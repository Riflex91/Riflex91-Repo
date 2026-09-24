using System.Security.Cryptography;

namespace AioBotLinuxBridge;

public sealed record BridgeRuntimeSnapshot(
    string Platform,
    long BuildNumber,
    bool SecretServiceAvailable,
    BridgeConfig Config,
    bool TelemetryTokenPresent,
    bool WebDashboardWriteKeyPresent,
    bool BackblazeCredentialsPresent,
    RuntimeBridgeStatus? Telemetry,
    WissenswaechterStatus? Wissenswaechter,
    GitHubAnmeldeStatus GitHub,
    string? LastActionError);

public sealed record BridgeSettingsUpdate(
    bool? AutoStartBrowser,
    bool? BrowserHeadless,
    string? PreferredBrowser,
    string? LiveKnowledgePath);

public sealed class BridgeRuntime : IAsyncDisposable
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(12) };
    private readonly SecureTokenStore _tokenStore = new();
    private readonly SecureDashboardWriteKeyStore _dashboardKeyStore = new();
    private readonly SecureBackblazeCredentialStore _backblazeCredentialStore = new();
    private readonly GitHubAnmeldung _github = new();
    private readonly IHostApplicationLifetime _lifetime;
    private BridgeConfig _config;
    private string? _token;
    private string? _dashboardWriteKey;
    private BackblazeCredentials? _backblazeCredentials;
    private TelemetryBridgeService? _bridge;
    private WissenswaechterDienst? _wissenswaechter;
    private LinuxBridgeSelfUpdater? _selfUpdater;
    private RuntimeBridgeStatus? _telemetryStatus;
    private WissenswaechterStatus? _wissensStatus;
    private GitHubAnmeldeStatus _githubStatus = new(false, false, null, "NOCH_NICHT_GEPRUEFT");
    private string? _lastActionError;
    private bool _initialized;
    private bool _disposed;

    public BridgeRuntime(BridgeConfig config, IHostApplicationLifetime lifetime)
    {
        _config = config;
        _lifetime = lifetime;
        CsrfToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
    }

    public string CsrfToken { get; }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_initialized) return;

            LinuxBridgeSelfUpdater.CleanupPreviousExecutable();

            _token = await _tokenStore.LoadAsync(_config.TelemetryTokenEnvironmentVariable, cancellationToken);
            _dashboardWriteKey = await _dashboardKeyStore.LoadAsync(_config.WebDashboardWriteKeyEnvironmentVariable, cancellationToken);
            _backblazeCredentials = await _backblazeCredentialStore.LoadAsync(
                _config.BackblazeKeyIdEnvironmentVariable,
                _config.BackblazeApplicationKeyEnvironmentVariable,
                cancellationToken);
            _githubStatus = await _github.LiesStatusAsync(cancellationToken);

            await StartTelemetryUnsafeAsync();
            await StartWissenswaechterUnsafeAsync();

            _selfUpdater = new LinuxBridgeSelfUpdater();
            _selfUpdater.UpdateInstallerStarted += OnUpdateInstallerStarted;
            await _selfUpdater.StartAsync();

            _initialized = true;
        }
        finally
        {
            _gate.Release();
        }
    }

    public BridgeRuntimeSnapshot Snapshot() => new(
        Platform: "linux",
        BuildNumber: LinuxBridgeSelfUpdater.CurrentBuildNumber(),
        SecretServiceAvailable: LinuxSecretStore.IsAvailable(),
        Config: _config,
        TelemetryTokenPresent: SecureTokenStore.IsValidToken(_token),
        WebDashboardWriteKeyPresent: SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey),
        BackblazeCredentialsPresent: _backblazeCredentials is { IsValid: true },
        Telemetry: _telemetryStatus,
        Wissenswaechter: _wissensStatus,
        GitHub: _githubStatus,
        LastActionError: _lastActionError);

    public async Task<BridgeRuntimeSnapshot> RefreshGitHubAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            _githubStatus = await _github.LiesStatusAsync(cancellationToken);
            _lastActionError = null;
            if (_config.WissenswaechterAktiv && _githubStatus.Angemeldet && _wissenswaechter is null)
                await StartWissenswaechterUnsafeAsync();
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> SaveTelemetryTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            await _tokenStore.SaveAsync(token, cancellationToken);
            _token = token.Trim();
            _lastActionError = null;
            if (_config.TelemetryEnabled)
                await RestartTelemetryUnsafeAsync();
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> DeleteTelemetryTokenAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            await _tokenStore.DeleteAsync();
            _token = null;
            await StopTelemetryUnsafeAsync();
            if (_config.TelemetryEnabled)
            {
                _config = _config with { TelemetryEnabled = false };
                await _config.SaveAsync(cancellationToken);
            }
            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> SaveDashboardWriteKeyAsync(string writeKey, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            await _dashboardKeyStore.SaveAsync(writeKey, cancellationToken);
            _dashboardWriteKey = writeKey.Trim();
            if (_config.TelemetryEnabled) await RestartTelemetryUnsafeAsync();
            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> DeleteDashboardWriteKeyAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            await _dashboardKeyStore.DeleteAsync();
            _dashboardWriteKey = null;
            try
            {
                var browser = new BrowserLauncher(_httpClient, _config with { AutoStartBrowser = false });
                if (await browser.ProbeAsync(cancellationToken))
                    await new CdpWebDashboardConfigurator(_httpClient, _config).ClearAsync(cancellationToken);
            }
            catch
            {
            }

            if (_config.TelemetryEnabled) await RestartTelemetryUnsafeAsync();
            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> SaveBackblazeCredentialsAsync(
        string keyId,
        string applicationKey,
        CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var credentials = new BackblazeCredentials(keyId.Trim(), applicationKey.Trim());
            await _backblazeCredentialStore.SaveAsync(credentials, cancellationToken);
            _backblazeCredentials = credentials;
            if (_config.TelemetryEnabled) await RestartTelemetryUnsafeAsync();
            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> DeleteBackblazeCredentialsAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            await _backblazeCredentialStore.DeleteAsync();
            _backblazeCredentials = null;

            try
            {
                var browser = new BrowserLauncher(_httpClient, _config with { AutoStartBrowser = false });
                if (await browser.ProbeAsync(cancellationToken))
                    await new CdpBackblazeConfigurator(_httpClient, _config).ClearAsync(cancellationToken);
            }
            catch
            {
            }

            if (_config.TelemetryEnabled) await RestartTelemetryUnsafeAsync();
            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> SetTelemetryEnabledAsync(bool enabled, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (enabled && !SecureTokenStore.IsValidToken(_token))
                throw new InvalidOperationException("TELEMETRY_TOKEN_FEHLT");

            _config = _config with { TelemetryEnabled = enabled };
            await _config.SaveAsync(cancellationToken);

            if (enabled) await RestartTelemetryUnsafeAsync();
            else await StopTelemetryUnsafeAsync();

            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> SetWissenswaechterEnabledAsync(bool enabled, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            _config = _config with { WissenswaechterAktiv = enabled };
            await _config.SaveAsync(cancellationToken);
            _githubStatus = await _github.LiesStatusAsync(cancellationToken);

            if (enabled) await StartWissenswaechterUnsafeAsync();
            else await StopWissenswaechterUnsafeAsync();

            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<BridgeRuntimeSnapshot> UpdateSettingsAsync(
        BridgeSettingsUpdate update,
        CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var old = _config;
            var next = _config with
            {
                AutoStartBrowser = update.AutoStartBrowser ?? _config.AutoStartBrowser,
                BrowserHeadless = update.BrowserHeadless ?? _config.BrowserHeadless,
                PreferredBrowser = string.IsNullOrWhiteSpace(update.PreferredBrowser)
                    ? _config.PreferredBrowser
                    : update.PreferredBrowser.Trim(),
                LiveWissensdatenbankPfad = string.IsNullOrWhiteSpace(update.LiveKnowledgePath)
                    ? _config.LiveWissensdatenbankPfad
                    : BridgeConfig.NormalisiereLiveWissenspfad(update.LiveKnowledgePath)
            };
            next.Validate();
            _config = next;
            await _config.SaveAsync(cancellationToken);

            var browserChanged = old.AutoStartBrowser != next.AutoStartBrowser
                || old.BrowserHeadless != next.BrowserHeadless
                || !string.Equals(old.PreferredBrowser, next.PreferredBrowser, StringComparison.OrdinalIgnoreCase);
            var knowledgeChanged = !string.Equals(old.LiveWissensdatenbankPfad, next.LiveWissensdatenbankPfad, StringComparison.Ordinal);

            if (browserChanged && _config.TelemetryEnabled) await RestartTelemetryUnsafeAsync();
            if (knowledgeChanged && _config.WissenswaechterAktiv)
            {
                await StopWissenswaechterUnsafeAsync();
                await StartWissenswaechterUnsafeAsync();
            }

            _lastActionError = null;
            return Snapshot();
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<object> EnsureBrowserAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await new BrowserLauncher(_httpClient, _config).EnsureReadyAsync(cancellationToken);
            _lastActionError = result.Ready ? null : result.State;
            return result;
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
    }

    public async Task<object> SendBackblazeToBotAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var credentials = _backblazeCredentials;
            if (credentials is not { IsValid: true })
                throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_FEHLEN");

            var browser = await new BrowserLauncher(_httpClient, _config).EnsureReadyAsync(cancellationToken);
            if (!browser.Ready) throw new InvalidOperationException(browser.State);

            var result = await new CdpBackblazeConfigurator(_httpClient, _config).ApplyAsync(
                _config.BackblazeEndpoint,
                _config.BackblazeRegion,
                _config.BackblazeBucket,
                _config.BackblazePrefix,
                credentials,
                cancellationToken);
            _lastActionError = null;
            return result;
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
    }

    public async Task<object> BackblazeSelfTestAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_backblazeCredentials is not { IsValid: true })
                throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_FEHLEN");

            var result = await new CdpBackblazeConfigurator(_httpClient, _config).SelfTestAsync(cancellationToken);
            _lastActionError = null;
            return result;
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
    }

    public async Task<object> RunWissenswaechterNowAsync(CancellationToken cancellationToken = default)
    {
        WissenswaechterDienst dienst;
        await _gate.WaitAsync(cancellationToken);
        try
        {
            _githubStatus = await _github.LiesStatusAsync(cancellationToken);
            if (!_githubStatus.Angemeldet || string.IsNullOrWhiteSpace(_githubStatus.Konto))
                throw new InvalidOperationException("GITHUB_ANMELDUNG_FEHLT");

            if (_wissenswaechter is null)
            {
                _wissenswaechter = new WissenswaechterDienst(_config, _github);
                _wissenswaechter.StatusGeaendert += OnWissensStatus;
            }
            dienst = _wissenswaechter;
        }
        finally
        {
            _gate.Release();
        }

        try
        {
            await dienst.FuehreAktualisierungJetztAusAsync(cancellationToken);
            _lastActionError = null;
            return (object?)_wissensStatus ?? new { status = "ABGESCHLOSSEN" };
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
    }

    public async Task<V5ReadinessBericht> RunReadinessAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var report = await new V5ReadinessSystemtest(_github).FuehreAusAsync(_config, cancellationToken);
            _lastActionError = report.Status == "NICHT_BESTANDEN" ? "READINESS_NICHT_BESTANDEN" : null;
            return report;
        }
        catch (Exception error)
        {
            Remember(error);
            throw;
        }
    }

    private async Task StartTelemetryUnsafeAsync()
    {
        if (!_config.TelemetryEnabled) return;
        if (!SecureTokenStore.IsValidToken(_token))
        {
            _telemetryStatus = new RuntimeBridgeStatus(
                "TOKEN_FEHLT", false, false, null, null, 0, 0,
                "TELEMETRY_TOKEN_FEHLT", null, "UNBEKANNT", null, "UNBEKANNT", null);
            return;
        }

        if (_bridge is not null) return;
        _bridge = new TelemetryBridgeService(_httpClient, _config, _token!, _dashboardWriteKey, _backblazeCredentials);
        _bridge.StatusChanged += OnTelemetryStatus;
        await _bridge.StartAsync();
    }

    private async Task StopTelemetryUnsafeAsync()
    {
        if (_bridge is null) return;
        _bridge.StatusChanged -= OnTelemetryStatus;
        await _bridge.DisposeAsync();
        _bridge = null;
    }

    private async Task RestartTelemetryUnsafeAsync()
    {
        await StopTelemetryUnsafeAsync();
        await StartTelemetryUnsafeAsync();
    }

    private async Task StartWissenswaechterUnsafeAsync()
    {
        if (!_config.WissenswaechterAktiv) return;
        if (!_githubStatus.Angemeldet || string.IsNullOrWhiteSpace(_githubStatus.Konto))
        {
            _wissensStatus = new WissenswaechterStatus(
                "WARTET_AUF_GITHUB", null, null, 0, 0, 0, false,
                "GITHUB_ANMELDUNG_FEHLT");
            return;
        }

        if (_wissenswaechter is not null) return;
        _wissenswaechter = new WissenswaechterDienst(_config, _github);
        _wissenswaechter.StatusGeaendert += OnWissensStatus;
        await _wissenswaechter.StarteAsync();
    }

    private async Task StopWissenswaechterUnsafeAsync()
    {
        if (_wissenswaechter is null) return;
        _wissenswaechter.StatusGeaendert -= OnWissensStatus;
        await _wissenswaechter.DisposeAsync();
        _wissenswaechter = null;
    }

    private void OnTelemetryStatus(RuntimeBridgeStatus status) => _telemetryStatus = status;
    private void OnWissensStatus(WissenswaechterStatus status) => _wissensStatus = status;

    private void OnUpdateInstallerStarted(PreparedLinuxBridgeUpdate update)
    {
        _lastActionError = null;
        _lifetime.StopApplication();
    }

    private void Remember(Exception error)
    {
        var text = string.IsNullOrWhiteSpace(error.Message) ? error.GetType().Name : error.Message.Trim();
        _lastActionError = text.Length <= 500 ? text : text[..500];
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;

        await _gate.WaitAsync();
        try
        {
            await StopTelemetryUnsafeAsync();
            await StopWissenswaechterUnsafeAsync();
            if (_selfUpdater is not null)
            {
                _selfUpdater.UpdateInstallerStarted -= OnUpdateInstallerStarted;
                await _selfUpdater.DisposeAsync();
                _selfUpdater = null;
            }
            _httpClient.Dispose();
        }
        finally
        {
            _gate.Release();
            _gate.Dispose();
        }
    }
}
