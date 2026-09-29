using System.Diagnostics;
using System.Text.Json;

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
        if (await ProbeAsync(cancellationToken)) return new BrowserConnectionStatus(true, "CONNECTED");
        if (!_config.AutoStartBrowser) return new BrowserConnectionStatus(false, "BROWSER_NOT_RUNNING");

        var budget = await BrowserStartBudget.LoadAsync(cancellationToken);
        if (!budget.CanStart(_config, DateTimeOffset.UtcNow, out var circuitUntil))
            return new BrowserConnectionStatus(false, "BROWSER_START_CIRCUIT_OPEN_UNTIL_" + circuitUntil.ToString("O"));

        var browserPath = FindBrowserPath(_config.PreferredBrowser);
        if (browserPath is null) return new BrowserConnectionStatus(false, "BROWSER_EXECUTABLE_NOT_FOUND");

        Directory.CreateDirectory(BridgeConfig.BrowserProfileDirectory);
        var port = new Uri(_config.CdpEndpoint).Port;
        var start = new ProcessStartInfo { FileName = browserPath, UseShellExecute = false, RedirectStandardError = false, RedirectStandardOutput = false };
        start.ArgumentList.Add("--remote-debugging-address=127.0.0.1");
        start.ArgumentList.Add("--remote-debugging-port=" + port);
        start.ArgumentList.Add("--user-data-dir=" + BridgeConfig.BrowserProfileDirectory);
        start.ArgumentList.Add("--no-first-run");
        start.ArgumentList.Add("--no-default-browser-check");
        start.ArgumentList.Add("--disable-session-crashed-bubble");
        if (_config.BrowserHeadless)
        {
            start.ArgumentList.Add("--headless=new");
            start.ArgumentList.Add("--disable-gpu");
        }
        start.ArgumentList.Add(_config.AllowedOrigin);

        var process = Process.Start(start);
        if (process is null) return new BrowserConnectionStatus(false, "BROWSER_START_FAILED");

        await File.WriteAllTextAsync(BridgeConfig.BrowserPidPath, process.Id.ToString(), cancellationToken);
        await budget.RecordStartAsync(_config, DateTimeOffset.UtcNow, cancellationToken);

        var deadline = DateTimeOffset.UtcNow.AddSeconds(_config.BrowserStartupTimeoutSeconds);
        while (DateTimeOffset.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
        {
            if (await ProbeAsync(cancellationToken)) return new BrowserConnectionStatus(true, "STARTED", browserPath);
            await Task.Delay(1000, cancellationToken);
        }
        return new BrowserConnectionStatus(false, "BROWSER_START_TIMEOUT", browserPath);
    }

    public async Task<BrowserConnectionStatus> RestartAsync(CancellationToken cancellationToken)
    {
        await StopManagedBrowserAsync(cancellationToken);
        await Task.Delay(1000, cancellationToken);
        return await EnsureReadyAsync(cancellationToken);
    }

    public async Task<bool> ProbeAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));
            using var response = await _httpClient.GetAsync(_versionUri, cts.Token);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task StopManagedBrowserAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(BridgeConfig.BrowserPidPath)) return;
        if (!int.TryParse((await File.ReadAllTextAsync(BridgeConfig.BrowserPidPath, cancellationToken)).Trim(), out var pid)) return;
        try
        {
            var procPath = "/proc/" + pid + "/cmdline";
            if (!File.Exists(procPath)) return;
            var cmdline = await File.ReadAllTextAsync(procPath, cancellationToken);
            if (!cmdline.Contains(BridgeConfig.BrowserProfileDirectory, StringComparison.Ordinal))
                throw new InvalidOperationException("BROWSER_PID_NOT_OWNED_BY_BRIDGE");
            using var process = Process.GetProcessById(pid);
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(10));
                try { await process.WaitForExitAsync(timeout.Token); } catch (OperationCanceledException) { }
            }
        }
        catch (ArgumentException) { }
        finally { try { File.Delete(BridgeConfig.BrowserPidPath); } catch { } }
    }

    public static IReadOnlyList<string> BrowserPreferenceOrder(string? preferred)
    {
        var all = new[] { "brave", "chrome", "chromium", "edge" };
        var first = Normalize(preferred);
        return string.IsNullOrEmpty(first) ? all : new[] { first }.Concat(all.Where(x => x != first)).Distinct(StringComparer.Ordinal).ToArray();
    }

    private static string? FindBrowserPath(string? preferred)
    {
        foreach (var family in BrowserPreferenceOrder(preferred))
        {
            var names = family switch
            {
                "brave" => new[] { "brave-browser", "brave" },
                "chrome" => new[] { "google-chrome-stable", "google-chrome" },
                "chromium" => new[] { "chromium", "chromium-browser" },
                "edge" => new[] { "microsoft-edge-stable", "microsoft-edge" },
                _ => Array.Empty<string>()
            };
            foreach (var name in names)
            {
                var path = Which(name);
                if (path is not null) return path;
            }
        }
        return null;
    }

    private static string? Which(string command)
    {
        foreach (var dir in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(dir, command);
            if (File.Exists(candidate)) return candidate;
        }
        return null;
    }

    private static string Normalize(string? name)
    {
        var value = (name ?? "").Trim().ToLowerInvariant();
        if (value.Contains("brave")) return "brave";
        if (value.Contains("chrom")) return value.Contains("ium") ? "chromium" : "chrome";
        if (value.Contains("edge")) return "edge";
        return "";
    }
}

