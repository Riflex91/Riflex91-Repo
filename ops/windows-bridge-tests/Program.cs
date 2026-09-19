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

var defaults = new BridgeConfig();
defaults.Validate();
Assert(defaults.TelemetryEnabled == false, "TELEMETRY_MUST_DEFAULT_OFF");
Assert(defaults.PreferredBrowser == "Brave", "BRAVE_MUST_DEFAULT");
Assert(defaults.ConfigVersion == BridgeConfig.CurrentConfigVersion, "CONFIG_VERSION");
Assert(BridgeConfig.CurrentConfigVersion == 7, "CONFIG_VERSION_7");
Assert(defaults.TelemetryIngestUrl.StartsWith("https://", StringComparison.Ordinal), "INGEST_MUST_DEFAULT_HTTPS");
Assert(defaults.SignalControlUrl.StartsWith("https://", StringComparison.Ordinal), "SIGNAL_CONTROL_MUST_DEFAULT_HTTPS");
Assert(defaults.WebDashboardEnabled, "WEB_DASHBOARD_PROFILE_SYNC_DEFAULT_ON");
Assert(defaults.WebDashboardBaseUrl.StartsWith("https://", StringComparison.Ordinal), "WEB_DASHBOARD_MUST_DEFAULT_HTTPS");
Assert(defaults.WebDashboardAccount == "default", "WEB_DASHBOARD_ACCOUNT_DEFAULT");
Assert(!string.IsNullOrWhiteSpace(defaults.WebDashboardWriteKeyEnvironmentVariable), "WEB_DASHBOARD_ENV_REQUIRED");
Assert(defaults.BackblazeEnabled, "BACKBLAZE_HANDOFF_MUST_DEFAULT_ON");
Assert(defaults.BackblazeEndpoint == "https://s3.eu-central-003.backblazeb2.com", "BACKBLAZE_ENDPOINT_DEFAULT");
Assert(defaults.BackblazeRegion == "eu-central-003", "BACKBLAZE_REGION_DEFAULT");
Assert(defaults.BackblazeBucket == "al-aio-bot", "BACKBLAZE_BUCKET_DEFAULT");
Assert(defaults.BackblazePrefix == "v4", "BACKBLAZE_PREFIX_DEFAULT");
Assert(!string.IsNullOrWhiteSpace(defaults.BackblazeKeyIdEnvironmentVariable), "BACKBLAZE_KEY_ID_ENV_REQUIRED");
Assert(!string.IsNullOrWhiteSpace(defaults.BackblazeApplicationKeyEnvironmentVariable), "BACKBLAZE_APPLICATION_KEY_ENV_REQUIRED");
Assert(defaults.WissenswaechterAktiv, "WISSENSWAECHTER_DEFAULT_ON");
Assert(defaults.WissenswaechterIntervallMinuten == 60, "WISSENSWAECHTER_HOURLY");
Assert(defaults.WissenswaechterWebSucheAktiv, "WISSENSWAECHTER_WEB_SEARCH_DEFAULT_ON");
Assert(defaults.WissenswaechterMaxQuellenProLauf == 200, "WISSENSWAECHTER_SOURCE_LIMIT");
Assert(defaults.WissenswaechterMaxKandidaten == 1000, "WISSENSWAECHTER_CANDIDATE_LIMIT");
Assert(defaults.LiveWissenImportAktiv, "LIVE_WISSEN_IMPORT_DEFAULT_ON");
Assert(defaults.LiveWissenQuellordner == string.Empty, "LIVE_WISSEN_SOURCE_DEFAULT_EMPTY");
Assert(CdpBackblazeConfigurator.GlobalConfigName == "AIO_V3_BACKBLAZE_CONFIG", "BACKBLAZE_GLOBAL_NAME");
Assert(CdpWebDashboardConfigurator.CloudStorageKey == "aio-v3:cloud-control:v1", "WEB_DASHBOARD_CLOUD_STORAGE_KEY");
Assert(CdpWebDashboardConfigurator.ControlStorageKey == "aio-v3:control-plane-config:v1", "WEB_DASHBOARD_CONTROL_STORAGE_KEY");
Assert(GitArbeitskopie.WissensbasisPfad == "v5/wissensbasis", "WISSENSWAECHTER_SCOPE_PATH");
Assert(GitArbeitskopie.DatenbankPfad == "v5/wissensbasis/datenbank", "WISSENSWAECHTER_DATABASE_PATH");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/quellen/quellen.json"), "KNOWLEDGE_READ_ALLOWED");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/fakten/adventure-land-kern.json"), "KNOWLEDGE_WRITE_ALLOWED");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/datenbank/quellenstatus.json"), "DATABASE_WITHIN_SCOPE_ALLOWED");
Assert(GitArbeitskopie.IstErlaubterWissensbasisPfad("v5\\wissensbasis\\fragen\\offene-fragen.json"), "WINDOWS_SCOPE_PATH_ALLOWED");
Assert(!GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/dokumentation/V5-MASTER-ROADMAP.md"), "ROADMAP_OUTSIDE_SCOPE_BLOCKED");
Assert(!GitArbeitskopie.IstErlaubterWissensbasisPfad("ops/windows-bridge/MainWindow.xaml"), "OPS_OUTSIDE_SCOPE_BLOCKED");
Assert(!GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/../dokumentation/test.md"), "SCOPE_TRAVERSAL_BLOCKED");
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

(defaults with { PreferredBrowser = "Brave" }).Validate();
(defaults with { PreferredBrowser = "Edge" }).Validate();
(defaults with { PreferredBrowser = "Chrome" }).Validate();
ExpectInvalid(defaults with { PreferredBrowser = "Firefox" }, "PREFERRED_BROWSER_INVALID");

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
ExpectInvalid(defaults with { WissenswaechterIntervallMinuten = 10 }, "WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
ExpectInvalid(defaults with { WissenswaechterIntervallMinuten = 120 }, "WISSENSWAECHTER_INTERVALL_MUSS_60_MINUTEN_SEIN");
ExpectInvalid(defaults with { WissenswaechterMaxQuellenProLauf = 0 }, "WISSENSWAECHTER_QUELLENLIMIT_UNGUELTIG");
ExpectInvalid(defaults with { WissenswaechterMaxKandidaten = 10 }, "WISSENSWAECHTER_KANDIDATENLIMIT_UNGUELTIG");
ExpectInvalid(defaults with { LiveWissenQuellordner = @"relative\wissen" }, "LIVE_WISSEN_QUELLORDNER_UNGUELTIG");
ExpectInvalid(defaults with { LiveWissenQuellordner = @"\\server\freigabe\wissen" }, "LIVE_WISSEN_QUELLORDNER_UNGUELTIG");
(defaults with { LiveWissenQuellordner = @"D:\AdventureLand\LiveWissen" }).Validate();

Assert(LiveWissenImporteur.IstUnterstuetzteLiveWissenDatei("monster/drops.json"), "LIVE_WISSEN_JSON_ALLOWED");
Assert(LiveWissenImporteur.IstUnterstuetzteLiveWissenDatei("events/live.jsonl"), "LIVE_WISSEN_JSONL_ALLOWED");
Assert(!LiveWissenImporteur.IstUnterstuetzteLiveWissenDatei("binary/data.exe"), "LIVE_WISSEN_BINARY_BLOCKED");
Assert(LiveWissenImporteur.IstSichererRelativerPfad("monster/drops.json"), "LIVE_WISSEN_RELATIVE_PATH_ALLOWED");
Assert(!LiveWissenImporteur.IstSichererRelativerPfad("../secret.json"), "LIVE_WISSEN_TRAVERSAL_BLOCKED");
Assert(!LiveWissenImporteur.IstSichererRelativerPfad(".git/config"), "LIVE_WISSEN_GIT_PATH_BLOCKED");
Assert(LiveWissenImporteur.BerechneZielRelativpfad("monster/drops.json") == "v5/wissensbasis/datenbank/live-verifiziert/aktuell/monster/drops.json", "LIVE_WISSEN_TARGET_MAPPING");
Assert(!LiveWissenImporteur.EnthaeltMoeglicheGeheimnisse("safe.json", Encoding.UTF8.GetBytes("""{"monster":"goo","hp":120}""")), "LIVE_WISSEN_SAFE_CONTENT_ALLOWED");
Assert(LiveWissenImporteur.EnthaeltMoeglicheGeheimnisse("secret.json", Encoding.UTF8.GetBytes("""{"token":"abcdefghijklmnop123456"}""")), "LIVE_WISSEN_SECRET_BLOCKED");
(defaults with
{
    BackblazeEnabled = true,
    BackblazeEndpoint = "https://s3.eu-central-003.backblazeb2.com",
    BackblazeRegion = "eu-central-003",
    BackblazeBucket = "al-aio-bot",
    BackblazePrefix = "v4"
}).Validate();

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
Assert(TelemetryBridgeService.EventLimitForRead(100, true) == TelemetryBridgeService.DeepDiagnosticEventLimit, "DIAGNOSTIC_EVENT_LIMIT");
Assert(TelemetryBridgeService.EventLimitForRead(20, true) == 20, "DIAGNOSTIC_SMALL_EVENT_LIMIT");
Assert(SupabaseTelemetrySink.IsWithinPayloadBudget(SupabaseTelemetrySink.MaxPayloadBytes), "PAYLOAD_BUDGET_BOUNDARY");
Assert(!SupabaseTelemetrySink.IsWithinPayloadBudget(SupabaseTelemetrySink.MaxPayloadBytes + 1), "PAYLOAD_BUDGET_REJECTS_OVERSIZE");
Assert(SupabaseProblemDiagnosticsSink.IsWithinPayloadBudget(SupabaseProblemDiagnosticsSink.MaxPayloadBytes), "PROBLEM_MIRROR_BUDGET_BOUNDARY");
Assert(!SupabaseProblemDiagnosticsSink.IsWithinPayloadBudget(SupabaseProblemDiagnosticsSink.MaxPayloadBytes + 1), "PROBLEM_MIRROR_BUDGET_REJECTS_OVERSIZE");

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
  "type": "AIO_V3_PROBLEM_DIAGNOSTICS_BUNDLE",
  "bundleId": "bundle-test-1",
  "botId": "pi-main",
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
        "pi-main",
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
    Assert(parsed.RootElement.GetProperty("type").GetString() == "AIO_V3_PROBLEM_DIAGNOSTICS_MIRROR", "PROBLEM_MIRROR_TYPE");
    Assert(parsed.RootElement.GetProperty("botId").GetString() == "pi-main", "PROBLEM_MIRROR_BOT_ID");
    Assert(parsed.RootElement.GetProperty("archive").GetProperty("provider").GetString() == "local-spool", "PROBLEM_MIRROR_PROVIDER");
    Assert(parsed.RootElement.GetProperty("archive").GetProperty("sha256").GetString() == new string('a', 64), "PROBLEM_MIRROR_ARCHIVE_HASH");
    Assert(parsed.RootElement.GetProperty("bundle").GetProperty("bundleId").GetString() == "bundle-test-1", "PROBLEM_MIRROR_BUNDLE_ID");
    Assert(Encoding.UTF8.GetString(payload).Contains("[REDACTED]", StringComparison.Ordinal), "PROBLEM_MIRROR_REDACTION_PRESERVED");
}

var liveSourceDirectory = Path.Combine(Path.GetTempPath(), "aio-live-wissen-source-" + Guid.NewGuid().ToString("N"));
var liveRepoDirectory = Path.Combine(Path.GetTempPath(), "aio-live-wissen-repo-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(Path.Combine(liveSourceDirectory, "monster"));
try
{
    var liveFile = Path.Combine(liveSourceDirectory, "monster", "drops.json");
    var secretFile = Path.Combine(liveSourceDirectory, "secret.json");
    await File.WriteAllTextAsync(liveFile, """{"monster":"goo","drop":"slime"}""");
    await File.WriteAllTextAsync(secretFile, """{"token":"abcdefghijklmnop123456"}""");
    File.SetLastWriteTimeUtc(liveFile, DateTime.UtcNow.AddSeconds(-10));
    File.SetLastWriteTimeUtc(secretFile, DateTime.UtcNow.AddSeconds(-10));

    var liveConfig = defaults with
    {
        LiveWissenImportAktiv = true,
        LiveWissenQuellordner = liveSourceDirectory
    };
    liveConfig.Validate();

    var liveArbeitskopie = new GitArbeitskopie(liveRepoDirectory);
    var liveImporteur = new LiveWissenImporteur(liveConfig, liveArbeitskopie);
    var liveResult = await liveImporteur.ImportiereAsync(DateTimeOffset.UtcNow);

    Assert(liveResult.Konfiguriert, "LIVE_WISSEN_IMPORT_CONFIGURED");
    Assert(liveResult.ImportierteDateien == 1, "LIVE_WISSEN_ONE_IMPORTED");
    Assert(liveResult.UebersprungeneDateien == 1, "LIVE_WISSEN_SECRET_SKIPPED");

    var importedPath = Path.Combine(
        liveRepoDirectory,
        "v5", "wissensbasis", "datenbank", "live-verifiziert", "aktuell", "monster", "drops.json");
    Assert(File.Exists(importedPath), "LIVE_WISSEN_FILE_MIRRORED");

    var manifestPath = Path.Combine(
        liveRepoDirectory,
        "v5", "wissensbasis", "datenbank", "live-verifiziert", "manifest.json");
    Assert(File.Exists(manifestPath), "LIVE_WISSEN_MANIFEST_CREATED");
    var liveManifest = await File.ReadAllTextAsync(manifestPath);
    Assert(!liveManifest.Contains(liveSourceDirectory, StringComparison.OrdinalIgnoreCase), "LIVE_WISSEN_ABSOLUTE_SOURCE_PATH_NOT_UPLOADED");
    Assert(liveManifest.Contains("LIVE_VERIFIZIERT_DURCH_BOT", StringComparison.Ordinal), "LIVE_WISSEN_VERIFICATION_MARKER");
}
finally
{
    if (Directory.Exists(liveSourceDirectory)) Directory.Delete(liveSourceDirectory, true);
    if (Directory.Exists(liveRepoDirectory)) Directory.Delete(liveRepoDirectory, true);
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
