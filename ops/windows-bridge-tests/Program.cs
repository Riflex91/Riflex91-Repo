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
Assert(BridgeConfig.CurrentConfigVersion == 9, "CONFIG_VERSION_9");
Assert(defaults.PollIntervalSeconds == 5, "V5_LOCAL_OBSERVATION_DEFAULT");
Assert(defaults.SupabaseStatusIntervalSeconds == 60, "V5_SUPABASE_STATUS_INTERVAL_60S");
Assert(WindowsBridgeSelfUpdater.CheckIntervalSeconds == 60, "SELF_UPDATE_INTERVAL_60S");
Assert(WindowsBridgeSelfUpdater.ReleaseTag == "windows-bridge-latest", "SELF_UPDATE_RELEASE_TAG");
Assert(WindowsBridgeSelfUpdater.StatusFileName == "self-update-status.json", "SELF_UPDATE_STATUS_FILE");
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
    BackblazePrefix = "v4"
}).Validate();

var v5TransportNow = DateTimeOffset.UtcNow;
Assert(TelemetryBridgeService.ShouldUploadV5(null, 60, v5TransportNow, null, null), "V5_STATUS_INITIAL_UPLOAD");
Assert(!TelemetryBridgeService.ShouldUploadV5(v5TransportNow, 60, v5TransportNow.AddSeconds(59), null, null), "V5_STATUS_THROTTLED_BEFORE_60S");
Assert(TelemetryBridgeService.ShouldUploadV5(v5TransportNow, 60, v5TransportNow.AddSeconds(60), null, null), "V5_STATUS_DUE_AT_60S");
Assert(TelemetryBridgeService.ShouldUploadV5(v5TransportNow, 60, v5TransportNow.AddSeconds(5), "test|1|BESTANDEN", null), "V5_TERMINAL_IMMEDIATE");
Assert(!TelemetryBridgeService.ShouldUploadV5(v5TransportNow, 60, v5TransportNow.AddSeconds(5), "test|1|BESTANDEN", "test|1|BESTANDEN"), "V5_TERMINAL_DEDUPED");
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
Assert(CdpAdventureLandClient.IsEligibleV5CoordinatorContext(
    "merchant", false, "PR21_MERCHANT_INTEGRATION",
    "pr21-merchant-integration-live-15m-v1-0-3", true),
    "V5_CONTEXT_PR21_BOOTSTRAP_FACADE_ALLOWED");
Assert(!CdpAdventureLandClient.RequiresNativeV3CoordinatorContext(
    "PR21_MERCHANT_INTEGRATION",
    "pr21-merchant-integration-live-15m-v1-0-3", true),
    "V5_CONTEXT_PR21_BOOTSTRAP_NATIVE_RUNTIME_NOT_PREEXISTING_REQUIRED");
Assert(!CdpAdventureLandClient.IsEligibleV5CoordinatorContext(
    "ranger", false, "PR21_MERCHANT_INTEGRATION",
    "pr21-merchant-integration-live-15m-v1-0-3", true),
    "V5_CONTEXT_PR21_BOOTSTRAP_NON_MERCHANT_REJECTED");
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
Assert(!v5AutoManifest.BootstrapNativeV3, "V5_AUTO_MANIFEST_NATIVE_BOOTSTRAP_DEFAULT_OFF");

var v5Pr21BootstrapManifestJson = """
{
  "schemaVersion": 1,
  "enabled": true,
  "repository": "Riflex91/Riflex91-Repo",
  "branch": "main",
  "gate": "PR21_MERCHANT_INTEGRATION",
  "testId": "pr21-merchant-integration-live-15m-v1-0-3",
  "controllerVersion": "1.0.3",
  "coordinatorClass": "merchant",
  "workerDistribution": "PACKAGE_OWNED_COMMAND_CHARACTER",
  "sourceCommit": "1111111111111111111111111111111111111111",
  "packagePath": "v5/werkzeuge/pr21-merchant-integration-live-15m-v1-0-3.js",
  "packageSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "maxPackageBytes": 131072,
  "expectedGlobal": "V5PR21MerchantIntegrationLive15mV103",
  "normalRuntimeAllowed": false,
  "bootstrapNativeV3": true
}
""";
var v5Pr21BootstrapManifest =
    CdpAdventureLandClient.ParseAndValidateV5AutonomousTestManifest(v5Pr21BootstrapManifestJson);
Assert(v5Pr21BootstrapManifest.BootstrapNativeV3, "V5_PR21_NATIVE_BOOTSTRAP_MANIFEST_ACCEPTED");

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

var v5DeployNow = DateTimeOffset.UtcNow;
Assert(TelemetryBridgeService.ShouldEnsureV5AutonomousTestDeployment(null, v5DeployNow), "V5_AUTO_DEPLOY_INITIAL");
Assert(!TelemetryBridgeService.ShouldEnsureV5AutonomousTestDeployment(v5DeployNow, v5DeployNow.AddSeconds(14)), "V5_AUTO_DEPLOY_THROTTLED");
Assert(TelemetryBridgeService.ShouldEnsureV5AutonomousTestDeployment(v5DeployNow, v5DeployNow.AddSeconds(15)), "V5_AUTO_DEPLOY_15S");
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
