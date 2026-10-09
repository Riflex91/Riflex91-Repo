using AioBotWindowsBridge;
using System.Text;
using System.Text.Json;

static void Assert(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

static void ExpectInvalid(BridgeConfig config, string expected)
{
    try
    {
        config.Validate();
        throw new InvalidOperationException("EXPECTED_VALIDATION_FAILURE:" + expected);
    }
    catch (InvalidOperationException error) when (error.Message == expected)
    {
    }
}

static void ExpectInvalidLiveFakt(string json, string expected)
{
    try
    {
        LiveWissensImportDienst.ValidiereLiveFaktJson(Encoding.UTF8.GetBytes(json));
        throw new InvalidOperationException("EXPECTED_LIVE_FACT_VALIDATION_FAILURE:" + expected);
    }
    catch (InvalidOperationException error) when (error.Message == expected)
    {
    }
}

var jsonOptions = new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};

var defaults = new BridgeConfig();
defaults.Validate();
Assert(defaults.TelemetryEnabled == false, "TELEMETRY_MUST_DEFAULT_OFF");
Assert(defaults.PreferredBrowser == "Brave", "BRAVE_MUST_DEFAULT");
Assert(defaults.ConfigVersion == BridgeConfig.CurrentConfigVersion, "CONFIG_VERSION");
Assert(BridgeConfig.CurrentConfigVersion == 13, "CONFIG_VERSION_13");
Assert(defaults.PollIntervalSeconds == 5, "V5_LOCAL_OBSERVATION_DEFAULT");
Assert(defaults.SupabaseStatusIntervalSeconds == 60, "V5_SUPABASE_STATUS_INTERVAL_60S");
Assert(WindowsBridgeSelfUpdater.CheckIntervalSeconds == 60, "SELF_UPDATE_INTERVAL_60S");
Assert(WindowsBridgeSelfUpdater.ReleaseTag == "windows-bridge-latest", "SELF_UPDATE_RELEASE_TAG");
Assert(WindowsBridgeSelfUpdater.StatusFileName == "self-update-status.json", "SELF_UPDATE_STATUS_FILE");

// Account writer preflight: schema, monotonicity, durable restart.
var accountTestRoot = Path.Combine(Path.GetTempPath(), "aio-ssd-account-" + Guid.NewGuid().ToString("N"));
try
{
    var accountStore = new AlFinalNativeAccountSnapshot(accountTestRoot);
    using (var write = JsonDocument.Parse(
        "{\"profiles\":[{\"name\":\"My_Merchant\",\"observedAtMs\":200,\"gold\":10}],\"wealth\":{\"observedAtMs\":300,\"gold\":100}}"))
    {
        var result = accountStore.WriteAccount(write.RootElement);
        Assert(result.ProfilesWritten == 1 && result.WealthWritten,
            "SSD_NATIVE_ACCOUNT_WRITE_CONFIRMED");
    }
    var mirror = JsonSerializer.Serialize(new AlFinalNativeAccountSnapshot(accountTestRoot).ReadAccount());
    using (var state = JsonDocument.Parse(mirror))
        Assert(state.RootElement.GetProperty("profiles")[0].GetProperty("gold").GetInt32() == 10
            && state.RootElement.GetProperty("wealth").GetProperty("gold").GetInt32() == 100,
            "SSD_NATIVE_ACCOUNT_WRITE_READBACK");
    try
    {
        using var stale = JsonDocument.Parse(
            "{\"profiles\":[{\"name\":\"My_Merchant\",\"observedAtMs\":199,\"gold\":999}]}");
        accountStore.WriteAccount(stale.RootElement);
        throw new InvalidOperationException("SSD_NATIVE_STALE_PROFILE_ACCEPTED");
    }
    catch (InvalidOperationException error) when (error.Message == "ACCOUNT_STALE_PROFILE_REJECTED") {}
    try
    {
        using var traversal = JsonDocument.Parse(
            "{\"profiles\":[{\"name\":\"../bad\",\"observedAtMs\":250}]}");
        accountStore.WriteAccount(traversal.RootElement);
        throw new InvalidOperationException("SSD_NATIVE_TRAVERSAL_ACCEPTED");
    }
    catch (InvalidDataException error) when (error.Message == "ACCOUNT_WRITE_NAME_INVALID") {}
    try
    {
        using var duplicate = JsonDocument.Parse(
            "{\"profiles\":[{\"name\":\"My_Merchant\"},{\"name\":\"My_Merchant\"}]}");
        accountStore.WriteAccount(duplicate.RootElement);
        throw new InvalidOperationException("SSD_NATIVE_DUPLICATE_ACCEPTED");
    }
    catch (InvalidDataException error) when (error.Message == "ACCOUNT_WRITE_NAME_INVALID") {}
    using (var still = JsonDocument.Parse(JsonSerializer.Serialize(accountStore.ReadAccount())))
        Assert(still.RootElement.GetProperty("profiles")[0].GetProperty("gold").GetInt32() == 10,
            "SSD_NATIVE_STALE_REJECTION_NO_MUTATION");
}
finally { if (Directory.Exists(accountTestRoot)) Directory.Delete(accountTestRoot, recursive: true); }

// Native telemetry parity checks: direct files; no production write activation.
var captureRoot = Path.Combine(Path.GetTempPath(), "aio-ssd-telemetry-" + Guid.NewGuid().ToString("N"));
try
{
    var telemetryCapture = new AlFinalNativeTelemetryCapture(captureRoot);
    const string record = "{\"schemaVersion\":1,\"atMs\":1791570000000,\"character\":{\"name\":\"My_Ranger2\",\"gold\":100,\"hp\":50,\"maxHp\":100,\"map\":\"main\"},\"fullAutonomy\":{\"taskType\":\"FARM\"},\"encounter\":{\"selected\":\"goo\"},\"health\":{\"state\":\"HEALTHY\"}}";
    using (var batch = JsonDocument.Parse("{\"records\":[" + record + "]}"))
        Assert(telemetryCapture.Ingest(batch.RootElement) == 1, "SSD_NATIVE_TELEMETRY_INGEST");
    var at = DateTimeOffset.FromUnixTimeMilliseconds(1791570000000);
    var day = at.UtcDateTime.ToString("yyyy-MM-dd");
    var hour = at.UtcDateTime.ToString("HH");
    var rawFile = Path.Combine(captureRoot, "raw", day, hour, "My_Ranger2.ndjson");
    var dailyFile = Path.Combine(captureRoot, "daily", day, "My_Ranger2.json");
    Assert(File.Exists(rawFile) && File.ReadAllLines(rawFile).Length == 1,
        "SSD_NATIVE_TELEMETRY_RAW_FILE");
    using (var daily = JsonDocument.Parse(await File.ReadAllTextAsync(dailyFile)))
    {
        var row = daily.RootElement;
        Assert(row.GetProperty("samples").GetInt32() == 1
            && row.GetProperty("gold").GetProperty("last").GetDouble() == 100
            && row.GetProperty("hp").GetProperty("minRatio").GetDouble() == 0.5
            && row.GetProperty("maps").GetProperty("main").GetInt32() == 1
            && row.GetProperty("tasks").GetProperty("FARM").GetInt32() == 1,
            "SSD_NATIVE_TELEMETRY_DAILY_SCHEMA");
    }
    using (var batch = JsonDocument.Parse("{\"records\":[" + record + "]}"))
        Assert(new AlFinalNativeTelemetryCapture(captureRoot).Ingest(batch.RootElement) == 1,
            "SSD_NATIVE_TELEMETRY_RESTART");
    using (var daily = JsonDocument.Parse(await File.ReadAllTextAsync(dailyFile)))
        Assert(daily.RootElement.GetProperty("samples").GetInt32() == 2,
            "SSD_NATIVE_TELEMETRY_COUNTERS_SURVIVE_RESTART");
    using (var invalid = JsonDocument.Parse("{\"records\":[{\"atMs\":0}]}"))
    {
        try
        {
            telemetryCapture.Ingest(invalid.RootElement);
            throw new InvalidOperationException("SSD_NATIVE_INVALID_TIMESTAMP_ACCEPTED");
        }
        catch (InvalidDataException error) when (error.Message == "TELEMETRY_TIMESTAMP_INVALID") { }
    }
}
finally { if (Directory.Exists(captureRoot)) Directory.Delete(captureRoot, recursive: true); }

// Native SSD backend regression tests. No Adventure Land or Node process involved.
Assert(!new BridgeConfig().AlFinalNativeStorageEnabled, "NATIVE_SSD_DEFAULT_OFF");
Assert(AlFinalNativeStorageApi.DefaultPort == 17392, "NATIVE_SSD_SEPARATE_PORT");
Assert(AlFinalNativeStorageApi.AllowedOrigin("https://adventure.land"), "SSD_ORIGIN_ALLOWED");
Assert(AlFinalNativeStorageApi.AllowedOrigin("https://www.adventure.land"), "SSD_WWW_ORIGIN_ALLOWED");
Assert(!AlFinalNativeStorageApi.AllowedOrigin("https://evil.example"), "SSD_EVIL_ORIGIN_DENIED");
var ssdTestDir = Path.Combine(Path.GetTempPath(), "aio-ssd-" + Guid.NewGuid().ToString("N"));
try
{
    var store = new AlFinalNativeKeyValueStore(ssdTestDir);
    const string ssdKey = "albot:h25:autonomy-handoff:v1:EU:I:My_Mage";
    var absent = store.Read(ssdKey);
    Assert(!absent.Found && absent.Revision == 0, "SSD_INITIAL_ABSENT");
    var revision = store.Write(ssdKey, "{\"task\":\"FARM\"}", expectedRevision: 0);
    Assert(revision == 1, "SSD_FIRST_REVISION");
    var restored = new AlFinalNativeKeyValueStore(ssdTestDir);
    Assert(restored.Read(ssdKey).Found && restored.Read(ssdKey).Revision == 1,
        "SSD_DURABLE_RESTART_READ");
    try
    {
        restored.Write(ssdKey, "other", expectedRevision: 0);
        throw new InvalidOperationException("SSD_EXPECTED_REVISION_REJECTED");
    }
    catch (InvalidOperationException error) when (error.Message == "SSD_REVISION_CONFLICT") { }
    Assert(restored.Write(ssdKey, "changed", expectedRevision: 1) == 2,
        "SSD_SECOND_REVISION");
    Assert(restored.Remove(ssdKey) && !restored.Read(ssdKey).Found, "SSD_REMOVE");
    try
    {
        restored.Write("../secrets", "x");
        throw new InvalidOperationException("SSD_INVALID_KEY_ACCEPTED");
    }
    catch (InvalidOperationException error) when (error.Message == "SSD_KEY_INVALID") { }
    Assert(restored.Write("aio-v3-content-drift-v1:My_Ranger2", "{\"records\":[]}",
        expectedRevision: 0) == 1, "SSD_V3_OWNED_NAMESPACE");
    Assert(restored.Write("albot:market-intelligence-history:v1", "{\"items\":[]}",
        expectedRevision: 0) == 1, "SSD_MARKET_NAMESPACE");
}
finally { if (Directory.Exists(ssdTestDir)) Directory.Delete(ssdTestDir, recursive: true); }


// Exercise the native HTTP routes and browser-facing CORS protocol with a
// temporary, unprivileged localhost port. No Node or Adventure Land involved.
var tcpReservation = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
tcpReservation.Start();
var ssdTestPort = ((System.Net.IPEndPoint)tcpReservation.LocalEndpoint).Port;
tcpReservation.Stop();
var httpRoot = Path.Combine(Path.GetTempPath(), "aio-ssd-http-" + Guid.NewGuid().ToString("N"));
var accountRoot = Path.Combine(httpRoot, "state");
Directory.CreateDirectory(Path.Combine(accountRoot, "account-profiles"));
await File.WriteAllTextAsync(Path.Combine(accountRoot, "account-profiles", "My_Merchant.json"),
    "{\"name\":\"My_Merchant\",\"observedAtMs\":1234}");
await File.WriteAllTextAsync(Path.Combine(accountRoot, "account-wealth.json"),
    "{\"schemaVersion\":1,\"gold\":890}");
await using (var nativeApi = new AlFinalNativeStorageApi(
    new AlFinalNativeKeyValueStore(httpRoot), ssdTestPort,
    new AlFinalNativeAccountSnapshot(accountRoot)))
{
    try
    {
        await nativeApi.StartAsync();
        using var http = new HttpClient();
        var baseUrl = "http://127.0.0.1:" + ssdTestPort;
        var status = await http.GetAsync(baseUrl + "/health");
        Assert(status.IsSuccessStatusCode, "SSD_NATIVE_HTTP_HEALTH");
        using var health = JsonDocument.Parse(await status.Content.ReadAsStringAsync());
        Assert(health.RootElement.GetProperty("ok").GetBoolean(), "SSD_NATIVE_HEALTH_TRUE");

        var accountResponse = await http.GetAsync(baseUrl + "/v1/state/account");
        Assert(accountResponse.IsSuccessStatusCode, "SSD_NATIVE_ACCOUNT_SHADOW_GET");
        using var accountJson = JsonDocument.Parse(await accountResponse.Content.ReadAsStringAsync());
        Assert(accountJson.RootElement.GetProperty("schemaVersion").GetInt32() == 1
            && accountJson.RootElement.GetProperty("profiles").GetArrayLength() == 1
            && accountJson.RootElement.GetProperty("profiles")[0].GetProperty("name").GetString() == "My_Merchant"
            && accountJson.RootElement.GetProperty("wealth").GetProperty("gold").GetInt32() == 890,
            "SSD_NATIVE_ACCOUNT_SHADOW_SCHEMA");
        var telemetryBlocked = await http.PostAsync(baseUrl + "/v1/telemetry",
            new StringContent("{\"records\":[]}", Encoding.UTF8, "text/plain"));
        Assert((int)telemetryBlocked.StatusCode == 423,
            "SSD_NATIVE_TELEMETRY_DUAL_WRITES_BLOCKED");

        var accountPost = await http.PostAsync(baseUrl + "/v1/state/account",
            new StringContent("{}", Encoding.UTF8, "text/plain"));
        Assert((int)accountPost.StatusCode == 423, "SSD_NATIVE_ACCOUNT_DUAL_WRITE_BLOCKED");

        var resource = baseUrl + "/v1/storage?key=" +
            Uri.EscapeDataString("albot:h25:autonomy-handoff:v1:EU:I:My_Mage");
        var put = new HttpRequestMessage(HttpMethod.Post, resource)
        {
            Content = new StringContent(
                "{\"key\":\"albot:h25:autonomy-handoff:v1:EU:I:My_Mage\",\"value\":\"abc\",\"expectedRevision\":0}",
                Encoding.UTF8, "text/plain")
        };
        put.Headers.TryAddWithoutValidation("Origin", "https://adventure.land");
        var posted = await http.SendAsync(put);
        Assert(posted.IsSuccessStatusCode, "SSD_NATIVE_HTTP_WRITE");
        var read = new HttpRequestMessage(HttpMethod.Get, resource);
        read.Headers.TryAddWithoutValidation("Origin", "https://adventure.land");
        using var returned = JsonDocument.Parse(await (await http.SendAsync(read)).Content.ReadAsStringAsync());
        Assert(returned.RootElement.GetProperty("found").GetBoolean()
            && returned.RootElement.GetProperty("value").GetString() == "abc",
            "SSD_NATIVE_HTTP_READBACK");
        var denied = new HttpRequestMessage(HttpMethod.Get, resource);
        denied.Headers.TryAddWithoutValidation("Origin", "https://evil.invalid");
        Assert((await http.SendAsync(denied)).StatusCode == System.Net.HttpStatusCode.Forbidden,
            "SSD_NATIVE_HTTP_BAD_ORIGIN_BLOCKED");
    }
    finally
    {
        if (Directory.Exists(httpRoot)) Directory.Delete(httpRoot, recursive: true);
    }
}

// Explicit test-only flag exercises the native telemetry HTTP handler.
// Production Bridge never passes telemetryWritesEnabled=true in this phase.
var telemetryListener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
telemetryListener.Start();
var telemetryTestPort = ((System.Net.IPEndPoint)telemetryListener.LocalEndpoint).Port;
telemetryListener.Stop();
var telemetryTestRoot = Path.Combine(Path.GetTempPath(), "aio-native-http-capture-" + Guid.NewGuid().ToString("N"));
try
{
    await using (var api = new AlFinalNativeStorageApi(
        new AlFinalNativeKeyValueStore(Path.Combine(telemetryTestRoot, "kv")),
        telemetryTestPort,
        new AlFinalNativeAccountSnapshot(Path.Combine(telemetryTestRoot, "state")),
        new AlFinalNativeTelemetryCapture(Path.Combine(telemetryTestRoot, "telemetry")),
        telemetryWritesEnabled: true,
        legacyWriterAbsentProbe: _ => Task.FromResult(true)))
    {
        await api.StartAsync();
        using var client = new HttpClient();
        var payload = JsonSerializer.Serialize(new {
            records = new[] { new {
                schemaVersion = 1, atMs = 1791570000000L,
                character = new { name = "My_Ranger2", gold = 250, hp = 80, maxHp = 100 }
            } }
        });
        var ingest = await client.PostAsync("http://127.0.0.1:" + telemetryTestPort + "/v1/telemetry",
            new StringContent(payload, Encoding.UTF8, "text/plain"));
        Assert(ingest.IsSuccessStatusCode, "SSD_NATIVE_TELEMETRY_HTTP_OPTIN");
        using var result = JsonDocument.Parse(await ingest.Content.ReadAsStringAsync());
        Assert(result.RootElement.GetProperty("ok").GetBoolean()
            && result.RootElement.GetProperty("accepted").GetInt32() == 1,
            "SSD_NATIVE_TELEMETRY_HTTP_ACK");
        var day = DateTimeOffset.FromUnixTimeMilliseconds(1791570000000L).UtcDateTime.ToString("yyyy-MM-dd");
        Assert(File.Exists(Path.Combine(telemetryTestRoot, "telemetry", "daily", day, "My_Ranger2.json")),
            "SSD_NATIVE_TELEMETRY_HTTP_FILE");
    }
}
finally
{
    if (Directory.Exists(telemetryTestRoot)) Directory.Delete(telemetryTestRoot, recursive: true);
}

