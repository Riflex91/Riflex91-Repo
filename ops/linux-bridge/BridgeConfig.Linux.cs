using System.Text.Json;
using System.Text.Json.Serialization;

namespace AioBotWindowsBridge;

public sealed record BridgeConfig
{
    public const int CurrentConfigVersion = 1;
    public const string V6TelemetryIngestUrl = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/albot-v6-debug-ingest";
    public const string V6SignalControlUrl = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/albot-v6-signal-control";
    public const string DefaultDashboardUrl = "https://aio-bot-dashboard.hansijuergenlul.workers.dev";

    public int ConfigVersion { get; init; } = CurrentConfigVersion;
    public string CdpEndpoint { get; init; } = "http://127.0.0.1:9222";
    public string AllowedOrigin { get; init; } = "https://adventure.land";
    public string TelemetryIngestUrl { get; init; } = V6TelemetryIngestUrl;
    public string SignalControlUrl { get; init; } = V6SignalControlUrl;
    public string TelemetryTokenEnvironmentVariable { get; init; } = "ALBOT_V6_TELEMETRY_TOKEN";
    public string BotId { get; init; } = "albot-v6-main";
    public bool TelemetryEnabled { get; init; } = false;
    public bool AutoStartBrowser { get; init; } = true;
    public string PreferredBrowser { get; init; } = "Brave";
    public bool BrowserHeadless { get; init; } = false;
    public int BrowserStartupTimeoutSeconds { get; init; } = 45;
    public int PollIntervalSeconds { get; init; } = 5;
    public int SupabaseStatusIntervalSeconds { get; init; } = 60;
    public int MaxBackoffSeconds { get; init; } = 300;
    public int EventLimit { get; init; } = 100;
    public bool WatchdogEnabled { get; init; } = true;
    public int WatchdogIntervalSeconds { get; init; } = 10;
    public int WatchdogFailuresBeforeReload { get; init; } = 2;
    public int WatchdogFailuresBeforeRestart { get; init; } = 4;
    public int WatchdogRecoveryGraceSeconds { get; init; } = 20;
    public int BrowserStartWindowMinutes { get; init; } = 10;
    public int BrowserMaxStartsPerWindow { get; init; } = 4;
    public int BrowserStartCircuitCooldownMinutes { get; init; } = 15;
    public bool SelfUpdateEnabled { get; init; } = true;
    public int SelfUpdateIntervalSeconds { get; init; } = 60;
    public bool WissenswaechterAktiv { get; init; } = true;
    public int WissenswaechterIntervallMinuten { get; init; } = 60;
    public bool WissenswaechterWebSucheAktiv { get; init; } = true;
    public int WissenswaechterMaxQuellenProLauf { get; init; } = 200;
    public int WissenswaechterMaxKandidaten { get; init; } = 1000;
    public bool LiveWissensimportAktiv { get; init; } = false;
    public string LiveWissensdatenbankPfad { get; init; } = "/mnt/adventureland/wissensdatenbank";
    public int LiveWissensMaxDateienProLauf { get; init; } = 5000;
    public int LiveWissensMaxDateiBytes { get; init; } = 512 * 1024;
    public long LiveWissensMaxGesamtBytesProLauf { get; init; } = 64L * 1024 * 1024;
    public bool WebDashboardEnabled { get; init; } = true;
    public string WebDashboardBaseUrl { get; init; } = DefaultDashboardUrl;
    public string WebDashboardAccount { get; init; } = "default";
    public string WebDashboardWriteKeyEnvironmentVariable { get; init; } = "ALBOT_V6_WEB_DASHBOARD_WRITE_KEY";
    public bool BackblazeEnabled { get; init; } = true;
    public string BackblazeEndpoint { get; init; } = "https://s3.eu-central-003.backblazeb2.com";
    public string BackblazeRegion { get; init; } = "eu-central-003";
    public string BackblazeBucket { get; init; } = "al-aio-bot";
    public string BackblazePrefix { get; init; } = "v6";
    public string BackblazeKeyIdEnvironmentVariable { get; init; } = "ALBOT_V6_BACKBLAZE_KEY_ID";
    public string BackblazeApplicationKeyEnvironmentVariable { get; init; } = "ALBOT_V6_BACKBLAZE_APPLICATION_KEY";

