using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record BridgeConfig
{
    public const int CurrentConfigVersion = 1;
    public const string V6TelemetryIngestUrl = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/albot-v6-debug-ingest";
    public const string V6SignalControlUrl = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/albot-v6-signal-control";
    public const string V6TelemetryTokenEnvironmentVariable = "ALBOT_V6_TELEMETRY_TOKEN";
    public const string V6DashboardBaseUrl = "https://aio-bot-dashboard.hansijuergenlul.workers.dev";
    public const string V6DashboardWriteKeyEnvironmentVariable = "ALBOT_V6_WEB_DASHBOARD_WRITE_KEY";
    public const string V6BackblazeKeyIdEnvironmentVariable = "ALBOT_V6_BACKBLAZE_KEY_ID";
    public const string V6BackblazeApplicationKeyEnvironmentVariable = "ALBOT_V6_BACKBLAZE_APPLICATION_KEY";
    public const string DefaultDashboardUrl = V6DashboardBaseUrl;

    public int ConfigVersion { get; init; } = CurrentConfigVersion;
    public string CdpEndpoint { get; init; } = "http://127.0.0.1:9222";
    public string AllowedOrigin { get; init; } = "https://adventure.land";
    public string TelemetryIngestUrl { get; init; } = V6TelemetryIngestUrl;
    public string SignalControlUrl { get; init; } = V6SignalControlUrl;
    public string TelemetryTokenEnvironmentVariable { get; init; } = V6TelemetryTokenEnvironmentVariable;
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
    public string WebDashboardWriteKeyEnvironmentVariable { get; init; } = V6DashboardWriteKeyEnvironmentVariable;
    public bool BackblazeEnabled { get; init; } = true;
    public string BackblazeEndpoint { get; init; } = "https://s3.eu-central-003.backblazeb2.com";
    public string BackblazeRegion { get; init; } = "eu-central-003";
    public string BackblazeBucket { get; init; } = "al-aio-bot";
    public string BackblazePrefix { get; init; } = "v6";
    public string BackblazeKeyIdEnvironmentVariable { get; init; } = V6BackblazeKeyIdEnvironmentVariable;
    public string BackblazeApplicationKeyEnvironmentVariable { get; init; } = V6BackblazeApplicationKeyEnvironmentVariable;

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
    public static string AdminTokenPath => Path.Combine(StateDirectory, "admin-token");

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

        if (!string.Equals(TelemetryIngestUrl.TrimEnd('/'), V6TelemetryIngestUrl, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("V6_TELEMETRY_ENDPOINT_REQUIRED");
        if (!string.Equals(SignalControlUrl.TrimEnd('/'), V6SignalControlUrl, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("V6_SIGNAL_ENDPOINT_REQUIRED");
        if (!string.Equals(WebDashboardBaseUrl.TrimEnd('/'), V6DashboardBaseUrl, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("V6_DASHBOARD_ENDPOINT_REQUIRED");
        if (!string.Equals(TelemetryTokenEnvironmentVariable, V6TelemetryTokenEnvironmentVariable, StringComparison.Ordinal))
            throw new InvalidOperationException("V6_TELEMETRY_TOKEN_ENV_REQUIRED");
        if (!string.Equals(WebDashboardWriteKeyEnvironmentVariable, V6DashboardWriteKeyEnvironmentVariable, StringComparison.Ordinal))
            throw new InvalidOperationException("V6_DASHBOARD_WRITE_KEY_ENV_REQUIRED");
        if (!string.Equals(BackblazeKeyIdEnvironmentVariable, V6BackblazeKeyIdEnvironmentVariable, StringComparison.Ordinal))
            throw new InvalidOperationException("V6_BACKBLAZE_KEY_ID_ENV_REQUIRED");
        if (!string.Equals(BackblazeApplicationKeyEnvironmentVariable, V6BackblazeApplicationKeyEnvironmentVariable, StringComparison.Ordinal))
            throw new InvalidOperationException("V6_BACKBLAZE_APPLICATION_KEY_ENV_REQUIRED");

        if (string.Equals(BotId, "pi-main", StringComparison.OrdinalIgnoreCase)
            || !BotId.StartsWith("albot-v6-", StringComparison.OrdinalIgnoreCase)
            || BotId.Length > 128)
            throw new InvalidOperationException("V6_BOT_ID_REQUIRED");
        if (string.IsNullOrWhiteSpace(WebDashboardAccount) || WebDashboardAccount.Length > 100)
            throw new InvalidOperationException("WEB_DASHBOARD_ACCOUNT_INVALID");

        if (!string.Equals(PreferredBrowser, "Brave", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Edge", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Chrome", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(PreferredBrowser, "Chromium", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("PREFERRED_BROWSER_INVALID");

        if (PollIntervalSeconds is < 2 or > 60) throw new InvalidOperationException("POLL_INTERVAL_INVALID");
        if (SupabaseStatusIntervalSeconds != 60) throw new InvalidOperationException("SUPABASE_STATUS_INTERVAL_MUST_BE_60_SECONDS");
        if (MaxBackoffSeconds < PollIntervalSeconds || MaxBackoffSeconds > 3600) throw new InvalidOperationException("MAX_BACKOFF_INVALID");
        if (EventLimit is < 1 or > 200) throw new InvalidOperationException("EVENT_LIMIT_INVALID");
        if (WatchdogIntervalSeconds is < 5 or > 60) throw new InvalidOperationException("WATCHDOG_INTERVAL_INVALID");
        if (WatchdogFailuresBeforeReload < 1 || WatchdogFailuresBeforeRestart <= WatchdogFailuresBeforeReload || WatchdogFailuresBeforeRestart > 20)
            throw new InvalidOperationException("WATCHDOG_FAILURE_THRESHOLDS_INVALID");
        if (BrowserMaxStartsPerWindow is < 1 or > 20 || BrowserStartWindowMinutes is < 1 or > 120)
            throw new InvalidOperationException("BROWSER_START_BUDGET_INVALID");

        if (WissenswaechterIntervallMinuten != 60)
            throw new InvalidOperationException("WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
        if (WissenswaechterMaxQuellenProLauf is < 1 or > 500)
            throw new InvalidOperationException("WISSENSWAECHTER_QUELLENLIMIT_UNGUELTIG");
        if (WissenswaechterMaxKandidaten is < 50 or > 5000)
            throw new InvalidOperationException("WISSENSWAECHTER_KANDIDATENLIMIT_UNGUELTIG");

        if (LiveWissensimportAktiv) _ = NormalisiereLiveWissenspfad(LiveWissensdatenbankPfad);
        if (LiveWissensMaxDateienProLauf is < 1 or > 20000)
            throw new InvalidOperationException("LIVE_WISSEN_DATEILIMIT_UNGUELTIG");
        if (LiveWissensMaxDateiBytes is < 16 * 1024 or > 5 * 1024 * 1024)
            throw new InvalidOperationException("LIVE_WISSEN_DATEIGROESSE_UNGUELTIG");
        if (LiveWissensMaxGesamtBytesProLauf is < 1024 * 1024 or > 512L * 1024 * 1024)
            throw new InvalidOperationException("LIVE_WISSEN_GESAMTGROESSE_UNGUELTIG");

        ValidateBackblaze();
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

    private void ValidateBackblaze()
    {
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
            || System.Net.IPAddress.TryParse(BackblazeBucket, out _))
            throw new InvalidOperationException("BACKBLAZE_BUCKET_INVALID");

        if (BackblazePrefix.Length > 512
            || BackblazePrefix.Any(char.IsControl)
            || BackblazePrefix.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries).Any(part => part == ".."))
            throw new InvalidOperationException("BACKBLAZE_PREFIX_INVALID");
        if (!string.Equals(BackblazePrefix.Trim('/'), "v6", StringComparison.Ordinal))
            throw new InvalidOperationException("V6_BACKBLAZE_PREFIX_REQUIRED");
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

public sealed record BridgeState(
    long LastEventSeq = 0,
    Dictionary<string, long>? CharacterEventSeqs = null)
{
    public long GetLastEventSeq(string? character)
    {
        if (string.IsNullOrWhiteSpace(character) || CharacterEventSeqs is null)
            return 0;

        foreach (var row in CharacterEventSeqs)
        {
            if (string.Equals(row.Key, character, StringComparison.OrdinalIgnoreCase))
                return Math.Max(0, row.Value);
        }

        return 0;
    }

    public BridgeState WithCharacterSeq(string character, long lastEventSeq)
    {
        if (string.IsNullOrWhiteSpace(character))
            throw new ArgumentException("CHARACTER_REQUIRED", nameof(character));

        var next = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        if (CharacterEventSeqs is not null)
        {
            foreach (var row in CharacterEventSeqs)
                next[row.Key] = Math.Max(0, row.Value);
        }

        next[character.Trim()] = Math.Max(0, lastEventSeq);
        var aggregate = Math.Max(LastEventSeq, next.Values.DefaultIfEmpty(0).Max());
        return this with { LastEventSeq = aggregate, CharacterEventSeqs = next };
    }

    public static async Task<BridgeState> LoadAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(BridgeConfig.BridgeStatePath))
            return new BridgeState();

        try
        {
            await using var stream = File.OpenRead(BridgeConfig.BridgeStatePath);
            return await JsonSerializer.DeserializeAsync<BridgeState>(
                stream,
                BridgeConfig.JsonOptions,
                cancellationToken) ?? new BridgeState();
        }
        catch (Exception error)
        {
            throw new InvalidOperationException("BRIDGE_STATE_CORRUPT", error);
        }
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(BridgeConfig.StateDirectory);
        var temp = BridgeConfig.BridgeStatePath + ".tmp";
        await File.WriteAllTextAsync(
            temp,
            JsonSerializer.Serialize(this, BridgeConfig.JsonOptions),
            cancellationToken);
        File.Move(temp, BridgeConfig.BridgeStatePath, true);
    }
}

public sealed record DebugReadResult(
    JsonElement Snapshot,
    JsonElement Events,
    long RequestedAfterSeq,
    long EffectiveAfterSeq,
    long MaxSeq,
    long LastCapturedSeq,
    bool HasMoreEvents,
    string TargetUrl,
    JsonElement? DashboardVisual = null)
{
    public int EventCount => Events.ValueKind == JsonValueKind.Array ? Events.GetArrayLength() : 0;
    public bool CursorWasReset => EffectiveAfterSeq != RequestedAfterSeq;
}

public sealed record TelemetryAckResult(
    bool Supported,
    int Acknowledged,
    int Remaining,
    long LastAcknowledgedSeq,
    long LastCapturedSeq,
    int Dropped)
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