// HTTP account writer: disabled by default; enabled only with an explicit
// test-only flag on a temporary folder, never in production Bridge setup.
var accountListener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
accountListener.Start();
var accountTestPort = ((System.Net.IPEndPoint)accountListener.LocalEndpoint).Port;
accountListener.Stop();
var accountHttpRoot = Path.Combine(Path.GetTempPath(), "aio-account-http-" + Guid.NewGuid().ToString("N"));
try
{
    await using (var api = new AlFinalNativeStorageApi(
        new AlFinalNativeKeyValueStore(Path.Combine(accountHttpRoot, "kv")),
        accountTestPort,
        new AlFinalNativeAccountSnapshot(Path.Combine(accountHttpRoot, "state")),
        accountWritesEnabled: true,
        legacyWriterAbsentProbe: _ => Task.FromResult(true)))
    {
        await api.StartAsync();
        using var client = new HttpClient();
        var endpoint = "http://127.0.0.1:" + accountTestPort + "/v1/state/account";
        var body = "{\"profiles\":[{\"name\":\"My_Merchant\",\"observedAtMs\":1234,\"gold\":555}]}";
        var resp = await client.PostAsync(endpoint, new StringContent(body, Encoding.UTF8, "text/plain"));
        Assert(resp.IsSuccessStatusCode, "SSD_NATIVE_ACCOUNT_HTTP_OPTIN");
        using var ack = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        Assert(ack.RootElement.GetProperty("ok").GetBoolean()
            && ack.RootElement.GetProperty("profilesWritten").GetInt32() == 1,
            "SSD_NATIVE_ACCOUNT_HTTP_ACK");
        using var snapshot = JsonDocument.Parse(await client.GetStringAsync(endpoint));
        Assert(snapshot.RootElement.GetProperty("profiles")[0].GetProperty("gold").GetInt32() == 555,
            "SSD_NATIVE_ACCOUNT_HTTP_READBACK");
        var stale = await client.PostAsync(endpoint,
            new StringContent("{\"profiles\":[{\"name\":\"My_Merchant\",\"observedAtMs\":10}]}",
                Encoding.UTF8, "text/plain"));
        Assert((int)stale.StatusCode == 409, "SSD_NATIVE_ACCOUNT_STALE_HTTP_CONFLICT");
    }
}
finally
{
    if (Directory.Exists(accountHttpRoot)) Directory.Delete(accountHttpRoot, recursive: true);
}

// Simulate an occupied legacy Node writer: both APIs must fail closed even
// with a test-only opt-in. No actual port 17391 dependency in CI.
var blockedListener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
blockedListener.Start();
var blockedPort = ((System.Net.IPEndPoint)blockedListener.LocalEndpoint).Port;
blockedListener.Stop();
var blockedRoot = Path.Combine(Path.GetTempPath(), "aio-node-present-" + Guid.NewGuid().ToString("N"));
try
{
    await using (var api = new AlFinalNativeStorageApi(
        new AlFinalNativeKeyValueStore(Path.Combine(blockedRoot, "kv")),
        blockedPort,
        new AlFinalNativeAccountSnapshot(Path.Combine(blockedRoot, "state")),
        new AlFinalNativeTelemetryCapture(Path.Combine(blockedRoot, "telemetry")),
        telemetryWritesEnabled: true, accountWritesEnabled: true,
        legacyWriterAbsentProbe: _ => Task.FromResult(false)))
    {
        await api.StartAsync();
        using var http = new HttpClient();
        var baseUrl = "http://127.0.0.1:" + blockedPort;
        var profileResponse = await http.PostAsync(baseUrl + "/v1/state/account",
            new StringContent("{\"profiles\":[{\"name\":\"My_Merchant\"}]}",
                Encoding.UTF8, "text/plain"));
        Assert((int)profileResponse.StatusCode == 423, "SSD_NODE_PRESENT_ACCOUNT_REJECTED");
        var telemetryResponse = await http.PostAsync(baseUrl + "/v1/telemetry",
            new StringContent("{\"records\":[]}", Encoding.UTF8, "text/plain"));
        Assert((int)telemetryResponse.StatusCode == 423, "SSD_NODE_PRESENT_TELEMETRY_REJECTED");
        Assert(!Directory.Exists(Path.Combine(blockedRoot, "state", "account-profiles")),
            "SSD_NODE_PRESENT_NO_ACCOUNT_WRITE");
        Assert(!Directory.Exists(Path.Combine(blockedRoot, "telemetry")),
            "SSD_NODE_PRESENT_NO_TELEMETRY_WRITE");
    }
}
finally
{
    if (Directory.Exists(blockedRoot)) Directory.Delete(blockedRoot, recursive: true);
}

Assert(TrayIconService.ToolTipText == "AIO Bot Windows Bridge", "TRAY_TOOLTIP");
Assert(typeof(App).GetMethod("ShutdownForUpdate", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic) is not null, "TRAY_UPDATE_SHUTDOWN_PATH");
Assert(typeof(AioBotWindowsBridge.Program).GetMethod("Main", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static) is not null, "SELF_UPDATE_PRE_WPF_ENTRYPOINT");
Assert(WindowsBridgeUpdateBootstrap.FileOperationRetryCount >= 20, "SELF_UPDATE_APPLY_RETRY_COUNT");
Assert(WindowsBridgeUpdateBootstrap.FileOperationRetryDelayMilliseconds >= 250, "SELF_UPDATE_APPLY_RETRY_DELAY");
Assert(WindowsBridgeSelfUpdater.AssetUrl == "https://github.com/Riflex91/Riflex91-Repo/releases/download/windows-bridge-latest/AioBotWindowsBridge.exe", "SELF_UPDATE_FIXED_ASSET_URL");
var selfUpdateManifest = new WindowsBridgeUpdateManifest(
    SchemaVersion: 1,
    BuildNumber: 123,
    Version: new string('a', 40),
    AssetUrl: WindowsBridgeSelfUpdater.AssetUrl,
    Sha256: new string('b', 64),
    SizeBytes: 123456,
    PublishedAt: DateTimeOffset.UtcNow);
WindowsBridgeSelfUpdater.ValidateManifest(selfUpdateManifest);
Assert(WindowsBridgeSelfUpdater.IsUpdateRequired(122, new string('c', 40), selfUpdateManifest), "SELF_UPDATE_NEWER_BUILD_REQUIRED");
Assert(!WindowsBridgeSelfUpdater.IsUpdateRequired(123, new string('a', 40), selfUpdateManifest), "SELF_UPDATE_SAME_BUILD_NOT_REQUIRED");
Assert(!WindowsBridgeSelfUpdater.IsUpdateRequired(124, new string('d', 40), selfUpdateManifest), "SELF_UPDATE_NEVER_DOWNGRADES");
Assert(defaults.TelemetryIngestUrl.StartsWith("https://", StringComparison.Ordinal), "INGEST_MUST_DEFAULT_HTTPS");
Assert(defaults.SignalControlUrl.StartsWith("https://", StringComparison.Ordinal), "SIGNAL_CONTROL_MUST_DEFAULT_HTTPS");
Assert(defaults.TelemetryIngestUrl.Contains("/functions/v1/albot-v6-debug-ingest", StringComparison.Ordinal), "V6_INGEST_ENDPOINT_DEFAULT");
Assert(defaults.SignalControlUrl.Contains("/functions/v1/albot-v6-signal-control", StringComparison.Ordinal), "V6_SIGNAL_ENDPOINT_DEFAULT");
Assert(defaults.TelemetryTokenEnvironmentVariable == "ALBOT_V6_TELEMETRY_TOKEN", "V6_TELEMETRY_ENV_DEFAULT");
Assert(defaults.BotId == "albot-v6-main", "V6_BOT_ID_DEFAULT");
Assert(defaults.WebDashboardWriteKeyEnvironmentVariable == "ALBOT_V6_WEB_DASHBOARD_WRITE_KEY", "V6_DASHBOARD_ENV_DEFAULT");
Assert(BridgeConfig.TokenPath.EndsWith("telemetry-token-v6.dpapi", StringComparison.OrdinalIgnoreCase), "V6_TOKEN_STORE_PATH");
Assert(BridgeConfig.WebDashboardWriteKeyPath.EndsWith("web-dashboard-write-key-v6.dpapi", StringComparison.OrdinalIgnoreCase), "V6_DASHBOARD_KEY_STORE_PATH");
Assert(BridgeConfig.BackblazeCredentialsPath.EndsWith("backblaze-credentials-v6.dpapi", StringComparison.OrdinalIgnoreCase), "V6_BACKBLAZE_STORE_PATH");
ExpectInvalid(defaults with {
    TelemetryIngestUrl = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/bot-debug-ingest"
}, "V6_TELEMETRY_ENDPOINT_REQUIRED");
ExpectInvalid(defaults with {
    SignalControlUrl = "https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/bot-chatgpt-signal-control"
}, "V6_SIGNAL_ENDPOINT_REQUIRED");
ExpectInvalid(defaults with {
    WebDashboardBaseUrl = "https://example.invalid"
}, "V6_DASHBOARD_ENDPOINT_REQUIRED");
ExpectInvalid(defaults with {
    TelemetryTokenEnvironmentVariable = "AIO_V3_DEBUG_TELEMETRY_TOKEN"
}, "V6_TELEMETRY_TOKEN_ENV_REQUIRED");
ExpectInvalid(defaults with {
    WebDashboardWriteKeyEnvironmentVariable = "AIO_V3_WEB_DASHBOARD_WRITE_KEY"
}, "V6_DASHBOARD_WRITE_KEY_ENV_REQUIRED");
ExpectInvalid(defaults with { BotId = "pi-main" }, "V6_BOT_ID_REQUIRED");
Assert(CdpAlBotV6Client.Generation == 6, "V6_BRIDGE_GENERATION");
Assert(CdpAlBotV6Client.Product == "AL Bot", "V6_BRIDGE_PRODUCT");
Assert(CdpAlBotV6Client.Protocol == "albot-v6-bridge-v1", "V6_BRIDGE_PROTOCOL");
Assert(CdpAlBotV6Client.SnapshotType == "ALBOT_V6_DEBUG_SNAPSHOT", "V6_BRIDGE_SNAPSHOT_TYPE");
Assert(CdpAlBotV6Client.EventsType == "ALBOT_V6_DEBUG_EVENTS", "V6_BRIDGE_EVENTS_TYPE");
Assert(CdpAlBotV6Client.AckType == "ALBOT_V6_TELEMETRY_ACK", "V6_BRIDGE_ACK_TYPE");
Assert(CdpAlBotV6Client.DashboardVisualType == "ALBOT_V6_DASHBOARD_VISUAL", "V6_DASHBOARD_VISUAL_TYPE");
Assert(CdpAlBotV6Client.DashboardTerrainMaxChars <= 400_000, "V6_DASHBOARD_TERRAIN_BUDGET_BOUNDED");
Assert(CdpAlBotV6Client.ExecutionContextDrainMilliseconds >= 100
    && CdpAlBotV6Client.ExecutionContextDrainMilliseconds <= 1000,
    "V6_CDP_EXECUTION_CONTEXT_DRAIN_BOUNDED");
Assert(typeof(CdpAlBotV6Client).GetField(
        "AutoAttachDrainMilliseconds",
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static) is null,
    "V6_OOPIF_LIVE_EVALUATION_SOCKET_HAS_NO_CANCELLATION_DRAIN");
