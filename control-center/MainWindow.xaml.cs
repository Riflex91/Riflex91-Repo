using System.Diagnostics;
using System.Windows;
using AioBotControlCenter.Models;
using AioBotControlCenter.Services;

namespace AioBotControlCenter;

public partial class MainWindow : Window
{
    private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(5) };
    private readonly GitHubStatusService _github;
    private readonly PiHostService _pi;
    private readonly TelemetryService _telemetry;
    private CancellationTokenSource? _refreshCts;

    public MainWindow()
    {
        InitializeComponent();
        _github = new GitHubStatusService(_httpClient);
        _pi = new PiHostService(_httpClient);
        _telemetry = new TelemetryService(_httpClient);
        ConfigPathText.Text = ControlCenterConfig.ConfigPath;
        Loaded += async (_, _) => await RefreshAsync();
    }

    private async void Refresh_Click(object sender, RoutedEventArgs e) => await RefreshAsync();

    private async Task RefreshAsync()
    {
        _refreshCts?.Cancel();
        _refreshCts = new CancellationTokenSource(TimeSpan.FromSeconds(8));
        var token = _refreshCts.Token;

        try
        {
            var config = await ControlCenterConfig.LoadAsync(token);
            var githubTask = _github.ReadMainAsync(config, token);
            var piTask = _pi.ReadAsync(config, token);
            var telemetryTask = _telemetry.ReadAsync(config, token);
            await Task.WhenAll(githubTask, piTask, telemetryTask);

            var github = await githubTask;
            var pi = await piTask;
            var telemetry = await telemetryTask;
            Render(new DashboardSnapshot(
                DateTimeOffset.Now,
                github.Commit,
                github.State,
                pi.State,
                pi.BotHealth,
                telemetry.State,
                pi.CharacterName,
                pi.Map,
                pi.RestartCount,
                telemetry.LastIncident));
        }
        catch (OperationCanceledException)
        {
            Render(DashboardSnapshot.Empty() with { LastIncident = "Refresh timed out" });
        }
        catch (Exception error)
        {
            Render(DashboardSnapshot.Empty() with { LastIncident = error.Message });
        }
    }

    private void Render(DashboardSnapshot snapshot)
    {
        BotHealthText.Text = snapshot.BotHealth;
        PiStateText.Text = snapshot.PiState;
        TelemetryStateText.Text = snapshot.TelemetryState;
        GitHubCommitText.Text = snapshot.GitHubCommit;
        GitHubStateText.Text = snapshot.GitHubState;
        CharacterText.Text = snapshot.CharacterName ?? "—";
        MapText.Text = snapshot.Map ?? "—";
        RestartCountText.Text = snapshot.RestartCount.ToString();
        LastIncidentText.Text = snapshot.LastIncident ?? "None";
        LastRefreshText.Text = snapshot.RefreshedAt.LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss");
    }

    private void OpenSettings_Click(object sender, RoutedEventArgs e)
    {
        var directory = Path.GetDirectoryName(ControlCenterConfig.ConfigPath)!;
        Directory.CreateDirectory(directory);
        if (!File.Exists(ControlCenterConfig.ConfigPath))
            new ControlCenterConfig().SaveAsync().GetAwaiter().GetResult();
        Process.Start(new ProcessStartInfo("explorer.exe", directory) { UseShellExecute = true });
    }
}
