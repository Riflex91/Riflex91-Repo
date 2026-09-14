using System.Diagnostics;
using System.Windows;
using AioBotControlCenter.Models;
using AioBotControlCenter.Services;

namespace AioBotControlCenter;

public partial class MainWindow : Window
{
    private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(8) };
    private readonly GitHubStatusService _github;
    private readonly PiHostService _pi;
    private readonly PiControlService _control;
    private readonly TelemetryService _telemetry;
    private CancellationTokenSource? _refreshCts;

    public MainWindow()
    {
        InitializeComponent();
        _github = new GitHubStatusService(_httpClient);
        _pi = new PiHostService(_httpClient);
        _control = new PiControlService(_httpClient);
        _telemetry = new TelemetryService(_httpClient);
        ConfigPathText.Text = ControlCenterConfig.ConfigPath;
        Loaded += async (_, _) => await RefreshAsync();
    }

    private async void Refresh_Click(object sender, RoutedEventArgs e) => await RefreshAsync();

    private async Task RefreshAsync()
    {
        _refreshCts?.Cancel();
        _refreshCts = new CancellationTokenSource(TimeSpan.FromSeconds(12));
        var token = _refreshCts.Token;

        try
        {
            var config = await ControlCenterConfig.LoadAsync(token);
            var githubTask = _github.ReadMainAsync(config, token);
            var piTask = _pi.ReadAsync(config, token);
            var controlTask = _control.ReadAsync(config, token);
            var telemetryTask = _telemetry.ReadAsync(config, token);
            await Task.WhenAll(githubTask, piTask, controlTask, telemetryTask);

            var github = await githubTask;
            var pi = await piTask;
            var control = await controlTask;
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
            RenderControl(control);
        }
        catch (OperationCanceledException)
        {
            Render(DashboardSnapshot.Empty() with { LastIncident = "Refresh timed out" });
            RenderControl(new PiControlStatus("TIMEOUT", false, null, false));
        }
        catch (Exception error)
        {
            Render(DashboardSnapshot.Empty() with { LastIncident = error.Message });
            RenderControl(new PiControlStatus("ERROR", false, null, false));
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

    private void RenderControl(PiControlStatus status)
    {
        ControlStatusText.Text = status.RepoSha is { Length: > 7 }
            ? $"{status.State} · {status.RepoSha[..7]}"
            : status.State;
        var enabled = status.State == "HEALTHY" && !status.Busy;
        StartBotButton.IsEnabled = enabled;
        StopBotButton.IsEnabled = enabled;
        RestartBotButton.IsEnabled = enabled;
        DeployMainButton.IsEnabled = enabled;
        RollbackButton.IsEnabled = enabled;
    }

    private async Task RunControlCommandAsync(Func<ControlCenterConfig, CancellationToken, Task<PiCommandResult>> command, string title)
    {
        SetControlButtons(false);
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(3));
        try
        {
            var config = await ControlCenterConfig.LoadAsync(cts.Token);
            var result = await command(config, cts.Token);
            MessageBox.Show(result.Message, title, MessageBoxButton.OK, result.Ok ? MessageBoxImage.Information : MessageBoxImage.Warning);
        }
        catch (OperationCanceledException)
        {
            MessageBox.Show("The command timed out.", title, MessageBoxButton.OK, MessageBoxImage.Warning);
        }
        finally
        {
            await RefreshAsync();
        }
    }

    private void SetControlButtons(bool enabled)
    {
        StartBotButton.IsEnabled = enabled;
        StopBotButton.IsEnabled = enabled;
        RestartBotButton.IsEnabled = enabled;
        DeployMainButton.IsEnabled = enabled;
        RollbackButton.IsEnabled = enabled;
    }

    private async void StartBot_Click(object sender, RoutedEventArgs e) => await RunControlCommandAsync(_control.StartAsync, "Start bot");
    private async void StopBot_Click(object sender, RoutedEventArgs e) => await RunControlCommandAsync(_control.StopAsync, "Stop bot");
    private async void RestartBot_Click(object sender, RoutedEventArgs e) => await RunControlCommandAsync(_control.RestartAsync, "Restart bot");
    private async void DeployMain_Click(object sender, RoutedEventArgs e) => await RunControlCommandAsync(_control.DeployMainAsync, "Deploy main");
    private async void Rollback_Click(object sender, RoutedEventArgs e) => await RunControlCommandAsync(_control.RollbackAsync, "Rollback");

    private void OpenSettings_Click(object sender, RoutedEventArgs e)
    {
        var directory = Path.GetDirectoryName(ControlCenterConfig.ConfigPath)!;
        Directory.CreateDirectory(directory);
        if (!File.Exists(ControlCenterConfig.ConfigPath))
            new ControlCenterConfig().SaveAsync().GetAwaiter().GetResult();
        Process.Start(new ProcessStartInfo("explorer.exe", directory) { UseShellExecute = true });
    }
}
