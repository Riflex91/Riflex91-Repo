namespace AioBotWindowsBridge;

public sealed record RuntimeBridgeStatus(
    string State,
    bool BrowserReady,
    bool SupabaseReady,
    DateTimeOffset? LastAttemptAt,
    DateTimeOffset? LastSuccessAt,
    long LastEventSeq,
    int LastEventCount,
    string? LastError,
    string? TargetUrl,
    string WebDashboardState,
    string? WebDashboardError);

public sealed class TelemetryBridgeService : IAsyncDisposable
{
    public const int MaxCatchUpBatches = 8;
    public const int DeepDiagnosticsIntervalSeconds = 30;
    public const int DeepDiagnosticEventLimit = 40;
    private const int CatchUpDelayMilliseconds = 100;

    private readonly BridgeConfig _config;
    private readonly BrowserLauncher _launcher;
    private readonly CdpAdventureLandClient _browser;
    private readonly CdpWebDashboardConfigurator _dashboard;
    private readonly SupabaseTelemetrySink _sink;
    private readonly string? _dashboardWriteKey;
    private CancellationTokenSource? _loopCts;
    private Task? _loopTask;

    public TelemetryBridgeService(HttpClient httpClient, BridgeConfig config, string token, string? dashboardWriteKey = null)
    {
        _config = config;
        _launcher = new BrowserLauncher(httpClient, config);
        _browser = new CdpAdventureLandClient(httpClient, config);
        _dashboard = new CdpWebDashboardConfigurator(httpClient, config);
        _sink = new SupabaseTelemetrySink(httpClient, config, token);
        _dashboardWriteKey = SecureDashboardWriteKeyStore.IsValidWriteKey(dashboardWriteKey)
            ? dashboardWriteKey
            : null;
    }

    public event Action<RuntimeBridgeStatus>? StatusChanged;
    public bool IsRunning => _loopTask is { IsCompleted: false };