    public static string ConfigDirectory => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".config", "aio-bot-linux-bridge");
    public static string LocalAppDirectory => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "share", "aio-bot-linux-bridge");
    public static string StateDirectory => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "state", "aio-bot-linux-bridge");
    public static string AppDirectory => StateDirectory;
    public static string BrowserProfileDirectory => Path.Combine(LocalAppDirectory, "browser-profile");
    public static string DiagnosticsDirectory => Path.Combine(StateDirectory, "diagnostics");
    public static string SettingsPath => Path.Combine(ConfigDirectory, "settings.json");
    public static string BridgeStatePath => Path.Combine(StateDirectory, "bridge-state.json");
    public static string StatusPath => Path.Combine(StateDirectory, "bridge-status.json");
    public static string WatchdogStatePath => Path.Combine(StateDirectory, "watchdog-state.json");
    public static string BrowserPidPath => Path.Combine(StateDirectory, "browser.pid");
    public static string BrowserStartBudgetPath => Path.Combine(StateDirectory, "browser-start-budget.json");
    public static string SelfUpdateStatusPath => Path.Combine(StateDirectory, "self-update-status.json");

    public static JsonSerializerOptions JsonOptions { get; } = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public void Validate()
    {
        if (ConfigVersion != CurrentConfigVersion) throw new InvalidOperationException("LINUX_BRIDGE_CONFIG_VERSION_UNSUPPORTED");
        var cdp = RequireUri(CdpEndpoint, "CDP_ENDPOINT_INVALID");
        if (cdp.Scheme != Uri.UriSchemeHttp || !IsLoopback(cdp.Host)) throw new InvalidOperationException("CDP_ENDPOINT_MUST_BE_LOOPBACK_HTTP");
        var origin = RequireUri(AllowedOrigin, "ALLOWED_ORIGIN_INVALID");
        if (origin.Scheme != Uri.UriSchemeHttps || origin.Host.Length == 0) throw new InvalidOperationException("ALLOWED_ORIGIN_MUST_BE_HTTPS");
        RequireHttps(TelemetryIngestUrl, "TELEMETRY_HTTPS_REQUIRED");
        RequireHttps(SignalControlUrl, "SIGNAL_CONTROL_HTTPS_REQUIRED");
        RequireHttps(WebDashboardBaseUrl, "WEB_DASHBOARD_HTTPS_REQUIRED");
        RequireHttps(BackblazeEndpoint, "BACKBLAZE_ENDPOINT_INVALID");
        if (!string.Equals(BackblazePrefix.Trim('/'), "v6", StringComparison.Ordinal)) throw new InvalidOperationException("V6_BACKBLAZE_PREFIX_REQUIRED");
        if (PollIntervalSeconds is < 1 or > 60) throw new InvalidOperationException("POLL_INTERVAL_INVALID");
        if (MaxBackoffSeconds < PollIntervalSeconds || MaxBackoffSeconds > 3600) throw new InvalidOperationException("MAX_BACKOFF_INVALID");
        if (EventLimit is < 1 or > 200) throw new InvalidOperationException("EVENT_LIMIT_INVALID");
        if (WatchdogIntervalSeconds is < 5 or > 60) throw new InvalidOperationException("WATCHDOG_INTERVAL_INVALID");
        if (WatchdogFailuresBeforeReload < 1 || WatchdogFailuresBeforeRestart <= WatchdogFailuresBeforeReload || WatchdogFailuresBeforeRestart > 20)
            throw new InvalidOperationException("WATCHDOG_FAILURE_THRESHOLDS_INVALID");
        if (BrowserMaxStartsPerWindow is < 1 or > 20 || BrowserStartWindowMinutes is < 1 or > 120)
            throw new InvalidOperationException("BROWSER_START_BUDGET_INVALID");
        if (WissenswaechterIntervallMinuten != 60) throw new InvalidOperationException("WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
        if (LiveWissensimportAktiv) _ = NormalisiereLiveWissenspfad(LiveWissensdatenbankPfad);
    }

    public static async Task<BridgeConfig> LoadAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(ConfigDirectory);
        Directory.CreateDirectory(LocalAppDirectory);
        Directory.CreateDirectory(StateDirectory);
        Directory.CreateDirectory(DiagnosticsDirectory);
        Directory.CreateDirectory(BrowserProfileDirectory);
        BridgeConfig config;
        if (!File.Exists(SettingsPath))
        {
            config = new BridgeConfig();
            await config.SaveAsync(cancellationToken);
        }
        else
        {
            await using var stream = File.OpenRead(SettingsPath);
            config = await JsonSerializer.DeserializeAsync<BridgeConfig>(stream, JsonOptions, cancellationToken)
                ?? throw new InvalidOperationException("LINUX_BRIDGE_SETTINGS_INVALID");
        }
        config.Validate();
        return config;
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Validate();
        Directory.CreateDirectory(ConfigDirectory);
        var temp = SettingsPath + ".tmp";
        await File.WriteAllTextAsync(temp, JsonSerializer.Serialize(this, JsonOptions), cancellationToken);
        File.Move(temp, SettingsPath, true);
    }

    public static string NormalisiereLiveWissenspfad(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new InvalidOperationException("LIVE_WISSEN_PFAD_FEHLT");
        var full = Path.GetFullPath(Environment.ExpandEnvironmentVariables(value.Trim()));
        if (!Path.IsPathRooted(full) || string.Equals(full, Path.GetPathRoot(full), StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_WISSEN_LAUFWERKSWURZEL_VERBOTEN");
        return Path.TrimEndingDirectorySeparator(full);
    }

    private static Uri RequireUri(string value, string error)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)) throw new InvalidOperationException(error);
        return uri;
    }

    private static void RequireHttps(string value, string error)
    {
        var uri = RequireUri(value, error);
        if (uri.Scheme != Uri.UriSchemeHttps) throw new InvalidOperationException(error);
    }

    private static bool IsLoopback(string host) =>
        string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
        || string.Equals(host, "127.0.0.1", StringComparison.Ordinal)
        || string.Equals(host, "::1", StringComparison.Ordinal);
}

