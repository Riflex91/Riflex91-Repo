using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;

namespace ForeverDataMiner;

public sealed class ManagedWowToolsProcess(Process? process) : IAsyncDisposable
{
    public bool StartedByMiner => process is not null;

    public async ValueTask DisposeAsync()
    {
        if (process is null) return;

        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                await process.WaitForExitAsync();
            }
        }
        catch
        {
            // Best effort: provider shutdown must not hide the collected dataset.
        }
        finally
        {
            process.Dispose();
        }
    }
}

public static class WowToolsProviderBootstrapper
{
    private static readonly JsonSerializerOptions MarkerJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private const string LatestReleaseApi =
        "https://api.github.com/repos/Marlamin/wow.tools.local/releases/latest";
    private const string WindowsAssetName = "Release-win-x64.zip";

    private static string ProviderRoot => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ForeverGuide",
        "ForeverDataMiner",
        "provider");

    private static string MarkerPath => Path.Combine(ProviderRoot, "provider.json");

    public static bool IsInstalled()
    {
        var install = LoadInstalled();
        return install is not null && File.Exists(install.ExecutablePath);
    }

    public static async Task<string> InstallOrUpdateAsync(
        Action<string>? log = null,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(ProviderRoot);

        using var http = CreateHttpClient();
        log?.Invoke("Prüfe offizielle wow.tools.local-Version …");

        using var response = await http.GetAsync(LatestReleaseApi, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var releaseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var release = await JsonDocument.ParseAsync(releaseStream, cancellationToken: cancellationToken);

        var root = release.RootElement;
        var tag = root.GetProperty("tag_name").GetString()
            ?? throw new InvalidDataException("Latest wow.tools.local release has no tag_name.");

        JsonElement? selectedAsset = null;
        foreach (var releaseAsset in root.GetProperty("assets").EnumerateArray())
        {
            if (string.Equals(releaseAsset.GetProperty("name").GetString(), WindowsAssetName, StringComparison.OrdinalIgnoreCase))
            {
                selectedAsset = releaseAsset;
                break;
            }
        }

        if (selectedAsset is null)
            throw new InvalidDataException($"Latest wow.tools.local release has no {WindowsAssetName} asset.");

        var existing = LoadInstalled();
        if (existing is not null &&
            string.Equals(existing.Version, tag, StringComparison.OrdinalIgnoreCase) &&
            File.Exists(existing.ExecutablePath))
        {
            log?.Invoke($"wow.tools.local {tag} ist bereits installiert.");
            return existing.ExecutablePath;
        }

        var asset = selectedAsset.Value;
        var downloadUrl = asset.GetProperty("browser_download_url").GetString()
            ?? throw new InvalidDataException("wow.tools.local release asset has no download URL.");
        var expectedDigest = asset.TryGetProperty("digest", out var digestElement)
            ? digestElement.GetString()
            : null;

        var cacheDirectory = Path.Combine(ProviderRoot, "downloads");
        Directory.CreateDirectory(cacheDirectory);
        var zipPath = Path.Combine(cacheDirectory, $"wow.tools.local-{tag}.zip");

        log?.Invoke($"Lade wow.tools.local {tag} von der offiziellen GitHub-Release-Seite …");
        using (var download = await http.GetAsync(downloadUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken))
        {
            download.EnsureSuccessStatusCode();
            await using var source = await download.Content.ReadAsStreamAsync(cancellationToken);
            await using var target = File.Create(zipPath);
            await source.CopyToAsync(target, cancellationToken);
        }

        var actualDigest = await Sha256FileAsync(zipPath, cancellationToken);
        if (!string.IsNullOrWhiteSpace(expectedDigest) &&
            expectedDigest.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase))
        {
            var expected = expectedDigest["sha256:".Length..].Trim();
            if (!string.Equals(expected, actualDigest, StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("SHA-256 verification for wow.tools.local failed.");
        }

        log?.Invoke("SHA-256-Prüfung erfolgreich.");

        var versionDirectory = Path.Combine(ProviderRoot, "versions", Sanitize(tag));
        if (Directory.Exists(versionDirectory))
            Directory.Delete(versionDirectory, recursive: true);
        Directory.CreateDirectory(versionDirectory);

        ZipFile.ExtractToDirectory(zipPath, versionDirectory, overwriteFiles: true);

        var executable = Directory
            .EnumerateFiles(versionDirectory, "wow.tools.local.exe", SearchOption.AllDirectories)
            .FirstOrDefault()
            ?? throw new FileNotFoundException("wow.tools.local.exe was not found in the official release archive.");

        var marker = new ProviderInstallMarker
        {
            Version = tag,
            ExecutablePath = executable,
            ArchiveSha256 = actualDigest,
            InstalledUtc = DateTimeOffset.UtcNow
        };

        SaveInstalled(marker);

        log?.Invoke($"wow.tools.local {tag} eingerichtet.");
        return executable;
    }

    public static async Task<ManagedWowToolsProcess> StartInstalledAsync(
        string wowRoot,
        string? wowProduct,
        Uri baseUri,
        Action<string>? log = null,
        CancellationToken cancellationToken = default)
    {
        if (await WowToolsLocalClient.IsAvailableAsync(baseUri, cancellationToken))
        {
            log?.Invoke("Vorhandener wow.tools.local-Provider wird verwendet.");
            return new ManagedWowToolsProcess(null);
        }

        if (ProcessState.IsWowRunning())
            throw new InvalidOperationException(
                "wow.tools.local wird nicht gestartet, solange ein WoW-Client läuft.");

        if (ProcessState.IsBattleNetRunning())
            throw new InvalidOperationException(
                "Bitte Battle.net/Blizzard Agent vor dem verwalteten DB2-Scan schließen.");

        var install = LoadInstalled();
        if (install is null || !File.Exists(install.ExecutablePath))
            throw new InvalidOperationException(
                "Der DB2-Provider ist noch nicht eingerichtet. In der GUI zuerst „Provider einrichten“ wählen.");

        var startInfo = new ProcessStartInfo
        {
            FileName = install.ExecutablePath,
            WorkingDirectory = Path.GetDirectoryName(install.ExecutablePath)!,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        startInfo.ArgumentList.Add("-wowFolder");
        startInfo.ArgumentList.Add(wowRoot);

        if (!string.IsNullOrWhiteSpace(wowProduct))
        {
            startInfo.ArgumentList.Add("-wowProduct");
            startInfo.ArgumentList.Add(wowProduct);
        }

        log?.Invoke($"Starte wow.tools.local {install.Version} …");
        var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("wow.tools.local could not be started.");

        process.OutputDataReceived += (_, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Data))
                log?.Invoke("WTL: " + e.Data);
        };
        process.ErrorDataReceived += (_, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Data))
                log?.Invoke("WTL: " + e.Data);
        };
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        var deadline = DateTimeOffset.UtcNow.AddMinutes(3);
        while (DateTimeOffset.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (process.HasExited)
            {
                process.Dispose();
                throw new InvalidOperationException(
                    "wow.tools.local wurde beendet, bevor der lokale Provider erreichbar war.");
            }

            if (await WowToolsLocalClient.IsAvailableAsync(baseUri, cancellationToken))
            {
                log?.Invoke("wow.tools.local ist bereit.");
                return new ManagedWowToolsProcess(process);
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        try { process.Kill(entireProcessTree: true); } catch { }
        process.Dispose();
        throw new TimeoutException("wow.tools.local war nach drei Minuten noch nicht erreichbar.");
    }

    private static HttpClient CreateHttpClient()
    {
        var http = new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd("ForeverDataMiner/0.5");
        http.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        return http;
    }

    private static ProviderInstallMarker? LoadInstalled()
    {
        try
        {
            if (File.Exists(MarkerPath))
            {
                var marker = JsonSerializer.Deserialize<ProviderInstallMarker>(
                    File.ReadAllText(MarkerPath),
                    MarkerJsonOptions);

                if (marker is not null &&
                    !string.IsNullOrWhiteSpace(marker.ExecutablePath) &&
                    File.Exists(marker.ExecutablePath))
                {
                    return marker;
                }
            }
        }
        catch
        {
            // Fall through to recovery discovery below.
        }

        return RecoverInstalledProvider();
    }

    private static ProviderInstallMarker? RecoverInstalledProvider()
    {
        try
        {
            var versionsRoot = Path.Combine(ProviderRoot, "versions");
            if (!Directory.Exists(versionsRoot))
                return null;

            var executable = Directory
                .EnumerateFiles(versionsRoot, "wow.tools.local.exe", SearchOption.AllDirectories)
                .OrderByDescending(File.GetLastWriteTimeUtc)
                .FirstOrDefault();

            if (executable is null)
                return null;

            var relative = Path.GetRelativePath(versionsRoot, executable);
            var version = relative
                .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))
                ?? "recovered";

            var marker = new ProviderInstallMarker
            {
                Version = version,
                ExecutablePath = executable,
                ArchiveSha256 = string.Empty,
                InstalledUtc = File.GetLastWriteTimeUtc(executable)
            };

            SaveInstalled(marker);
            return marker;
        }
        catch
        {
            return null;
        }
    }

    private static void SaveInstalled(ProviderInstallMarker marker)
    {
        Directory.CreateDirectory(ProviderRoot);
        File.WriteAllText(
            MarkerPath,
            JsonSerializer.Serialize(marker, MarkerJsonOptions));
    }

    private static async Task<string> Sha256FileAsync(string path, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(path);
        using var sha = SHA256.Create();
        var hash = await sha.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Sanitize(string value) =>
        string.Concat(value.Select(c => char.IsLetterOrDigit(c) || c is '.' or '-' or '_' ? c : '_'));

    private sealed class ProviderInstallMarker
    {
        public string Version { get; set; } = string.Empty;
        public string ExecutablePath { get; set; } = string.Empty;
        public string ArchiveSha256 { get; set; } = string.Empty;
        public DateTimeOffset InstalledUtc { get; set; }
    }
}
