using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record BridgeConfig
{
    public const int CurrentConfigVersion = 2;

    public int ConfigVersion { get; init; } = CurrentConfigVersion;
    public string CdpEndpoint { get; init; } = "http://127.0.0.1:9222";
    public string AllowedOrigin { get; init; } = "https://adventure.land";
    public string TelemetryIngestUrl { get; init; } = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/bot-debug-ingest";
    public string SignalControlUrl { get; init; } = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/bot-chatgpt-signal-control";
    public string TelemetryTokenEnvironmentVariable { get; init; } = "AIO_V3_DEBUG_TELEMETRY_TOKEN";
    public string BotId { get; init; } = "pi-main";
    public bool TelemetryEnabled { get; init; }
    public bool AutoStartBrowser { get; init; } = true;
    public string PreferredBrowser { get; init; } = "Brave";
    public int PollIntervalSeconds { get; init; } = 5;
    public int MaxBackoffSeconds { get; init; } = 300;
    public int EventLimit { get; init; } = 100;

    public static string AppDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "AioBotWindowsBridge");

    public static string BrowserProfileDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "AioBotWindowsBridge",
        "BrowserProfile");

    public static string ConfigPath => Path.Combine(AppDirectory, "settings.json");
    public static string StatePath => Path.Combine(AppDirectory, "bridge-state.json");
    public static string StatusPath => Path.Combine(AppDirectory, "bridge-status.json");
    public static string TokenPath => Path.Combine(AppDirectory, "telemetry-token.dpapi");

    public static async Task<BridgeConfig> LoadAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(AppDirectory);
        if (!File.Exists(ConfigPath))
        {
            var initial = new BridgeConfig();
            await initial.SaveAsync(cancellationToken);
            return initial;
        }

        var json = await File.ReadAllTextAsync(ConfigPath, cancellationToken);
        var loaded = JsonSerializer.Deserialize<BridgeConfig>(json, JsonOptions) ?? new BridgeConfig();

        using var document = JsonDocument.Parse(json);
        var hasConfigVersion = document.RootElement.TryGetProperty("configVersion", out _);
        if (!hasConfigVersion)
        {
            loaded = loaded with
            {
                ConfigVersion = CurrentConfigVersion,
                PreferredBrowser = string.Equals(loaded.PreferredBrowser, "Edge", StringComparison.OrdinalIgnoreCase)
                    ? "Brave"
                    : loaded.PreferredBrowser
            };
            await loaded.SaveAsync(cancellationToken);
        }

        return loaded;
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Validate();
        Directory.CreateDirectory(AppDirectory);
        var temporaryPath = ConfigPath + ".tmp";
        await using (var stream = File.Create(temporaryPath))
        {
            await JsonSerializer.SerializeAsync(stream, this with { ConfigVersion = CurrentConfigVersion }, JsonOptions, cancellationToken);
        }
        File.Move(temporaryPath, ConfigPath, true);
    }

    public void Validate()
    {
        if (!Uri.TryCreate(CdpEndpoint, UriKind.Absolute, out var cdp)
            || cdp.Scheme != Uri.UriSchemeHttp
            || !IsLoopback(cdp.Host))
            throw new InvalidOperationException("CDP_ENDPOINT_MUST_BE_LOOPBACK_HTTP");

        if (!Uri.TryCreate(AllowedOrigin, UriKind.Absolute, out var allowed)
            || allowed.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException("ALLOWED_ORIGIN_INVALID");

        ValidateHttps(TelemetryIngestUrl, "TELEMETRY_HTTPS_REQUIRED");
        ValidateHttps(SignalControlUrl, "SIGNAL_CONTROL_HTTPS_REQUIRED");

        if (string.IsNullOrWhiteSpace(TelemetryTokenEnvironmentVariable))
            throw new InvalidOperationException("TELEMETRY_TOKEN_ENV_REQUIRED");
        if (string.IsNullOrWhiteSpace(BotId) || BotId.Length > 128)
            throw new InvalidOperationException("BOT_ID_INVALID");
        if (!string.Equals(PreferredBrowser, "Brave", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Edge", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Chrome", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("PREFERRED_BROWSER_INVALID");
        if (PollIntervalSeconds is < 2 or > 60)
            throw new InvalidOperationException("POLL_INTERVAL_OUT_OF_RANGE");
        if (MaxBackoffSeconds < PollIntervalSeconds || MaxBackoffSeconds > 3600)
            throw new InvalidOperationException("MAX_BACKOFF_OUT_OF_RANGE");
        if (EventLimit is < 1 or > 200)
            throw new InvalidOperationException("EVENT_LIMIT_OUT_OF_RANGE");
    }

    private static void ValidateHttps(string value, string error)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException(error);
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

public sealed record BridgeState(long LastEventSeq = 0)
{
    public static async Task<BridgeState> LoadAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(BridgeConfig.StatePath)) return new BridgeState();
        try
        {
            await using var stream = File.OpenRead(BridgeConfig.StatePath);
            return await JsonSerializer.DeserializeAsync<BridgeState>(stream, BridgeConfig.JsonOptions, cancellationToken)
                ?? new BridgeState();
        }
        catch (Exception error)
        {
            throw new InvalidOperationException("BRIDGE_STATE_CORRUPT", error);
        }
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BridgeConfig.AppDirectory);
        await using var stream = File.Create(BridgeConfig.StatePath);
        await JsonSerializer.SerializeAsync(stream, this, BridgeConfig.JsonOptions, cancellationToken);
    }
}

public sealed record BridgeStatus(
    string State,
    string BotId,
    bool TelemetryEnabled,
    bool BrowserReady,
    bool SupabaseReady,
    DateTimeOffset? LastAttemptAt,
    DateTimeOffset? LastSuccessAt,
    long LastEventSeq,
    int? LastEventCount,
    string? LastError,
    string? TargetUrl)
{
    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BridgeConfig.AppDirectory);
        await using var stream = File.Create(BridgeConfig.StatusPath);
        await JsonSerializer.SerializeAsync(stream, this, BridgeConfig.JsonOptions, cancellationToken);
    }
}
