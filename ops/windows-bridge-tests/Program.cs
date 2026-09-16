using AioBotWindowsBridge;
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
Assert(BridgeConfig.CurrentConfigVersion == 4, "CONFIG_VERSION_4");
Assert(defaults.TelemetryIngestUrl.StartsWith("https://", StringComparison.Ordinal), "INGEST_MUST_DEFAULT_HTTPS");
Assert(defaults.SignalControlUrl.StartsWith("https://", StringComparison.Ordinal), "SIGNAL_CONTROL_MUST_DEFAULT_HTTPS");
Assert(defaults.WebDashboardEnabled, "WEB_DASHBOARD_PROFILE_SYNC_DEFAULT_ON");
Assert(defaults.WebDashboardBaseUrl.StartsWith("https://", StringComparison.Ordinal), "WEB_DASHBOARD_MUST_DEFAULT_HTTPS");
Assert(defaults.WebDashboardAccount == "default", "WEB_DASHBOARD_ACCOUNT_DEFAULT");
Assert(!string.IsNullOrWhiteSpace(defaults.WebDashboardWriteKeyEnvironmentVariable), "WEB_DASHBOARD_ENV_REQUIRED");
Assert(!defaults.DiagnosticsFtpsEnabled, "FTPS_MUST_DEFAULT_OFF");
Assert(defaults.DiagnosticsFtpsPort == 21, "FTPS_PORT_DEFAULT");
Assert(defaults.DiagnosticsFtpsRoot == "/diagnostics/v3", "FTPS_ROOT_DEFAULT");
Assert(defaults.DiagnosticsFtpsRejectUnauthorized, "FTPS_CERT_VALIDATION_DEFAULT_ON");
Assert(!string.IsNullOrWhiteSpace(defaults.DiagnosticsFtpsPasswordEnvironmentVariable), "FTPS_PASSWORD_ENV_REQUIRED");
Assert(FtpsDiagnosticsArchive.NormalizeRemoteRoot("/diagnostics/v3/") == "/diagnostics/v3", "FTPS_ROOT_NORMALIZATION");
Assert(CdpWebDashboardConfigurator.CloudStorageKey == "aio-v3:cloud-control:v1", "WEB_DASHBOARD_CLOUD_STORAGE_KEY");
Assert(CdpWebDashboardConfigurator.ControlStorageKey == "aio-v3:control-plane-config:v1", "WEB_DASHBOARD_CONTROL_STORAGE_KEY");

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
ExpectInvalid(defaults with { DiagnosticsFtpsPort = 0 }, "DIAGNOSTICS_FTPS_PORT_INVALID");
ExpectInvalid(defaults with { DiagnosticsFtpsHost = "ftps://example.test" }, "DIAGNOSTICS_FTPS_HOST_INVALID");
ExpectInvalid(defaults with { DiagnosticsFtpsRoot = "/diagnostics/../secret" }, "DIAGNOSTICS_FTPS_ROOT_INVALID");
ExpectInvalid(defaults with { DiagnosticsFtpsEnabled = true }, "DIAGNOSTICS_FTPS_HOST_REQUIRED");
ExpectInvalid(defaults with { DiagnosticsFtpsEnabled = true, DiagnosticsFtpsHost = "example.test" }, "DIAGNOSTICS_FTPS_USER_REQUIRED");
(defaults with
{
    DiagnosticsFtpsEnabled = true,
    DiagnosticsFtpsHost = "example.test",
    DiagnosticsFtpsUser = "aio",
    DiagnosticsFtpsPort = 21,
    DiagnosticsFtpsRoot = "/diagnostics/v3"
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
    "data": { "token": "must-not-leak", "safe": "ok" }
  }
]
"""))
{
    var signal = FtpsDiagnosticsArchive.FindProblemSignal(problemEvents.RootElement);
    Assert(signal is not null, "FTPS_PROBLEM_SIGNAL_FOUND");
    Assert(signal!.Seq == 44, "FTPS_PROBLEM_SIGNAL_SEQ");
    Assert(signal.Type == "NO_PROGRESS", "FTPS_PROBLEM_SIGNAL_TYPE");
    var sanitized = JsonSerializer.Serialize(FtpsDiagnosticsArchive.SanitizeJson(problemEvents.RootElement));
    Assert(!sanitized.Contains("must-not-leak", StringComparison.Ordinal), "FTPS_SECRET_REDACTED");
    Assert(sanitized.Contains("[REDACTED]", StringComparison.Ordinal), "FTPS_REDACTION_MARKER");
    Assert(sanitized.Contains("ok", StringComparison.Ordinal), "FTPS_NON_SECRET_PRESERVED");
}

using (var harmlessEvents = JsonDocument.Parse("""
[
  { "seq": 1, "severity": "INFO", "event": "HEARTBEAT" },
  { "seq": 2, "severity": "WARN", "event": "NORMAL_RETRY", "reason": "temporary" }
]
"""))
{
    Assert(FtpsDiagnosticsArchive.FindProblemSignal(harmlessEvents.RootElement) is null, "FTPS_HARMLESS_EVENTS_IGNORED");
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

    var ftpsPasswordPath = Path.Combine(temporaryDirectory, "ftps-password.dpapi");
    var ftpsStore = new SecureFtpsPasswordStore(ftpsPasswordPath);
    var ftpsPassword = "test-ftps-password-123456";
    await ftpsStore.SaveAsync(ftpsPassword);
    var loadedFtpsPassword = await ftpsStore.LoadAsync("AIO_TEST_FTPS_ENV_DOES_NOT_EXIST");
    Assert(loadedFtpsPassword == ftpsPassword, "FTPS_DPAPI_ROUNDTRIP");
    var ftpsDisk = await File.ReadAllTextAsync(ftpsPasswordPath);
    Assert(!ftpsDisk.Contains(ftpsPassword, StringComparison.Ordinal), "FTPS_PASSWORD_MUST_NOT_BE_PLAINTEXT");
    await ftpsStore.DeleteAsync();
    Assert(!File.Exists(ftpsPasswordPath), "FTPS_PASSWORD_DELETE");
}
finally
{
    Directory.Delete(temporaryDirectory, true);
}

Console.WriteLine("AioBotWindowsBridge smoke tests passed.");
