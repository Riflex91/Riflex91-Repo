using System.Diagnostics;

namespace AioBotLinuxBridge;

public sealed record BrowserConnectionStatus(bool Ready, string State, string? BrowserPath = null);

public sealed class BrowserLauncher
{
    private readonly HttpClient _httpClient;
    private readonly BridgeConfig _config;
    private readonly Uri _versionUri;

    public BrowserLauncher(HttpClient httpClient, BridgeConfig config)
    {
        _httpClient = httpClient;
        _config = config;
        _versionUri = new Uri(new Uri(config.CdpEndpoint.TrimEnd('/') + "/"), "json/version");
    }

    public async Task<BrowserConnectionStatus> EnsureReadyAsync(CancellationToken cancellationToken)
    {
        if (await ProbeAsync(cancellationToken))
            return new BrowserConnectionStatus(true, "CONNECTED");

        if (!_config.AutoStartBrowser)
            return new BrowserConnectionStatus(false, "BROWSER_NOT_RUNNING");

        var browserPath = BrowserPreferenceOrder(_config.PreferredBrowser)
            .Select(FindBrowserPath)
            .FirstOrDefault(path => path is not null);
        if (browserPath is null)
            return new BrowserConnectionStatus(false, "BROWSER_NOT_FOUND");

        Directory.CreateDirectory(BridgeConfig.BrowserProfileDirectory);
        var port = new Uri(_config.CdpEndpoint).Port;

        try
        {
            var start = new ProcessStartInfo
            {
                FileName = browserPath,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            start.ArgumentList.Add($"--remote-debugging-port={port}");
            start.ArgumentList.Add($"--user-data-dir={BridgeConfig.BrowserProfileDirectory}");
            start.ArgumentList.Add("--no-first-run");
            start.ArgumentList.Add("--no-default-browser-check");
            if (_config.BrowserHeadless)
            {
                start.ArgumentList.Add("--headless=new");
                start.ArgumentList.Add("--disable-dev-shm-usage");
            }
            start.ArgumentList.Add(_config.AllowedOrigin);
            Process.Start(start);
        }
        catch (Exception error)
        {
            return new BrowserConnectionStatus(false, "BROWSER_START_FAILED:" + Bound(error.Message), browserPath);
        }

        for (var attempt = 0; attempt < 40; attempt++)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken);
            if (await ProbeAsync(cancellationToken))
                return new BrowserConnectionStatus(true, "CONNECTED", browserPath);
        }

        return new BrowserConnectionStatus(false, "BROWSER_DEBUG_ENDPOINT_TIMEOUT", browserPath);
    }

    public async Task<bool> ProbeAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, _versionUri);
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return false;
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }

    public static IReadOnlyList<string> BrowserPreferenceOrder(string preferred)
    {
        var order = new[] { preferred, "Brave", "Chrome", "Chromium", "Edge" };
        return order.Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static string? FindBrowserPath(string browser)
    {
        var names = browser.ToLowerInvariant() switch
        {
            "brave" => new[] { "brave-browser", "brave" },
            "chrome" => new[] { "google-chrome-stable", "google-chrome" },
            "chromium" => new[] { "chromium", "chromium-browser" },
            "edge" => new[] { "microsoft-edge-stable", "microsoft-edge" },
            _ => Array.Empty<string>()
        };

        foreach (var name in names)
        {
            var found = FindOnPath(name);
            if (found is not null) return found;
        }

        return null;
    }

    private static string? FindOnPath(string executable)
    {
        var path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        foreach (var directory in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            try
            {
                var candidate = Path.Combine(directory, executable);
                if (File.Exists(candidate)) return candidate;
            }
            catch
            {
            }
        }
        return null;
    }

    private static string Bound(string value) => value.Length <= 300 ? value : value[..300];
}
