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
    string? TargetUrl);

public sealed class TelemetryBridgeService : IAsyncDisposable
{
    private readonly BridgeConfig _config;
    private readonly BrowserLauncher _launcher;
    private readonly CdpAdventureLandClient _browser;
    private readonly SupabaseTelemetrySink _sink;
    private CancellationTokenSource? _loopCts;
    private Task? _loopTask;

    public TelemetryBridgeService(HttpClient httpClient, BridgeConfig config, string token)
    {
        _config = config;
        _launcher = new BrowserLauncher(httpClient, config);
        _browser = new CdpAdventureLandClient(httpClient, config);
        _sink = new SupabaseTelemetrySink(httpClient, config, token);
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
        Publish(new RuntimeBridgeStatus("STOPPED", false, false, null, null, 0, 0, null, null));
    }

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        var state = await BridgeState.LoadAsync(cancellationToken);
        DateTimeOffset? lastSuccess = null;
        var failures = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            var attempt = DateTimeOffset.UtcNow;
            var browserReady = false;
            try
            {
                Publish(new RuntimeBridgeStatus("CONNECTING", false, false, attempt, lastSuccess, state.LastEventSeq, 0, null, null));
                var browserConnection = await _launcher.EnsureReadyAsync(cancellationToken);
                browserReady = browserConnection.Ready;
                if (!browserReady) throw new InvalidOperationException(browserConnection.State);

                var read = await _browser.ReadAsync(state.LastEventSeq, _config.EventLimit, cancellationToken);
                await _sink.SendAsync(read, state.LastEventSeq, cancellationToken);
                state = new BridgeState(read.MaxSeq);
                await state.SaveAsync(cancellationToken);
                failures = 0;
                lastSuccess = DateTimeOffset.UtcNow;
                var status = new RuntimeBridgeStatus(
                    "HEALTHY", true, true, attempt, lastSuccess, state.LastEventSeq, read.EventCount, null, read.TargetUrl);
                Publish(status);
                await SaveStatusAsync(status, cancellationToken);
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
                    "DEGRADED", browserReady, false, attempt, lastSuccess, state.LastEventSeq, 0, message, null);
                Publish(status);
                await SaveStatusAsync(status, CancellationToken.None);
                var backoff = ComputeBackoffSeconds(_config.PollIntervalSeconds, _config.MaxBackoffSeconds, failures);
                await Task.Delay(TimeSpan.FromSeconds(backoff), cancellationToken);
            }
        }
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
            status.TargetUrl).SaveAsync(cancellationToken);
    }

    private void Publish(RuntimeBridgeStatus status) => StatusChanged?.Invoke(status);

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
