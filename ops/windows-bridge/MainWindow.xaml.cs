using System.Windows;

namespace AioBotWindowsBridge;

public partial class MainWindow : Window
{
    private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(8) };
    private readonly SecureTokenStore _tokenStore = new();
    private BridgeConfig _config = new();
    private string? _token;
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
            ConfigPathText.Text = BridgeConfig.ConfigPath;

            _token = await _tokenStore.LoadAsync(_config.TelemetryTokenEnvironmentVariable);
            TokenStateText.Text = SecureTokenStore.IsValidToken(_token)
                ? "Token vorhanden und für diesen Windows-Benutzer geschützt gespeichert."
                : "Kein Token gefunden. Einmalig einfügen oder als AIO_V3_DEBUG_TELEMETRY_TOKEN setzen.";

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
        }
        finally
        {
            _initializing = false;
        }

        if (SecureTokenStore.IsValidToken(_token))
        {
            await RefreshConnectionsAsync(startBrowser: _config.TelemetryEnabled);
            if (_config.TelemetryEnabled) await StartBridgeAsync();
        }
        else
        {
            BrowserStateText.Text = "BEREIT";
            BotStateText.Text = "TOKEN FEHLT";
            SupabaseStateText.Text = "TOKEN FEHLT";
            SetSignalToggle(false, false, "Token fehlt");
        }
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
        _bridge = new TelemetryBridgeService(_httpClient, _config, _token!);
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
                "CONNECTING" => "Aktiv · Verbindung wird hergestellt",
                "DEGRADED" => "Aktiv · Wiederholungsversuch mit Backoff",
                _ => status.State
            };
            TelemetryErrorText.Text = status.LastError ?? string.Empty;
            TargetUrlText.Text = status.TargetUrl ?? TargetUrlText.Text;
            EventCountText.Text = $"{status.LastEventCount} Events";
            LastUploadText.Text = status.LastSuccessAt?.LocalDateTime.ToString("HH:mm:ss") ?? "—";
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
    }

    private async void CheckConnection_Click(object sender, RoutedEventArgs e)
    {
        await RefreshConnectionsAsync(startBrowser: true);
    }

    private async Task RefreshConnectionsAsync(bool startBrowser)
    {
        if (!SecureTokenStore.IsValidToken(_token))
        {
            SupabaseStateText.Text = "TOKEN FEHLT";
            return;
        }

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        try
        {
            var effectiveConfig = startBrowser ? _config : _config with { AutoStartBrowser = false };
            var launcher = new BrowserLauncher(_httpClient, effectiveConfig);
            var browser = await launcher.EnsureReadyAsync(cts.Token);
            BrowserStateText.Text = browser.Ready ? "VERBUNDEN" : "OFFLINE";
            if (browser.Ready)
            {
                try
                {
                    var cdp = new CdpAdventureLandClient(_httpClient, _config);
                    var target = await cdp.FindTargetUrlAsync(cts.Token);
                    TargetUrlText.Text = target;
                    BotStateText.Text = "GEFUNDEN";
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
            }
        }
        catch (Exception error)
        {
            BrowserStateText.Text = "FEHLER";
            BotStateText.Text = "OFFLINE";
            TelemetryErrorText.Text = Bounded(error.Message);
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
    }

    private static string Bounded(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "UNBEKANNTER_FEHLER" : value;
        return text.Length <= 256 ? text : text[..256];
    }
}
