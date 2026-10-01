using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record LinuxWatchdogStatus(
    string State,
    string Browser,
    string Bot,
    DateTimeOffset? LastHealthyAt,
    DateTimeOffset LastCheckAt,
    int ConsecutiveFailures,
    int PageReloads,
    int BrowserRestarts,
    string? RecoveryAction,
    string? LastError);

public sealed class LinuxWatchdogSupervisor : IAsyncDisposable
{
    public const int SystemdKeepaliveSeconds = 10;

    private readonly HttpClient _httpClient;
    private readonly BridgeConfig _config;
    private readonly BrowserLauncher _launcher;
    private readonly CdpAlBotV6Client _bot;
    private readonly CancellationTokenSource _stop = new();
    private Task? _healthLoop;
    private Task? _systemdLoop;
    private int _disposed;
    private LinuxWatchdogStatus _status = new(
        "STARTING", "UNKNOWN", "UNKNOWN", null, DateTimeOffset.UtcNow, 0, 0, 0, null, null);

    public LinuxWatchdogSupervisor(HttpClient httpClient, BridgeConfig config)
    {
        _httpClient = httpClient;
        _config = config;
        _launcher = new BrowserLauncher(httpClient, config);
        _bot = new CdpAlBotV6Client(httpClient, config);
    }

    public LinuxWatchdogStatus Status => _status;
    public event Action<LinuxWatchdogStatus>? StatusChanged;

    public Task StartAsync()
    {
        _systemdLoop ??= Task.Run(() => RunSystemdLoopAsync(_stop.Token));

        if (!_config.WatchdogEnabled)
        {
            Set(_status with
            {
                State = "DISABLED",
                Browser = "NOT_MONITORED",
                Bot = "NOT_MONITORED",
                LastCheckAt = DateTimeOffset.UtcNow,
                ConsecutiveFailures = 0,
                RecoveryAction = null,
                LastError = null
            });
            return Task.CompletedTask;
        }

        _healthLoop ??= Task.Run(() => RunHealthLoopAsync(_stop.Token));
        return Task.CompletedTask;
    }

    public async Task<BrowserConnectionStatus> ManualRestartAsync(CancellationToken cancellationToken = default)
    {
        Set(_status with { State = "RECOVERING", RecoveryAction = "MANUAL_BROWSER_RESTART", LastCheckAt = DateTimeOffset.UtcNow });
        var result = await _launcher.RestartAsync(cancellationToken);
        Set(_status with
        {
            BrowserRestarts = _status.BrowserRestarts + (result.Ready ? 1 : 0),
            Browser = result.State,
            Bot = result.Ready ? "RECOVERING" : _status.Bot,
            RecoveryAction = result.Ready ? "MANUAL_BROWSER_RESTART_OK" : "MANUAL_BROWSER_RESTART_FAILED"
        });
        return result;
    }

