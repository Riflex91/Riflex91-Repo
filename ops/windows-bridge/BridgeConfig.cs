using System.Text.Json;

namespace AioBotWindowsBridge;

internal sealed record BridgeConfig
{
    public string CdpEndpoint { get; init; } = "http://127.0.0.1:9222";
    public string AllowedOrigin { get; init; } = "https://adventure.land";
    public string TelemetryIngestUrl { get; init; } = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/bot-debug-ingest";
    public string TelemetryTokenEnvironmentVariable { get; init; } = "AIO_V3_DEBUG_TELEMETRY_TOKEN";
    public string BotId { get; init; } = "pi-main";
    public int PollIntervalSeconds { get; init; } = 5;
    public int MaxBackoffSeconds { get; init; } = 300;
    public int EventLimit { get; init; } = 100;

    public static string AppDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "AioBotControlCenter");

    public static string ConfigPath => Path.Combine(AppDirectory, "windows-bridge.json");
    public static string StatePath => Path.Combine(AppDirectory, "windows-bridge-state.json");
    public static string StatusPath => Path.Combine(AppDirectory, "windows-bridge-status.json");

    public static async Task<BridgeConfig> LoadAsync(CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(AppDirectory);
        if (!File.Exists(ConfigPath))
        {
            var initial = new BridgeConfig();
            await initial.SaveAsync(cancellationToken);
            return initial;
        }

        await using var stream = File.OpenRead(ConfigPath);
        return await JsonSerializer.DeserializeAsync<BridgeConfig>(stream, cancellationToken: cancellationToken)
            ?? new BridgeConfig();
    }

    public async Task SaveAsync(CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(AppDirectory);
        await using var stream = File.Create(ConfigPath);
        await JsonSerializer.SerializeAsync(stream, this, JsonOptions, cancellationToken);
    }

    public void Validate()
    {
        if (!Uri.TryCreate(CdpEndpoint, UriKind.Absolute, out var cdp)
            || cdp.Scheme != Uri.UriSchemeHttp
            || !IsLoopback(cdp.Host))
            throw new InvalidOperationException("CDP_ENDPOINT_MUST_BE_LOOPBACK_HTTP");

        if (!Uri.TryCreate(AllowedOrigin, UriKind.Absolute, out var allowed)
            || allowed.Scheme != Uri.UriSchemeHttps
            || allowed.AbsolutePath != "/")
            throw new InvalidOperationException("ALLOWED_ORIGIN_INVALID");

        if (!Uri.TryCreate(TelemetryIngestUrl, UriKind.Absolute, out var ingest)
            || ingest.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException("TELEMETRY_HTTPS_REQUIRED");

        if (string.IsNullOrWhiteSpace(TelemetryTokenEnvironmentVariable))
            throw new InvalidOperationException("TELEMETRY_TOKEN_ENV_REQUIRED");
        if (string.IsNullOrWhiteSpace(BotId) || BotId.Length > 128)
            throw new InvalidOperationException("BOT_ID_INVALID");
        if (PollIntervalSeconds is < 1 or > 60)
            throw new InvalidOperationException("POLL_INTERVAL_OUT_OF_RANGE");
        if (MaxBackoffSeconds < PollIntervalSeconds || MaxBackoffSeconds > 3600)
            throw new InvalidOperationException("MAX_BACKOFF_OUT_OF_RANGE");
        if (EventLimit is < 1 or > 200)
            throw new InvalidOperationException("EVENT_LIMIT_OUT_OF_RANGE");
    }

    private static bool IsLoopback(string host) =>
        string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
        || host == "127.0.0.1"
        || host == "::1"
        || host == "[::1]";

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}

internal sealed record BridgeState(long LastEventSeq = 0)
{
    public static async Task<BridgeState> LoadAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(BridgeConfig.StatePath)) return new BridgeState();
        try
        {
            await using var stream = File.OpenRead(BridgeConfig.StatePath);
            return await JsonSerializer.DeserializeAsync<BridgeState>(stream, cancellationToken: cancellationToken)
                ?? new BridgeState();
        }
        catch (Exception error)
        {
            throw new InvalidOperationException("BRIDGE_STATE_CORRUPT", error);
        }
    }

    public async Task SaveAsync(CancellationToken cancellationToken)
    {
        await using var stream = File.Create(BridgeConfig.StatePath);
        await JsonSerializer.SerializeAsync(stream, this, BridgeConfig.JsonOptions, cancellationToken);
    }
}

internal sealed record BridgeStatus(
    string State,
    string BotId,
    DateTimeOffset? LastAttemptAt,
    DateTimeOffset? LastSuccessAt,
    long LastEventSeq,
    int? LastEventCount,
    string? LastError,
    string? TargetUrl)
{
    public async Task SaveAsync(CancellationToken cancellationToken)
    {
        await using var stream = File.Create(BridgeConfig.StatusPath);
        await JsonSerializer.SerializeAsync(stream, this, BridgeConfig.JsonOptions, cancellationToken);
    }
}