    public Task StartAsync()
    {
        if (IsRunning) return Task.CompletedTask;
        _loopCts = new CancellationTokenSource();
        _loopTask = Task.Run(() => RunAsync(_loopCts.Token));
        return Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        if (_loopCts is null || _loopTask is null) return;
        _loopCts.Cancel();
        try { await _loopTask; }
        catch (OperationCanceledException) { }
        _loopCts.Dispose();
        _loopCts = null;
        _loopTask = null;
        Publish(new RuntimeBridgeStatus(
            "STOPPED", false, false, null, null, 0, 0, null, null,
            DashboardInitialState(), null));
    }

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        var state = await BridgeState.LoadAsync(cancellationToken);
        DateTimeOffset? lastSuccess = null;
        DateTimeOffset? lastDeepDiagnosticsAt = null;
        var failures = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            var attempt = DateTimeOffset.UtcNow;
            var browserReady = false;
            var dashboardState = DashboardInitialState();
            string? dashboardError = null;
            try
            {
                Publish(new RuntimeBridgeStatus(
                    "CONNECTING", false, false, attempt, lastSuccess, state.LastEventSeq, 0, null, null,
                    dashboardState, null));
                var browserConnection = await _launcher.EnsureReadyAsync(cancellationToken);
                browserReady = browserConnection.Ready;
                if (!browserReady) throw new InvalidOperationException(browserConnection.State);

                (dashboardState, dashboardError) = await SyncDashboardProfileAsync(cancellationToken);

                RuntimeBridgeStatus? latestStatus = null;
                for (var batchIndex = 0; batchIndex < MaxCatchUpBatches; batchIndex++)
                {
                    var now = DateTimeOffset.UtcNow;
                    var includeDeepDiagnostics = ShouldIncludeDeepDiagnostics(lastDeepDiagnosticsAt, now);
                    var readLimit = EventLimitForRead(_config.EventLimit, includeDeepDiagnostics);
                    var read = await _browser.ReadAsync(
                        state.LastEventSeq,
                        readLimit,
                        includeDeepDiagnostics,
                        cancellationToken);

                    // During catch-up an empty second read is only a probe that the backlog is gone.
                    // Avoid creating an extra empty Supabase row unless this is the normal poll or a deep diagnostic sample is due.
                    if (batchIndex > 0 && read.EventCount == 0 && !includeDeepDiagnostics)
                        break;

                    // Supabase acceptance is the commit point. We never acknowledge browser telemetry before this succeeds.
                    await _sink.SendAsync(read, read.EffectiveAfterSeq, cancellationToken);

                    state = new BridgeState(read.MaxSeq);
                    await state.SaveAsync(cancellationToken);

                    // Sequence-aware acknowledgement is best effort for older bot bundles and exact for new bundles.
                    // If the bot has not updated yet, Supported=false and the external cursor still prevents duplicates.
                    if (state.LastEventSeq > 0)
                        await _browser.AcknowledgeThroughAsync(state.LastEventSeq, cancellationToken);

                    failures = 0;
                    lastSuccess = DateTimeOffset.UtcNow;
                    if (includeDeepDiagnostics) lastDeepDiagnosticsAt = lastSuccess;

                    latestStatus = new RuntimeBridgeStatus(
                        read.HasMoreEvents ? "CATCHING_UP" : "HEALTHY",
                        true,
                        true,
                        attempt,
                        lastSuccess,
                        state.LastEventSeq,
                        read.EventCount,
                        null,
                        read.TargetUrl,
                        dashboardState,
                        dashboardError);
                    Publish(latestStatus);
                    await SaveStatusAsync(latestStatus, cancellationToken);

                    if (!ShouldCatchUp(read.EventCount, readLimit, read.HasMoreEvents, batchIndex + 1))
                        break;

                    await Task.Delay(TimeSpan.FromMilliseconds(CatchUpDelayMilliseconds), cancellationToken);
                }

                if (latestStatus is null)
                {
                    latestStatus = new RuntimeBridgeStatus(
                        "HEALTHY", true, true, attempt, lastSuccess, state.LastEventSeq, 0, null, null,
                        dashboardState, dashboardError);
                    Publish(latestStatus);
                    await SaveStatusAsync(latestStatus, cancellationToken);
                }

                await Task.Delay(TimeSpan.FromSeconds(_config.PollIntervalSeconds), cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception error)
            {
                failures++;
                var message = Bounded(error.Message);
                var status = new RuntimeBridgeStatus(
                    "DEGRADED", browserReady, false, attempt, lastSuccess, state.LastEventSeq, 0, message, null,
                    dashboardState, dashboardError);
                Publish(status);
                await SaveStatusAsync(status, CancellationToken.None);
                var backoff = ComputeBackoffSeconds(_config.PollIntervalSeconds, _config.MaxBackoffSeconds, failures);
                await Task.Delay(TimeSpan.FromSeconds(backoff), cancellationToken);
            }
        }
    }

    private async Task<(string State, string? Error)> SyncDashboardProfileAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (!_config.WebDashboardEnabled)
            {
                await _dashboard.ClearAsync(cancellationToken);
                return ("DISABLED", null);
            }

            if (!SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey))
            {
                // Fail closed: an old key must not remain active in the dedicated profile after
                // the DPAPI copy was deleted or became unreadable.
                await _dashboard.ClearAsync(cancellationToken);
                return ("WRITE_KEY_MISSING", null);
            }

            var result = await _dashboard.ApplyAsync(
                _config.WebDashboardBaseUrl,
                _config.WebDashboardAccount,
                _dashboardWriteKey!,
                cancellationToken);
            return result.Applied ? ("READY", null) : ("ERROR", "WEB_DASHBOARD_PROFILE_NOT_APPLIED");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            // Dashboard sync is intentionally independent from Supabase telemetry. A profile
            // injection failure is visible, but it must not block diagnostic uploads.
            return ("ERROR", Bounded(error.Message));
        }
    }

    private string DashboardInitialState()
    {
        if (!_config.WebDashboardEnabled) return "DISABLED";
        return SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey)
            ? "PENDING"
            : "WRITE_KEY_MISSING";
    }

    private async Task SaveStatusAsync(RuntimeBridgeStatus status, CancellationToken cancellationToken)
    {
        await new BridgeStatus(
            status.State,
            _config.BotId,
            true,
            status.BrowserReady,
            status.SupabaseReady,
            status.LastAttemptAt,
            status.LastSuccessAt,
            status.LastEventSeq,
            status.LastEventCount,
            status.LastError,
            status.TargetUrl,
            status.WebDashboardState,
            status.WebDashboardError).SaveAsync(cancellationToken);
    }

    private void Publish(RuntimeBridgeStatus status) => StatusChanged?.Invoke(status);

    public static int EventLimitForRead(int configuredEventLimit, bool includeDeepDiagnostics)
    {
        var bounded = Math.Clamp(configuredEventLimit, 1, 200);
        return includeDeepDiagnostics ? Math.Min(bounded, DeepDiagnosticEventLimit) : bounded;
    }

    public static bool ShouldCatchUp(int eventCount, int eventLimit, bool hasMoreEvents, int completedBatches)
    {
        if (completedBatches >= MaxCatchUpBatches) return false;
        var boundedLimit = Math.Max(1, eventLimit);
        return hasMoreEvents || eventCount >= boundedLimit;
    }

    public static bool ShouldIncludeDeepDiagnostics(DateTimeOffset? lastDeepDiagnosticsAt, DateTimeOffset now)
    {
        if (!lastDeepDiagnosticsAt.HasValue) return true;
        return now - lastDeepDiagnosticsAt.Value >= TimeSpan.FromSeconds(DeepDiagnosticsIntervalSeconds);
    }

    public static int ComputeBackoffSeconds(int pollIntervalSeconds, int maxBackoffSeconds, int failures)
    {
        var exponent = Math.Min(8, Math.Max(0, failures - 1));
        var delay = pollIntervalSeconds * Math.Pow(2, exponent);
        return (int)Math.Min(maxBackoffSeconds, delay);
    }

    private static string Bounded(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "WINDOWS_BRIDGE_FAILED" : value;
        return text.Length <= 256 ? text : text[..256];
    }

    public async ValueTask DisposeAsync() => await StopAsync();
}