public sealed record BrowserStartBudget(List<DateTimeOffset> Starts, DateTimeOffset? CircuitOpenUntil)
{
    public static async Task<BrowserStartBudget> LoadAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (!File.Exists(BridgeConfig.BrowserStartBudgetPath)) return new BrowserStartBudget([], null);
            var json = await File.ReadAllTextAsync(BridgeConfig.BrowserStartBudgetPath, cancellationToken);
            return JsonSerializer.Deserialize<BrowserStartBudget>(json, BridgeConfig.JsonOptions) ?? new BrowserStartBudget([], null);
        }
        catch { return new BrowserStartBudget([], null); }
    }

    public bool CanStart(BridgeConfig config, DateTimeOffset now, out DateTimeOffset circuitUntil)
    {
        if (CircuitOpenUntil is { } open && open > now) { circuitUntil = open; return false; }
        var cutoff = now.AddMinutes(-config.BrowserStartWindowMinutes);
        if (Starts.Count(x => x >= cutoff) >= config.BrowserMaxStartsPerWindow)
        {
            circuitUntil = now.AddMinutes(config.BrowserStartCircuitCooldownMinutes);
            try
            {
                Directory.CreateDirectory(BridgeConfig.StateDirectory);
                File.WriteAllText(BridgeConfig.BrowserStartBudgetPath, JsonSerializer.Serialize(this with { CircuitOpenUntil = circuitUntil }, BridgeConfig.JsonOptions));
            }
            catch { }
            return false;
        }
        circuitUntil = default;
        return true;
    }

    public async Task RecordStartAsync(BridgeConfig config, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var cutoff = now.AddMinutes(-config.BrowserStartWindowMinutes);
        var next = Starts.Where(x => x >= cutoff).Append(now).TakeLast(config.BrowserMaxStartsPerWindow + 2).ToList();
        Directory.CreateDirectory(BridgeConfig.StateDirectory);
        await File.WriteAllTextAsync(BridgeConfig.BrowserStartBudgetPath,
            JsonSerializer.Serialize(new BrowserStartBudget(next, null), BridgeConfig.JsonOptions), cancellationToken);
    }
}

public sealed record BackblazeCredentials(string KeyId, string ApplicationKey)
{
    public bool IsValid => SecureBackblazeCredentialStore.IsValidKeyId(KeyId) && SecureBackblazeCredentialStore.IsValidApplicationKey(ApplicationKey);
}

public static class SecureBackblazeCredentialStore
{
    public static bool IsValidKeyId(string? value) => !string.IsNullOrWhiteSpace(value) && value.Length <= 256 && !value.Any(char.IsWhiteSpace);
    public static bool IsValidApplicationKey(string? value) => !string.IsNullOrWhiteSpace(value) && value.Length <= 1024 && !value.Any(char.IsWhiteSpace);
}

