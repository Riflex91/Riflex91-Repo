using System.Windows;

namespace AioBotWindowsBridge;

public partial class MainWindow : Window
{
    private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(8) };
    private readonly SecureTokenStore _tokenStore = new();
    private readonly SecureDashboardWriteKeyStore _dashboardKeyStore = new();
    private readonly SecureFtpsPasswordStore _ftpsPasswordStore = new();
    private BridgeConfig _config = new();
    private string? _token;
    private string? _dashboardWriteKey;
    private string? _diagnosticsFtpsPassword;
    private TelemetryBridgeService? _bridge;
    private bool _initializing = true;
    private bool _changingSignal;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
        Closed += MainWindow_Closed;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        _initializing = true;
        try
        {
            _config = await BridgeConfig.LoadAsync();
            _config.Validate();
            BotIdText.Text = _config.BotId;
            DetailBotIdText.Text = _config.BotId;
            IngestUrlText.Text = _config.TelemetryIngestUrl;
            DashboardUrlText.Text = _config.WebDashboardBaseUrl;
            ConfigPathText.Text = BridgeConfig.ConfigPath;

            _token = await _tokenStore.LoadAsync(_config.TelemetryTokenEnvironmentVariable);
            TokenStateText.Text = SecureTokenStore.IsValidToken(_token)
                ? "Token vorhanden und für diesen Windows-Benutzer geschützt gespeichert."
                : "Kein Token gefunden. Einmalig einfügen oder als AIO_V3_DEBUG_TELEMETRY_TOKEN setzen.";

            _dashboardWriteKey = await _dashboardKeyStore.LoadAsync(_config.WebDashboardWriteKeyEnvironmentVariable);
            UpdateDashboardCredentialStatus();

            _diagnosticsFtpsPassword = await _ftpsPasswordStore.LoadAsync(_config.DiagnosticsFtpsPasswordEnvironmentVariable);
            LoadFtpsControlsFromConfig();
            UpdateFtpsCredentialStatus();

            TelemetryToggle.IsChecked = _config.TelemetryEnabled && SecureTokenStore.IsValidToken(_token);
            if (_config.TelemetryEnabled && !SecureTokenStore.IsValidToken(_token))
            {
                _config = _config with { TelemetryEnabled = false };
                await _config.SaveAsync();
            }
            UpdateToggleLabels();
        }
        catch (Exception error)
        {
            TelemetryErrorText.Text = Bounded(error.Message);
            SupabaseStateText.Text = "FEHLER";
            DashboardStateText.Text = "FEHLER";
            DiagnosticsFtpsStateText.Text = "FEHLER";
            DiagnosticsFtpsErrorText.Text = Bounded(error.Message);
        }
        finally
        {
            _initializing = false;
        }

        await RefreshConnectionsAsync(startBrowser: _config.TelemetryEnabled && SecureTokenStore.IsValidToken(_token));
        if (_config.TelemetryEnabled && SecureTokenStore.IsValidToken(_token))
            await StartBridgeAsync();
    }

    private async void MainWindow_Closed(object? sender, EventArgs e)
    {
        if (_bridge is not null) await _bridge.DisposeAsync();
        _httpClient.Dispose();
    }

    private async void TelemetryToggle_Changed(object sender, RoutedEventArgs e)
    {
        if (_initializing) return;
        var enabled = TelemetryToggle.IsChecked == true;
        if (enabled && !SecureTokenStore.IsValidToken(_token))
        {
            _initializing = true;
            TelemetryToggle.IsChecked = false;
            _initializing = false;
            UpdateToggleLabels();
            MessageBox.Show("Für die Supabase-Verbindung fehlt der Telemetrie-Token.", "AIO Windows Bridge", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        try
        {
            _config = _config with { TelemetryEnabled = enabled };
            await _config.SaveAsync();
            if (enabled) await StartBridgeAsync();
            else await StopBridgeAsync();
            UpdateToggleLabels();
            UpdateFtpsCredentialStatus();
        }
        catch (Exception error)
        {
            TelemetryErrorText.Text = Bounded(error.Message);
        }
    }

    private async Task StartBridgeAsync()
    {
        if (!SecureTokenStore.IsValidToken(_token)) return;
        if (_bridge is not null && _bridge.IsRunning) return;

        if (_bridge is not null) await _bridge.DisposeAsync();
        _bridge = new TelemetryBridgeService(
            _httpClient,
            _config,
            _token!,
            _dashboardWriteKey,
            _diagnosticsFtpsPassword);
        _bridge.StatusChanged += OnBridgeStatusChanged;
        await _bridge.StartAsync();
        TelemetryDetailText.Text = "Aktiv · verbindet automatisch";
        TelemetryErrorText.Text = string.Empty;
    }

    private async Task StopBridgeAsync()
    {
        if (_bridge is not null)
        {
            _bridge.StatusChanged -= OnBridgeStatusChanged;
            await _bridge.DisposeAsync();
            _bridge = null;
        }
        TelemetryDetailText.Text = "Gestoppt";
        SupabaseStateText.Text = SecureTokenStore.IsValidToken(_token) ? "BEREIT" : "TOKEN FEHLT";
    }

    private void OnBridgeStatusChanged(RuntimeBridgeStatus status)
    {
        Dispatcher.Invoke(() =>
        {
            BrowserStateText.Text = status.BrowserReady ? "VERBUNDEN" : status.State == "CONNECTING" ? "VERBINDE …" : "OFFLINE";
            BotStateText.Text = status.TargetUrl is not null ? "GEFUNDEN" : status.BrowserReady ? "SUCHE …" : "OFFLINE";
            SupabaseStateText.Text = status.SupabaseReady ? "VERBUNDEN" : status.State == "CONNECTING" ? "VERBINDE …" : "OFFLINE";
            TelemetryDetailText.Text = status.State switch
            {
                "HEALTHY" => "Aktiv · Upload erfolgreich",
                "CATCHING_UP" => "Aktiv · Telemetrie wird aufgeholt",
                "CONNECTING" => "Aktiv · Verbindung wird hergestellt",
                "DEGRADED" => "Aktiv · Wiederholungsversuch mit Backoff",
                _ => status.State
            };
            TelemetryErrorText.Text = status.LastError ?? string.Empty;
            TargetUrlText.Text = status.TargetUrl ?? TargetUrlText.Text;
            EventCountText.Text = $"{status.LastEventCount} Events";
            LastUploadText.Text = status.LastSuccessAt?.LocalDateTime.ToString("HH:mm:ss") ?? "—";
            DashboardStateText.Text = DashboardStateLabel(status.WebDashboardState);
            DashboardErrorText.Text = status.WebDashboardError ?? string.Empty;
        });
    }

    private async void SignalToggle_Changed(object sender, RoutedEventArgs e)
    {
        if (_initializing || _changingSignal) return;
        if (!SecureTokenStore.IsValidToken(_token))
        {
            SetSignalToggle(false, false, "Token fehlt");
            return;
        }

        var desired = SignalToggle.IsChecked == true;
        SignalToggle.IsEnabled = false;
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var client = new SupabaseSignalControlClient(_httpClient, _config, _token!);
            var status = await client.SetAsync(desired, cts.Token);
            SetSignalToggle(status.Enabled, true, status.UpdatedAt?.LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss"));
            SupabaseStateText.Text = "VERBUNDEN";
        }
        catch (Exception error)
        {
            SetSignalToggle(!desired, true, "Fehler: " + Bounded(error.Message));
            SupabaseStateText.Text = "FEHLER";
        }
        finally
        {
            SignalToggle.IsEnabled = true;
        }
    }

    private async void SaveDashboardWriteKey_Click(object sender, RoutedEventArgs e)
    {
        var writeKey = DashboardWriteKeyBox.Password.Trim();
        try
        {
            await _dashboardKeyStore.SaveAsync(writeKey);
            _dashboardWriteKey = writeKey;
            DashboardWriteKeyBox.Clear();
            UpdateDashboardCredentialStatus("Write-Key sicher mit Windows-DPAPI gespeichert.");

            var restartTelemetry = _bridge is not null && _bridge.IsRunning;
            if (restartTelemetry) await StopBridgeAsync();
            await RefreshConnectionsAsync(startBrowser: true);
            if (restartTelemetry || _config.TelemetryEnabled) await StartBridgeAsync();
        }
        catch (Exception error)
        {
            DashboardKeyStateText.Text = "Write-Key konnte nicht gespeichert werden: " + Bounded(error.Message);
            DashboardStateText.Text = "FEHLER";
        }
    }

    private async void DeleteDashboardWriteKey_Click(object sender, RoutedEventArgs e)
    {
        var restartTelemetry = _bridge is not null && _bridge.IsRunning;
        if (restartTelemetry) await StopBridgeAsync();

        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(8));
            var launcher = new BrowserLauncher(_httpClient, _config with { AutoStartBrowser = false });
            if (await launcher.ProbeAsync(cts.Token))
            {
                var dashboard = new CdpWebDashboardConfigurator(_httpClient, _config);
                await dashboard.ClearAsync(cts.Token);
            }
        }
        catch (Exception error)
        {
            DashboardErrorText.Text = "Profil-Bereinigung wird beim nächsten Start erneut versucht: " + Bounded(error.Message);
        }

        await _dashboardKeyStore.DeleteAsync();
        _dashboardWriteKey = null;
        DashboardWriteKeyBox.Clear();
        UpdateDashboardCredentialStatus("Write-Key gelöscht.");
        DashboardStateText.Text = _config.WebDashboardEnabled ? "WRITE-KEY FEHLT" : "DEAKTIVIERT";

        if (restartTelemetry || _config.TelemetryEnabled) await StartBridgeAsync();
    }

    private async void SaveFtpsSettings_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var candidate = BuildFtpsConfigFromUi(forceEnabled: null);
            var typedPassword = DiagnosticsFtpsPasswordBox.Password;
            if (!string.IsNullOrEmpty(typedPassword))
            {
                await _ftpsPasswordStore.SaveAsync(typedPassword);
                _diagnosticsFtpsPassword = typedPassword;
                DiagnosticsFtpsPasswordBox.Clear();
            }

            if (candidate.DiagnosticsFtpsEnabled && !SecureFtpsPasswordStore.IsValidPassword(_diagnosticsFtpsPassword))
                throw new InvalidOperationException("DIAGNOSTICS_FTPS_PASSWORD_REQUIRED");

            await candidate.SaveAsync();
            _config = candidate;
            await RestartBridgeIfRunningAsync();
            UpdateFtpsCredentialStatus("FTPS-Einstellungen gespeichert.");
            DiagnosticsFtpsErrorText.Text = string.Empty;
        }
        catch (Exception error)
        {
            DiagnosticsFtpsStateText.Text = "FEHLER";
            DiagnosticsFtpsErrorText.Text = Bounded(error.Message);
        }
    }

    private async void TestFtpsConnection_Click(object sender, RoutedEventArgs e)
    {
        DiagnosticsFtpsStateText.Text = "VERBINDE …";
        DiagnosticsFtpsErrorText.Text = string.Empty;
        try
        {
            var candidate = BuildFtpsConfigFromUi(forceEnabled: true);
            var password = DiagnosticsFtpsPasswordBox.Password;
            if (!SecureFtpsPasswordStore.IsValidPassword(password)) password = _diagnosticsFtpsPassword;
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            var result = await FtpsDiagnosticsArchive.TestConnectionAsync(candidate, password, cts.Token);
            DiagnosticsFtpsStateText.Text = result.Success ? "VERBUNDEN" : "FEHLER";
            DiagnosticsFtpsErrorText.Text = result.Success ? string.Empty : result.Message;
            if (result.Success)
                DiagnosticsFtpsPasswordStateText.Text = SecureFtpsPasswordStore.IsValidPassword(_diagnosticsFtpsPassword)
                    ? "Verbindung erfolgreich. Passwort ist sicher gespeichert."
                    : "Verbindung erfolgreich. Passwort noch speichern, damit automatische Uploads funktionieren.";
        }
        catch (Exception error)
        {
            DiagnosticsFtpsStateText.Text = "FEHLER";
            DiagnosticsFtpsErrorText.Text = Bounded(error.Message);
        }
    }

    private async void DeleteFtpsPassword_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            await _ftpsPasswordStore.DeleteAsync();
            _diagnosticsFtpsPassword = null;
            DiagnosticsFtpsPasswordBox.Clear();
            _config = _config with { DiagnosticsFtpsEnabled = false };
            await _config.SaveAsync();
            DiagnosticsFtpsToggle.IsChecked = false;
            await RestartBridgeIfRunningAsync();
            UpdateFtpsCredentialStatus("FTPS-Passwort gelöscht; Diagnose-Upload wurde deaktiviert.");
        }
        catch (Exception error)
        {
            DiagnosticsFtpsStateText.Text = "FEHLER";
            DiagnosticsFtpsErrorText.Text = Bounded(error.Message);
        }
    }

    private BridgeConfig BuildFtpsConfigFromUi(bool? forceEnabled)
    {
        if (!int.TryParse(DiagnosticsFtpsPortBox.Text.Trim(), out var port))
            throw new InvalidOperationException("DIAGNOSTICS_FTPS_PORT_INVALID");
        var candidate = _config with
        {
            DiagnosticsFtpsEnabled = forceEnabled ?? DiagnosticsFtpsToggle.IsChecked == true,
            DiagnosticsFtpsHost = DiagnosticsFtpsHostBox.Text.Trim(),
            DiagnosticsFtpsPort = port,
            DiagnosticsFtpsUser = DiagnosticsFtpsUserBox.Text.Trim(),
            DiagnosticsFtpsRoot = DiagnosticsFtpsRootBox.Text.Trim(),
            DiagnosticsFtpsRejectUnauthorized = DiagnosticsFtpsRejectUnauthorizedCheck.IsChecked != false
        };
        candidate.Validate();
        return candidate;
    }

    private void LoadFtpsControlsFromConfig()
    {
        DiagnosticsFtpsToggle.IsChecked = _config.DiagnosticsFtpsEnabled;
        DiagnosticsFtpsHostBox.Text = _config.DiagnosticsFtpsHost;
        DiagnosticsFtpsPortBox.Text = _config.DiagnosticsFtpsPort.ToString();
        DiagnosticsFtpsUserBox.Text = _config.DiagnosticsFtpsUser;
        DiagnosticsFtpsRootBox.Text = _config.DiagnosticsFtpsRoot;
        DiagnosticsFtpsRejectUnauthorizedCheck.IsChecked = _config.DiagnosticsFtpsRejectUnauthorized;
    }

    private void UpdateFtpsCredentialStatus(string? overrideText = null)
    {
        var passwordPresent = SecureFtpsPasswordStore.IsValidPassword(_diagnosticsFtpsPassword);
        DiagnosticsFtpsToggle.Content = DiagnosticsFtpsToggle.IsChecked == true ? "FTPS AN" : "FTPS AUS";
        DiagnosticsFtpsPasswordStateText.Text = overrideText ?? (passwordPresent
            ? "FTPS-Passwort vorhanden und für diesen Windows-Benutzer mit DPAPI geschützt gespeichert."
            : $"Kein FTPS-Passwort gespeichert. Einmalig einfügen oder als {_config.DiagnosticsFtpsPasswordEnvironmentVariable} setzen.");

        if (!_config.DiagnosticsFtpsEnabled)
            DiagnosticsFtpsStateText.Text = "DEAKTIVIERT";
        else if (!passwordPresent)
            DiagnosticsFtpsStateText.Text = "PASSWORT FEHLT";
        else if (!_config.TelemetryEnabled)
            DiagnosticsFtpsStateText.Text = "BEREIT · WARTET AUF TELEMETRIE";
        else
            DiagnosticsFtpsStateText.Text = "BEREIT · AUTOMATISCH";
    }

    private async Task RestartBridgeIfRunningAsync()
    {
        var restart = _bridge is not null && _bridge.IsRunning;
        if (restart) await StopBridgeAsync();
        if ((restart || _config.TelemetryEnabled) && SecureTokenStore.IsValidToken(_token))
            await StartBridgeAsync();
    }

    private async void SaveToken_Click(object sender, RoutedEventArgs e)
    {
        var token = TokenBox.Password.Trim();
        try
        {
            await _tokenStore.SaveAsync(token);
            _token = token;
            TokenBox.Clear();
            TokenStateText.Text = "Token sicher mit Windows-DPAPI gespeichert.";
            await RefreshConnectionsAsync(startBrowser: _config.TelemetryEnabled);
            if (_config.TelemetryEnabled) await StartBridgeAsync();
        }
        catch (Exception error)
        {
            TokenStateText.Text = "Token konnte nicht gespeichert werden: " + Bounded(error.Message);
        }
    }

    private async void DeleteToken_Click(object sender, RoutedEventArgs e)
    {
        await StopBridgeAsync();
        await _tokenStore.DeleteAsync();
        _token = null;
        _config = _config with { TelemetryEnabled = false };
        await _config.SaveAsync();
        _initializing = true;
        TelemetryToggle.IsChecked = false;
        _initializing = false;
        TokenBox.Clear();
        TokenStateText.Text = "Token gelöscht.";
        SupabaseStateText.Text = "TOKEN FEHLT";
        SetSignalToggle(false, false, "Token fehlt");
        UpdateToggleLabels();
        UpdateFtpsCredentialStatus();
    }

    private async void CheckConnection_Click(object sender, RoutedEventArgs e)
    {
        await RefreshConnectionsAsync(startBrowser: true);
    }

    private async Task RefreshConnectionsAsync(bool startBrowser)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        try
        {
            var effectiveConfig = startBrowser ? _config : _config with { AutoStartBrowser = false };
            var launcher = new BrowserLauncher(_httpClient, effectiveConfig);
            var browser = await launcher.EnsureReadyAsync(cts.Token);
            BrowserStateText.Text = browser.Ready ? "VERBUNDEN" : "OFFLINE";
            if (browser.Ready)
            {
                await SyncDashboardProfileAsync(cts.Token);
                try
                {
                    var cdp = new CdpAdventureLandClient(_httpClient, _config);
                    var target = await cdp.FindBotTargetUrlAsync(cts.Token);
                    TargetUrlText.Text = target;
                    BotStateText.Text = "GEFUNDEN";
                    TelemetryErrorText.Text = string.Empty;
                }
                catch (Exception error)
                {
                    BotStateText.Text = "NICHT GEFUNDEN";
                    TelemetryErrorText.Text = Bounded(error.Message);
                }
            }
            else
            {
                BotStateText.Text = "OFFLINE";
                DashboardStateText.Text = SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey)
                    ? "WARTET AUF BROWSER"
                    : _config.WebDashboardEnabled ? "WRITE-KEY FEHLT" : "DEAKTIVIERT";
            }
        }
        catch (Exception error)
        {
            BrowserStateText.Text = "FEHLER";
            BotStateText.Text = "OFFLINE";
            TelemetryErrorText.Text = Bounded(error.Message);
        }

        if (!SecureTokenStore.IsValidToken(_token))
        {
            SupabaseStateText.Text = "TOKEN FEHLT";
            SetSignalToggle(false, false, "Token fehlt");
            return;
        }

        try
        {
            var signal = new SupabaseSignalControlClient(_httpClient, _config, _token!);
            var status = await signal.ReadAsync(cts.Token);
            SupabaseStateText.Text = "VERBUNDEN";
            SetSignalToggle(status.Enabled, true, status.UpdatedAt?.LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss"));
        }
        catch (Exception error)
        {
            SupabaseStateText.Text = "FEHLER";
            SetSignalToggle(false, true, "Fehler: " + Bounded(error.Message));
        }
    }

    private async Task SyncDashboardProfileAsync(CancellationToken cancellationToken)
    {
        var dashboard = new CdpWebDashboardConfigurator(_httpClient, _config);
        try
        {
            if (!_config.WebDashboardEnabled)
            {
                await dashboard.ClearAsync(cancellationToken);
                DashboardStateText.Text = "DEAKTIVIERT";
                DashboardErrorText.Text = string.Empty;
                return;
            }

            if (!SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey))
            {
                await dashboard.ClearAsync(cancellationToken);
                DashboardStateText.Text = "WRITE-KEY FEHLT";
                DashboardErrorText.Text = string.Empty;
                return;
            }

            var result = await dashboard.ApplyAsync(
                _config.WebDashboardBaseUrl,
                _config.WebDashboardAccount,
                _dashboardWriteKey!,
                cancellationToken);
            DashboardStateText.Text = result.Applied ? "BEREIT · PROFIL SYNCHRONISIERT" : "FEHLER";
            DashboardErrorText.Text = string.Empty;
        }
        catch (Exception error)
        {
            DashboardStateText.Text = "FEHLER";
            DashboardErrorText.Text = Bounded(error.Message);
        }
    }

    private void UpdateDashboardCredentialStatus(string? overrideText = null)
    {
        var keyPresent = SecureDashboardWriteKeyStore.IsValidWriteKey(_dashboardWriteKey);
        DashboardKeyStateText.Text = overrideText ?? (keyPresent
            ? "Write-Key vorhanden und für diesen Windows-Benutzer geschützt gespeichert."
            : $"Kein Write-Key gefunden. Einmalig einfügen oder als {_config.WebDashboardWriteKeyEnvironmentVariable} setzen.");
        DashboardStateText.Text = !_config.WebDashboardEnabled
            ? "DEAKTIVIERT"
            : keyPresent ? "BEREIT · WARTET AUF BROWSER" : "WRITE-KEY FEHLT";
        if (!keyPresent) DashboardErrorText.Text = string.Empty;
    }

    private void SetSignalToggle(bool enabled, bool controlEnabled, string? detail)
    {
        _changingSignal = true;
        SignalToggle.IsChecked = enabled;
        SignalToggle.IsEnabled = controlEnabled;
        _changingSignal = false;
        SignalDetailText.Text = enabled ? "Freigegeben" : "Gesperrt";
        SignalUpdatedText.Text = detail ?? string.Empty;
        UpdateToggleLabels();
    }

    private void UpdateToggleLabels()
    {
        TelemetryToggle.Content = TelemetryToggle.IsChecked == true ? "TELEMETRIE AN" : "TELEMETRIE AUS";
        SignalToggle.Content = SignalToggle.IsChecked == true ? "SIGNALE AN" : "SIGNALE AUS";
        if (DiagnosticsFtpsToggle is not null)
            DiagnosticsFtpsToggle.Content = DiagnosticsFtpsToggle.IsChecked == true ? "FTPS AN" : "FTPS AUS";
    }

    private static string DashboardStateLabel(string state) => state switch
    {
        "READY" => "BEREIT · PROFIL SYNCHRONISIERT",
        "PENDING" => "BEREIT · WARTET AUF BROWSER",
        "WRITE_KEY_MISSING" => "WRITE-KEY FEHLT",
        "DISABLED" => "DEAKTIVIERT",
        "ERROR" => "FEHLER",
        _ => state
    };

    private static string Bounded(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "UNBEKANNTER_FEHLER" : value;
        return text.Length <= 256 ? text : text[..256];
    }
}
