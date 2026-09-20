using System.Diagnostics;

namespace ForeverDataMiner;

public static class ProviderManager
{
    public static string? LocateWowToolsLocal()
    {
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "wow.tools.local.exe"),
            Path.Combine(AppContext.BaseDirectory, "tools", "wow.tools.local", "wow.tools.local.exe"),
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ForeverGuide", "Tools", "wow.tools.local", "wow.tools.local.exe"),
        };

        return candidates.FirstOrDefault(File.Exists);
    }

    public static async Task<Process?> EnsureRunningAsync(
        Uri baseUri,
        string wowRoot,
        string? wowProduct,
        CancellationToken cancellationToken)
    {
        if (await IsReadyAsync(baseUri, cancellationToken))
            return null;

        var executable = LocateWowToolsLocal();
        if (executable is null)
            return null;

        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            WorkingDirectory = Path.GetDirectoryName(executable)!,
            UseShellExecute = false,
            CreateNoWindow = true,
            Arguments = $"-wowFolder \"{wowRoot}\" -wowProduct {QuoteArg(wowProduct ?? "wow_beta")}",
        };

        var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("wow.tools.local could not be started.");

        for (var attempt = 0; attempt < 90; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (process.HasExited)
                throw new InvalidOperationException(
                    $"wow.tools.local exited before its API became available (exit code {process.ExitCode}).");

            if (await IsReadyAsync(baseUri, cancellationToken))
                return process;

            await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
        }

        Stop(process);
        throw new TimeoutException("wow.tools.local did not expose its local API.");
    }

    private static string QuoteArg(string value) =>
        "\"" + value.Replace("\"", "\\\"") + "\"";

    public static void Stop(Process? process)
    {
        if (process is null) return;

        try
        {
            if (!process.HasExited)
                process.Kill(entireProcessTree: true);
        }
        catch
        {
            // Provider shutdown failure must not corrupt an already created data bundle.
        }
        finally
        {
            process.Dispose();
        }
    }

    private static async Task<bool> IsReadyAsync(Uri baseUri, CancellationToken cancellationToken)
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            using var response = await http.GetAsync(baseUri, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return false;
        }
    }
}
