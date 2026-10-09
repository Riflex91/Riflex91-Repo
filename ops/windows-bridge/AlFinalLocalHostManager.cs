using System.Diagnostics;
using System.IO.Compression;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

/// <summary>
/// Dedicated, opt-in ALFinal SSD-host manager. No gameplay authority, generic
/// command execution, takeover of another Node process, or browser storage access.
/// Host code updates are applied only while port 17391 is unoccupied.
/// </summary>
public sealed record AlFinalHostRelease(
    int SchemaVersion,
    string Product,
    string Channel,
    string PackageVersion,
    string CommitSha,
    string AssetUrl,
    string Sha256,
    long Bytes,
    string ReleasedAt);

public sealed class AlFinalLocalHostManager : IAsyncDisposable
{
    public const string ManifestUrl =
        "https://github.com/Riflex91/ALFinal/releases/download/albot-host-latest/albot-host.json";
    public const string ArchiveUrl =
        "https://github.com/Riflex91/ALFinal/releases/download/albot-host-latest/albot-host.zip";
    public const string HostDirectory = @"D:\ALBot\host";
    public const string StateDirectory = @"D:\ALBot\state";
    public const string BackupDirectory = @"D:\ALBot\backup\host";
    public const string StagingDirectory = @"D:\ALBot\updates";
    public const string StatusFileName = "albot-host-update-status.json";
    public const int HostPort = 17391;
    public const int CheckIntervalMinutes = 5;
    public const int MaximumArchiveBytes = 8 * 1024 * 1024;
    public const int MaximumFileBytes = 4 * 1024 * 1024;

    private static readonly string[] RequiredFiles =
        ["telemetry-recorder.mjs", "h22-host-watchdog.mjs", "durable-storage.mjs"];
    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient _http;
    private readonly CancellationTokenSource _stop = new();
    private Task? _loop;
    private Process? _ownedProcess;
    private int _restartAttempts;
    private DateTimeOffset _restartWindow = DateTimeOffset.UtcNow;

    public AlFinalLocalHostManager(HttpMessageHandler? handler = null)
    {
        _http = handler is null ? new HttpClient() : new HttpClient(handler, disposeHandler: true);
        _http.Timeout = TimeSpan.FromSeconds(30);
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("AioBotWindowsBridge-AlFinalHost/1.0");
    }

    public Task StartAsync()
    {
        _loop ??= Task.Run(() => RunLoopAsync(_stop.Token));
        return Task.CompletedTask;
    }

