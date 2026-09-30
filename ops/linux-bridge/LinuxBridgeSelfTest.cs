namespace AioBotWindowsBridge;

public static class LinuxBridgeSelfTest
{
    public static async Task RunAsync()
    {
        var config = new BridgeConfig();
        config.Validate();

        Assert(CdpAlBotV6Client.Generation == 6, "V6_GENERATION");
        Assert(CdpAlBotV6Client.Protocol == "albot-v6-bridge-v1", "V6_PROTOCOL");
        Assert(config.CdpEndpoint == "http://127.0.0.1:9222", "CDP_LOOPBACK_DEFAULT");
        Assert(config.WatchdogEnabled, "WATCHDOG_DEFAULT_ON");
        Assert(LinuxWatchdogSupervisor.SystemdKeepaliveSeconds < 45, "SYSTEMD_KEEPALIVE_BELOW_UNIT_DEADLINE");
        Assert(LinuxStorageHealthProbe.MinimumFreePercent == 15, "STORAGE_FREE_RESERVE");
        Assert(LinuxReadinessSystemtest.TestId == "V6_LINUX_BRIDGE_READINESS", "LINUX_READINESS_ID");
        Assert(config.WatchdogFailuresBeforeRestart > config.WatchdogFailuresBeforeReload, "WATCHDOG_STAGED_RECOVERY");
        Assert(config.BrowserMaxStartsPerWindow == 4, "BROWSER_RESTART_BUDGET");
        Assert(config.BackblazePrefix == "v6", "BACKBLAZE_V6_PREFIX");
        Assert(config.WissenswaechterIntervallMinuten == 60, "KNOWLEDGE_HOURLY");
        Assert(BrowserLauncher.BrowserPreferenceOrder("Brave").First() == "brave", "BRAVE_PREFERENCE");
        Assert(LinuxBridgeSelfUpdater.AssetUrl.Contains("linux-bridge-latest", StringComparison.Ordinal), "FIXED_UPDATE_CHANNEL");
        Assert(GitHubAnmeldung.Authentifizierungsmodus == "FINE_GRAINED_PAT", "GITHUB_PAT_MODE");
        Assert(LinuxAdminTokenStore.IsValidToken(new string('a', 64)), "ADMIN_TOKEN_FORMAT");
        Assert(!LinuxAdminTokenStore.IsValidToken("short"), "ADMIN_TOKEN_REJECT_SHORT");
        Assert(BridgeConfig.NormalisiereLiveWissenspfad("/mnt/adventureland/wissensdatenbank") == "/mnt/adventureland/wissensdatenbank", "LIVE_PATH_NORMALIZATION");

        var invalid = config with { CdpEndpoint = "http://192.168.1.2:9222" };
        var blocked = false;
        try { invalid.Validate(); } catch (InvalidOperationException) { blocked = true; }
        Assert(blocked, "REMOTE_CDP_BLOCKED");

        blocked = false;
        try { (config with { AllowedOrigin = "https://example.com" }).Validate(); }
        catch (InvalidOperationException) { blocked = true; }
        Assert(blocked, "ADVENTURE_LAND_ORIGIN_PINNED");

        blocked = false;
        try { (config with { TelemetryIngestUrl = "https://example.com/ingest" }).Validate(); }
        catch (InvalidOperationException) { blocked = true; }
        Assert(blocked, "TELEMETRY_ENDPOINT_PINNED");

        blocked = false;
        try { (config with { WebDashboardBaseUrl = "https://example.com" }).Validate(); }
        catch (InvalidOperationException) { blocked = true; }
        Assert(blocked, "DASHBOARD_ENDPOINT_PINNED");

        blocked = false;
        try { (config with { BackblazeEndpoint = "https://example.com" }).Validate(); }
        catch (InvalidOperationException) { blocked = true; }
        Assert(blocked, "BACKBLAZE_ENDPOINT_PINNED");

        using var http = new HttpClient();
        await using (var disabledWatchdog = new LinuxWatchdogSupervisor(
            http,
            config with { WatchdogEnabled = false }))
        {
            await disabledWatchdog.StartAsync();
            Assert(
                disabledWatchdog.Status.State == "DISABLED",
                "SYSTEMD_SUPERVISION_WITH_APP_WATCHDOG_DISABLED");
            await disabledWatchdog.DisposeAsync();
            await disabledWatchdog.DisposeAsync();
        }

        await using (var updater = new LinuxBridgeSelfUpdater(config))
        {
            await updater.DisposeAsync();
            await updater.DisposeAsync();
        }

        Console.WriteLine("AIO Bot Linux Bridge self-test: PASS");
    }

    private static void Assert(bool value, string name)
    {
        if (!value)
            throw new InvalidOperationException("SELF_TEST_FAILED:" + name);
    }
}