    private async Task RunSystemdLoopAsync(CancellationToken cancellationToken)
    {
        var mode = _config.WatchdogEnabled
            ? "application watchdog active"
            : "application watchdog disabled; systemd supervision active";

        await SystemdNotifier.ReadyAsync("AIO Bot Linux Bridge ready; " + mode, cancellationToken);

        while (!cancellationToken.IsCancellationRequested)
        {
            await SystemdNotifier.WatchdogAsync(
                $"bridge={_status.State}; browser={_status.Browser}; bot={_status.Bot}",
                cancellationToken);

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(SystemdKeepaliveSeconds), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RunHealthLoopAsync(CancellationToken cancellationToken)
    {
        await LoadPersistedAsync(cancellationToken);

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await CheckOnceAsync(cancellationToken);
                await PersistAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception error)
            {
                Set(_status with
                {
                    State = "DEGRADED",
                    LastCheckAt = DateTimeOffset.UtcNow,
                    LastError = Limit(error.GetType().Name + ": " + error.Message)
                });
                try { await PersistAsync(cancellationToken); } catch { }
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(_config.WatchdogIntervalSeconds), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task CheckOnceAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var browser = await _launcher.EnsureReadyAsync(cancellationToken);
        if (!browser.Ready)
        {
            await RegisterFailureAsync(now, browser.State, "BROWSER", cancellationToken);
            return;
        }

        try
        {
            using var probeCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            probeCts.CancelAfter(TimeSpan.FromSeconds(CdpAlBotV6Client.CdpCommandTimeoutSeconds + 2));
            var read = await _bot.ReadAsync(0, 1, probeCts.Token);
            if (IsHeartbeatStale(
                read.Snapshot,
                now,
                TimeSpan.FromSeconds(Math.Max(30, _config.WatchdogIntervalSeconds * 4))))
            {
                throw new InvalidOperationException("ALBOT_V6_HEARTBEAT_STALE");
            }

            Set(_status with
            {
                State = "HEALTHY",
                Browser = "HEALTHY",
                Bot = "HEALTHY",
                LastHealthyAt = now,
                LastCheckAt = now,
                ConsecutiveFailures = 0,
                RecoveryAction = null,
                LastError = null
            });
        }
        catch (Exception error) when (error is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            await RegisterFailureAsync(
                now,
                Limit(error.GetType().Name + ": " + error.Message),
                "BOT",
                cancellationToken);
        }
    }

    private async Task RegisterFailureAsync(
        DateTimeOffset now,
        string error,
        string source,
        CancellationToken cancellationToken)
    {
        var failures = _status.ConsecutiveFailures + 1;
        Set(_status with
        {
            State = "DEGRADED",
            Browser = source == "BROWSER" ? "UNHEALTHY" : "HEALTHY",
            Bot = source == "BOT" ? "UNHEALTHY" : "UNKNOWN",
            LastCheckAt = now,
            ConsecutiveFailures = failures,
            LastError = Limit(error),
            RecoveryAction = null
        });

        if (failures == _config.WatchdogFailuresBeforeReload && source == "BOT")
        {
            Set(_status with { State = "RECOVERING", RecoveryAction = "PAGE_RELOAD" });
            var reloaded = await TryReloadAdventureLandAsync(cancellationToken);
            Set(_status with
            {
                PageReloads = _status.PageReloads + (reloaded ? 1 : 0),
                RecoveryAction = reloaded ? "PAGE_RELOAD_SENT" : "PAGE_RELOAD_FAILED"
            });
            if (reloaded)
                await Task.Delay(TimeSpan.FromSeconds(_config.WatchdogRecoveryGraceSeconds), cancellationToken);
            return;
        }

        if (failures >= _config.WatchdogFailuresBeforeRestart)
        {
            Set(_status with { State = "RECOVERING", RecoveryAction = "BROWSER_RESTART" });
            var result = await _launcher.RestartAsync(cancellationToken);
            Set(_status with
            {
                BrowserRestarts = _status.BrowserRestarts + (result.Ready ? 1 : 0),
                Browser = result.Ready ? "RESTARTED" : result.State,
                Bot = "RECOVERING",
                ConsecutiveFailures = result.Ready ? 0 : failures,
                RecoveryAction = result.Ready ? "BROWSER_RESTART_OK" : "BROWSER_RESTART_FAILED"
            });
            if (result.Ready)
                await Task.Delay(TimeSpan.FromSeconds(_config.WatchdogRecoveryGraceSeconds), cancellationToken);
        }
    }

    private async Task<bool> TryReloadAdventureLandAsync(CancellationToken cancellationToken)
    {
        try
        {
            var endpoint = new Uri(new Uri(_config.CdpEndpoint.TrimEnd('/') + "/"), "json/list");
            using var response = await _httpClient.GetAsync(endpoint, cancellationToken);
            response.EnsureSuccessStatusCode();
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var allowed = new Uri(_config.AllowedOrigin);

            foreach (var target in doc.RootElement.EnumerateArray())
            {
                if (!target.TryGetProperty("type", out var type) || type.GetString() != "page")
                    continue;

                if (!target.TryGetProperty("url", out var urlNode)
                    || !Uri.TryCreate(urlNode.GetString(), UriKind.Absolute, out var url)
                    || !string.Equals(url.Scheme, allowed.Scheme, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(url.Host, allowed.Host, StringComparison.OrdinalIgnoreCase)
                    || url.Port != allowed.Port)
                {
                    continue;
                }

                if (!target.TryGetProperty("webSocketDebuggerUrl", out var wsNode)
                    || !Uri.TryCreate(wsNode.GetString(), UriKind.Absolute, out var wsUri))
                {
                    continue;
                }

                using var ws = new ClientWebSocket();
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(8));
                await ws.ConnectAsync(wsUri, timeout.Token);
                var payload = Encoding.UTF8.GetBytes("""{"id":1,"method":"Page.reload","params":{"ignoreCache":false}}""");
                await ws.SendAsync(payload, WebSocketMessageType.Text, true, timeout.Token);
                await ws.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "reload", CancellationToken.None);
                return true;
            }
        }
        catch
        {
        }

        return false;
    }

    private static bool IsHeartbeatStale(JsonElement snapshot, DateTimeOffset now, TimeSpan maxAge)
    {
        if (snapshot.ValueKind != JsonValueKind.Object
            || !snapshot.TryGetProperty("heartbeat", out var heartbeat)
            || heartbeat.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        foreach (var key in new[] { "at", "updatedAt", "lastHeartbeatAt", "lastTickAt", "timestamp", "ts" })
        {
            if (heartbeat.TryGetProperty(key, out var value) && TryDate(value, out var at))
                return now - at > maxAge;
        }

        return false;
    }

    private static bool TryDate(JsonElement value, out DateTimeOffset result)
    {
        result = default;
        if (value.ValueKind == JsonValueKind.String && DateTimeOffset.TryParse(value.GetString(), out result))
            return true;

        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out var n))
        {
            try
            {
                result = n > 10_000_000_000
                    ? DateTimeOffset.FromUnixTimeMilliseconds(n)
                    : DateTimeOffset.FromUnixTimeSeconds(n);
                return true;
            }
            catch
            {
            }
        }

        return false;
    }

