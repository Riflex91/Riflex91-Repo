using System.Diagnostics;

namespace AioBotWindowsBridge;

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
        Process.Start(new ProcessStartInfo
        {
            FileName = browserPath,
            UseShellExecute = false,
            ArgumentList =
            {
                $"--remote-debugging-port={port}",
                $"--user-data-dir={BridgeConfig.BrowserProfileDirectory}",
                _config.AllowedOrigin
            }
        });

        for (var attempt = 0; attempt < 30; attempt++)
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

    internal static IReadOnlyList<string> BrowserPreferenceOrder(string preferred)
    {
        var order = new[] { preferred, "Brave", "Edge", "Chrome" };
        return order
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string? FindBrowserPath(string browser)
    {
        string[] candidates;
        if (string.Equals(browser, "Brave", StringComparison.OrdinalIgnoreCase))
        {
            candidates =
            [
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BraveSoftware", "Brave-Browser", "Application", "brave.exe")
            ];
        }
        else if (string.Equals(browser, "Chrome", StringComparison.OrdinalIgnoreCase))
        {
            candidates =
            [
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "Application", "chrome.exe")
            ];
        }
        else
        {
            candidates =
            [
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe")
            ];
        }

        return candidates.FirstOrDefault(File.Exists);
    }
}