    private async Task RunLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try { await CheckAndManageOnceAsync(cancellationToken); }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { break; }
            catch (Exception error)
            {
                await RecordStatusAsync("FAILED", error.GetType().Name + ": " + error.Message);
            }
            try { await Task.Delay(TimeSpan.FromMinutes(CheckIntervalMinutes), cancellationToken); }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { break; }
        }
    }

    public static void ValidateManifest(AlFinalHostRelease manifest)
    {
        if (manifest.SchemaVersion != 1 || manifest.Product != "AL Bot Local Host"
            || manifest.Channel != "stable"
            || !string.Equals(manifest.AssetUrl, ArchiveUrl, StringComparison.Ordinal)
            || !Regex.IsMatch(manifest.CommitSha ?? "", "^[a-f0-9]{40}$", RegexOptions.IgnoreCase)
            || !Regex.IsMatch(manifest.Sha256 ?? "", "^[a-f0-9]{64}$", RegexOptions.IgnoreCase)
            || !Regex.IsMatch(manifest.PackageVersion ?? "", @"^\d+\.\d+\.\d+$")
            || manifest.Bytes is < 100 or > MaximumArchiveBytes
            || !DateTimeOffset.TryParse(manifest.ReleasedAt, out _))
            throw new InvalidOperationException("ALFINAL_HOST_MANIFEST_INVALID");
    }

    public static bool IsNewer(AlFinalHostRelease next, AlFinalHostRelease? installed)
    {
        ValidateManifest(next);
        if (installed is null) return true;
        ValidateManifest(installed);
        var candidate = Version.Parse(next.PackageVersion);
        var current = Version.Parse(installed.PackageVersion);
        // Never downgrade or replace a stable version with a different build.
        return candidate > current;
    }

    public static IReadOnlyDictionary<string, byte[]> ValidateArchive(
        byte[] bytes, AlFinalHostRelease manifest)
    {
        ValidateManifest(manifest);
        if (bytes.Length != manifest.Bytes || bytes.Length > MaximumArchiveBytes
            || !string.Equals(Convert.ToHexString(SHA256.HashData(bytes)),
                manifest.Sha256, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ALFINAL_HOST_ARCHIVE_HASH_MISMATCH");

        using var stream = new MemoryStream(bytes, writable: false);
        using var zip = new ZipArchive(stream, ZipArchiveMode.Read);
        var files = new Dictionary<string, byte[]>(StringComparer.Ordinal);
        foreach (var entry in zip.Entries)
        {
            // Explicit names only: block zip-slip, duplicate entries and symlinks.
            if (!RequiredFiles.Contains(entry.FullName, StringComparer.Ordinal)
                || entry.Length < 1 || entry.Length > MaximumFileBytes
                || files.ContainsKey(entry.FullName)
                || ((entry.ExternalAttributes >> 16) & 0xF000) == 0xA000)
                throw new InvalidOperationException("ALFINAL_HOST_ARCHIVE_ENTRY_REJECTED");
            using var input = entry.Open();
            using var dest = new MemoryStream();
            input.CopyTo(dest);
            if (dest.Length != entry.Length || dest.Length > MaximumFileBytes)
                throw new InvalidOperationException("ALFINAL_HOST_ARCHIVE_LENGTH_MISMATCH");
            files.Add(entry.FullName, dest.ToArray());
        }
        if (files.Count != RequiredFiles.Length)
            throw new InvalidOperationException("ALFINAL_HOST_ARCHIVE_INCOMPLETE");
        return files;
    }

    public async Task<string> CheckAndManageOnceAsync(CancellationToken cancellationToken = default)
    {
        // Never take over a host launched from a developer checkout or another process.
        var occupied = await IsPortOccupiedAsync(cancellationToken);
        if (occupied)
        {
            await RecordStatusAsync("EXTERNAL_OR_RUNNING_HOST", "PORT_17391_OCCUPIED");
            return "EXTERNAL_OR_RUNNING_HOST";
        }

        var manifestBytes = await GetBoundedAsync(ManifestUrl, 64 * 1024, cancellationToken);
        var manifest = JsonSerializer.Deserialize<AlFinalHostRelease>(manifestBytes, JsonOptions)
            ?? throw new InvalidOperationException("ALFINAL_HOST_MANIFEST_MISSING");
        ValidateManifest(manifest);

        var installed = ReadInstalledManifest();
        if (IsNewer(manifest, installed))
        {
            var archive = await GetBoundedAsync(ArchiveUrl, MaximumArchiveBytes, cancellationToken);
            var files = ValidateArchive(archive, manifest);
            ApplyWhileStopped(files, manifest);
            await RecordStatusAsync("INSTALLED", manifest.PackageVersion);
        }
        else if (installed is not null && !Directory.Exists(HostDirectory))
            throw new InvalidOperationException("ALFINAL_HOST_INSTALLED_DIRECTORY_MISSING");

        if (File.Exists(Path.Combine(HostDirectory, RequiredFiles[0])))
        {
            if (DateTimeOffset.UtcNow - _restartWindow > TimeSpan.FromMinutes(30))
            {
                _restartAttempts = 0;
                _restartWindow = DateTimeOffset.UtcNow;
            }
            if (++_restartAttempts > 3)
                throw new InvalidOperationException("ALFINAL_HOST_RESTART_BUDGET_EXHAUSTED");
            var info = new ProcessStartInfo
            {
                FileName = "node.exe",
                WorkingDirectory = HostDirectory,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            info.ArgumentList.Add(RequiredFiles[0]);
            _ownedProcess?.Dispose();
            _ownedProcess = Process.Start(info)
                ?? throw new InvalidOperationException("ALFINAL_HOST_NODE_START_FAILED");
            await RecordStatusAsync("STARTED", manifest.PackageVersion);
            return "STARTED";
        }
        return "NO_HOST_INSTALLED";
    }

    private static AlFinalHostRelease? ReadInstalledManifest()
    {
        var path = Path.Combine(HostDirectory, "host-version.json");
        if (!File.Exists(path)) return null;
        var manifest = JsonSerializer.Deserialize<AlFinalHostRelease>(File.ReadAllBytes(path), JsonOptions);
        if (manifest is null) throw new InvalidOperationException("ALFINAL_HOST_INSTALLED_MANIFEST_INVALID");
        ValidateManifest(manifest);
        return manifest;
    }

    private static void ApplyWhileStopped(
        IReadOnlyDictionary<string, byte[]> files, AlFinalHostRelease manifest)
    {
        // Do not mutate any existing data under D:\ALBot\state or telemetry.
        Directory.CreateDirectory(StagingDirectory);
        Directory.CreateDirectory(BackupDirectory);
        var stage = Path.Combine(StagingDirectory, "host-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(stage);
        string? backup = null;
        try
        {
            foreach (var pair in files)
                File.WriteAllBytes(Path.Combine(stage, pair.Key), pair.Value);
            File.WriteAllBytes(Path.Combine(stage, "host-version.json"),
                JsonSerializer.SerializeToUtf8Bytes(manifest));

            if (Directory.Exists(HostDirectory))
            {
                backup = Path.Combine(BackupDirectory, "host-" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    + "-" + Guid.NewGuid().ToString("N")[..8]);
                Directory.Move(HostDirectory, backup);
            }
            try { Directory.Move(stage, HostDirectory); }
            catch
            {
                if (backup is not null && Directory.Exists(backup) && !Directory.Exists(HostDirectory))
                    Directory.Move(backup, HostDirectory);
                throw;
            }
        }
        finally { if (Directory.Exists(stage)) Directory.Delete(stage, recursive: true); }
    }

    private async Task<byte[]> GetBoundedAsync(string url, int maxBytes, CancellationToken token)
    {
        using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, token);
        response.EnsureSuccessStatusCode();
        if (response.Content.Headers.ContentLength > maxBytes)
            throw new InvalidOperationException("ALFINAL_HOST_DOWNLOAD_TOO_LARGE");
        await using var input = await response.Content.ReadAsStreamAsync(token);
        using var output = new MemoryStream();
        var chunk = new byte[16 * 1024];
        int count;
        while ((count = await input.ReadAsync(chunk, token)) != 0)
        {
            if (output.Length + count > maxBytes)
                throw new InvalidOperationException("ALFINAL_HOST_DOWNLOAD_TOO_LARGE");
            output.Write(chunk, 0, count);
        }
        return output.ToArray();
    }

    private static async Task<bool> IsPortOccupiedAsync(CancellationToken token)
    {
        using var tcp = new TcpClient();
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(token);
        cts.CancelAfter(TimeSpan.FromSeconds(1));
        try
        {
            await tcp.ConnectAsync("127.0.0.1", HostPort, cts.Token);
            return true;
        }
        catch (System.Net.Sockets.SocketException) { return false; }
        catch (OperationCanceledException) when (!token.IsCancellationRequested) { return true; }
    }

    private static async Task RecordStatusAsync(string state, string? details)
    {
        try
        {
            Directory.CreateDirectory(BridgeConfig.LocalAppDirectory);
            var path = Path.Combine(BridgeConfig.LocalAppDirectory, StatusFileName);
            var tmp = path + ".tmp";
            await File.WriteAllBytesAsync(tmp, JsonSerializer.SerializeToUtf8Bytes(new
            {
                schemaVersion = 1, state, details, updatedAt = DateTimeOffset.UtcNow,
                hostDirectory = HostDirectory, port = HostPort
            }));
            File.Move(tmp, path, overwrite: true);
        }
        catch { /* Diagnostics must never interrupt gameplay. */ }
    }

    public async ValueTask DisposeAsync()
    {
        _stop.Cancel();
        if (_loop is not null)
        {
            try { await _loop; }
            catch (OperationCanceledException) { }
        }
        // The Bridge must not kill a running host during its own self-update.
        _ownedProcess?.Dispose();
        _http.Dispose();
        _stop.Dispose();
    }
}
