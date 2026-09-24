using System.Diagnostics;

namespace AioBotLinuxBridge;

internal static class LinuxSecretStore
{
    private const string Application = "aio-bot-linux-bridge";

    public static bool IsAvailable() => FindExecutable("secret-tool") is not null;

    public static async Task<string?> LookupAsync(string key, CancellationToken cancellationToken = default)
    {
        var executable = FindExecutable("secret-tool");
        if (executable is null) return null;

        var result = await RunAsync(
            executable,
            ["lookup", "application", Application, "key", key],
            null,
            cancellationToken);

        if (result.ExitCode != 0) return null;
        var value = result.Stdout.TrimEnd('\r', '\n');
        return string.IsNullOrEmpty(value) ? null : value;
    }

    public static async Task StoreAsync(string key, string secret, CancellationToken cancellationToken = default)
    {
        var executable = FindExecutable("secret-tool")
            ?? throw new InvalidOperationException("LINUX_SECRET_SERVICE_UNAVAILABLE_USE_ENVIRONMENT");

        var result = await RunAsync(
            executable,
            [$"store", $"--label=AIO Bot Linux Bridge · {key}", "application", Application, "key", key],
            secret,
            cancellationToken);

        if (result.ExitCode != 0)
            throw new InvalidOperationException("LINUX_SECRET_SERVICE_STORE_FAILED:" + Bound(result.Stderr));
    }

    public static async Task ClearAsync(string key, CancellationToken cancellationToken = default)
    {
        var executable = FindExecutable("secret-tool");
        if (executable is null) return;

        var result = await RunAsync(
            executable,
            ["clear", "application", Application, "key", key],
            null,
            cancellationToken);

        // secret-tool returns non-zero when no matching secret exists on some implementations.
        if (result.ExitCode != 0 && !string.IsNullOrWhiteSpace(result.Stderr))
            throw new InvalidOperationException("LINUX_SECRET_SERVICE_CLEAR_FAILED:" + Bound(result.Stderr));
    }

    private static async Task<ProcessResult> RunAsync(
        string executable,
        IReadOnlyList<string> arguments,
        string? stdin,
        CancellationToken cancellationToken)
    {
        var start = new ProcessStartInfo
        {
            FileName = executable,
            UseShellExecute = false,
            RedirectStandardInput = stdin is not null,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };
        foreach (var argument in arguments) start.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = start };
        if (!process.Start()) throw new InvalidOperationException("LINUX_SECRET_SERVICE_START_FAILED");

        if (stdin is not null)
        {
            await process.StandardInput.WriteAsync(stdin.AsMemory(), cancellationToken);
            await process.StandardInput.WriteLineAsync();
            process.StandardInput.Close();
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeout.Token);
        try
        {
            await process.WaitForExitAsync(linked.Token);
        }
        catch (OperationCanceledException) when (timeout.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            throw new TimeoutException("LINUX_SECRET_SERVICE_TIMEOUT");
        }

        return new ProcessResult(process.ExitCode, await stdoutTask, await stderrTask);
    }

    private static string? FindExecutable(string name)
    {
        var path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        foreach (var directory in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            try
            {
                var candidate = Path.Combine(directory, name);
                if (File.Exists(candidate)) return candidate;
            }
            catch
            {
            }
        }
        return null;
    }

    private static string Bound(string value)
    {
        var text = value.Trim();
        return text.Length <= 300 ? text : text[..300];
    }

    private sealed record ProcessResult(int ExitCode, string Stdout, string Stderr);
}
