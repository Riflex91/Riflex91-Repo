using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record BridgeConfig
{
    public const int CurrentConfigVersion = 9;

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
    public int PollIntervalSeconds { get; init; } = 5;\n    public int SupabaseStatusIntervalSeconds { get; init; } = 60;
    public int MaxBackoffSeconds { get; init; } = 300;
    public int EventLimit { get; init; } = 100;

    public bool WissenswaechterAktiv { get; init; } = true;
    public int WissenswaechterIntervallMinuten { get; init; } = 60;
    public bool WissenswaechterWebSucheAktiv { get; init; } = true;
    public int WissenswaechterMaxQuellenProLauf { get; init; } = 200;
    public int WissenswaechterMaxKandidaten { get; init; } = 1000;

    public bool LiveWissensimportAktiv { get; init; } = true;
    public string LiveWissensdatenbankPfad { get; init; } = @"D:\AdventureLand-V5\wissensdatenbank";
    public int LiveWissensMaxDateienProLauf { get; init; } = 5000;
    public int LiveWissensMaxDateiBytes { get; init; } = 512 * 1024;
    public long LiveWissensMaxGesamtBytesProLauf { get; init; } = 64L * 1024 * 1024;

    public bool WebDashboardEnabled { get; init; } = true;
    public string WebDashboardBaseUrl { get; init; } = "https://aio-bot-dashboard.hansijuergenlul.workers.dev";
    public string WebDashboardAccount { get; init; } = "default";
    public string WebDashboardWriteKeyEnvironmentVariable { get; init; } = "AIO_V3_WEB_DASHBOARD_WRITE_KEY";

    // Backblaze credentials are never stored in settings.json. Only the non-secret
    // endpoint/bucket settings live here; keyID + applicationKey are DPAPI-protected.
    public bool BackblazeEnabled { get; init; } = true;
    public string BackblazeEndpoint { get; init; } = "https://s3.eu-central-003.backblazeb2.com";
    public string BackblazeRegion { get; init; } = "eu-central-003";
    public string BackblazeBucket { get; init; } = "al-aio-bot";
    public string BackblazePrefix { get; init; } = "v4";
    public string BackblazeKeyIdEnvironmentVariable { get; init; } = "AIO_V4_BACKBLAZE_KEY_ID";
    public string BackblazeApplicationKeyEnvironmentVariable { get; init; } = "AIO_V4_BACKBLAZE_APPLICATION_KEY";

    public static string AppDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "AioBotWindowsBridge");

    public static string LocalAppDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "AioBotWindowsBridge");

    public static string BrowserProfileDirectory => Path.Combine(LocalAppDirectory, "BrowserProfile");
    public static string DiagnosticsDirectory => Path.Combine(LocalAppDirectory, "Diagnostics");

    public static string ConfigPath => Path.Combine(AppDirectory, "settings.json");
    public static string StatePath => Path.Combine(AppDirectory, "bridge-state.json");
    public static string StatusPath => Path.Combine(AppDirectory, "bridge-status.json");
    public static string TokenPath => Path.Combine(AppDirectory, "telemetry-token.dpapi");
    public static string WebDashboardWriteKeyPath => Path.Combine(AppDirectory, "web-dashboard-write-key.dpapi");
    public static string BackblazeCredentialsPath => Path.Combine(AppDirectory, "backblaze-credentials.dpapi");

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
        var storedVersion = 0;
        var hasConfigVersion = document.RootElement.TryGetProperty("configVersion", out var versionNode)
            && versionNode.TryGetInt32(out storedVersion);
        var needsMigration = !hasConfigVersion || storedVersion < CurrentConfigVersion;
        if (needsMigration)
        {
            loaded = loaded with
            {
                ConfigVersion = CurrentConfigVersion,
                PreferredBrowser = !hasConfigVersion && string.Equals(loaded.PreferredBrowser, "Edge", StringComparison.OrdinalIgnoreCase)
                    ? "Brave"
                    : loaded.PreferredBrowser,
                PollIntervalSeconds = storedVersion < 9 && loaded.PollIntervalSeconds == 60
                    ? 5
                    : loaded.PollIntervalSeconds
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
        ValidateHttps(WebDashboardBaseUrl, "WEB_DASHBOARD_HTTPS_REQUIRED");

        if (string.IsNullOrWhiteSpace(TelemetryTokenEnvironmentVariable))
            throw new InvalidOperationException("TELEMETRY_TOKEN_ENV_REQUIRED");
        if (string.IsNullOrWhiteSpace(WebDashboardWriteKeyEnvironmentVariable))
            throw new InvalidOperationException("WEB_DASHBOARD_WRITE_KEY_ENV_REQUIRED");
        if (string.IsNullOrWhiteSpace(WebDashboardAccount) || WebDashboardAccount.Length > 100)
            throw new InvalidOperationException("WEB_DASHBOARD_ACCOUNT_INVALID");
        if (string.IsNullOrWhiteSpace(BotId) || BotId.Length > 128)
            throw new InvalidOperationException("BOT_ID_INVALID");
        if (!string.Equals(PreferredBrowser, "Brave", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Edge", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Chrome", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("PREFERRED_BROWSER_INVALID");
        if (PollIntervalSeconds is < 2 or > 60)
            throw new InvalidOperationException("POLL_INTERVAL_OUT_OF_RANGE");
        if (SupabaseStatusIntervalSeconds != 60)
            throw new InvalidOperationException("SUPABASE_STATUS_INTERVAL_MUST_BE_60_SECONDS");
        if (MaxBackoffSeconds < PollIntervalSeconds || MaxBackoffSeconds > 3600)
            throw new InvalidOperationException("MAX_BACKOFF_OUT_OF_RANGE");
        if (EventLimit is < 1 or > 200)
            throw new InvalidOperationException("EVENT_LIMIT_OUT_OF_RANGE");

        if (WissenswaechterIntervallMinuten != 60)
            throw new InvalidOperationException("WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
        if (WissenswaechterMaxQuellenProLauf is < 1 or > 500)
            throw new InvalidOperationException("WISSENSWAECHTER_QUELLENLIMIT_UNGUELTIG");
        if (WissenswaechterMaxKandidaten is < 50 or > 5000)
            throw new InvalidOperationException("WISSENSWAECHTER_KANDIDATENLIMIT_UNGUELTIG");

        _ = NormalisiereLiveWissenspfad(LiveWissensdatenbankPfad);
        if (LiveWissensMaxDateienProLauf is < 1 or > 20000)
            throw new InvalidOperationException("LIVE_WISSEN_DATEILIMIT_UNGUELTIG");
        if (LiveWissensMaxDateiBytes is < 16 * 1024 or > 5 * 1024 * 1024)
            throw new InvalidOperationException("LIVE_WISSEN_DATEIGROESSE_UNGUELTIG");
        if (LiveWissensMaxGesamtBytesProLauf is < 1024 * 1024 or > 512L * 1024 * 1024)
            throw new InvalidOperationException("LIVE_WISSEN_GESAMTGROESSE_UNGUELTIG");

        ValidateBackblaze();
    }

    private void ValidateBackblaze()
    {
        if (string.IsNullOrWhiteSpace(BackblazeKeyIdEnvironmentVariable))
            throw new InvalidOperationException("BACKBLAZE_KEY_ID_ENV_REQUIRED");
        if (string.IsNullOrWhiteSpace(BackblazeApplicationKeyEnvironmentVariable))
            throw new InvalidOperationException("BACKBLAZE_APPLICATION_KEY_ENV_REQUIRED");
        if (string.IsNullOrWhiteSpace(BackblazeRegion)
            || BackblazeRegion.Length > 64
            || !Regex.IsMatch(BackblazeRegion, "^[a-z0-9-]+$", RegexOptions.CultureInvariant))
            throw new InvalidOperationException("BACKBLAZE_REGION_INVALID");

        if (!Uri.TryCreate(BackblazeEndpoint, UriKind.Absolute, out var endpoint)
            || endpoint.Scheme != Uri.UriSchemeHttps
            || !string.IsNullOrEmpty(endpoint.UserInfo)
            || !string.IsNullOrEmpty(endpoint.Query)
            || !string.IsNullOrEmpty(endpoint.Fragment)
            || (endpoint.AbsolutePath != "/" && endpoint.AbsolutePath.Length != 0)
            || !string.Equals(endpoint.Host, $"s3.{BackblazeRegion}.backblazeb2.com", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("BACKBLAZE_ENDPOINT_INVALID");

        if (string.IsNullOrWhiteSpace(BackblazeBucket)
            || BackblazeBucket.Length is < 6 or > 63
            || !Regex.IsMatch(BackblazeBucket, "^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$", RegexOptions.CultureInvariant)
            || BackblazeBucket.Contains("..", StringComparison.Ordinal)
            || BackblazeBucket.StartsWith("b2-", StringComparison.Ordinal)
            || BackblazeBucket.StartsWith("xn--", StringComparison.Ordinal)
            || BackblazeBucket.StartsWith("sthree-", StringComparison.Ordinal)
            || BackblazeBucket.StartsWith("amzn-s3-demo-", StringComparison.Ordinal)
            || BackblazeBucket.EndsWith("-s3alias", StringComparison.Ordinal)
            || BackblazeBucket.EndsWith("--ol-s3", StringComparison.Ordinal)
            || BackblazeBucket.EndsWith(".mrap", StringComparison.Ordinal)
            || BackblazeBucket.EndsWith("--x-s3", StringComparison.Ordinal)
            || BackblazeBucket.EndsWith("--table-s3", StringComparison.Ordinal)
            || System.Net.IPAddress.TryParse(BackblazeBucket, out _))
            throw new InvalidOperationException("BACKBLAZE_BUCKET_INVALID");

        if (BackblazePrefix.Length > 512
            || BackblazePrefix.Any(char.IsControl)
            || BackblazePrefix.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries).Any(part => part == ".."))
            throw new InvalidOperationException("BACKBLAZE_PREFIX_INVALID");
    }

    public static string NormalisiereLiveWissenspfad(string wert)
    {
        if (string.IsNullOrWhiteSpace(wert) || wert.Any(char.IsControl))
            throw new InvalidOperationException("LIVE_WISSEN_PFAD_UNGUELTIG");

        string voll;
        try
        {
            voll = Path.TrimEndingDirectorySeparator(Path.GetFullPath(wert.Trim()));
        }
        catch (Exception error) when (error is ArgumentException or NotSupportedException or PathTooLongException)
        {
            throw new InvalidOperationException("LIVE_WISSEN_PFAD_UNGUELTIG", error);
        }

        var wurzel = Path.GetPathRoot(voll);
        if (string.IsNullOrWhiteSpace(wurzel)
            || !string.Equals(wurzel, @"D:\", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("LIVE_WISSEN_MUSS_AUF_D_LIEGEN");
        if (string.Equals(voll, Path.TrimEndingDirectorySeparator(wurzel), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("LIVE_WISSEN_D_LAUFWERKSWURZEL_VERBOTEN");

        return voll;
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
    string? TargetUrl,
    string WebDashboardState,
    string? WebDashboardError,
    string BackblazeState,
    string? BackblazeError)
{
    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BridgeConfig.AppDirectory);
        await using var stream = File.Create(BridgeConfig.StatusPath);
        await JsonSerializer.SerializeAsync(stream, this, BridgeConfig.JsonOptions, cancellationToken);
    }
}
