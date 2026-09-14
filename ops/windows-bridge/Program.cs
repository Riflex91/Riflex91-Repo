namespace AioBotWindowsBridge;

internal static class Program
{
    public static async Task<int> Main(string[] args)
    {
        var once = args.Any(arg => string.Equals(arg, "--once", StringComparison.OrdinalIgnoreCase));
        using var shutdown = new CancellationTokenSource();
        Console.CancelKeyPress += (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            shutdown.Cancel();
        };

        try
        {
            var config = await BridgeConfig.LoadAsync(shutdown.Token);
            config.Validate();
            var token = Environment.GetEnvironmentVariable(config.TelemetryTokenEnvironmentVariable) ?? string.Empty;
            if (token.Length is < 24 or > 256)
                throw new InvalidOperationException($"TELEMETRY_TOKEN_MISSING_OR_INVALID:{config.TelemetryTokenEnvironmentVariable}");

            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            var browser = new CdpAdventureLandClient(httpClient, config);
            var sink = new SupabaseTelemetrySink(httpClient, config, token);
            var state = await BridgeState.LoadAsync(shutdown.Token);
            var lastSuccess = (DateTimeOffset?)null;
            var failures = 0;

            Console.WriteLine($"AIO Windows Bridge started for {config.BotId}. Status: {BridgeConfig.StatusPath}");

            while (!shutdown.IsCancellationRequested)
            {
                var attempt = DateTimeOffset.UtcNow;
                try
                {
                    var read = await browser.ReadAsync(state.LastEventSeq, config.EventLimit, shutdown.Token);
                    await sink.SendAsync(read, state.LastEventSeq, shutdown.Token);
                    state = new BridgeState(read.MaxSeq);
                    await state.SaveAsync(shutdown.Token);
                    failures = 0;
                    lastSuccess = DateTimeOffset.UtcNow;
                    await new BridgeStatus(
                        "HEALTHY",
                        config.BotId,
                        attempt,
                        lastSuccess,
                        state.LastEventSeq,
                        read.EventCount,
                        null,
                        read.TargetUrl).SaveAsync(shutdown.Token);
                    Console.WriteLine($"{lastSuccess:O} telemetry ok events={read.EventCount} seq={state.LastEventSeq}");
                    if (once) return 0;
                    await Task.Delay(TimeSpan.FromSeconds(config.PollIntervalSeconds), shutdown.Token);
                }
                catch (OperationCanceledException) when (shutdown.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception error)
                {
                    failures++;
                    var message = Bounded(error.Message);
                    await new BridgeStatus(
                        "DEGRADED",
                        config.BotId,
                        attempt,
                        lastSuccess,
                        state.LastEventSeq,
                        null,
                        message,
                        null).SaveAsync(CancellationToken.None);
                    Console.Error.WriteLine($"{DateTimeOffset.UtcNow:O} {message}");
                    if (once) return 2;
                    var backoff = Math.Min(
                        config.MaxBackoffSeconds,
                        config.PollIntervalSeconds * Math.Pow(2, Math.Min(8, failures - 1)));
                    await Task.Delay(TimeSpan.FromSeconds(backoff), shutdown.Token);
                }
            }

            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(Bounded(error.Message));
            return 1;
        }
    }

    private static string Bounded(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "WINDOWS_BRIDGE_FAILED" : value;
        return text.Length <= 256 ? text : text[..256];
    }
}
