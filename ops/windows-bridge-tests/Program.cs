using AioBotWindowsBridge;

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
Assert(defaults.TelemetryIngestUrl.StartsWith("https://", StringComparison.Ordinal), "INGEST_MUST_DEFAULT_HTTPS");
Assert(defaults.SignalControlUrl.StartsWith("https://", StringComparison.Ordinal), "SIGNAL_CONTROL_MUST_DEFAULT_HTTPS");

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

Assert(TelemetryBridgeService.ComputeBackoffSeconds(5, 300, 1) == 5, "BACKOFF_1");
Assert(TelemetryBridgeService.ComputeBackoffSeconds(5, 300, 2) == 10, "BACKOFF_2");
Assert(TelemetryBridgeService.ComputeBackoffSeconds(5, 300, 20) == 300, "BACKOFF_CAP");

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
}
finally
{
    Directory.Delete(temporaryDirectory, true);
}

Console.WriteLine("AioBotWindowsBridge smoke tests passed.");