public sealed record BridgeState(long LastEventSeq = 0)
{
    public static async Task<BridgeState> LoadAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (!File.Exists(BridgeConfig.BridgeStatePath)) return new BridgeState();
            await using var stream = File.OpenRead(BridgeConfig.BridgeStatePath);
            return await JsonSerializer.DeserializeAsync<BridgeState>(stream, BridgeConfig.JsonOptions, cancellationToken) ?? new BridgeState();
        }
        catch { return new BridgeState(); }
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BridgeConfig.StateDirectory);
        var temp = BridgeConfig.BridgeStatePath + ".tmp";
        await File.WriteAllTextAsync(temp, JsonSerializer.Serialize(this, BridgeConfig.JsonOptions), cancellationToken);
        File.Move(temp, BridgeConfig.BridgeStatePath, true);
    }
}

public sealed record DebugReadResult(JsonElement Snapshot, JsonElement Events, long RequestedAfterSeq, long EffectiveAfterSeq, long MaxSeq, long LastCapturedSeq, bool HasMoreEvents, string TargetUrl)
{
    public int EventCount => Events.ValueKind == JsonValueKind.Array ? Events.GetArrayLength() : 0;
    public bool CursorWasReset => EffectiveAfterSeq != RequestedAfterSeq;
}

public sealed record TelemetryAckResult(bool Supported, int Acknowledged, int Remaining, long LastAcknowledgedSeq, long LastCapturedSeq, int Dropped)
{
    public static TelemetryAckResult Empty { get; } = new(false, 0, 0, 0, 0, 0);
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