public static class SecureDashboardWriteKeyStore
{
    public static bool IsValidWriteKey(string? value) => !string.IsNullOrWhiteSpace(value) && value.Length is >= 16 and <= 4096 && !value.Any(char.IsWhiteSpace);
}

public static class SecureTokenStore
{
    public static bool IsValidToken(string? value) => !string.IsNullOrWhiteSpace(value) && value.Length is >= 16 and <= 8192 && !value.Any(char.IsWhiteSpace);
}

public sealed class LinuxSecretStore
{
    public const string ServiceName = "aio-bot-linux-bridge";

    public async Task<string?> LoadAsync(string key, string? environmentVariable = null, CancellationToken cancellationToken = default)
    {
        var env = string.IsNullOrWhiteSpace(environmentVariable) ? null : Environment.GetEnvironmentVariable(environmentVariable);
        if (!string.IsNullOrWhiteSpace(env)) return env.Trim();
        if (!IsAvailable()) return null;
        var result = await RunSecretToolAsync(["lookup", "service", ServiceName, "key", key], null, cancellationToken);
        return result.ExitCode == 0 && !string.IsNullOrWhiteSpace(result.Stdout) ? result.Stdout.Trim() : null;
    }

    public async Task SaveAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new InvalidOperationException("SECRET_VALUE_REQUIRED");
        var result = await RunSecretToolAsync(["store", "--label", "AIO Bot Linux Bridge: " + key, "service", ServiceName, "key", key], value, cancellationToken);
        if (result.ExitCode != 0) throw new InvalidOperationException("SECRET_STORE_FAILED:" + Limit(result.Stderr));
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        var result = await RunSecretToolAsync(["clear", "service", ServiceName, "key", key], null, cancellationToken);
        if (result.ExitCode != 0 && result.ExitCode != 1) throw new InvalidOperationException("SECRET_DELETE_FAILED:" + Limit(result.Stderr));
    }

    public static bool IsAvailable() => FindInPath("secret-tool") is not null;

    private static async Task<(int ExitCode, string Stdout, string Stderr)> RunSecretToolAsync(IReadOnlyList<string> args, string? stdin, CancellationToken cancellationToken)
    {
        var tool = FindInPath("secret-tool") ?? throw new InvalidOperationException("LINUX_SECRET_SERVICE_UNAVAILABLE: install libsecret-tools");
        var start = new ProcessStartInfo { FileName = tool, UseShellExecute = false, RedirectStandardInput = stdin is not null, RedirectStandardOutput = true, RedirectStandardError = true, CreateNoWindow = true };
        foreach (var arg in args) start.ArgumentList.Add(arg);
        using var process = Process.Start(start) ?? throw new InvalidOperationException("SECRET_TOOL_START_FAILED");
        if (stdin is not null) { await process.StandardInput.WriteAsync(stdin); process.StandardInput.Close(); }
        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        return (process.ExitCode, await stdoutTask, await stderrTask);
    }

    private static string? FindInPath(string name)
    {
        foreach (var dir in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(dir, name);
            if (File.Exists(candidate)) return candidate;
        }
        return null;
    }

    private static string Limit(string text) => text.Trim().Length <= 240 ? text.Trim() : text.Trim()[..240];
}

public static class SystemdNotifier
{
    public static Task ReadyAsync(string status, CancellationToken cancellationToken = default) => NotifyAsync(["--ready", "--status=" + status], cancellationToken);
    public static Task WatchdogAsync(string status, CancellationToken cancellationToken = default) => NotifyAsync(["WATCHDOG=1", "STATUS=" + status], cancellationToken);
    public static Task StoppingAsync(CancellationToken cancellationToken = default) => NotifyAsync(["--stopping"], cancellationToken);

    private static async Task NotifyAsync(IReadOnlyList<string> args, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("NOTIFY_SOCKET"))) return;
        try
        {
            var start = new ProcessStartInfo { FileName = "systemd-notify", UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true, CreateNoWindow = true };
            foreach (var arg in args) start.ArgumentList.Add(arg);
            using var process = Process.Start(start);
            if (process is not null) await process.WaitForExitAsync(cancellationToken);
        }
        catch { }
    }
}