var v6CollectContextsMethod = typeof(CdpAlBotV6Client).GetMethod(
    "CollectTargetExecutionContextsAsync",
    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
Assert(v6CollectContextsMethod is not null, "V6_CDP_CONTEXT_DISCOVERY_METHOD");
var v6CollectContextParameters = v6CollectContextsMethod!.GetParameters();
Assert(v6CollectContextParameters.Length == 2
    && v6CollectContextParameters[0].ParameterType == typeof(string)
    && v6CollectContextParameters.All(parameter => parameter.ParameterType.Name != "ClientWebSocket"),
    "V6_CDP_CONTEXT_DISCOVERY_OWNS_DISPOSABLE_SOCKET");
var v6FindContextMethod = typeof(CdpAlBotV6Client).GetMethod(
    "FindV6ContextAsync",
    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
Assert(v6FindContextMethod is not null
    && v6FindContextMethod.GetParameters().Any(parameter =>
        parameter.ParameterType == typeof(IReadOnlyList<int>)),
    "V6_CDP_EVALUATION_USES_PRECOLLECTED_CONTEXTS_ON_FRESH_SOCKET");
Assert(CdpAlBotV6Client.AdaptiveEventLimits(200).SequenceEqual([200, 24, 12, 6, 3, 1]),
    "V6_OVERSIZE_EVENT_RETRY_LADDER");
Assert(CdpAlBotV6Client.AdaptiveEventLimits(12).SequenceEqual([12, 6, 3, 1]),
    "V6_OVERSIZE_EVENT_RETRY_SMALL_LADDER");
var v6LocalProbeExpression = CdpAlBotV6Client.BuildLocalProbeExpression();
Assert(v6LocalProbeExpression.Contains("globalThis.ALBot", StringComparison.Ordinal),
    "V6_LOCAL_PROBE_CHECKS_CURRENT_CONTEXT_ALBOT");
Assert(v6LocalProbeExpression.Contains("__ALBOT_SHARED_RUNTIME__", StringComparison.Ordinal),
    "V6_LOCAL_PROBE_CHECKS_CURRENT_CONTEXT_SHARED_RUNTIME");
Assert(!v6LocalProbeExpression.Contains("candidate.frames", StringComparison.Ordinal),
    "V6_LOCAL_PROBE_DOES_NOT_ROUTE_THROUGH_SIBLING_FRAMES");
Assert(!v6LocalProbeExpression.Contains("findAdventureLandCharacterRoot", StringComparison.Ordinal),
    "V6_LOCAL_PROBE_DOES_NOT_ROUTE_BY_CROSS_FRAME_CHARACTER_LOOKUP");

var v6ProbeExpression = CdpAlBotV6Client.BuildProbeExpression();
Assert(v6ProbeExpression.Contains("__ALBOT_SHARED_RUNTIME__", StringComparison.Ordinal),
    "V6_PROBE_USES_SHARED_RUNTIME_RUNNER");
Assert(v6ProbeExpression.Contains("runnerRoot", StringComparison.Ordinal),
    "V6_PROBE_USES_RUNNER_ROOT");
Assert(v6ProbeExpression.Contains("candidate.frames", StringComparison.Ordinal),
    "V6_PROBE_SCANS_SAME_ORIGIN_FRAMES");
Assert(v6ProbeExpression.Contains("void candidate.location.href", StringComparison.Ordinal),
    "V6_PROBE_GATES_FRAME_ACCESS_BY_SAME_ORIGIN_READ");
Assert(v6ProbeExpression.Contains("identity.bridgeProtocol === 'albot-v6-bridge-v1'", StringComparison.Ordinal),
    "V6_PROBE_STILL_REQUIRES_EXACT_PROTOCOL");
Assert(v6ProbeExpression.Contains("identity.gameplayActionAuthority === false", StringComparison.Ordinal),
    "V6_PROBE_STILL_REJECTS_GAMEPLAY_AUTHORITY");
Assert(v6ProbeExpression.Contains("directAlBotCount", StringComparison.Ordinal),
    "V6_PROBE_REPORTS_DIRECT_ALBOT_COUNT");
Assert(v6ProbeExpression.Contains("sharedRuntimeCount", StringComparison.Ordinal),
    "V6_PROBE_REPORTS_SHARED_RUNTIME_COUNT");
Assert(v6ProbeExpression.Contains("runnerRootCount", StringComparison.Ordinal),
    "V6_PROBE_REPORTS_RUNNER_ROOT_COUNT");
Assert(v6ProbeExpression.Contains("candidateCount", StringComparison.Ordinal),
    "V6_PROBE_REPORTS_CANDIDATE_COUNT");
Assert(v6ProbeExpression.Contains("version: candidate && candidate.version", StringComparison.Ordinal),
    "V6_PROBE_REPORTS_RUNTIME_VERSION");
Assert(v6ProbeExpression.Contains("hasBridge: !!bridge", StringComparison.Ordinal),
    "V6_PROBE_REPORTS_BRIDGE_PRESENCE");
Assert(v6ProbeExpression.Contains("rowSet", StringComparison.Ordinal),
    "V6_PROBE_DEDUPES_BRIDGE_CANDIDATES");
Assert(v6ProbeExpression.Contains("findBridgeApiForCharacter", StringComparison.Ordinal),
    "V6_PROBE_SUPPORTS_EXACT_CHARACTER_SELECTION");
Assert(v6ProbeExpression.Contains("iframe[data-name]", StringComparison.Ordinal),
    "V6_PROBE_PRIORITIZES_ADVENTURE_LAND_CHARACTER_IFRAMES");
Assert(v6ProbeExpression.Contains("findAdventureLandCharacterRoot", StringComparison.Ordinal),
    "V6_PROBE_RESOLVES_NAMED_CHARACTER_ROOT");
Assert(v6ProbeExpression.Contains("collectCharacterScopeRoots", StringComparison.Ordinal),
    "V6_PROBE_SCOPES_CHARACTER_RUNNER_SEARCH");
Assert(v6ProbeExpression.Contains("element.dataset && element.dataset.name", StringComparison.Ordinal),
    "V6_PROBE_PREVENTS_CROSS_CHARACTER_SCOPE_LEAK");

var v6CharacterCatalogExpression = CdpAlBotV6Client.BuildCharacterCatalogExpression();
Assert(v6CharacterCatalogExpression.Contains("get_active_characters", StringComparison.Ordinal),
    "V6_CHARACTER_CATALOG_USES_ADVENTURE_LAND_LIVENESS_ROSTER");
Assert(v6CharacterCatalogExpression.Contains("const roster = new Map()", StringComparison.Ordinal),
    "V6_CHARACTER_CATALOG_DEDUPES_CHARACTER_NAMES");
Assert(v6CharacterCatalogExpression.Contains("findBridgeApiForCharacter('snapshot', row.character)", StringComparison.Ordinal),
    "V6_CHARACTER_CATALOG_ROUTES_EACH_ROSTER_CHARACTER_EXACTLY");
Assert(v6CharacterCatalogExpression.Contains("source: row.source", StringComparison.Ordinal),
    "V6_CHARACTER_CATALOG_RETURNS_ROSTER_SOURCE_DIAGNOSTIC");
Assert(v6CharacterCatalogExpression.Contains("bridgeAvailable: false", StringComparison.Ordinal),
    "V6_CHARACTER_CATALOG_REPORTS_ACTIVE_CHARACTER_WITHOUT_BRIDGE");
Assert(v6CharacterCatalogExpression.Contains("bridgeAvailable: true", StringComparison.Ordinal),
    "V6_CHARACTER_CATALOG_REPORTS_ROUTABLE_CHARACTER");
Assert(typeof(CdpAlBotV6Client).GetProperty("LastDiscoveryWarning") is not null,
    "V6_DISCOVERY_WARNING_PUBLIC_STATUS");

var mergedCharacterCandidates = CdpAlBotV6Client.MergeCharacterCandidates(
    "FarmerA",
    new string?[] { "My_Merchant", "FarmerA", "FarmerB", "my_merchant", null, " " });
Assert(mergedCharacterCandidates.SequenceEqual(
        new[] { "FarmerA", "FarmerB", "My_Merchant" },
        StringComparer.OrdinalIgnoreCase),
    "V6_LIVE_DISCOVERY_MERGES_TARGET_AND_CATALOG_CHARACTERS");
Assert(CdpAlBotV6Client.MergeCharacterCandidates(
        null,
        new string?[] { "My_Merchant" }).Single() == "My_Merchant",
    "V6_LIVE_DISCOVERY_SUPPORTS_SECONDARY_CHARACTER_WITHOUT_TARGET_URL_IDENTITY");

var v6DashboardVisualExpression = CdpAlBotV6Client.BuildDashboardVisualExpression("My_Merchant", includeTerrain: true);
Assert(v6DashboardVisualExpression.Contains("findAdventureLandCharacterRoot", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_SCOPES_EXACT_CHARACTER");
Assert(v6DashboardVisualExpression.Contains("gameData.geometry", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_READS_ADVENTURE_LAND_GEOMETRY");
Assert(v6DashboardVisualExpression.Contains("gameData.maps", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_READS_MAP_METADATA");
Assert(v6DashboardVisualExpression.Contains("gameData.tilesets", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_READS_TILESETS");
Assert(v6DashboardVisualExpression.Contains("encoding: 'base36-all-v2'", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_USES_V3_TERRAIN_ENCODING");
Assert(v6DashboardVisualExpression.Contains("gc: groups.map(packRows)", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_PRESERVES_TERRAIN_GROUPS");
Assert(v6DashboardVisualExpression.Contains("ac: packRows(animations)", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_PRESERVES_TERRAIN_ANIMATIONS");
Assert(v6DashboardVisualExpression.Contains("mapBounds", StringComparison.Ordinal)
    && v6DashboardVisualExpression.Contains("mapVisual", StringComparison.Ordinal)
    && v6DashboardVisualExpression.Contains("sprite", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_PRESERVES_V3_MAP_CONTRACT");
Assert(!v6DashboardVisualExpression.Contains("mapDef.monsters", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_OMITS_ENEMY_SPAWN_AREAS");
Assert(!v6DashboardVisualExpression.Contains("spawns:", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_HAS_NO_SPAWN_OVERLAY_PAYLOAD");
var v6DashboardVisualNoTerrainExpression = CdpAlBotV6Client.BuildDashboardVisualExpression("My_Rogue", includeTerrain: false);
Assert(v6DashboardVisualNoTerrainExpression.Contains("const includeTerrain = false", StringComparison.Ordinal),
    "V6_DASHBOARD_VISUAL_SUPPORTS_PER_MAP_TERRAIN_DEDUP");
Assert(CdpAlBotV6Client.IsSupportedTargetType("page"), "V6_CDP_PAGE_TARGET_SUPPORTED");
Assert(CdpAlBotV6Client.IsSupportedTargetType("iframe"), "V6_CDP_IFRAME_TARGET_SUPPORTED");
Assert(!CdpAlBotV6Client.IsSupportedTargetType("service_worker"), "V6_CDP_FOREIGN_TARGET_TYPE_REJECTED");
Assert(CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "https://adventure.land/character/My_Merchant/in/EU/II/",
        "https://adventure.land"),
    "V6_OOPIF_SAME_ORIGIN_AUTOATTACHED_CHILD_ACCEPTED");
Assert(CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "about:blank",
        "https://adventure.land"),
    "V6_OOPIF_OPAQUE_AUTOATTACHED_CHILD_ACCEPTED");
Assert(CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "about:srcdoc",
        "https://adventure.land"),
    "V6_OOPIF_SRCDOC_AUTOATTACHED_CHILD_ACCEPTED");
Assert(CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "",
        "https://adventure.land"),
    "V6_OOPIF_INITIAL_EMPTY_AUTOATTACHED_CHILD_ACCEPTED");
Assert(CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "blob:https://adventure.land/runner",
        "https://adventure.land"),
    "V6_OOPIF_SAME_ORIGIN_BLOB_ACCEPTED");
Assert(!CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "https://example.com/foreign",
        "https://adventure.land"),
    "V6_OOPIF_FOREIGN_ORIGIN_REJECTED");
Assert(!CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "blob:https://example.com/foreign",
        "https://adventure.land"),
    "V6_OOPIF_FOREIGN_BLOB_REJECTED");
Assert(!CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "service_worker",
        "https://adventure.land/sw.js",
        "https://adventure.land"),
    "V6_OOPIF_NON_IFRAME_REJECTED");
Assert(!CdpAlBotV6Client.IsTrustedAutoAttachedIframeDescriptor(
        "iframe",
        "about:blank",
        "not-a-valid-origin"),
    "V6_OOPIF_INVALID_ALLOWED_ORIGIN_REJECTED");

// The ancestry proof comes from the parent-scoped Target.attachedToTarget event;
// TargetInfo itself deliberately has no parentId/parentFrameId dependency.
using (var autoAttachEventDoc = JsonDocument.Parse("""
{
  "method": "Target.attachedToTarget",
  "params": {
    "sessionId": "CHILD-SESSION",
    "targetInfo": {
      "targetId": "IFRAME-TARGET",
      "type": "iframe",
      "url": "about:blank"
    },
    "waitingForDebugger": false
  }
}
"""))
{
    var root = autoAttachEventDoc.RootElement;
    Assert(root.GetProperty("params").GetProperty("sessionId").GetString() == "CHILD-SESSION",
        "V6_OOPIF_REAL_CDP_EVENT_EXPOSES_CHILD_SESSION");
    Assert(root.GetProperty("params").GetProperty("targetInfo").GetProperty("type").GetString() == "iframe",
        "V6_OOPIF_REAL_CDP_EVENT_EXPOSES_IFRAME_TARGET");
    Assert(!root.GetProperty("params").GetProperty("targetInfo").TryGetProperty("parentId", out _),
        "V6_OOPIF_TEST_DOES_NOT_INVENT_TARGETINFO_PARENT_ID");
    Assert(!root.GetProperty("params").GetProperty("targetInfo").TryGetProperty("parentFrameId", out _),
        "V6_OOPIF_TEST_DOES_NOT_INVENT_TARGETINFO_PARENT_FRAME_ID");
}
Assert(CdpAlBotV6Client.CharacterNameFromTargetUrl(
    "https://adventure.land/character/My_Merchant/in/EU/II/") == "My_Merchant",
    "V6_CDP_TARGET_CHARACTER_PARSED");
Assert(CdpAlBotV6Client.CharacterNameFromTargetUrl(
    "https://adventure.land/character/My%20Merchant/in/EU/II/") == "My Merchant",
    "V6_CDP_TARGET_CHARACTER_URL_DECODED");
Assert(CdpAlBotV6Client.CharacterNameFromTargetUrl(
    "https://adventure.land/runner") is null,
    "V6_CDP_NON_CHARACTER_TARGET_HAS_NO_CHARACTER");

var namedSnapshotBuilder = typeof(CdpAlBotV6Client).GetMethods(
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)
    .Single(method => method.Name == "BuildSnapshotExpression"
        && method.GetParameters().Length == 2);
var namedEventsBuilder = typeof(CdpAlBotV6Client).GetMethods(
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)
    .Single(method => method.Name == "BuildEventsExpression"
        && method.GetParameters().Length == 3);
var namedAckBuilder = typeof(CdpAlBotV6Client).GetMethods(
        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)
    .Single(method => method.Name == "BuildAcknowledgeExpression"
        && method.GetParameters().Length == 2);

var namedSnapshotExpression = (string)namedSnapshotBuilder.Invoke(null, [false, "My_Mage"])!;
var namedEventsExpression = (string)namedEventsBuilder.Invoke(null, ["My_Mage", 12L, 100])!;
var namedAckExpression = (string)namedAckBuilder.Invoke(null, [34L, "My_Mage"])!;
Assert(namedSnapshotExpression.Contains("findBridgeApiForCharacter('snapshot', \"My_Mage\")", StringComparison.Ordinal),
    "V6_SNAPSHOT_SELECTS_EXACT_CHARACTER");
Assert(namedEventsExpression.Contains("findBridgeApiForCharacter('events', \"My_Mage\")", StringComparison.Ordinal),
    "V6_EVENTS_SELECT_EXACT_CHARACTER");
Assert(namedAckExpression.Contains("findBridgeApiForCharacter('acknowledgeTelemetry', \"My_Mage\")", StringComparison.Ordinal),
    "V6_ACK_SELECTS_EXACT_CHARACTER");

var telemetryBoundedMethod = typeof(TelemetryBridgeService).GetMethod(
    "Bounded",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(telemetryBoundedMethod is not null, "V6_UI_ERROR_BOUND_HELPER");
var boundedDiagnostic = (string)telemetryBoundedMethod!.Invoke(null, [new string('x', 700)])!;
Assert(boundedDiagnostic.Length == 512, "V6_UI_ERROR_BOUND_PRESERVES_DIAGNOSTICS");
var bridgePrivateFields = typeof(TelemetryBridgeService)
    .GetFields(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
Assert(bridgePrivateFields.Any(field => field.FieldType == typeof(CdpAlBotV6Client)), "ACTIVE_BRIDGE_MUST_USE_V6_CDP_CLIENT");
Assert(bridgePrivateFields.Any(field => field.FieldType == typeof(CdpCharacterSupervisor)), "ACTIVE_BRIDGE_MUST_USE_BOUNDED_CHARACTER_SUPERVISOR");
Assert(!bridgePrivateFields.Any(field => field.FieldType == typeof(CdpAdventureLandClient)), "ACTIVE_BRIDGE_MUST_NOT_USE_LEGACY_CDP_CLIENT");
Assert(TelemetryBridgeService.SupervisorBlocksTelemetry("WAITING_FOR_ACCOUNT_SESSION"),
    "V6_SUPERVISOR_LOGIN_WAIT_BLOCKS_RUNTIME_PROBE");
Assert(!TelemetryBridgeService.SupervisorBlocksTelemetry("ROSTER_ACTIVE"),
    "V6_SUPERVISOR_ACTIVE_ROSTER_ALLOWS_RUNTIME_PROBE");
Assert(!bridgePrivateFields.Any(field => field.FieldType == typeof(CdpBackblazeConfigurator)), "ACTIVE_BRIDGE_MUST_NOT_HOLD_LEGACY_BACKBLAZE_CONFIGURATOR");
Assert(bridgePrivateFields.Any(field => field.FieldType == typeof(BackblazeV6ArchiveSink)), "ACTIVE_BRIDGE_MUST_USE_V6_BACKBLAZE_HOST_SINK");
Assert(CloudflareV6DashboardSink.RuntimePath == "/api/v6/runtime", "V6_DASHBOARD_RUNTIME_PATH");
Assert(CloudflareV6DashboardSink.IsWithinPayloadBudget(CloudflareV6DashboardSink.MaxPayloadBytes), "V6_DASHBOARD_PAYLOAD_BUDGET");
Assert(!CloudflareV6DashboardSink.IsWithinPayloadBudget(CloudflareV6DashboardSink.MaxPayloadBytes + 1), "V6_DASHBOARD_PAYLOAD_OVERSIZE_BLOCKED");

var compactDashboardSnapshotMethod = typeof(CloudflareV6DashboardSink).GetMethod(
    "CreateCompactSnapshot",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
var compactDashboardEventsMethod = typeof(CloudflareV6DashboardSink).GetMethod(
    "CreateCompactEvents",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(compactDashboardSnapshotMethod is not null, "V6_DASHBOARD_COMPACT_SNAPSHOT_HELPER");
Assert(compactDashboardEventsMethod is not null, "V6_DASHBOARD_COMPACT_EVENTS_HELPER");

var createDashboardSnapshotMethod = typeof(CloudflareV6DashboardSink).GetMethod(
    "CreateDashboardSnapshot",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(createDashboardSnapshotMethod is not null, "V6_DASHBOARD_VISUAL_MERGE_HELPER");

using (var baseDashboardSnapshotDoc = JsonDocument.Parse("""
{
  "schemaVersion": 1,
  "type": "ALBOT_V6_DEBUG_SNAPSHOT",
  "identity": {
    "product": "AL Bot",
    "generation": 6,
    "bridgeProtocol": "albot-v6-bridge-v1",
    "transportOnly": true,
    "gameplayActionAuthority": false,
    "acceptsLegacyGenerations": false
  },
  "character": { "name": "My_Merchant", "ctype": "merchant", "map": "main", "x": 1, "y": 2 }
}
"""))
using (var dashboardVisualDoc = JsonDocument.Parse("""
{
  "schemaVersion": 1,
  "type": "ALBOT_V6_DASHBOARD_VISUAL",
  "character": "My_Merchant",
  "available": true,
  "mapBounds": { "minX": -1800, "minY": -1200, "maxX": 1800, "maxY": 1200 },
  "mapVisual": { "npcs": [], "doors": [] },
  "terrain": { "map": "main", "encoding": "base36-all-v2", "t": [], "pc": "", "gc": [], "ac": "", "s": {} },
  "sprite": { "skin": "merchant", "file": "/images/pack.png", "columns": 8, "rows": 8, "column": 1, "row": 2 }
}
"""))
{
    var mergedDashboardSnapshot = createDashboardSnapshotMethod!.Invoke(
        null,
        [baseDashboardSnapshotDoc.RootElement, (JsonElement?)dashboardVisualDoc.RootElement.Clone()])!;
    var mergedDashboardJson = JsonSerializer.SerializeToUtf8Bytes(mergedDashboardSnapshot);
    using var mergedDashboardDoc = JsonDocument.Parse(mergedDashboardJson);
    var mergedRoot = mergedDashboardDoc.RootElement;
    Assert(mergedRoot.GetProperty("character").GetProperty("name").GetString() == "My_Merchant",
        "V6_DASHBOARD_VISUAL_MERGE_PRESERVES_CHARACTER");
    Assert(mergedRoot.GetProperty("terrain").GetProperty("encoding").GetString() == "base36-all-v2",
        "V6_DASHBOARD_VISUAL_MERGE_PRESERVES_REAL_TERRAIN");
    Assert(mergedRoot.GetProperty("mapBounds").GetProperty("minX").GetInt32() == -1800,
        "V6_DASHBOARD_VISUAL_MERGE_PRESERVES_MAP_BOUNDS");
    Assert(mergedRoot.TryGetProperty("sprite", out _),
        "V6_DASHBOARD_VISUAL_MERGE_PRESERVES_SPRITE");
}

var oversizedDashboardSnapshot = new Dictionary<string, object?>
{
    ["schemaVersion"] = 1,
    ["type"] = "ALBOT_V6_DEBUG_SNAPSHOT",
    ["identity"] = new Dictionary<string, object?>
    {
        ["product"] = "AL Bot",
        ["generation"] = 6,
        ["bridgeProtocol"] = "albot-v6-bridge-v1",
        ["runtimeVersion"] = "0.22.7-h22",
        ["transportOnly"] = true,
        ["gameplayActionAuthority"] = false,
        ["acceptsLegacyGenerations"] = false,
        ["huge"] = new string('i', 180_000)
    },
    ["observedAt"] = 123456789L,
    ["character"] = new Dictionary<string, object?>
    {
        ["name"] = "My_Ranger1",
        ["ctype"] = "ranger",
        ["level"] = 80,
        ["hp"] = 900,
        ["max_hp"] = 1000,
        ["mp"] = 450,
        ["max_mp"] = 500,
        ["gold"] = 12345,
        ["map"] = "main",
        ["x"] = 12.5,
        ["y"] = -7.25,
        ["inventory"] = new string('c', 220_000)
    },
    ["status"] = new Dictionary<string, object?>
    {
        ["currentTask"] = "Farm goo",
        ["huge"] = new string('s', 220_000)
    },
    ["telemetry"] = new Dictionary<string, object?>
    {
        ["performance"] = new Dictionary<string, object?>
        {
            ["current"] = new Dictionary<string, object?>
            {
                ["rates"] = new Dictionary<string, object?>
                {
                    ["xpPerHour"] = 1234.5,
                    ["goldPerHour"] = 678.9
                }
            }
        },
        ["huge"] = new string('t', 220_000)
    }
};
using (var oversizedDashboardDocument = JsonDocument.Parse(JsonSerializer.Serialize(oversizedDashboardSnapshot)))
{
    var compactDashboardSnapshot = compactDashboardSnapshotMethod!.Invoke(
        null,
        [oversizedDashboardDocument.RootElement])!;
    var compactDashboardBytes = JsonSerializer.SerializeToUtf8Bytes(compactDashboardSnapshot);
    Assert(compactDashboardBytes.Length < 64 * 1024, "V6_DASHBOARD_COMPACT_SNAPSHOT_SMALL");
    Assert(compactDashboardBytes.Length < CloudflareV6DashboardSink.MaxPayloadBytes,
        "V6_DASHBOARD_COMPACT_SNAPSHOT_FITS_HOST_BUDGET");

    using var compactDashboardDocument = JsonDocument.Parse(compactDashboardBytes);
    var compactRoot = compactDashboardDocument.RootElement;
    Assert(compactRoot.GetProperty("identity").GetProperty("bridgeProtocol").GetString() == "albot-v6-bridge-v1",
        "V6_DASHBOARD_COMPACT_SNAPSHOT_PRESERVES_IDENTITY");
    Assert(compactRoot.GetProperty("character").GetProperty("name").GetString() == "My_Ranger1",
        "V6_DASHBOARD_COMPACT_SNAPSHOT_PRESERVES_CHARACTER");
    Assert(compactRoot.GetProperty("character").GetProperty("hp").GetDouble() == 900,
        "V6_DASHBOARD_COMPACT_SNAPSHOT_PRESERVES_HP");
    Assert(compactRoot.GetProperty("task").GetString() == "Farm goo",
        "V6_DASHBOARD_COMPACT_SNAPSHOT_PRESERVES_TASK");
    Assert(compactRoot.GetProperty("rates").GetProperty("xpPerHour").GetDouble() == 1234.5,
        "V6_DASHBOARD_COMPACT_SNAPSHOT_PRESERVES_XP_RATE");
    Assert(compactRoot.GetProperty("rates").GetProperty("goldPerHour").GetDouble() == 678.9,
        "V6_DASHBOARD_COMPACT_SNAPSHOT_PRESERVES_GOLD_RATE");
    Assert(!Encoding.UTF8.GetString(compactDashboardBytes).Contains(new string('s', 128), StringComparison.Ordinal),
        "V6_DASHBOARD_COMPACT_SNAPSHOT_DROPS_HEAVY_STATUS");
}

var oversizedDashboardEvents = Enumerable.Range(1, 200)
    .Select(seq => new Dictionary<string, object?>
    {
        ["seq"] = seq,
        ["ts"] = "2026-09-29T19:00:00.000Z",
        ["severity"] = seq % 10 == 0 ? "ERROR" : "INFO",
        ["component"] = "combat",
        ["event"] = "HEARTBEAT",
        ["reason"] = new string('r', 5000),
        ["data"] = new Dictionary<string, object?>
        {
            ["component"] = "combat",
            ["character"] = "My_Ranger1",
            ["huge"] = new string('x', 24_000)
        }
    })
    .ToArray();
using (var oversizedDashboardEventsDocument = JsonDocument.Parse(JsonSerializer.Serialize(oversizedDashboardEvents)))
{
    var compactDashboardEvents = (IReadOnlyList<object>)compactDashboardEventsMethod!.Invoke(
        null,
        [oversizedDashboardEventsDocument.RootElement])!;
    Assert(compactDashboardEvents.Count == 24, "V6_DASHBOARD_EVENT_COMPACTION_MATCHES_WORKER_BATCH_MAX");

    var compactDashboardEventBytes = JsonSerializer.SerializeToUtf8Bytes(compactDashboardEvents);
    Assert(compactDashboardEventBytes.Length < 64 * 1024, "V6_DASHBOARD_COMPACT_EVENTS_SMALL");
    using var compactDashboardEventsJson = JsonDocument.Parse(compactDashboardEventBytes);
    Assert(compactDashboardEventsJson.RootElement[0].GetProperty("seq").GetInt64() == 177,
        "V6_DASHBOARD_EVENT_COMPACTION_KEEPS_LATEST_WINDOW_START");
    Assert(compactDashboardEventsJson.RootElement[23].GetProperty("seq").GetInt64() == 200,
        "V6_DASHBOARD_EVENT_COMPACTION_KEEPS_LATEST_WINDOW_END");
    Assert(!Encoding.UTF8.GetString(compactDashboardEventBytes).Contains(new string('x', 128), StringComparison.Ordinal),
        "V6_DASHBOARD_EVENT_COMPACTION_DROPS_HEAVY_DATA");
}

using (var v6IdentityDocument = JsonDocument.Parse("""
{
  "product": "AL Bot",
  "generation": 6,
  "bridgeProtocol": "albot-v6-bridge-v1",
  "runtimeVersion": "0.22.7-h22",
  "transportOnly": true,
  "gameplayActionAuthority": false,
  "acceptsLegacyGenerations": false
}
"""))
{
    Assert(CdpAlBotV6Client.IsV6Identity(v6IdentityDocument.RootElement), "V6_IDENTITY_ACCEPTED");
}
using (var legacyIdentityDocument = JsonDocument.Parse("""
{
  "product": "Adventure Land AiO Bot",
  "generation": 5,
  "bridgeProtocol": "aio-v3",
  "transportOnly": true,
  "gameplayActionAuthority": false,
  "acceptsLegacyGenerations": true
}
"""))
{
    Assert(!CdpAlBotV6Client.IsV6Identity(legacyIdentityDocument.RootElement), "LEGACY_IDENTITY_REJECTED");
}
Assert(typeof(CdpAlBotV6Client).GetMethods().Any(method => method.Name == "ReadAllAsync"), "V6_MULTI_CHARACTER_READ_API");

var executionContextCandidateMethod = typeof(CdpAlBotV6Client).GetMethod(
    "TryGetExecutionContextId",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
Assert(executionContextCandidateMethod is not null, "V6_EXECUTION_CONTEXT_CANDIDATE_METHOD");
using var executionContextHttpClient = new HttpClient();
var executionContextClient = new CdpAlBotV6Client(executionContextHttpClient, defaults);
using (var sandboxContextDocument = JsonDocument.Parse("""{"id":42,"origin":""}"""))
{
    object?[] invokeArgs = [sandboxContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(accepted, "V6_SANDBOX_CONTEXT_WITH_EMPTY_ORIGIN_ACCEPTED_FOR_IDENTITY_PROBE");
    Assert((int)invokeArgs[1]! == 42, "V6_SANDBOX_CONTEXT_ID_PRESERVED");
}
using (var missingOriginContextDocument = JsonDocument.Parse("""{"id":43}"""))
{
    object?[] invokeArgs = [missingOriginContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(accepted, "V6_CONTEXT_WITHOUT_ORIGIN_ACCEPTED_FOR_IDENTITY_PROBE");
    Assert((int)invokeArgs[1]! == 43, "V6_CONTEXT_WITHOUT_ORIGIN_ID_PRESERVED");
}
using (var sameOriginContextDocument = JsonDocument.Parse("""{"id":44,"origin":"https://adventure.land"}"""))
{
    object?[] invokeArgs = [sameOriginContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(accepted, "V6_ADVENTURE_LAND_CONTEXT_ACCEPTED_FOR_IDENTITY_PROBE");
}
using (var opaqueSandboxContextDocument = JsonDocument.Parse("""
{"id":46,"origin":"null","auxData":{"isDefault":true,"type":"default","frameId":"FRAME-MERCHANT"}}
"""))
{
    object?[] invokeArgs = [opaqueSandboxContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(accepted, "V6_SANDBOX_CONTEXT_WITH_NULL_ORIGIN_ACCEPTED_FOR_DEFAULT_FRAME");
    Assert((int)invokeArgs[1]! == 46, "V6_NULL_ORIGIN_CONTEXT_ID_PRESERVED");
}
using (var opaqueSchemeContextDocument = JsonDocument.Parse("""
{"id":47,"origin":"://","auxData":{"isDefault":true,"type":"default","frameId":"FRAME-RANGER2"}}
"""))
{
    object?[] invokeArgs = [opaqueSchemeContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(accepted, "V6_SANDBOX_CONTEXT_WITH_OPAQUE_SCHEME_ACCEPTED_FOR_DEFAULT_FRAME");
}
using (var opaqueIsolatedContextDocument = JsonDocument.Parse("""
{"id":48,"origin":"null","auxData":{"isDefault":false,"type":"isolated","frameId":"FRAME-FOREIGN"}}
"""))
{
    object?[] invokeArgs = [opaqueIsolatedContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(!accepted, "V6_OPAQUE_ISOLATED_WORLD_REJECTED");
}
using (var opaqueContextWithoutFrameDocument = JsonDocument.Parse("""
{"id":49,"origin":"null","auxData":{"isDefault":true,"type":"default"}}
"""))
{
    object?[] invokeArgs = [opaqueContextWithoutFrameDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(!accepted, "V6_OPAQUE_CONTEXT_WITHOUT_FRAME_ID_REJECTED");
}
using (var foreignOriginContextDocument = JsonDocument.Parse("""{"id":45,"origin":"https://example.invalid"}"""))
{
    object?[] invokeArgs = [foreignOriginContextDocument.RootElement, 0];
    var accepted = (bool)executionContextCandidateMethod!.Invoke(executionContextClient, invokeArgs)!;
    Assert(!accepted, "V6_EXPLICIT_FOREIGN_CONTEXT_REJECTED");
}
Assert(typeof(CdpAlBotV6Client).GetMethods().Any(method =>
    method.Name == "AcknowledgeThroughAsync"
    && method.GetParameters().Length == 3
    && method.GetParameters()[0].ParameterType == typeof(string)), "V6_CHARACTER_SCOPED_ACK_API");

var parseCdpJsonMethod = typeof(CdpAlBotV6Client).GetMethod(
    "ParseCdpJson",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(parseCdpJsonMethod is not null, "V6_CDP_JSON_PARSE_HELPER");
var validCdpPayload = System.Text.Encoding.UTF8.GetBytes("""{"id":1,"result":{}}""");
using (var validCdpDocument = (JsonDocument)parseCdpJsonMethod!.Invoke(null, [validCdpPayload])!)
{
    Assert(validCdpDocument.RootElement.GetProperty("id").GetInt32() == 1, "V6_CDP_VALID_JSON_ACCEPTED");
}
try
{
    var invalidCdpPayload = System.Text.Encoding.UTF8.GetBytes("/not-json");
    parseCdpJsonMethod!.Invoke(null, [invalidCdpPayload]);
    Assert(false, "V6_CDP_INVALID_JSON_MUST_FAIL_CLOSED");
}
catch (System.Reflection.TargetInvocationException error)
{
    Assert(error.InnerException is InvalidOperationException, "V6_CDP_INVALID_JSON_WRAPPED");
    Assert(error.InnerException!.Message.StartsWith("CDP_FRAME_INVALID_JSON:", StringComparison.Ordinal),
        "V6_CDP_INVALID_JSON_CLASSIFIED");
}

var classifyCdpEnvelopeMethod = typeof(CdpAlBotV6Client).GetMethod(
    "ClassifyCdpEnvelopePrefix",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(classifyCdpEnvelopeMethod is not null, "V6_CDP_ENVELOPE_CLASSIFIER");
string ClassifyCdp(string json, int expectedId) =>
    (string)classifyCdpEnvelopeMethod!.Invoke(
        null,
        [System.Text.Encoding.UTF8.GetBytes(json), expectedId])!;
Assert(ClassifyCdp("""{"method":"Runtime.consoleAPICalled","params":{"id":77}}""", 77) == "event",
    "V6_CDP_UNSOLICITED_EVENT_CLASSIFIED_BEFORE_NESTED_ID");
Assert(ClassifyCdp("""{"id":77,"result":{}}""", 77) == "expected-response",
    "V6_CDP_EXPECTED_RESPONSE_CLASSIFIED");
Assert(ClassifyCdp("""{"id":76,"result":{}}""", 77) == "other-response",
    "V6_CDP_OTHER_RESPONSE_CLASSIFIED");
Assert(ClassifyCdp("""{"garbage":{"id":77}}""", 77) == "unknown",
    "V6_CDP_UNCLASSIFIED_LARGE_MESSAGE_FAILS_CLOSED");

using (var multiCharacterSnapshot = JsonDocument.Parse(
    """{"character":{"name":"My_Ranger1","ctype":"ranger"},"status":{"running":true}}"""))
{
    Assert(CdpAlBotV6Client.ReadCharacterName(multiCharacterSnapshot.RootElement) == "My_Ranger1",
        "V6_SNAPSHOT_CHARACTER_NAME");
    Assert(CdpAlBotV6Client.ReadCharacterType(multiCharacterSnapshot.RootElement) == "ranger",
        "V6_SNAPSHOT_CHARACTER_TYPE");
    Assert(CdpAlBotV6Client.IsRuntimeRunning(multiCharacterSnapshot.RootElement),
        "V6_SNAPSHOT_RUNTIME_RUNNING");
}
using (var stoppedCharacterSnapshot = JsonDocument.Parse(
    """{"character":{"name":"My_Ranger2","ctype":"ranger"},"status":{"running":false}}"""))
{
    Assert(!CdpAlBotV6Client.IsRuntimeRunning(stoppedCharacterSnapshot.RootElement),
        "V6_SNAPSHOT_RUNTIME_STOPPED");
}

Assert(CdpCharacterSupervisor.IsActiveState("code"), "V6_SUPERVISOR_CODE_STATE_ACTIVE");
Assert(CdpCharacterSupervisor.IsActiveState("starting"), "V6_SUPERVISOR_STARTING_STATE_ACTIVE");
Assert(CdpCharacterSupervisor.IsActiveState("active"), "V6_SUPERVISOR_LOADED_CHARACTER_PRESENT");
Assert(CdpCharacterSupervisor.IsActiveState("self"), "V6_SUPERVISOR_LOCAL_CHARACTER_PRESENT");
Assert(!CdpCharacterSupervisor.IsActiveState("offline"), "V6_SUPERVISOR_OFFLINE_STATE_REJECTED");
Assert(CdpCharacterSupervisor.IsCodeActiveState("code", false, false),
    "V6_SUPERVISOR_CHILD_CODE_STATE_RUNTIME_ACTIVE");
Assert(!CdpCharacterSupervisor.IsCodeActiveState("active", false, false),
    "V6_SUPERVISOR_LOADED_CHILD_WITHOUT_CODE_NOT_RUNTIME_ACTIVE");
Assert(!CdpCharacterSupervisor.IsCodeActiveState("self", false, true),
    "V6_SUPERVISOR_LOCAL_SELF_WITHOUT_CODE_NOT_RUNTIME_ACTIVE");
Assert(CdpCharacterSupervisor.IsCodeActiveState("self", true, true),
    "V6_SUPERVISOR_LOCAL_SELF_REQUIRES_EXPLICIT_CODE_ACTIVE");
Assert(!CdpCharacterSupervisor.IsCodeActiveState("self", true, false),
    "V6_SUPERVISOR_REMOTE_SELF_STATE_CANNOT_INFER_CODE_ACTIVE");
Assert(CdpCharacterSupervisor.IsCombatClass("priest"), "V6_SUPERVISOR_PRIEST_IS_FARMER_CLASS");
Assert(CdpCharacterSupervisor.IsCombatClass("ranger"), "V6_SUPERVISOR_RANGER_IS_FARMER_CLASS");
Assert(!CdpCharacterSupervisor.IsCombatClass("merchant"), "V6_SUPERVISOR_MERCHANT_NOT_FARMER_CLASS");
Assert(CdpCharacterSupervisor.IsHealthyRuntimeComposition([
    ("My_Merchant", "merchant", true),
    ("My_Priest", "priest", true),
    ("My_Ranger2", "ranger", true),
    ("My_Ranger3", "ranger", true)
]), "V6_SUPERVISOR_ONE_MERCHANT_THREE_FARMERS_HEALTHY");
Assert(!CdpCharacterSupervisor.IsHealthyRuntimeComposition([
    ("My_Merchant", "merchant", true),
    ("My_Priest", "priest", true),
    ("My_Ranger2", "ranger", true),
    ("My_Ranger3", "ranger", false)
]), "V6_SUPERVISOR_STOPPED_RUNTIME_UNHEALTHY");

DebugReadResult RuntimeRead(string name, string ctype, bool running)
{
    var snapshotBytes = JsonSerializer.SerializeToUtf8Bytes(new
    {
        character = new { name, ctype },
        status = new { running }
    });
    using var snapshot = JsonDocument.Parse(snapshotBytes);
    using var events = JsonDocument.Parse("[]");
    return new DebugReadResult(
        snapshot.RootElement.Clone(),
        events.RootElement.Clone(),
        0, 0, 0, 0, false,
        "https://adventure.land/character/" + name + "/in/EU/II/");
}
var healthyRuntimeReads = new[]
{
    RuntimeRead("My_Merchant", "merchant", true),
    RuntimeRead("My_Priest", "priest", true),
    RuntimeRead("My_Ranger2", "ranger", true),
    RuntimeRead("My_Ranger3", "ranger", true)
};
Assert(TelemetryBridgeService.RuntimeCompositionWarning(healthyRuntimeReads) is null,
    "V6_RUNTIME_GROUP_ONE_MERCHANT_THREE_FARMERS_HEALTHY");
var incompleteRuntimeWarning = TelemetryBridgeService.RuntimeCompositionWarning([
    RuntimeRead("My_Merchant", "merchant", true),
    RuntimeRead("My_Priest", "priest", true),
    RuntimeRead("My_Ranger2", "ranger", true),
    RuntimeRead("My_Ranger3", "ranger", false)
]);
Assert(incompleteRuntimeWarning is not null
    && incompleteRuntimeWarning.Contains("runtime=3/4", StringComparison.Ordinal)
    && incompleteRuntimeWarning.Contains("merchant=1/1", StringComparison.Ordinal)
    && incompleteRuntimeWarning.Contains("farmers=2/3", StringComparison.Ordinal),
    "V6_RUNTIME_GROUP_WARNING_EXPOSES_RUNNING_COMPOSITION");

var merchantNavigationBuilder = typeof(CdpCharacterSupervisor).GetMethod(
    "BuildMerchantNavigationExpression",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
var characterStartBuilder = typeof(CdpCharacterSupervisor).GetMethod(
    "BuildStartCharacterExpression",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
var codeRestartBuilder = typeof(CdpCharacterSupervisor).GetMethod(
    "BuildRestartCodeExpression",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(merchantNavigationBuilder is not null, "V6_SUPERVISOR_MERCHANT_NAVIGATION_BUILDER");
Assert(characterStartBuilder is not null, "V6_SUPERVISOR_CHARACTER_START_BUILDER");
Assert(codeRestartBuilder is not null, "V6_SUPERVISOR_CODE_RESTART_BUILDER");
var merchantNavigationExpression = (string)merchantNavigationBuilder!.Invoke(
    null, ["My_Merchant", "EU", "II", "AL Final Bot"])!;
var characterStartExpression = (string)characterStartBuilder!.Invoke(
    null, ["My_Ranger2", "AL Final Bot"])!;
var codeRestartExpression = (string)codeRestartBuilder!.Invoke(
    null, ["My_Ranger2", "AL Final Bot"])!;
Assert(merchantNavigationExpression.Contains("location.assign", StringComparison.Ordinal)
    && merchantNavigationExpression.Contains("?code=", StringComparison.Ordinal),
    "V6_SUPERVISOR_COLD_START_NAVIGATES_MERCHANT_WITH_CODE_SLOT");
Assert(characterStartExpression.Contains("start_character_runner", StringComparison.Ordinal)
    && characterStartExpression.Contains("start_character", StringComparison.Ordinal),
    "V6_SUPERVISOR_USES_OFFICIAL_CHARACTER_LIFECYCLE_API");
Assert(!characterStartExpression.Contains("stop_character", StringComparison.Ordinal),
    "V6_SUPERVISOR_DOES_NOT_BLINDLY_STOP_ACTIVE_CHARACTERS");
Assert(codeRestartExpression.Contains("code_active === true", StringComparison.Ordinal)
    && codeRestartExpression.Contains("frame.src = next.toString()", StringComparison.Ordinal)
    && codeRestartExpression.Contains("root.location.assign(next.toString())", StringComparison.Ordinal),
    "V6_SUPERVISOR_RESTARTS_CODE_LAYER_FOR_LOADED_LOCAL_OR_CHILD_CHARACTER");
Assert(codeRestartExpression.Contains("searchParams.set('code', slot)", StringComparison.Ordinal),
    "V6_SUPERVISOR_CODE_RESTART_PRESERVES_MANAGED_CODE_SLOT");
Assert(!codeRestartExpression.Contains("stop_character", StringComparison.Ordinal),
    "V6_SUPERVISOR_CODE_RESTART_PRESERVES_CONNECTED_CHARACTER");

var perCharacterState = new BridgeState(999);
Assert(perCharacterState.GetLastEventSeq("My_Ranger1") == 0,
    "V6_LEGACY_GLOBAL_CURSOR_MUST_NOT_SKIP_NEW_CHARACTER_DATA");
perCharacterState = perCharacterState.WithCharacterSeq("My_Ranger1", 12);
perCharacterState = perCharacterState.WithCharacterSeq("My_Priest", 34);
Assert(perCharacterState.GetLastEventSeq("My_Ranger1") == 12, "V6_RANGER_CURSOR_INDEPENDENT");
Assert(perCharacterState.GetLastEventSeq("my_priest") == 34, "V6_PRIEST_CURSOR_CASE_INSENSITIVE");
Assert(perCharacterState.GetLastEventSeq("My_Merchant") == 0, "V6_NEW_CHARACTER_CURSOR_STARTS_ZERO");
Assert(perCharacterState.LastEventSeq == 999, "V6_AGGREGATE_CURSOR_REMAINS_MONOTONIC");
perCharacterState = perCharacterState.WithManagedCharacterNames([
    "My_Ranger3", "My_Merchant", "My_Priest", "My_Ranger2"
]);
Assert(perCharacterState.GetManagedCharacterNames().SequenceEqual(
    ["My_Merchant", "My_Priest", "My_Ranger2", "My_Ranger3"],
    StringComparer.OrdinalIgnoreCase),
    "V6_MANAGED_ROSTER_PERSISTED_DETERMINISTICALLY");
try
{
    _ = perCharacterState.WithManagedCharacterNames(["My_Merchant", "My_Priest"]);
    throw new InvalidOperationException("EXPECTED_MANAGED_ROSTER_VALIDATION");
}
catch (ArgumentException error) when (
    error.Message.Contains("MANAGED_CHARACTER_SET_MUST_CONTAIN_FOUR_UNIQUE_NAMES", StringComparison.Ordinal))
{
}

Assert(defaults.WebDashboardEnabled, "WEB_DASHBOARD_PROFILE_SYNC_DEFAULT_ON");
Assert(defaults.WebDashboardBaseUrl.StartsWith("https://", StringComparison.Ordinal), "WEB_DASHBOARD_MUST_DEFAULT_HTTPS");
Assert(defaults.WebDashboardAccount == "default", "WEB_DASHBOARD_ACCOUNT_DEFAULT");
Assert(!string.IsNullOrWhiteSpace(defaults.WebDashboardWriteKeyEnvironmentVariable), "WEB_DASHBOARD_ENV_REQUIRED");
Assert(defaults.BackblazeEnabled, "V6_BACKBLAZE_HOST_ARCHIVE_DEFAULT_ON");
Assert(defaults.BackblazeEndpoint == "https://s3.eu-central-003.backblazeb2.com", "BACKBLAZE_ENDPOINT_DEFAULT");
Assert(defaults.BackblazeRegion == "eu-central-003", "BACKBLAZE_REGION_DEFAULT");
Assert(defaults.BackblazeBucket == "al-aio-bot", "BACKBLAZE_BUCKET_DEFAULT");
Assert(defaults.BackblazePrefix == "v6", "BACKBLAZE_PREFIX_DEFAULT");
Assert(defaults.BackblazeKeyIdEnvironmentVariable == "ALBOT_V6_BACKBLAZE_KEY_ID", "BACKBLAZE_KEY_ID_ENV_REQUIRED");
Assert(defaults.BackblazeApplicationKeyEnvironmentVariable == "ALBOT_V6_BACKBLAZE_APPLICATION_KEY", "BACKBLAZE_APPLICATION_KEY_ENV_REQUIRED");
Assert(BridgeConfig.CurrentConfigVersion == 13, "V6_CONFIG_VERSION_13");
Assert(defaults.CharacterSupervisorEnabled, "V6_CHARACTER_SUPERVISOR_DEFAULT_ON");
Assert(defaults.ManagedCodeSlot == "AL Final Bot", "V6_CHARACTER_SUPERVISOR_CODE_SLOT_DEFAULT");
Assert(BridgeConfig.LegacyBackblazeCredentialsPath.EndsWith("backblaze-credentials.dpapi", StringComparison.OrdinalIgnoreCase), "LEGACY_BACKBLAZE_STORE_AVAILABLE_FOR_ONE_TIME_IMPORT");
Assert(defaults.WissenswaechterAktiv, "WISSENSWAECHTER_DEFAULT_ON");
Assert(V5ReadinessSystemtest.TestKennung == "V5_WINDOWS_BRIDGE_READINESS", "V5_READINESS_TEST_ID");
Assert(V5ReadinessSystemtest.TestVersion == "1.1.0", "V5_READINESS_TEST_VERSION");
var readinessCleanupRoot = Path.Combine(Path.GetTempPath(), "aio-v5-readiness-cleanup-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(Path.Combine(readinessCleanupRoot, ".git", "objects", "info", "commit-graphs"));
var readinessCleanupDatei = Path.Combine(readinessCleanupRoot, ".git", "objects", "info", "commit-graphs", "commit-graph-chain");
await File.WriteAllTextAsync(readinessCleanupDatei, "test");
File.SetAttributes(readinessCleanupDatei, File.GetAttributes(readinessCleanupDatei) | FileAttributes.ReadOnly);
var readinessCleanupMethode = typeof(V5ReadinessSystemtest).GetMethod(
    "EntferneTempArbeitskopieAsync",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(readinessCleanupMethode is not null, "V5_READINESS_CLEANUP_METHOD");
var readinessCleanupTask = (Task<string?>)readinessCleanupMethode!.Invoke(null, [readinessCleanupRoot])!;
var readinessCleanupFehler = await readinessCleanupTask;
Assert(readinessCleanupFehler is null, "V5_READINESS_CLEANUP_READONLY_FILE");
Assert(!Directory.Exists(readinessCleanupRoot), "V5_READINESS_CLEANUP_REMOVES_ROOT");
var readinessStatisch = V5ReadinessSystemtest.PruefeStatischeKonfiguration(defaults);
Assert(readinessStatisch.Count >= 8, "V5_READINESS_STATIC_CHECK_COUNT");
Assert(readinessStatisch.All(x => x.Status == "BESTANDEN"), "V5_READINESS_DEFAULT_CONFIG_PASS");
Assert(readinessStatisch.Any(x => x.Kennung == "KNOWLEDGE_BRANCH" && x.Detail.Contains("v5/wissenswaechter-automatisch", StringComparison.Ordinal)), "V5_READINESS_KNOWLEDGE_BRANCH");
Assert(readinessStatisch.Any(x => x.Kennung == "GITHUB_AUTH_MODUS" && x.Status == "BESTANDEN"), "V5_READINESS_PAT_ONLY_AUTH");
Assert(readinessStatisch.Any(x => x.Kennung == "KNOWLEDGE_SYNC_LEAST_PRIVILEGE" && x.Status == "BESTANDEN"), "V5_READINESS_NO_MAIN_MERGE");
Assert(readinessStatisch.Any(x => x.Kennung == "TEST_OHNE_GAMEPLAY_WRITE" && x.Status == "BESTANDEN"), "V5_READINESS_NO_GAMEPLAY_AUTHORITY");
Assert(GitHubAnmeldung.Authentifizierungsmodus == "FINE_GRAINED_PAT", "GITHUB_AUTH_FINE_GRAINED_PAT_REQUIRED");
Assert(GitHubAnmeldung.MinimalBerechtigungsprofil == "REPOSITORY_ONLY_CONTENTS_WRITE", "GITHUB_AUTH_MINIMAL_PROFILE");
Assert(defaults.WissenswaechterIntervallMinuten == 60, "WISSENSWAECHTER_HOURLY");
Assert(defaults.WissenswaechterWebSucheAktiv, "WISSENSWAECHTER_WEB_SEARCH_DEFAULT_ON");
Assert(defaults.WissenswaechterMaxQuellenProLauf == 200, "WISSENSWAECHTER_SOURCE_LIMIT");
Assert(defaults.WissenswaechterMaxKandidaten == 1000, "WISSENSWAECHTER_CANDIDATE_LIMIT");
Assert(defaults.LiveWissensimportAktiv, "LIVE_WISSEN_IMPORT_DEFAULT_ON");
Assert(defaults.LiveWissensdatenbankPfad == @"D:\AdventureLand-V5\wissensdatenbank", "LIVE_WISSEN_DEFAULT_PATH");
Assert(defaults.LiveWissensMaxDateienProLauf == 5000, "LIVE_WISSEN_FILE_LIMIT");
Assert(defaults.LiveWissensMaxDateiBytes == 512 * 1024, "LIVE_WISSEN_FILE_BYTES");
Assert(defaults.LiveWissensMaxGesamtBytesProLauf == 64L * 1024 * 1024, "LIVE_WISSEN_TOTAL_BYTES");
Assert(CdpBackblazeConfigurator.GlobalConfigName == "AIO_V3_BACKBLAZE_CONFIG", "BACKBLAZE_GLOBAL_NAME");
Assert(CdpWebDashboardConfigurator.CloudStorageKey == "aio-v3:cloud-control:v1", "WEB_DASHBOARD_CLOUD_STORAGE_KEY");
Assert(CdpWebDashboardConfigurator.ControlStorageKey == "aio-v3:control-plane-config:v1", "WEB_DASHBOARD_CONTROL_STORAGE_KEY");
Assert(GitArbeitskopie.WissensbasisPfad == "v5/wissensbasis", "WISSENSWAECHTER_SCOPE_PATH");
Assert(GitArbeitskopie.DatenbankPfad == "v5/wissensbasis/datenbank", "WISSENSWAECHTER_DATABASE_PATH");
Assert(GitArbeitskopie.LiveWissenPfad == "v5/wissensbasis/live", "LIVE_WISSEN_GITHUB_PATH");
Assert(GitArbeitskopie.BasisBranch == "main", "WISSENSWAECHTER_BASIS_BRANCH_MAIN");
Assert(GitArbeitskopie.WissensBranch == "v5/wissenswaechter-automatisch", "WISSENSWAECHTER_DEDICATED_BRANCH");
Assert(GitArbeitskopie.WissensBranch != GitArbeitskopie.BasisBranch, "WISSENSWAECHTER_MUST_NOT_PUSH_MAIN");
Assert(GitArbeitskopie.PushZielRef == "HEAD:v5/wissenswaechter-automatisch", "WISSENSWAECHTER_PUSH_REF");
Assert(GitArbeitskopie.SyncStrategie == "KNOWLEDGE_ONLY_NO_MAIN_MERGE", "WISSENSWAECHTER_SYNC_STRATEGY");
Assert(!GitArbeitskopie.IntegriertBasisVorPush, "WISSENSWAECHTER_MUST_NOT_MERGE_MAIN");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/quellen/quellen.json"), "KNOWLEDGE_READ_ALLOWED");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/fakten/adventure-land-kern.json"), "KNOWLEDGE_WRITE_ALLOWED");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/datenbank/quellenstatus.json"), "DATABASE_WITHIN_SCOPE_ALLOWED");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5\\wissensbasis\\fragen\\offene-fragen.json"), "WINDOWS_SCOPE_PATH_ALLOWED");
Assert(!GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/dokumentation/V5-MASTER-ROADMAP.md"), "ROADMAP_OUTSIDE_SCOPE_BLOCKED");
Assert(!GitArbeitskopie.IstErlaubterWissensbasisPfad("ops/windows-bridge/MainWindow.xaml"), "OPS_OUTSIDE_SCOPE_BLOCKED");
Assert(!GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/../dokumentation/test.md"), "SCOPE_TRAVERSAL_BLOCKED");
var rotationsBasis = DateTimeOffset.FromUnixTimeSeconds(0);
var suchfenster0 = WebQuellenEntdecker.WaehleRotierendeSuchanfragen(rotationsBasis, 4);
var suchfenster1 = WebQuellenEntdecker.WaehleRotierendeSuchanfragen(rotationsBasis.AddHours(1), 4);
var suchfenster10 = WebQuellenEntdecker.WaehleRotierendeSuchanfragen(rotationsBasis.AddHours(WebQuellenEntdecker.Suchanfragen.Length), 4);
Assert(suchfenster0.Count == 4, "KNOWLEDGE_DISCOVERY_ROTATION_WINDOW_SIZE");
Assert(suchfenster0.Distinct(StringComparer.Ordinal).Count() == 4, "KNOWLEDGE_DISCOVERY_ROTATION_NO_DUPLICATES");
Assert(suchfenster1[0] == suchfenster0[1], "KNOWLEDGE_DISCOVERY_ROTATES_HOURLY");
Assert(suchfenster10.SequenceEqual(suchfenster0), "KNOWLEDGE_DISCOVERY_ROTATION_WRAP");

Assert(WebQuellenEntdecker.BestimmeVertrauensklasse("https://adventure.land/allnotes") == "OFFIZIELL", "OFFICIAL_SITE_CLASSIFIED");
Assert(WebQuellenEntdecker.BestimmeVertrauensklasse("https://github.com/kaansoral/adventureland_mongodb") == "OFFIZIELL", "OFFICIAL_REPO_CLASSIFIED");
Assert(WebQuellenEntdecker.BestimmeVertrauensklasse("https://github.com/example/adventure-land-bot") == "COMMUNITY", "COMMUNITY_REPO_CLASSIFIED");
Assert(WebQuellenEntdecker.IstOffizielleAdventureLandAdresse("https://adventure.land/allnotes"), "ADVENTURE_LAND_OFFICIAL_ADDRESS");
Assert(WebQuellenEntdecker.IstOffizielleAdventureLandAdresse("https://store.steampowered.com/app/777150/Adventure_Land__The_Code_MMORPG/"), "STEAM_777150_OFFICIAL_ADDRESS");
Assert(WebQuellenEntdecker.HatDirektenAdventureLandSpielbezug("Adventure Land - The Code MMORPG"), "CANONICAL_GAME_NAME_RELEVANT");
Assert(WebQuellenEntdecker.HatDirektenAdventureLandSpielbezug("Community tools for https://adventure.land and its MMORPG"), "OFFICIAL_DOMAIN_REFERENCE_RELEVANT");
Assert(!WebQuellenEntdecker.HatDirektenAdventureLandSpielbezug("Adventure Land amusement park family tickets"), "UNRELATED_ADVENTURE_LAND_REJECTED");
Assert(!WebQuellenEntdecker.HatAusreichendenAdventureLandHinweis("https://adventure.com/", "Adventure.com | Travel Media Website of the Year", ""), "TRAVEL_RESULT_REJECTED");
Assert(!WebQuellenEntdecker.HatAusreichendenAdventureLandHinweis("https://adventure-shop.at/", "Adventure Shop", ""), "ADVENTURE_SHOP_REJECTED");
Assert(!WebQuellenEntdecker.HatAusreichendenAdventureLandHinweis("https://de.wikipedia.org/wiki/Adventure", "Adventure – Wikipedia", ""), "GENERIC_ADVENTURE_REJECTED");
Assert(WebQuellenEntdecker.HatAusreichendenAdventureLandHinweis("https://github.com/example/adventure-land-bot", "example/adventure-land-bot", ""), "GITHUB_ADVENTURE_LAND_PREFILTER_ALLOWED");
Assert(!WebQuellenEntdecker.IstGueltigeWebAdresse("http://127.0.0.1:9222/internal"), "LOOPBACK_WEB_RESULT_REJECTED");
Assert(!WebQuellenEntdecker.IstGueltigeWebAdresse("http://192.168.1.20/private"), "PRIVATE_IPV4_WEB_RESULT_REJECTED");

Assert(LiveWissensImportDienst.IstSichererRelativerPfad("monster/frog.json"), "LIVE_RELATIVE_PATH_ALLOWED");
Assert(!LiveWissensImportDienst.IstSichererRelativerPfad("../secret.json"), "LIVE_RELATIVE_TRAVERSAL_BLOCKED");
Assert(!LiveWissensImportDienst.IstSichererRelativerPfad("monster/frog.txt"), "LIVE_RELATIVE_NON_JSON_BLOCKED");
Assert(!LiveWissensImportDienst.IstSichererRelativerPfad("/monster/frog.json"), "LIVE_RELATIVE_ROOTED_BLOCKED");

var liveNow = DateTimeOffset.UtcNow;
var gueltigerLiveFakt = JsonSerializer.Serialize(new Dictionary<string, object?>
{
    ["schemaVersion"] = 1,
    ["spiel"] = LiveWissensImportDienst.KanonischerSpielname,
    ["kennung"] = "monster.frog.spawn",
    ["domaene"] = "MONSTER",
    ["status"] = "LIVE_VERIFIZIERT",
    ["beobachtetAm"] = liveNow.AddSeconds(-2).ToString("O"),
    ["verifiziertAm"] = liveNow.AddSeconds(-1).ToString("O"),
    ["quelle"] = new Dictionary<string, object?>
    {
        ["art"] = "LIVE_SPIEL",
        ["methode"] = "reconciled-world-observation"
    },
    ["wert"] = new Dictionary<string, object?> { ["map"] = "main" }
});
LiveWissensImportDienst.ValidiereLiveFaktJson(Encoding.UTF8.GetBytes(gueltigerLiveFakt));

var falschesSpiel = gueltigerLiveFakt.Replace(
    LiveWissensImportDienst.KanonischerSpielname,
    "Anderes Spiel",
    StringComparison.Ordinal);
ExpectInvalidLiveFakt(falschesSpiel, "LIVE_FAKT_FALSCHES_SPIEL");

var nichtVerifiziert = gueltigerLiveFakt.Replace(
    "\"LIVE_VERIFIZIERT\"",
    "\"UNBESTAETIGT\"",
    StringComparison.Ordinal);
ExpectInvalidLiveFakt(nichtVerifiziert, "LIVE_FAKT_NICHT_VERIFIZIERT");

var mitSecret = JsonSerializer.Serialize(new Dictionary<string, object?>
{
    ["schemaVersion"] = 1,
    ["spiel"] = LiveWissensImportDienst.KanonischerSpielname,
    ["kennung"] = "server.test",
    ["domaene"] = "SERVER",
    ["status"] = "LIVE_VERIFIZIERT",
    ["beobachtetAm"] = liveNow.AddSeconds(-2).ToString("O"),
    ["verifiziertAm"] = liveNow.AddSeconds(-1).ToString("O"),
    ["quelle"] = new Dictionary<string, object?> { ["art"] = "LIVE_SPIEL", ["methode"] = "test" },
    ["wert"] = new Dictionary<string, object?> { ["accessToken"] = "darf-nicht-hochgeladen-werden" }
});
ExpectInvalidLiveFakt(mitSecret, "LIVE_WISSEN_GEHEIMNISFELD_VERBOTEN");

if (Directory.Exists(@"D:\"))
{
    var testKennung = Guid.NewGuid().ToString("N");
    var liveRoot = Path.Combine(@"D:\", "AioBotLiveWissenSmoke-" + testKennung);
    var gitRoot = Path.Combine(@"D:\", "AioBotLiveWissenGitSmoke-" + testKennung);

    try
    {
        Directory.CreateDirectory(Path.Combine(liveRoot, "aktuell", "monster"));
        Directory.CreateDirectory(Path.Combine(gitRoot, "v5", "wissensbasis"));

        await File.WriteAllTextAsync(
            Path.Combine(liveRoot, "manifest.json"),
            JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["schemaVersion"] = 1,
                ["format"] = LiveWissensImportDienst.LokalesFormat,
                ["spiel"] = LiveWissensImportDienst.KanonischerSpielname,
                ["aktuellVerzeichnis"] = "aktuell"
            }, jsonOptions));

        var generation = 1L;
        var statusBereit = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["schemaVersion"] = 1,
            ["spiel"] = LiveWissensImportDienst.KanonischerSpielname,
            ["generation"] = generation,
            ["zustand"] = "BEREIT",
            ["aktualisiertAm"] = DateTimeOffset.UtcNow.ToString("O")
        }, jsonOptions);
        await File.WriteAllTextAsync(Path.Combine(liveRoot, "status.json"), statusBereit);

        await File.WriteAllTextAsync(
            Path.Combine(liveRoot, "aktuell", "monster", "frog.json"),
            gueltigerLiveFakt);

        var liveConfig = defaults with
        {
            LiveWissensdatenbankPfad = liveRoot,
            LiveWissensimportAktiv = true
        };
        liveConfig.Validate();

        var importer = new LiveWissensImportDienst(liveConfig, new GitArbeitskopie(gitRoot));
        var import = await importer.ImportiereAsync();

        Assert(import.Zustand == "IMPORTIERT", "LIVE_IMPORT_SUCCESS");
        Assert(import.Generation == generation, "LIVE_IMPORT_GENERATION");
        Assert(import.Dateien == 1, "LIVE_IMPORT_FILE_COUNT");
        Assert(!string.IsNullOrWhiteSpace(import.SnapshotSha256), "LIVE_IMPORT_HASH");
        Assert(File.Exists(Path.Combine(gitRoot, "v5", "wissensbasis", "live", "snapshot", "aktuell", "monster", "frog.json")), "LIVE_IMPORT_MIRRORED_FACT");
        Assert(File.Exists(Path.Combine(gitRoot, "v5", "wissensbasis", "live", "snapshot", "import.json")), "LIVE_IMPORT_METADATA");

        var importJson = await File.ReadAllTextAsync(Path.Combine(gitRoot, "v5", "wissensbasis", "live", "snapshot", "import.json"));
        Assert(!importJson.Contains(liveRoot, StringComparison.OrdinalIgnoreCase), "LIVE_IMPORT_LOCAL_PATH_NOT_LEAKED");

        var vorherigerFakt = await File.ReadAllTextAsync(Path.Combine(gitRoot, "v5", "wissensbasis", "live", "snapshot", "aktuell", "monster", "frog.json"));

        var statusSchreibt = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["schemaVersion"] = 1,
            ["spiel"] = LiveWissensImportDienst.KanonischerSpielname,
            ["generation"] = generation + 1,
            ["zustand"] = "SCHREIBT",
            ["aktualisiertAm"] = DateTimeOffset.UtcNow.ToString("O")
        }, jsonOptions);
        await File.WriteAllTextAsync(Path.Combine(liveRoot, "status.json"), statusSchreibt);
        await File.WriteAllTextAsync(
            Path.Combine(liveRoot, "aktuell", "monster", "frog.json"),
            gueltigerLiveFakt.Replace("monster.frog.spawn", "monster.frog.neu", StringComparison.Ordinal));

        var waehrendSchreiben = await importer.ImportiereAsync();
        Assert(waehrendSchreiben.Zustand == "WARTET_AUF_BOT", "LIVE_IMPORT_WRITING_BLOCKED");

        var nachherFakt = await File.ReadAllTextAsync(Path.Combine(gitRoot, "v5", "wissensbasis", "live", "snapshot", "aktuell", "monster", "frog.json"));
        Assert(nachherFakt == vorherigerFakt, "LIVE_IMPORT_LAST_VALID_SNAPSHOT_PRESERVED");
    }
    finally
    {
        if (Directory.Exists(liveRoot)) Directory.Delete(liveRoot, recursive: true);
        if (Directory.Exists(gitRoot)) Directory.Delete(gitRoot, recursive: true);
    }
}

(defaults with { PreferredBrowser = "Brave" }).Validate();
(defaults with { PreferredBrowser = "Edge" }).Validate();
(defaults with { PreferredBrowser = "Chrome" }).Validate();
ExpectInvalid(defaults with { PreferredBrowser = "Firefox" }, "PREFERRED_BROWSER_INVALID");
ExpectInvalid(defaults with { ManagedCodeSlot = "" }, "MANAGED_CODE_SLOT_INVALID");
(defaults with { CharacterSupervisorEnabled = false, ManagedCodeSlot = "" }).Validate();

var browserOrder = BrowserLauncher.BrowserPreferenceOrder("Brave");
Assert(browserOrder.Count == 3, "BROWSER_ORDER_COUNT");
Assert(browserOrder[0] == "Brave", "BRAVE_FIRST");
Assert(browserOrder.Contains("Edge", StringComparer.OrdinalIgnoreCase), "EDGE_FALLBACK");
Assert(browserOrder.Contains("Chrome", StringComparer.OrdinalIgnoreCase), "CHROME_FALLBACK");

ExpectInvalid(defaults with { CdpEndpoint = "http://192.168.1.10:9222" }, "CDP_ENDPOINT_MUST_BE_LOOPBACK_HTTP");
ExpectInvalid(defaults with { TelemetryIngestUrl = "http://example.test/ingest" }, "TELEMETRY_HTTPS_REQUIRED");
ExpectInvalid(defaults with { SignalControlUrl = "http://example.test/control" }, "SIGNAL_CONTROL_HTTPS_REQUIRED");
ExpectInvalid(defaults with { WebDashboardBaseUrl = "http://example.test" }, "WEB_DASHBOARD_HTTPS_REQUIRED");
ExpectInvalid(defaults with { WebDashboardAccount = "" }, "WEB_DASHBOARD_ACCOUNT_INVALID");
ExpectInvalid(defaults with { BackblazeEndpoint = "http://s3.eu-central-003.backblazeb2.com" }, "BACKBLAZE_ENDPOINT_INVALID");
ExpectInvalid(defaults with { BackblazeEndpoint = "https://s3.eu-central-002.backblazeb2.com" }, "BACKBLAZE_ENDPOINT_INVALID");
ExpectInvalid(defaults with { BackblazeRegion = "EU Central" }, "BACKBLAZE_REGION_INVALID");
ExpectInvalid(defaults with { BackblazeBucket = "AL-aio-bot" }, "BACKBLAZE_BUCKET_INVALID");
ExpectInvalid(defaults with { BackblazeBucket = "b2-aio-bot" }, "BACKBLAZE_BUCKET_INVALID");
ExpectInvalid(defaults with { BackblazePrefix = "v4/../secret" }, "BACKBLAZE_PREFIX_INVALID");
ExpectInvalid(defaults with { BackblazePrefix = "v4" }, "V6_BACKBLAZE_PREFIX_REQUIRED");
ExpectInvalid(defaults with { WissenswaechterIntervallMinuten = 10 }, "WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
ExpectInvalid(defaults with { WissenswaechterIntervallMinuten = 120 }, "WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
ExpectInvalid(defaults with { WissenswaechterMaxQuellenProLauf = 0 }, "WISSENSWAECHTER_QUELLENLIMIT_UNGUELTIG");
ExpectInvalid(defaults with { WissenswaechterMaxKandidaten = 10 }, "WISSENSWAECHTER_KANDIDATENLIMIT_UNGUELTIG");
ExpectInvalid(defaults with { LiveWissensdatenbankPfad = @"C:\AdventureLand-V5\wissensdatenbank" }, "LIVE_WISSEN_MUSS_AUF_D_LIEGEN");
ExpectInvalid(defaults with { LiveWissensdatenbankPfad = @"D:\" }, "LIVE_WISSEN_D_LAUFWERKSWURZEL_VERBOTEN");
ExpectInvalid(defaults with { LiveWissensMaxDateienProLauf = 0 }, "LIVE_WISSEN_DATEILIMIT_UNGUELTIG");
ExpectInvalid(defaults with { LiveWissensMaxDateiBytes = 1024 }, "LIVE_WISSEN_DATEIGROESSE_UNGUELTIG");
ExpectInvalid(defaults with { LiveWissensMaxGesamtBytesProLauf = 1024 }, "LIVE_WISSEN_GESAMTGROESSE_UNGUELTIG");
Assert(BridgeConfig.NormalisiereLiveWissenspfad(@"D:\AdventureLand-V5\wissensdatenbank") == @"D:\AdventureLand-V5\wissensdatenbank", "LIVE_WISSEN_PATH_NORMALIZATION");
var gesundeSsd = new SsdVolumeProbe(true, "D:", true, "SSD", "VOL-TEST", 1_000, 200);
Assert(SsdVolumeGesundheitsPruefer.Bewerte(gesundeSsd).Gesund, "SSD_HEALTHY");
Assert(SsdVolumeGesundheitsPruefer.Bewerte(gesundeSsd with { Vorhanden = false }).Grund == "SSD_VOLUME_FEHLT", "SSD_MISSING_BLOCKED");
Assert(SsdVolumeGesundheitsPruefer.Bewerte(gesundeSsd with { Laufwerk = "C:" }).Grund == "FALSCHES_VOLUME", "SSD_WRONG_VOLUME_BLOCKED");
Assert(SsdVolumeGesundheitsPruefer.Bewerte(gesundeSsd with { FestplattenTyp = "HDD" }).Grund == "MEDIENTYP_NICHT_SSD", "SSD_MEDIA_TYPE_REQUIRED");
Assert(SsdVolumeGesundheitsPruefer.Bewerte(gesundeSsd with { VolumeId = "" }).Grund == "VOLUME_IDENTITAET_FEHLT", "SSD_VOLUME_ID_REQUIRED");
Assert(SsdVolumeGesundheitsPruefer.Bewerte(gesundeSsd with { FreiBytes = 149 }).Grund == "KRITISCHE_SPEICHERRESERVE_UNTERSCHRITTEN", "SSD_RESERVE_REQUIRED");

(defaults with
{
    BackblazeEnabled = true,
    BackblazeEndpoint = "https://s3.eu-central-003.backblazeb2.com",
    BackblazeRegion = "eu-central-003",
    BackblazeBucket = "al-aio-bot",
    BackblazePrefix = "v6"
}).Validate();

using (var archiveSnapshot = JsonDocument.Parse("{}"))
using (var archiveEvents = JsonDocument.Parse("[]"))
{
    var archiveRead = new DebugReadResult(
        archiveSnapshot.RootElement.Clone(),
        archiveEvents.RootElement.Clone(),
        0,
        0,
        0,
        0,
        false,
        "https://adventure.land/");
    var archiveNow = DateTimeOffset.UtcNow;
    Assert(BackblazeV6ArchiveSink.ShouldArchive(archiveRead, null, archiveNow), "V6_BACKBLAZE_INITIAL_SNAPSHOT_ARCHIVED");
    Assert(!BackblazeV6ArchiveSink.ShouldArchive(archiveRead, archiveNow, archiveNow.AddMinutes(1)), "V6_BACKBLAZE_EMPTY_BATCH_SAMPLED");
    Assert(BackblazeV6ArchiveSink.ShouldArchive(archiveRead, archiveNow, archiveNow.AddSeconds(BackblazeV6ArchiveSink.SnapshotArchiveIntervalSeconds + 1)), "V6_BACKBLAZE_PERIODIC_SNAPSHOT_ARCHIVED");
}

using (var archiveSnapshot = JsonDocument.Parse("{}"))
using (var archiveEvents = JsonDocument.Parse("[{\"seq\":1}]"))
{
    var archiveRead = new DebugReadResult(
        archiveSnapshot.RootElement.Clone(),
        archiveEvents.RootElement.Clone(),
        0,
        0,
        1,
        1,
        false,
        "https://adventure.land/");
    var archiveNow = DateTimeOffset.UtcNow;
    Assert(BackblazeV6ArchiveSink.ShouldArchive(archiveRead, archiveNow, archiveNow.AddSeconds(1)), "V6_BACKBLAZE_EVENT_BATCH_ALWAYS_ARCHIVED");
}

Assert(CdpAdventureLandClient.OperationsContextPriority(false, false, null, null, null) == 0, "V5_CONTEXT_INVALID_REJECTED");
Assert(CdpAdventureLandClient.OperationsContextPriority(true, false, null, null, "priest") == 10, "V5_CONTEXT_LEGACY_FALLBACK");
Assert(CdpAdventureLandClient.OperationsContextPriority(true, true, "WORKER", "HEARTBEAT", "priest") == 50, "V5_CONTEXT_WORKER_PRIORITY");
Assert(CdpAdventureLandClient.OperationsContextPriority(true, true, "WAITING_FOR_4_CHARACTERS", "ROSTER", "priest") == 100, "V5_CONTEXT_NONWORKER_PRIORITY");
Assert(CdpAdventureLandClient.OperationsContextPriority(true, true, "RUNNING", "FIFTEEN_MINUTE_NO_WRITE", "merchant") == 200, "V5_CONTEXT_MERCHANT_COORDINATOR_PRIORITY");
Assert(CdpAdventureLandClient.IsEligibleV5CoordinatorContext(
    "merchant", false, "PR20.9_PRODUCTION", "pr20-9-craft-durable-shadow-no-write"),
    "V5_CONTEXT_PR20_LEGACY_MERCHANT_ALLOWED");
Assert(!CdpAdventureLandClient.IsEligibleV5CoordinatorContext(
    "merchant", false, "PR21_MERCHANT_INTEGRATION", "pr21-merchant-integration-live-15m-v1-0-2"),
    "V5_CONTEXT_PR21_FACADE_ONLY_REJECTED");
Assert(CdpAdventureLandClient.IsEligibleV5CoordinatorContext(
    "merchant", true, "PR21_MERCHANT_INTEGRATION", "pr21-merchant-integration-live-15m-v1-0-2"),
    "V5_CONTEXT_PR21_NATIVE_RUNTIME_ACCEPTED");
Assert(!CdpAdventureLandClient.IsEligibleV5CoordinatorContext(
    "ranger", true, "PR21_MERCHANT_INTEGRATION", "pr21-merchant-integration-live-15m-v1-0-2"),
    "V5_CONTEXT_PR21_NON_MERCHANT_REJECTED");
Assert(CdpAdventureLandClient.RequiresNativeV3CoordinatorContext(
    "PR21_MERCHANT_INTEGRATION", "pr21-merchant-integration-live-15m-v1-0-2"),
    "V5_CONTEXT_PR21_NATIVE_RUNTIME_REQUIRED");
Assert(!CdpAdventureLandClient.RequiresNativeV3CoordinatorContext(
    "PR20.9_PRODUCTION", "pr20-9-craft-durable-shadow-no-write"),
    "V5_CONTEXT_PR20_NATIVE_RUNTIME_NOT_REQUIRED");
Assert(
    CdpAdventureLandClient.BuildPr21V3BootstrapUrl()
        == "https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/5dc9d0dfbe303835a82f7b341938aa13ad1626b0/v3/dist/aio-v3.js",
    "V5_CONTEXT_PR21_BOOTSTRAP_URL_PINNED");
Assert(
    CdpAdventureLandClient.Pr21V3BootstrapSha256
        == "1d20f11de456c7a84bff2b0500da004dd4765106b947ddf29947110f079f2a54",
    "V5_CONTEXT_PR21_BOOTSTRAP_SHA256_PINNED");
Assert(CdpAdventureLandClient.Pr21V3BootstrapMaxBytes == 32 * 1024,
    "V5_CONTEXT_PR21_BOOTSTRAP_SIZE_BOUNDED");
Assert(CdpAdventureLandClient.Pr21V3BootstrapPath == "v3/dist/aio-v3.js",
    "V5_CONTEXT_PR21_BOOTSTRAP_PATH_FIXED");
Assert(CdpAdventureLandClient.IsAllowedSameOriginExecutionContext(
    new Uri("https://adventure.land"),
    "https://adventure.land"), "CDP_CONTEXT_DEFAULT_SAME_ORIGIN_ALLOWED");
Assert(CdpAdventureLandClient.IsAllowedSameOriginExecutionContext(
    new Uri("https://adventure.land"),
    "https://adventure.land"), "CDP_CONTEXT_CHILD_SAME_ORIGIN_ALLOWED");
Assert(!CdpAdventureLandClient.IsAllowedSameOriginExecutionContext(
    new Uri("https://adventure.land"),
    "https://evil.example"), "CDP_CONTEXT_CROSS_ORIGIN_REJECTED");
Assert(!CdpAdventureLandClient.IsAllowedSameOriginExecutionContext(
    new Uri("https://adventure.land"),
    "not-a-uri"), "CDP_CONTEXT_INVALID_ORIGIN_REJECTED");
Assert(CdpAdventureLandClient.CdpCommandTimeoutSeconds == 12, "CDP_COMMAND_WATCHDOG_BOUND");
Assert(CdpAdventureLandClient.BridgeFarmerGearDiagnosticsKey == "bridgeFarmerGearContexts", "V5_FARMER_GEAR_DIAGNOSTICS_KEY");
var farmerGearProbe = CdpAdventureLandClient.BuildV5FarmerGearObservationExpression();
foreach (var required in new[] {
    "My_Ranger1", "My_Priest", "My_Mage",
    "character?.items", "character?.slots", "G?.items", "G?.classes",
    "performance_trick", "HOWLER_PLAYING_TRUE",
    "candidates.slice(0, 16)", "items.slice(0, 128)",
    "gameplayWrites: 0", "publicFunctionCalls: 0", "rawWriteCalls: 0",
    "startCalls: 0", "disconnectCalls: 0", "normalRuntimeAllowed: false"
})
    Assert(farmerGearProbe.Contains(required, StringComparison.Ordinal), "V5_FARMER_GEAR_PROBE_REQUIRED_" + required);
foreach (var forbidden in new[] {
    "start_character(", "command_character(", "observe_character(",
    "socket.emit(", "api_call(", "equip(", "unequip(",
    "buy(", "buy_with_gold(", "sell(", "send_item(", "send_gold("
})
    Assert(!farmerGearProbe.Contains(forbidden, StringComparison.Ordinal), "V5_FARMER_GEAR_PROBE_FORBIDDEN_" + forbidden);

Assert(CdpAdventureLandClient.BridgeV5DeploymentDiagnosticsKey == "bridgeV5Deployment", "V5_DEPLOYMENT_DIAGNOSTICS_KEY");
var readInt64 = typeof(CdpAdventureLandClient).GetMethod(
    "ReadInt64",
    System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.NonPublic)
    ?? throw new InvalidOperationException("V5_READ_INT64_REFLECTION_MISSING");
using (var nullNumberDoc = JsonDocument.Parse("""{"value":null,"number":7}"""))
{
    var nullFallback = (long)(readInt64.Invoke(null, [nullNumberDoc.RootElement, "value", -1L])
        ?? throw new InvalidOperationException("V5_READ_INT64_NULL_RESULT"));
    var numberValue = (long)(readInt64.Invoke(null, [nullNumberDoc.RootElement, "number", -1L])
        ?? throw new InvalidOperationException("V5_READ_INT64_NUMBER_RESULT"));
    Assert(nullFallback == -1L, "V5_READ_INT64_NULL_FALLBACK");
    Assert(numberValue == 7L, "V5_READ_INT64_NUMBER_VALUE");
}
using (var v5DiagnosticHttp = new HttpClient())
{
    var v5DiagnosticClient = new CdpAdventureLandClient(v5DiagnosticHttp, defaults);
    v5DiagnosticClient.RecordV5AutonomousTestDeploymentResult(
        new V5AutonomousTestDeploymentResult("DEPLOYED", true, "test-v5", "https://adventure.land/"));
    Assert(v5DiagnosticClient.LastV5DeploymentDiagnostic?.State == "DEPLOYED", "V5_DEPLOYMENT_DIAGNOSTIC_SUCCESS_STATE");
    Assert(v5DiagnosticClient.LastV5DeploymentDiagnostic?.Changed == true, "V5_DEPLOYMENT_DIAGNOSTIC_SUCCESS_CHANGED");
    Assert(v5DiagnosticClient.LastV5DeploymentDiagnostic?.TestId == "test-v5", "V5_DEPLOYMENT_DIAGNOSTIC_SUCCESS_TEST_ID");
    Assert(v5DiagnosticClient.LastV5DeploymentDiagnostic?.Error is null, "V5_DEPLOYMENT_DIAGNOSTIC_SUCCESS_NO_ERROR");

    v5DiagnosticClient.RecordV5AutonomousTestDeploymentFailure(
        new InvalidOperationException(new string('x', 500)));
    Assert(v5DiagnosticClient.LastV5DeploymentDiagnostic?.State == "ERROR", "V5_DEPLOYMENT_DIAGNOSTIC_ERROR_STATE");
    Assert(v5DiagnosticClient.LastV5DeploymentDiagnostic?.Changed == false, "V5_DEPLOYMENT_DIAGNOSTIC_ERROR_NO_CHANGE");
    Assert((v5DiagnosticClient.LastV5DeploymentDiagnostic?.Error?.Length ?? 0) <= 320, "V5_DEPLOYMENT_DIAGNOSTIC_ERROR_BOUNDED");
}


var v5AutoManifestJson = """
{
  "schemaVersion": 1,
  "enabled": true,
  "repository": "Riflex91/Riflex91-Repo",
  "branch": "main",
  "gate": "PR20.6_MLUCK",
  "testId": "pr20-6-mluck-autonomous-live-5m",
  "controllerVersion": "1.0.0",
  "coordinatorClass": "merchant",
  "workerDistribution": "PACKAGE_OWNED_COMMAND_CHARACTER",
  "sourceCommit": "d0823081da6f07a8a60002b1b809c24916555521",
  "packagePath": "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
  "packageSha256": "26acb41bb17ff1da0719b0a4604621a5fa4bcd87f5e78b3cc647bf112a25753b",
  "maxPackageBytes": 131072,
  "expectedGlobal": "V5PR206MluckTest",
  "normalRuntimeAllowed": false
}
""";
var v5AutoManifest = CdpAdventureLandClient.ParseAndValidateV5AutonomousTestManifest(v5AutoManifestJson);
Assert(v5AutoManifest.TestId == "pr20-6-mluck-autonomous-live-5m", "V5_AUTO_MANIFEST_TEST_ID");
Assert(v5AutoManifest.CoordinatorClass == "merchant", "V5_AUTO_MANIFEST_MERCHANT_ONLY");
Assert(v5AutoManifest.WorkerDistribution == "PACKAGE_OWNED_COMMAND_CHARACTER", "V5_AUTO_MANIFEST_WORKER_DISTRIBUTION");
Assert(!v5AutoManifest.NormalRuntimeAllowed, "V5_AUTO_MANIFEST_NORMAL_RUNTIME_BLOCKED");

Assert(CdpAdventureLandClient.BuildV5AutonomousTestPackageUrl(v5AutoManifest)
    == "https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/d0823081da6f07a8a60002b1b809c24916555521/v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
    "V5_AUTO_MANIFEST_IMMUTABLE_PACKAGE_URL");

var v5WorkerManifestJson = """
{
  "schemaVersion": 1,
  "enabled": true,
  "repository": "Riflex91/Riflex91-Repo",
  "branch": "main",
  "gate": "PR20.6_MLUCK",
  "testId": "pr20-6-mluck-autonomous-live-5m",
  "controllerVersion": "1.0.7",
  "coordinatorClass": "merchant",
  "workerDistribution": "PACKAGE_OWNED_COMMAND_CHARACTER",
  "sourceCommit": "d0823081da6f07a8a60002b1b809c24916555521",
  "packagePath": "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
  "packageSha256": "26acb41bb17ff1da0719b0a4604621a5fa4bcd87f5e78b3cc647bf112a25753b",
  "maxPackageBytes": 131072,
  "expectedGlobal": "V5PR206MluckTest",
  "normalRuntimeAllowed": false,
  "workerVersion": "1.0.0",
  "workerPackagePath": "v5/werkzeuge/pr20-6-mluck-worker.js",
  "workerPackageSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "workerExpectedGlobal": "V5PR206MluckWorker",
  "workerTargets": ["My_Ranger1:ranger", "My_Priest:priest", "My_Mage:mage"]
}
""";
var v5WorkerManifest = CdpAdventureLandClient.ParseAndValidateV5AutonomousTestManifest(v5WorkerManifestJson);
Assert(CdpAdventureLandClient.HasConfiguredV5WorkerPackage(v5WorkerManifest), "V5_WORKER_PACKAGE_CONFIGURED");
Assert(CdpAdventureLandClient.IsConfiguredV5WorkerTarget(v5WorkerManifest, "My_Ranger1", "ranger"), "V5_WORKER_RANGER_EXACT");
Assert(CdpAdventureLandClient.IsConfiguredV5WorkerTarget(v5WorkerManifest, "My_Priest", "priest"), "V5_WORKER_PRIEST_EXACT");
Assert(CdpAdventureLandClient.IsConfiguredV5WorkerTarget(v5WorkerManifest, "My_Mage", "mage"), "V5_WORKER_MAGE_EXACT");
Assert(!CdpAdventureLandClient.IsConfiguredV5WorkerTarget(v5WorkerManifest, "My_Ranger2", "ranger"), "V5_WORKER_OTHER_RANGER_REJECTED");
Assert(!CdpAdventureLandClient.IsConfiguredV5WorkerTarget(v5WorkerManifest, "My_Ranger1", "mage"), "V5_WORKER_CLASS_MISMATCH_REJECTED");
Assert(CdpAdventureLandClient.BuildV5AutonomousTestWorkerPackageUrl(v5WorkerManifest)
    == "https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/d0823081da6f07a8a60002b1b809c24916555521/v5/werkzeuge/pr20-6-mluck-worker.js",
    "V5_WORKER_IMMUTABLE_PACKAGE_URL");
Assert(CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", null, null,
    false, long.MaxValue, long.MaxValue, true, true, -1),
    "V5_AUTO_DEPLOY_WHEN_NO_TEST");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.2",
    true, 0, 0, false, false, 0),
    "V5_AUTO_NO_RELOAD_SAME_VERSION");
Assert(CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    true, 0, 0, false, false, -1),
    "V5_AUTO_SAFE_SAME_TEST_UPGRADE_AFTER_TERMINAL_ZERO_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.1", v5AutoManifest.TestId, "1.0.2",
    true, 0, 0, false, false, 0),
    "V5_AUTO_BLOCKS_SAME_TEST_DOWNGRADE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    false, 0, 0, false, false, 0),
    "V5_AUTO_BLOCKS_NONTERMINAL_SAME_TEST_UPGRADE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    true, 1, 0, false, false, 0),
    "V5_AUTO_BLOCKS_SAME_TEST_UPGRADE_AFTER_GAMEPLAY_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    true, 0, 1, false, false, 0),
    "V5_AUTO_BLOCKS_SAME_TEST_UPGRADE_AFTER_RAW_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    true, 0, 0, true, false, 0),
    "V5_AUTO_BLOCKS_SAME_TEST_UPGRADE_WITH_RETRY_DRIFT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    true, 0, 0, false, true, 0),
    "V5_AUTO_BLOCKS_SAME_TEST_UPGRADE_WITH_DURABLE_INTENT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", v5AutoManifest.TestId, "1.0.1",
    true, 0, 0, false, false, 1),
    "V5_AUTO_BLOCKS_SAME_TEST_UPGRADE_WITH_OPEN_INTENT");
Assert(CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", "pr20-5-merchant-stability-autonomous-4char", "1.0.0",
    true, 3, 0, false, true, 1),
    "V5_AUTO_ADVANCE_AFTER_OTHER_TERMINAL");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    v5AutoManifest.TestId, "1.0.2", "other-nonterminal", "1.0.0",
    false, 0, 0, false, false, 0),
    "V5_AUTO_BLOCK_OTHER_NONTERMINAL");

Assert(CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-bridge-handshake-probe-v1", "1.0.1",
    "pr20-8-bridge-handshake-probe-v1", "1.0.0",
    false, 0, 0, false, true, 0),
    "V5_PR208_BRIDGE_PROBE_EXACT_TERMINALIZATION_ALLOWED");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-bridge-handshake-probe-v1", "1.0.1",
    "pr20-8-bridge-handshake-probe-v1", "1.0.0",
    false, 1, 0, false, true, 0),
    "V5_PR208_BRIDGE_PROBE_TERMINALIZATION_BLOCKS_GAMEPLAY_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-bridge-handshake-probe-v1", "1.0.1",
    "pr20-8-bridge-handshake-probe-v1", "1.0.0",
    false, 0, 1, false, true, 0),
    "V5_PR208_BRIDGE_PROBE_TERMINALIZATION_BLOCKS_RAW_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-bridge-handshake-probe-v1", "1.0.1",
    "pr20-8-bridge-handshake-probe-v1", "1.0.0",
    false, 0, 0, true, true, 0),
    "V5_PR208_BRIDGE_PROBE_TERMINALIZATION_BLOCKS_RETRY_DRIFT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-bridge-handshake-probe-v1", "1.0.1",
    "pr20-8-bridge-handshake-probe-v1", "1.0.0",
    false, 0, 0, false, true, 1),
    "V5_PR208_BRIDGE_PROBE_TERMINALIZATION_BLOCKS_OPEN_INTENT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "other-test", "1.0.1",
    "pr20-8-bridge-handshake-probe-v1", "1.0.0",
    false, 0, 0, false, true, 0),
    "V5_PR208_BRIDGE_PROBE_TERMINALIZATION_REJECTS_OTHER_DESIRED_TEST");

Assert(CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 0, 0, false, true, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_EXACT_ZERO_WRITE_ALLOWED");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    false, 0, 0, false, true, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_REQUIRES_TERMINAL");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 1, 0, false, true, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_BLOCKS_GAMEPLAY_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 0, 1, false, true, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_BLOCKS_RAW_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 0, 0, true, true, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_BLOCKS_RETRY_DRIFT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 0, 0, false, true, 1),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_BLOCKS_OPEN_INTENT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 0, 0, false, true, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_REJECTS_OTHER_TARGET_VERSION");
Assert(!CdpAdventureLandClient.IsSafePr208CompoundLive5mPerformanceRecovery(
    "other-test", "1.0.1",
    "pr20-8-compound-live-5m", "1.0.0",
    true, 0, 0, false, 0),
    "V5_PR208_COMPOUND_5M_PERFORMANCE_RECOVERY_REJECTS_OTHER_DESIRED_TEST");

Assert(CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 0, false, true, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_EXACT_TERMINAL_ALLOWED");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    false, 0, 0, false, true, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_REQUIRES_TERMINAL");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 1, 0, false, true, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_BLOCKS_GAMEPLAY_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 1, false, true, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_BLOCKS_RAW_WRITE");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 0, true, true, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_BLOCKS_RETRY_DRIFT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 0, false, true, 0),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_REQUIRES_ONE_SOURCE_INTENT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 0, false, true, 2),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_BLOCKS_EXTRA_INTENT");
Assert(!CdpAdventureLandClient.ShouldDeployV5AutonomousTest(
    "pr20-8-compound-live-5m", "1.0.3",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 0, false, true, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_REJECTS_OTHER_TARGET_VERSION");
Assert(!CdpAdventureLandClient.IsSafePr208CompoundLive5mNotificationIdentityRecovery(
    "other-test", "1.0.2",
    "pr20-8-compound-live-5m", "1.0.1",
    true, 0, 0, false, 1),
    "V5_PR208_COMPOUND_5M_NOTIFICATION_IDENTITY_RECOVERY_REJECTS_OTHER_DESIRED_TEST");

Assert(CdpAdventureLandClient.ShouldContinuePr208CandidateReadonlyContextConvergence(
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.3",
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.3"),
    "V5_PR208_CANDIDATE_V103_CONTINUES_CONTEXT_CONVERGENCE");
Assert(CdpAdventureLandClient.ShouldContinuePr208CandidateReadonlyContextConvergence(
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.4",
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.4"),
    "V5_PR208_CANDIDATE_V104_CONTINUES_CONTEXT_CONVERGENCE");
Assert(!CdpAdventureLandClient.ShouldContinuePr208CandidateReadonlyContextConvergence(
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.2",
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.2"),
    "V5_PR208_CANDIDATE_V102_DOES_NOT_BROADEN_CONTEXT_CONVERGENCE");
Assert(!CdpAdventureLandClient.ShouldContinuePr208CandidateReadonlyContextConvergence(
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.3",
    "pr20-8-wertmutation-live-candidate-readonly", "1.0.2"),
    "V5_PR208_CANDIDATE_V103_REQUIRES_EXACT_CURRENT_VERSION");
Assert(!CdpAdventureLandClient.ShouldContinuePr208CandidateReadonlyContextConvergence(
    "pr20-8-upgrade-productive-one-write-live", "1.0.3",
    "pr20-8-upgrade-productive-one-write-live", "1.0.3"),
    "V5_PR208_CANDIDATE_CONTEXT_CONVERGENCE_REJECTS_MUTATING_TEST");

Assert(CdpAdventureLandClient.IsStrictlyNewerControllerVersion("1.0.2", "1.0.1"), "V5_VERSION_STRICTLY_NEWER");
Assert(!CdpAdventureLandClient.IsStrictlyNewerControllerVersion("1.0.1", "1.0.1"), "V5_VERSION_EQUAL_NOT_NEWER");
Assert(!CdpAdventureLandClient.IsStrictlyNewerControllerVersion("1.0.1", "1.0.2"), "V5_VERSION_DOWNGRADE_REJECTED");
Assert(!CdpAdventureLandClient.IsStrictlyNewerControllerVersion("garbage", "1.0.1"), "V5_VERSION_INVALID_REJECTED");

var coordinatorProbe = CdpAdventureLandClient.BuildV5CoordinatorProbeExpression("V5PR207AccountWeaponCandidateDiscovery");
Assert(coordinatorProbe.Contains("V5PR207AccountWeaponCandidateDiscovery", StringComparison.Ordinal), "V5_COORDINATOR_PROBE_EXPECTED_GLOBAL");
Assert(!coordinatorProbe.Contains("V5PR206MluckTest", StringComparison.Ordinal), "V5_COORDINATOR_PROBE_NOT_HARDCODED_MLUCK");

Assert(CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.0",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    currentTerminal: false,
    currentGameplayWrites: 0,
    currentRawWriteCalls: 0,
    currentSameIntentRetry: false,
    currentIntentCount: 0), "V5_LEGACY_ROSTER_RECOVERY_SAFE_PRE_SEND");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.1",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    false, 0, 0, false, 0), "V5_LEGACY_ROSTER_RECOVERY_ONLY_100");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.0",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    false, 1, 0, false, 0), "V5_LEGACY_ROSTER_RECOVERY_BLOCKS_GAMEPLAY_WRITE");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.0",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    false, 0, 1, false, 0), "V5_LEGACY_ROSTER_RECOVERY_BLOCKS_RAW_WRITE");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.0",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    false, 0, 0, true, 0), "V5_LEGACY_ROSTER_RECOVERY_BLOCKS_RETRY_DRIFT");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.0",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    false, 0, 0, false, 1), "V5_LEGACY_ROSTER_RECOVERY_BLOCKS_OPEN_INTENT");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "pr20-6-mluck-autonomous-live-5m",
    "1.0.0",
    "RUNNING",
    "LIVE_SEND",
    false, 0, 0, false, 0), "V5_LEGACY_ROSTER_RECOVERY_ROSTER_PHASE_ONLY");
Assert(!CdpAdventureLandClient.ShouldAttemptLegacyPr206RosterRecovery(
    "other-test",
    "1.0.0",
    "WAITING_FOR_4_CHARACTERS",
    "ROSTER",
    false, 0, 0, false, 0), "V5_LEGACY_ROSTER_RECOVERY_EXACT_TEST_ONLY");

ExpectInvalid(defaults with { SupabaseStatusIntervalSeconds = 59 }, "SUPABASE_STATUS_INTERVAL_MUST_BE_60_SECONDS");

Assert(TelemetryBridgeService.ComputeBackoffSeconds(5, 300, 1) == 5, "BACKOFF_1");
Assert(TelemetryBridgeService.ComputeBackoffSeconds(5, 300, 2) == 10, "BACKOFF_2");
Assert(TelemetryBridgeService.ComputeBackoffSeconds(5, 300, 20) == 300, "BACKOFF_CAP");
Assert(TelemetryBridgeService.ShouldCatchUp(100, 100, false, 1), "CATCHUP_FULL_BATCH");
Assert(TelemetryBridgeService.ShouldCatchUp(10, 100, true, 1), "CATCHUP_HAS_MORE");
Assert(!TelemetryBridgeService.ShouldCatchUp(10, 100, false, 1), "CATCHUP_STOPS_WHEN_DRAINED");
Assert(!TelemetryBridgeService.ShouldCatchUp(100, 100, true, TelemetryBridgeService.MaxCatchUpBatches), "CATCHUP_BATCH_CAP");

var diagnosticNow = DateTimeOffset.UtcNow;
Assert(TelemetryBridgeService.ShouldIncludeDeepDiagnostics(null, diagnosticNow), "DIAGNOSTICS_INITIAL");
Assert(!TelemetryBridgeService.ShouldIncludeDeepDiagnostics(diagnosticNow, diagnosticNow.AddSeconds(10)), "DIAGNOSTICS_THROTTLED");
Assert(TelemetryBridgeService.ShouldIncludeDeepDiagnostics(
    diagnosticNow,
    diagnosticNow.AddSeconds(TelemetryBridgeService.DeepDiagnosticsIntervalSeconds)), "DIAGNOSTICS_INTERVAL");
Assert(TelemetryBridgeService.EventLimitForRead(100, false) == 100, "NORMAL_EVENT_LIMIT");
Assert(TelemetryBridgeService.EventLimitForRead(1000, false) == 200, "NORMAL_EVENT_LIMIT_HARD_CAP_200");
Assert(TelemetryBridgeService.EventLimitForRead(100, true) == TelemetryBridgeService.DeepDiagnosticEventLimit, "DIAGNOSTIC_EVENT_LIMIT");
Assert(TelemetryBridgeService.EventLimitForRead(20, true) == 20, "DIAGNOSTIC_SMALL_EVENT_LIMIT");
Assert(TelemetryBridgeService.ShouldPublishConnecting(null), "BRIDGE_CONNECTING_SHOWN_BEFORE_FIRST_SUCCESS");
Assert(!TelemetryBridgeService.ShouldPublishConnecting(DateTimeOffset.UtcNow), "BRIDGE_HEALTHY_STATE_NOT_RESET_BETWEEN_POLLS");
Assert(!TelemetryBridgeService.LiveTransportIncludesDeepDiagnostics,
    "V6_LIVE_TRANSPORT_MUST_USE_SHALLOW_SNAPSHOT");
Assert(typeof(TelemetryBridgeService).GetMethod(
    "CaptureDeepDiagnosticsBestEffortAsync",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance) is not null,
    "V6_DEEP_DIAGNOSTICS_MUST_BE_SEPARATE_BEST_EFFORT_PATH");
Assert(SupabaseTelemetrySink.IsWithinPayloadBudget(SupabaseTelemetrySink.MaxPayloadBytes), "PAYLOAD_BUDGET_BOUNDARY");
Assert(!SupabaseTelemetrySink.IsWithinPayloadBudget(SupabaseTelemetrySink.MaxPayloadBytes + 1), "PAYLOAD_BUDGET_REJECTS_OVERSIZE");

var compactEventsMethod = typeof(SupabaseTelemetrySink).GetMethod(
    "CreateBudgetFallbackEvents",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(compactEventsMethod is not null, "V6_SUPABASE_EVENT_COMPACTION_HELPER");
var strictCompactEventsMethod = typeof(SupabaseTelemetrySink).GetMethod(
    "CreateStrictBudgetFallbackEvents",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(strictCompactEventsMethod is not null, "V6_SUPABASE_STRICT_EVENT_COMPACTION_HELPER");
Assert(SupabaseTelemetrySink.StrictEventStringMaxChars == 32, "V6_SUPABASE_STRICT_EVENT_STRING_CAP");

var hugeEventRows = Enumerable.Range(1, 200)
    .Select(seq => new Dictionary<string, object?>
    {
        ["seq"] = seq,
        ["ts"] = "2026-09-29T19:00:00.000Z",
        ["severity"] = seq % 10 == 0 ? "ERROR" : "INFO",
        ["component"] = "combat",
        ["event"] = seq % 10 == 0 ? "NO_PROGRESS" : "HEARTBEAT",
        ["reason"] = seq % 10 == 0 ? new string('r', 2000) : null,
        ["character"] = "My_Ranger1",
        ["dedupeKey"] = "combat:" + seq,
        ["data"] = new Dictionary<string, object?>
        {
            ["component"] = "combat",
            ["character"] = "My_Ranger1",
            ["huge"] = new string('x', 24_000)
        }
    })
    .ToArray();
using (var hugeEventsDocument = JsonDocument.Parse(JsonSerializer.Serialize(hugeEventRows)))
{
    var compactEvents = (IReadOnlyList<object>)compactEventsMethod!.Invoke(
        null,
        [hugeEventsDocument.RootElement])!;
    Assert(compactEvents.Count == 200, "V6_SUPABASE_COMPACTION_PRESERVES_EVENT_COUNT");

    var compactBytes = JsonSerializer.SerializeToUtf8Bytes(compactEvents);
    Assert(compactBytes.Length < SupabaseTelemetrySink.MaxPayloadBytes,
        "V6_SUPABASE_COMPACT_EVENTS_FIT_BUDGET");

    using var compactDocument = JsonDocument.Parse(compactBytes);
    var first = compactDocument.RootElement[0];
    var tenth = compactDocument.RootElement[9];
    Assert(first.GetProperty("seq").GetInt64() == 1, "V6_SUPABASE_COMPACTION_PRESERVES_SEQ");
    Assert(tenth.GetProperty("seq").GetInt64() == 10, "V6_SUPABASE_COMPACTION_PRESERVES_SIGNAL_SEQ");
    Assert(tenth.GetProperty("severity").GetString() == "ERROR", "V6_SUPABASE_COMPACTION_PRESERVES_SEVERITY");
    Assert(tenth.GetProperty("event").GetString() == "NO_PROGRESS", "V6_SUPABASE_COMPACTION_PRESERVES_EVENT_TYPE");
    Assert(tenth.GetProperty("data").GetProperty("character").GetString() == "My_Ranger1",
        "V6_SUPABASE_COMPACTION_PRESERVES_SIGNAL_CHARACTER");
    Assert(!compactDocument.RootElement.ToString().Contains(new string('x', 128), StringComparison.Ordinal),
        "V6_SUPABASE_COMPACTION_DROPS_LARGE_DETAIL_FIELDS");
}

var worstEscaped = new string('\u0001', 700);
var adversarialEventRows = Enumerable.Range(1, 200)
    .Select(seq => new Dictionary<string, object?>
    {
        ["seq"] = seq,
        ["ts"] = worstEscaped,
        ["at"] = 1_790_709_000_000L + seq,
        ["severity"] = worstEscaped,
        ["component"] = worstEscaped,
        ["event"] = worstEscaped,
        ["type"] = worstEscaped,
        ["reason"] = worstEscaped,
        ["character"] = worstEscaped,
        ["dedupeKey"] = worstEscaped,
        ["data"] = new Dictionary<string, object?>
        {
            ["component"] = worstEscaped,
            ["character"] = worstEscaped,
            ["huge"] = new string('x', 24_000)
        }
    })
    .ToArray();
using (var adversarialEventsDocument = JsonDocument.Parse(JsonSerializer.Serialize(adversarialEventRows)))
{
    var strictEvents = (IReadOnlyList<object>)strictCompactEventsMethod!.Invoke(
        null,
        [adversarialEventsDocument.RootElement])!;
    Assert(strictEvents.Count == 200, "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_EVENT_COUNT");

    var strictBytes = JsonSerializer.SerializeToUtf8Bytes(strictEvents);
    Assert(strictBytes.Length < SupabaseTelemetrySink.MaxPayloadBytes - (32 * 1024),
        "V6_SUPABASE_STRICT_COMPACTION_LEAVES_ENVELOPE_HEADROOM");

    using var strictDocument = JsonDocument.Parse(strictBytes);
    var strictFirst = strictDocument.RootElement[0];
    Assert(strictFirst.GetProperty("seq").GetInt64() == 1, "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_SEQ");
    Assert(strictFirst.TryGetProperty("ts", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_TS_FIELD");
    Assert(strictFirst.TryGetProperty("severity", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_SEVERITY_FIELD");
    Assert(strictFirst.TryGetProperty("component", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_COMPONENT_FIELD");
    Assert(strictFirst.TryGetProperty("event", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_EVENT_FIELD");
    Assert(strictFirst.TryGetProperty("type", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_TYPE_FIELD");
    Assert(strictFirst.TryGetProperty("reason", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_REASON_FIELD");
    Assert(strictFirst.TryGetProperty("character", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_CHARACTER_FIELD");
    Assert(strictFirst.TryGetProperty("dedupeKey", out _), "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_DEDUPE_FIELD");
    Assert(strictFirst.GetProperty("data").TryGetProperty("component", out _),
        "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_DATA_COMPONENT_FIELD");
    Assert(strictFirst.GetProperty("data").TryGetProperty("character", out _),
        "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_DATA_CHARACTER_FIELD");
}

var sharedDedupePrefix = new string('d', 96);
var strictSignalRows = new[]
{
    new Dictionary<string, object?>
    {
        ["seq"] = 1,
        ["severity"] = "WARN",
        ["event"] = "HEARTBEAT",
        ["reason"] = new string('x', 80) + "NO_PROGRESS",
        ["dedupeKey"] = sharedDedupePrefix + ":alpha"
    },
    new Dictionary<string, object?>
    {
        ["seq"] = 2,
        ["severity"] = "WARN",
        ["event"] = "HEARTBEAT",
        ["reason"] = new string('x', 80) + "NO_PROGRESS",
        ["dedupeKey"] = sharedDedupePrefix + ":beta"
    }
};
using (var strictSignalsDocument = JsonDocument.Parse(JsonSerializer.Serialize(strictSignalRows)))
{
    var strictSignals = (IReadOnlyList<object>)strictCompactEventsMethod!.Invoke(
        null,
        [strictSignalsDocument.RootElement])!;
    using var strictSignalsJson = JsonDocument.Parse(JsonSerializer.Serialize(strictSignals));

    var firstStrictSignal = strictSignalsJson.RootElement[0];
    var secondStrictSignal = strictSignalsJson.RootElement[1];
    Assert(firstStrictSignal.GetProperty("reason").GetString() == "NO_PROGRESS",
        "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_WARNING_MARKER");
    Assert(firstStrictSignal.GetProperty("dedupeKey").GetString()!.Length <= SupabaseTelemetrySink.StrictEventStringMaxChars,
        "V6_SUPABASE_STRICT_COMPACTION_BOUNDS_DEDUPE_KEY");
    Assert(firstStrictSignal.GetProperty("dedupeKey").GetString() != secondStrictSignal.GetProperty("dedupeKey").GetString(),
        "V6_SUPABASE_STRICT_COMPACTION_DEDUPE_KEYS_REMAIN_DISTINCT");
}

var missingDedupeSignalRows = new[]
{
    new Dictionary<string, object?>
    {
        ["seq"] = 11,
        ["severity"] = "WARN",
        ["component"] = "combat",
        ["event"] = "HEARTBEAT",
        ["reason"] = new string('a', 80) + "NO_PROGRESS",
        ["character"] = "My_Ranger1"
    },
    new Dictionary<string, object?>
    {
        ["seq"] = 12,
        ["severity"] = "WARN",
        ["component"] = "combat",
        ["event"] = "HEARTBEAT",
        ["reason"] = new string('b', 80) + "NO_PROGRESS",
        ["character"] = "My_Ranger1"
    }
};
using (var missingDedupeSignalsDocument = JsonDocument.Parse(JsonSerializer.Serialize(missingDedupeSignalRows)))
{
    var strictSignals = (IReadOnlyList<object>)strictCompactEventsMethod!.Invoke(
        null,
        [missingDedupeSignalsDocument.RootElement])!;
    using var strictSignalsJson = JsonDocument.Parse(JsonSerializer.Serialize(strictSignals));

    var firstMissingDedupe = strictSignalsJson.RootElement[0];
    var secondMissingDedupe = strictSignalsJson.RootElement[1];
    Assert(firstMissingDedupe.GetProperty("reason").GetString() == "NO_PROGRESS",
        "V6_SUPABASE_STRICT_COMPACTION_PRESERVES_MISSING_DEDUPE_WARNING_MARKER");
    Assert(firstMissingDedupe.GetProperty("dedupeKey").GetString()!.StartsWith("auto#", StringComparison.Ordinal),
        "V6_SUPABASE_STRICT_COMPACTION_SYNTHESIZES_DEDUPE_KEY");
    Assert(firstMissingDedupe.GetProperty("dedupeKey").GetString() != secondMissingDedupe.GetProperty("dedupeKey").GetString(),
        "V6_SUPABASE_STRICT_COMPACTION_SYNTHETIC_DEDUPE_PRESERVES_REASON_IDENTITY");
}

var minimalSnapshotMethod = typeof(SupabaseTelemetrySink).GetMethod(
    "CreateMinimalBudgetSnapshot",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
Assert(minimalSnapshotMethod is not null, "V6_SUPABASE_MINIMAL_SNAPSHOT_HELPER");
using (var oversizedSnapshotDocument = JsonDocument.Parse("""
{
  "identity": {
    "product": "AL Bot",
    "generation": 6,
    "bridgeProtocol": "albot-v6-bridge-v1",
    "runtimeVersion": "0.22.7-h22",
    "oversized": "must-be-omitted",
    "transportOnly": true,
    "gameplayActionAuthority": false,
    "acceptsLegacyGenerations": false
  },
  "observedAt": 123,
  "character": {
    "name": "My_Ranger1",
    "ctype": "ranger",
    "level": 80,
    "map": "main",
    "x": 12.5,
    "y": -7.25
  },
  "status": {"large": "ignored"}
}
"""))
{
    var minimalSnapshot = minimalSnapshotMethod!.Invoke(null, [oversizedSnapshotDocument.RootElement])!;
    var minimalJson = JsonSerializer.Serialize(minimalSnapshot);
    Assert(minimalJson.Contains("\"bridgeProtocol\":\"albot-v6-bridge-v1\"", StringComparison.Ordinal),
        "V6_SUPABASE_MINIMAL_SNAPSHOT_PRESERVES_IDENTITY");
    Assert(minimalJson.Contains("\"name\":\"My_Ranger1\"", StringComparison.Ordinal),
        "V6_SUPABASE_MINIMAL_SNAPSHOT_PRESERVES_CHARACTER");
    Assert(minimalJson.Contains("\"runtimeVersion\":\"0.22.7-h22\"", StringComparison.Ordinal),
        "V6_SUPABASE_MINIMAL_SNAPSHOT_PRESERVES_RUNTIME_VERSION");
    Assert(!minimalJson.Contains("\"oversized\"", StringComparison.Ordinal),
        "V6_SUPABASE_MINIMAL_SNAPSHOT_BOUNDS_IDENTITY");
    Assert(!minimalJson.Contains("\"status\"", StringComparison.Ordinal),
        "V6_SUPABASE_MINIMAL_SNAPSHOT_OMITS_HEAVY_STATUS");
}
Assert(SupabaseProblemDiagnosticsSink.IsWithinPayloadBudget(SupabaseProblemDiagnosticsSink.MaxPayloadBytes), "PROBLEM_MIRROR_BUDGET_BOUNDARY");
Assert(!SupabaseProblemDiagnosticsSink.IsWithinPayloadBudget(SupabaseProblemDiagnosticsSink.MaxPayloadBytes + 1), "PROBLEM_MIRROR_BUDGET_REJECTS_OVERSIZE");
Assert(ProblemDiagnosticsMirrorOutbox.PendingDirectory.EndsWith("mirror-pending-v6", StringComparison.OrdinalIgnoreCase), "V6_PROBLEM_MIRROR_OUTBOX_NAMESPACED");
Assert(ProblemDiagnosticsMirrorOutbox.LegacyPendingDirectory.EndsWith("mirror-pending", StringComparison.OrdinalIgnoreCase), "LEGACY_PROBLEM_MIRROR_OUTBOX_RETAINED");
Assert(!string.Equals(
    ProblemDiagnosticsMirrorOutbox.PendingDirectory,
    ProblemDiagnosticsMirrorOutbox.LegacyPendingDirectory,
    StringComparison.OrdinalIgnoreCase), "V6_PROBLEM_MIRROR_OUTBOX_ISOLATED_FROM_V3");

using (var snapshotDocument = JsonDocument.Parse("{}"))
using (var eventsDocument = JsonDocument.Parse("[]"))
{
    var restarted = new DebugReadResult(
        snapshotDocument.RootElement.Clone(),
        eventsDocument.RootElement.Clone(),
        RequestedAfterSeq: 500,
        EffectiveAfterSeq: 0,
        MaxSeq: 0,
        LastCapturedSeq: 12,
        HasMoreEvents: false,
        TargetUrl: "https://adventure.land/");
    Assert(restarted.CursorWasReset, "CURSOR_RESET_DETECTED");
}

using (var problemEvents = JsonDocument.Parse("""
[
  {
    "seq": 44,
    "severity": "ERROR",
    "component": "farmer",
    "event": "NO_PROGRESS",
    "reason": "stalled",
    "data": {
      "token": "must-not-leak",
      "applicationKey": "backblaze-secret",
      "keyId": "backblaze-key-id",
      "safe": "ok"
    }
  }
]
"""))
{
    var signal = LocalProblemDiagnosticsArchive.FindProblemSignal(problemEvents.RootElement);
    Assert(signal is not null, "PROBLEM_SIGNAL_FOUND");
    Assert(signal!.Seq == 44, "PROBLEM_SIGNAL_SEQ");
    Assert(signal.Type == "NO_PROGRESS", "PROBLEM_SIGNAL_TYPE");
    var sanitized = JsonSerializer.Serialize(LocalProblemDiagnosticsArchive.SanitizeJson(problemEvents.RootElement));
    Assert(!sanitized.Contains("must-not-leak", StringComparison.Ordinal), "TOKEN_REDACTED");
    Assert(!sanitized.Contains("backblaze-secret", StringComparison.Ordinal), "BACKBLAZE_APPLICATION_KEY_REDACTED");
    Assert(!sanitized.Contains("backblaze-key-id", StringComparison.Ordinal), "BACKBLAZE_KEY_ID_REDACTED");
    Assert(sanitized.Contains("[REDACTED]", StringComparison.Ordinal), "REDACTION_MARKER");
    Assert(sanitized.Contains("ok", StringComparison.Ordinal), "NON_SECRET_PRESERVED");
}

using (var harmlessEvents = JsonDocument.Parse("""
[
  { "seq": 1, "severity": "INFO", "event": "HEARTBEAT" },
  { "seq": 2, "severity": "WARN", "event": "NORMAL_RETRY", "reason": "temporary" }
]
"""))
{
    Assert(LocalProblemDiagnosticsArchive.FindProblemSignal(harmlessEvents.RootElement) is null, "HARMLESS_EVENTS_IGNORED");
}

using (var mirrorBundle = JsonDocument.Parse("""
{
  "schemaVersion": 1,
  "type": "ALBOT_V6_PROBLEM_DIAGNOSTICS_BUNDLE",
  "bundleId": "bundle-test-1",
  "botId": "albot-v6-main",
  "capturedAt": "2026-09-16T12:00:00Z",
  "trigger": { "severity": "ERROR", "reason": "NO_PROGRESS" },
  "snapshot": { "credential": "[REDACTED]" },
  "events": []
}
"""))
using (var mirrorHttp = new HttpClient())
{
    var sink = new SupabaseProblemDiagnosticsSink(mirrorHttp, defaults, "test-token-123456789012345678901234567890");
    var metadata = new ProblemDiagnosticsMetadata(
        1,
        "bundle-test-1",
        "albot-v6-main",
        "2026-09-16T12:00:00Z",
        "2026-09-16",
        "ERROR",
        "NO_PROGRESS",
        new string('a', 64),
        1234,
        "problem-bundle-test-1.json.gz");
    var logicalPath = LocalProblemDiagnosticsArchive.LogicalArchivePath(metadata);
    var payload = sink.SerializePayload(mirrorBundle.RootElement.Clone(), metadata, logicalPath);
    using var parsed = JsonDocument.Parse(payload);
    Assert(parsed.RootElement.GetProperty("type").GetString() == "ALBOT_V6_PROBLEM_DIAGNOSTICS_MIRROR", "PROBLEM_MIRROR_TYPE");
    Assert(parsed.RootElement.GetProperty("botId").GetString() == "albot-v6-main", "PROBLEM_MIRROR_BOT_ID");
    Assert(parsed.RootElement.GetProperty("archive").GetProperty("provider").GetString() == "local-spool", "PROBLEM_MIRROR_PROVIDER");
    Assert(parsed.RootElement.GetProperty("archive").GetProperty("sha256").GetString() == new string('a', 64), "PROBLEM_MIRROR_ARCHIVE_HASH");
    Assert(parsed.RootElement.GetProperty("bundle").GetProperty("bundleId").GetString() == "bundle-test-1", "PROBLEM_MIRROR_BUNDLE_ID");
    Assert(Encoding.UTF8.GetString(payload).Contains("[REDACTED]", StringComparison.Ordinal), "PROBLEM_MIRROR_REDACTION_PRESERVED");
}

var temporaryDirectory = Path.Combine(Path.GetTempPath(), "aio-windows-bridge-tests-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(temporaryDirectory);
try
{
    var tokenPath = Path.Combine(temporaryDirectory, "token.dpapi");
    var store = new SecureTokenStore(tokenPath);
    var token = "test-token-123456789012345678901234567890";
    await store.SaveAsync(token);
    var loaded = await store.LoadAsync("AIO_TEST_ENV_DOES_NOT_EXIST");
    Assert(loaded == token, "DPAPI_ROUNDTRIP");
    var disk = await File.ReadAllTextAsync(tokenPath);
    Assert(!disk.Contains(token, StringComparison.Ordinal), "TOKEN_MUST_NOT_BE_PLAINTEXT");
    await store.DeleteAsync();
    Assert(!File.Exists(tokenPath), "TOKEN_DELETE");

    var dashboardKeyPath = Path.Combine(temporaryDirectory, "dashboard-write-key.dpapi");
    var dashboardStore = new SecureDashboardWriteKeyStore(dashboardKeyPath);
    var dashboardWriteKey = "dashboard-write-key-test-1234567890";
    await dashboardStore.SaveAsync(dashboardWriteKey);
    var loadedDashboardKey = await dashboardStore.LoadAsync("AIO_TEST_DASHBOARD_ENV_DOES_NOT_EXIST");
    Assert(loadedDashboardKey == dashboardWriteKey, "DASHBOARD_DPAPI_ROUNDTRIP");
    var dashboardDisk = await File.ReadAllTextAsync(dashboardKeyPath);
    Assert(!dashboardDisk.Contains(dashboardWriteKey, StringComparison.Ordinal), "DASHBOARD_KEY_MUST_NOT_BE_PLAINTEXT");
    await dashboardStore.DeleteAsync();
    Assert(!File.Exists(dashboardKeyPath), "DASHBOARD_KEY_DELETE");

    var backblazePath = Path.Combine(temporaryDirectory, "backblaze-credentials.dpapi");
    var backblazeStore = new SecureBackblazeCredentialStore(backblazePath);
    var backblazeCredentials = new BackblazeCredentials(
        "004-test-key-id-1234567890",
        "K004-test-application-key-12345678901234567890");
    await backblazeStore.SaveAsync(backblazeCredentials);
    var loadedBackblaze = await backblazeStore.LoadAsync(
        "AIO_TEST_BACKBLAZE_KEY_ID_DOES_NOT_EXIST",
        "AIO_TEST_BACKBLAZE_APPLICATION_KEY_DOES_NOT_EXIST");
    Assert(loadedBackblaze == backblazeCredentials, "BACKBLAZE_DPAPI_ROUNDTRIP");
    var backblazeDisk = await File.ReadAllTextAsync(backblazePath);
    Assert(!backblazeDisk.Contains(backblazeCredentials.KeyId, StringComparison.Ordinal), "BACKBLAZE_KEY_ID_MUST_NOT_BE_PLAINTEXT");
    Assert(!backblazeDisk.Contains(backblazeCredentials.ApplicationKey, StringComparison.Ordinal), "BACKBLAZE_APPLICATION_KEY_MUST_NOT_BE_PLAINTEXT");
    await backblazeStore.DeleteAsync();
    Assert(!File.Exists(backblazePath), "BACKBLAZE_CREDENTIAL_DELETE");
}
finally
{
    Directory.Delete(temporaryDirectory, true);
}

Console.WriteLine("AioBotWindowsBridge smoke tests passed.");