    private void Set(LinuxWatchdogStatus status)
    {
        _status = status;
        try { StatusChanged?.Invoke(status); } catch { }
    }

    private async Task LoadPersistedAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (!File.Exists(BridgeConfig.WatchdogStatePath))
                return;
            var json = await File.ReadAllTextAsync(BridgeConfig.WatchdogStatePath, cancellationToken);
            var old = JsonSerializer.Deserialize<LinuxWatchdogStatus>(json, BridgeConfig.JsonOptions);
            if (old is not null)
            {
                _status = old with
                {
                    State = "STARTING",
                    LastCheckAt = DateTimeOffset.UtcNow,
                    ConsecutiveFailures = 0
                };
            }
        }
        catch
        {
        }
    }

    private async Task PersistAsync(CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(BridgeConfig.StateDirectory);
        var temp = BridgeConfig.WatchdogStatePath + ".tmp";
        await File.WriteAllTextAsync(
            temp,
            JsonSerializer.Serialize(_status, BridgeConfig.JsonOptions),
            cancellationToken);
        File.Move(temp, BridgeConfig.WatchdogStatePath, true);
    }

    private static string Limit(string value) => value.Length <= 320 ? value : value[..320];

    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0)
            return;

        _stop.Cancel();

        if (_healthLoop is not null)
        {
            try { await _healthLoop; } catch (OperationCanceledException) { }
        }
        if (_systemdLoop is not null)
        {
            try { await _systemdLoop; } catch (OperationCanceledException) { }
        }

        await SystemdNotifier.StoppingAsync();
        _stop.Dispose();
    }
}
