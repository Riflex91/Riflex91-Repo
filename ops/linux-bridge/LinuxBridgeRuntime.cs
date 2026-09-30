using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record LinuxBridgeStatusSnapshot(
    DateTimeOffset StartedAt,
    RuntimeBridgeStatus? Telemetry,
    LinuxWatchdogStatus Watchdog,
    WissenswaechterStatus? Knowledge,
    GitHubAnmeldeStatus? GitHub,
    bool SecretServiceAvailable,
    bool TelemetryTokenConfigured,
    bool DashboardKeyConfigured,
    bool BackblazeCredentialsConfigured,
    bool TelemetryEnabled,
    bool WebDashboardEnabled,
    bool BackblazeEnabled,
    bool KnowledgeEnabled,
    bool LiveKnowledgeEnabled,
    string LiveKnowledgePath,
    bool LiveKnowledgePathExists,
    string GitHubTokenTemplateUrl,
    JsonElement? SelfUpdate,
    string SettingsPath,
    string BrowserProfileDirectory);

public sealed class LinuxBridgeRuntime : IHostedService, IAsyncDisposable
{
    private BridgeConfig _config;
    private readonly LinuxSecretStore _secrets = new();
    private readonly GitHubAnmeldung _github = new();
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(30) };
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly object _stopSync = new();
    private Task? _stopTask;
    private int _disposed;
    private TelemetryBridgeService? _telemetry;
    private WissenswaechterDienst? _knowledge;
    private LinuxWatchdogSupervisor? _watchdog;
    private LinuxBridgeSelfUpdater? _updater;
    private RuntimeBridgeStatus? _telemetryStatus;
    private WissenswaechterStatus? _knowledgeStatus;
    private GitHubAnmeldeStatus? _githubStatus;
    private string? _telemetryToken;
    private string? _dashboardKey;
    private BackblazeCredentials? _backblazeCredentials;

    public LinuxBridgeRuntime(BridgeConfig config)
    {
        _config = config;
        StartedAt = DateTimeOffset.UtcNow;
        AdminToken = LinuxAdminTokenStore.LoadOrCreate();
    }

    public DateTimeOffset StartedAt { get; }
    public string AdminToken { get; }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await ReloadSecretsAsync(cancellationToken);
        _githubStatus = await _github.LiesStatusAsync(cancellationToken);
        await StartTelemetryUnsafeAsync(cancellationToken);
        await StartKnowledgeIfReadyUnsafeAsync(cancellationToken);

        _watchdog = new LinuxWatchdogSupervisor(_http, _config);
        await _watchdog.StartAsync();

        if (_config.SelfUpdateEnabled)
        {
            _updater = new LinuxBridgeSelfUpdater(_config);
            _updater.Start();
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        lock (_stopSync)
            return _stopTask ??= StopCoreAsync();
    }

    private async Task StopCoreAsync()
    {
        var updater = _updater;
        _updater = null;
        var watchdog = _watchdog;
        _watchdog = null;
        var knowledge = _knowledge;
        _knowledge = null;
        var telemetry = _telemetry;
        _telemetry = null;

        if (updater is not null) await updater.DisposeAsync();
        if (watchdog is not null) await watchdog.DisposeAsync();
        if (knowledge is not null) await knowledge.DisposeAsync();
        if (telemetry is not null)
        {
            await telemetry.StopAsync();
            await telemetry.DisposeAsync();
        }
    }

    public LinuxBridgeStatusSnapshot Snapshot() => new(
        StartedAt,
        _telemetryStatus,
        _watchdog?.Status ?? new LinuxWatchdogStatus(
            "DISABLED", "UNKNOWN", "UNKNOWN", null, DateTimeOffset.UtcNow, 0, 0, 0, null, null),
        _knowledgeStatus,
        _githubStatus,
        LinuxSecretStore.IsAvailable(),
        SecureTokenStore.IsValidToken(_telemetryToken),
        SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardKey),
        _backblazeCredentials is { IsValid: true },
        _config.TelemetryEnabled,
        _config.WebDashboardEnabled,
        _config.BackblazeEnabled,
        _config.WissenswaechterAktiv,
        _config.LiveWissensimportAktiv,
        _config.LiveWissensdatenbankPfad,
        Directory.Exists(_config.LiveWissensdatenbankPfad),
        GitHubAnmeldung.TokenVorlageUrl,
        ReadSelfUpdateStatus(),
        BridgeConfig.SettingsPath,
        BridgeConfig.BrowserProfileDirectory);

    public Task<BrowserConnectionStatus> RestartBrowserAsync(CancellationToken cancellationToken) =>
        _watchdog is null
            ? Task.FromResult(new BrowserConnectionStatus(false, "WATCHDOG_DISABLED"))
            : _watchdog.ManualRestartAsync(cancellationToken);

    public async Task RunKnowledgeNowAsync(CancellationToken cancellationToken)
    {
        if (_knowledge is null)
        {
            _githubStatus = await _github.LiesStatusAsync(cancellationToken);
            if (!_config.WissenswaechterAktiv)
                throw new InvalidOperationException("WISSENSWAECHTER_DISABLED");
            if (_githubStatus is not { Angemeldet: true })
                throw new InvalidOperationException("GITHUB_ANMELDUNG_FEHLT");
            await RestartKnowledgeAsync(cancellationToken);
        }

        if (_knowledge is null)
            throw new InvalidOperationException("WISSENSWAECHTER_UNAVAILABLE");

        await _knowledge.FuehreAktualisierungJetztAusAsync(cancellationToken);
    }

    public async Task<ChatGptSignalStatus> SetSignalAsync(
        bool enabled,
        CancellationToken cancellationToken)
    {
        if (!SecureTokenStore.IsValidToken(_telemetryToken))
            throw new InvalidOperationException("TELEMETRY_TOKEN_REQUIRED");
        return await new SupabaseSignalControlClient(
            _http,
            _config,
            _telemetryToken!).SetAsync(enabled, cancellationToken);
    }

    public async Task SetTelemetryEnabledAsync(bool enabled, CancellationToken cancellationToken)
    {
        if (enabled && !SecureTokenStore.IsValidToken(_telemetryToken))
            throw new InvalidOperationException("TELEMETRY_TOKEN_REQUIRED");

        var next = _config with { TelemetryEnabled = enabled };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartTelemetryAsync(cancellationToken);
    }

    public async Task SetDashboardEnabledAsync(bool enabled, CancellationToken cancellationToken)
    {
        var next = _config with { WebDashboardEnabled = enabled };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartTelemetryAsync(cancellationToken);
    }

    public async Task SetBackblazeEnabledAsync(bool enabled, CancellationToken cancellationToken)
    {
        if (enabled && _backblazeCredentials is not { IsValid: true })
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_REQUIRED");

        var next = _config with { BackblazeEnabled = enabled };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartTelemetryAsync(cancellationToken);
    }

    public async Task SetKnowledgeEnabledAsync(bool enabled, CancellationToken cancellationToken)
    {
        var next = _config with { WissenswaechterAktiv = enabled };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartKnowledgeAsync(cancellationToken);
    }

    public async Task<string> SetLiveKnowledgePathAsync(
        string path,
        CancellationToken cancellationToken)
    {
        var normalized = BridgeConfig.NormalisiereLiveWissenspfad(path);
        var next = _config with
        {
            LiveWissensimportAktiv = true,
            LiveWissensdatenbankPfad = normalized
        };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartKnowledgeAsync(cancellationToken);
        return normalized;
    }

    public async Task<GitHubAnmeldeStatus> GetGitHubStatusAsync(
        CancellationToken cancellationToken)
    {
        _githubStatus = await _github.LiesStatusAsync(cancellationToken);
        return _githubStatus;
    }

    public async Task<GitHubAnmeldeStatus> LoginGitHubAsync(
        CancellationToken cancellationToken)
    {
        _githubStatus = await _github.MeldeAnAsync(cancellationToken);
        await RestartKnowledgeAsync(cancellationToken);
        return _githubStatus;
    }

    public async Task<GitHubAnmeldeStatus> LogoutGitHubAsync(
        CancellationToken cancellationToken)
    {
        await StopKnowledgeAsync();
        _githubStatus = await _github.LiesStatusAsync(cancellationToken);
        if (_githubStatus.Angemeldet && !string.IsNullOrWhiteSpace(_githubStatus.Konto))
            await _github.MeldeAbAsync(_githubStatus.Konto, cancellationToken);

        _githubStatus = await _github.LiesStatusAsync(cancellationToken);
        return _githubStatus;
    }

    public Task<LinuxStorageHealth> ProbeStorageAsync(CancellationToken cancellationToken) =>
        LinuxStorageHealthProbe.ProbeAsync(_config.LiveWissensdatenbankPfad, cancellationToken);

    public Task<LinuxReadinessReport> RunReadinessAsync(CancellationToken cancellationToken) =>
        new LinuxReadinessSystemtest(_github).RunAsync(_config, cancellationToken);

    public async Task<BackblazeV6ArchiveResult> TestBackblazeAsync(
        CancellationToken cancellationToken)
    {
        if (_backblazeCredentials is not { IsValid: true })
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_REQUIRED");

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(25));
        var config = _config with { BackblazeEnabled = true };
        config.Validate();
        var sink = new BackblazeV6ArchiveSink(_http, config, _backblazeCredentials);
        var result = await sink.SelfTestAsync(timeout.Token);
        if (!result.Stored || !result.Verified)
            throw new InvalidOperationException("BACKBLAZE_V6_SELF_TEST_NOT_VERIFIED");
        return result;
    }

    public async Task SaveTelemetryTokenAsync(string value, CancellationToken cancellationToken)
    {
        if (!SecureTokenStore.IsValidToken(value))
            throw new InvalidOperationException("TELEMETRY_TOKEN_INVALID");
        await _secrets.SaveAsync("telemetry-token-v6", value.Trim(), cancellationToken);
        await RestartTelemetryAsync(cancellationToken);
    }

    public async Task SaveDashboardKeyAsync(string value, CancellationToken cancellationToken)
    {
        if (!SecureDashboardWriteKeyStore.IsValidWriteKey(value))
            throw new InvalidOperationException("WEB_DASHBOARD_WRITE_KEY_INVALID");
        await _secrets.SaveAsync("web-dashboard-write-key-v6", value.Trim(), cancellationToken);
        var next = _config with { WebDashboardEnabled = true };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartTelemetryAsync(cancellationToken);
    }

    public async Task SaveBackblazeAsync(
        string keyId,
        string applicationKey,
        CancellationToken cancellationToken)
    {
        if (!SecureBackblazeCredentialStore.IsValidKeyId(keyId)
            || !SecureBackblazeCredentialStore.IsValidApplicationKey(applicationKey))
        {
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_INVALID");
        }

        await _secrets.SaveAsync("backblaze-key-id-v6", keyId.Trim(), cancellationToken);
        await _secrets.SaveAsync(
            "backblaze-application-key-v6",
            applicationKey.Trim(),
            cancellationToken);

        var next = _config with { BackblazeEnabled = true };
        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartTelemetryAsync(cancellationToken);
    }

    public async Task DeleteSecretAsync(string logicalName, CancellationToken cancellationToken)
    {
        var next = _config;
        switch (logicalName)
        {
            case "telemetry":
                await _secrets.DeleteAsync("telemetry-token-v6", cancellationToken);
                next = next with { TelemetryEnabled = false };
                break;
            case "dashboard":
                await _secrets.DeleteAsync("web-dashboard-write-key-v6", cancellationToken);
                break;
            case "backblaze":
                await _secrets.DeleteAsync("backblaze-key-id-v6", cancellationToken);
                await _secrets.DeleteAsync("backblaze-application-key-v6", cancellationToken);
                next = next with { BackblazeEnabled = false };
                break;
            default:
                throw new InvalidOperationException("SECRET_NAME_INVALID");
        }

        next.Validate();
        await next.SaveAsync(cancellationToken);
        _config = next;
        await RestartTelemetryAsync(cancellationToken);
    }

    private async Task RestartTelemetryAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_telemetry is not null)
            {
                await _telemetry.StopAsync();
                await _telemetry.DisposeAsync();
                _telemetry = null;
            }
            await ReloadSecretsAsync(cancellationToken);
            await StartTelemetryUnsafeAsync(cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task RestartKnowledgeAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            await StopKnowledgeUnsafeAsync();
            _githubStatus = await _github.LiesStatusAsync(cancellationToken);
            await StartKnowledgeIfReadyUnsafeAsync(cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task StopKnowledgeAsync()
    {
        await _gate.WaitAsync();
        try
        {
            await StopKnowledgeUnsafeAsync();
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task StopKnowledgeUnsafeAsync()
    {
        var knowledge = _knowledge;
        _knowledge = null;
        if (knowledge is not null)
            await knowledge.DisposeAsync();
    }

    private async Task StartKnowledgeIfReadyUnsafeAsync(
        CancellationToken cancellationToken)
    {
        if (!_config.WissenswaechterAktiv)
        {
            _knowledgeStatus = new WissenswaechterStatus(
                "DEAKTIVIERT", null, null, 0, 0, 0, false, null);
            return;
        }

        _githubStatus ??= await _github.LiesStatusAsync(cancellationToken);
        if (_githubStatus is not { Angemeldet: true })
        {
            _knowledgeStatus = new WissenswaechterStatus(
                "WARTET_AUF_GITHUB", null, null, 0, 0, 0, false, null);
            return;
        }

        _knowledge = new WissenswaechterDienst(_config, _github);
        _knowledge.StatusGeaendert += status => _knowledgeStatus = status;
        await _knowledge.StarteAsync();
    }

    private async Task ReloadSecretsAsync(CancellationToken cancellationToken)
    {
        _telemetryToken = await _secrets.LoadAsync(
            "telemetry-token-v6",
            _config.TelemetryTokenEnvironmentVariable,
            cancellationToken);
        _dashboardKey = await _secrets.LoadAsync(
            "web-dashboard-write-key-v6",
            _config.WebDashboardWriteKeyEnvironmentVariable,
            cancellationToken);
        var keyId = await _secrets.LoadAsync(
            "backblaze-key-id-v6",
            _config.BackblazeKeyIdEnvironmentVariable,
            cancellationToken);
        var appKey = await _secrets.LoadAsync(
            "backblaze-application-key-v6",
            _config.BackblazeApplicationKeyEnvironmentVariable,
            cancellationToken);

        _backblazeCredentials =
            SecureBackblazeCredentialStore.IsValidKeyId(keyId)
            && SecureBackblazeCredentialStore.IsValidApplicationKey(appKey)
                ? new BackblazeCredentials(keyId!, appKey!)
                : null;
    }

    private async Task StartTelemetryUnsafeAsync(CancellationToken cancellationToken)
    {
        if (!_config.TelemetryEnabled || !SecureTokenStore.IsValidToken(_telemetryToken))
        {
            _telemetryStatus = new RuntimeBridgeStatus(
                "DISABLED_OR_TOKEN_MISSING",
                false,
                false,
                null,
                null,
                0,
                0,
                null,
                null,
                _config.WebDashboardEnabled ? "PENDING" : "DISABLED",
                null,
                _config.BackblazeEnabled ? "PENDING" : "DISABLED",
                null);
            return;
        }

        _telemetry = new TelemetryBridgeService(
            _http,
            _config,
            _telemetryToken!,
            _dashboardKey,
            _backblazeCredentials);
        _telemetry.StatusChanged += status => _telemetryStatus = status;
        await _telemetry.StartAsync();
    }

    private static JsonElement? ReadSelfUpdateStatus()
    {
        try
        {
            if (!File.Exists(BridgeConfig.SelfUpdateStatusPath))
                return null;
            using var doc = JsonDocument.Parse(File.ReadAllText(BridgeConfig.SelfUpdateStatusPath));
            return doc.RootElement.Clone();
        }
        catch
        {
            return null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        await StopAsync(CancellationToken.None);
        if (Interlocked.Exchange(ref _disposed, 1) != 0)
            return;

        _http.Dispose();
        _gate.Dispose();
    }
}
