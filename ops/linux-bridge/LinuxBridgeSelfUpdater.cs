using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.Json;

namespace AioBotLinuxBridge;

public sealed record LinuxBridgeUpdateManifest(
    int SchemaVersion,
    long BuildNumber,
    string Version,
    string AssetUrl,
    string Sha256,
    long SizeBytes,
    string PublishedAt);

public sealed record PreparedLinuxBridgeUpdate(
    long BuildNumber,
    string Version,
    string StagedPath,
    string TargetPath,
    string Sha256);

public sealed class LinuxBridgeSelfUpdater : IAsyncDisposable
{
    public const string AssetFileName = "AioBotLinuxBridge";
    public const string ManifestFileName = "AioBotLinuxBridge.version.json";
    public static string ArchitectureSuffix => RuntimeInformation.ProcessArchitecture switch
    {
        Architecture.X64 => "linux-x64",
        Architecture.Arm64 => "linux-arm64",
        _ => "unsupported"
    };
    public static string ReleaseTag => "linux-bridge-latest-" + ArchitectureSuffix;
    public static string AssetUrl => $"https://github.com/Riflex91/Riflex91-Repo/releases/download/{ReleaseTag}/{AssetFileName}";
    public static string ManifestUrl => $"https://github.com/Riflex91/Riflex91-Repo/releases/download/{ReleaseTag}/{ManifestFileName}";
    public const string StatusFileName = "self-update-status.json";
    private const long MaxAssetBytes = 500L * 1024 * 1024;
    private readonly HttpClient _httpClient;
    private readonly CancellationTokenSource _cts = new();
    private Task? _loop;

    public event Action<PreparedLinuxBridgeUpdate>? UpdateInstallerStarted;

    public LinuxBridgeSelfUpdater(HttpMessageHandler? handler = null)
    {
        _httpClient = handler is null ? new HttpClient() : new HttpClient(handler, disposeHandler: true);
        _httpClient.Timeout = TimeSpan.FromSeconds(45);
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("AioBotLinuxBridge-SelfUpdater/1.0");
    }

    public Task StartAsync()
    {
        _loop ??= Task.Run(() => RunLoopAsync(_cts.Token));
        return Task.CompletedTask;
    }

    private async Task RunLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var prepared = await CheckAndPrepareAsync(cancellationToken);
                if (prepared is not null)
                {
                    LaunchInstaller(prepared);
                    UpdateInstallerStarted?.Invoke(prepared);
                    return;
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception error)
            {
                await WriteStatusAsync("CHECK_FAILED", null, error.Message, cancellationToken);
            }

            await Task.Delay(TimeSpan.FromSeconds(60), cancellationToken);
        }
    }

    public async Task<PreparedLinuxBridgeUpdate?> CheckAndPrepareAsync(CancellationToken cancellationToken = default)
    {
        if (ArchitectureSuffix == "unsupported")
        {
            await WriteStatusAsync("UP_TO_DATE", null, "SELF_UPDATE_ARCHITECTURE_UNSUPPORTED:" + RuntimeInformation.ProcessArchitecture, cancellationToken);
            return null;
        }

        var targetPath = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(targetPath)
            || !string.Equals(Path.GetFileName(targetPath), AssetFileName, StringComparison.Ordinal))
        {
            await WriteStatusAsync("UP_TO_DATE", null, "SELF_UPDATE_REQUIRES_PUBLISHED_BINARY", cancellationToken);
            return null;
        }

        await WriteStatusAsync("CHECKING", null, null, cancellationToken);
        var manifest = await LoadManifestAsync(cancellationToken);
        ValidateManifest(manifest);

        if (manifest.BuildNumber <= CurrentBuildNumber())
        {
            await WriteStatusAsync("UP_TO_DATE", manifest, null, cancellationToken);
            return null;
        }

        Directory.CreateDirectory(BridgeConfig.SelfUpdateDirectory);
        var stagedPath = Path.Combine(BridgeConfig.SelfUpdateDirectory, "AioBotLinuxBridge.update");
        if (!await IsValidStagedFileAsync(stagedPath, manifest, cancellationToken))
            await DownloadAndVerifyAsync(stagedPath, manifest, cancellationToken);

        var prepared = new PreparedLinuxBridgeUpdate(
            manifest.BuildNumber,
            manifest.Version,
            stagedPath,
            targetPath,
            manifest.Sha256.ToLowerInvariant());

        await WriteStatusAsync("READY_TO_INSTALL", manifest, null, cancellationToken);
        return prepared;
    }

    public static long CurrentBuildNumber()
    {
        var attribute = Assembly.GetExecutingAssembly()
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .FirstOrDefault(a => string.Equals(a.Key, "BridgeBuildNumber", StringComparison.Ordinal));
        return long.TryParse(attribute?.Value, out var build) && build >= 0 ? build : 0;
    }

    public static void ValidateManifest(LinuxBridgeUpdateManifest manifest)
    {
        if (manifest.SchemaVersion != 1) throw new InvalidOperationException("SELF_UPDATE_MANIFEST_SCHEMA_UNSUPPORTED");
        if (manifest.BuildNumber <= 0) throw new InvalidOperationException("SELF_UPDATE_BUILD_NUMBER_INVALID");
        if (string.IsNullOrWhiteSpace(manifest.Version) || manifest.Version.Length > 200)
            throw new InvalidOperationException("SELF_UPDATE_VERSION_INVALID");
        if (!string.Equals(manifest.AssetUrl, AssetUrl, StringComparison.Ordinal))
            throw new InvalidOperationException("SELF_UPDATE_ASSET_URL_INVALID");
        if (manifest.Sha256.Length != 64 || manifest.Sha256.Any(c => !Uri.IsHexDigit(c)))
            throw new InvalidOperationException("SELF_UPDATE_SHA256_INVALID");
        if (manifest.SizeBytes <= 0 || manifest.SizeBytes > MaxAssetBytes)
            throw new InvalidOperationException("SELF_UPDATE_SIZE_INVALID");
        if (!DateTimeOffset.TryParse(manifest.PublishedAt, out _))
            throw new InvalidOperationException("SELF_UPDATE_PUBLISHED_AT_INVALID");
    }

    private async Task<LinuxBridgeUpdateManifest> LoadManifestAsync(CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(ManifestUrl + "?check=" + DateTimeOffset.UtcNow.ToUnixTimeSeconds(), cancellationToken);
        response.EnsureSuccessStatusCode();
        if (response.Content.Headers.ContentLength is > 65_536)
            throw new InvalidOperationException("SELF_UPDATE_MANIFEST_TOO_LARGE");
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        if (bytes.Length > 65_536) throw new InvalidOperationException("SELF_UPDATE_MANIFEST_TOO_LARGE");
        return JsonSerializer.Deserialize<LinuxBridgeUpdateManifest>(bytes, BridgeConfig.JsonOptions)
            ?? throw new InvalidOperationException("SELF_UPDATE_MANIFEST_INVALID");
    }

    private async Task DownloadAndVerifyAsync(
        string stagedPath,
        LinuxBridgeUpdateManifest manifest,
        CancellationToken cancellationToken)
    {
        var temp = stagedPath + ".tmp";
        try
        {
            using var response = await _httpClient.GetAsync(AssetUrl + "?build=" + manifest.BuildNumber,
                HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();
            if (response.Content.Headers.ContentLength is long length && length != manifest.SizeBytes)
                throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_SIZE_MISMATCH");

            await using (var input = await response.Content.ReadAsStreamAsync(cancellationToken))
            await using (var output = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None, 64 * 1024, useAsync: true))
            {
                var buffer = new byte[64 * 1024];
                long total = 0;
                int read;
                while ((read = await input.ReadAsync(buffer, cancellationToken)) > 0)
                {
                    total += read;
                    if (total > manifest.SizeBytes || total > MaxAssetBytes)
                        throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_TOO_LARGE");
                    await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                }
                if (total != manifest.SizeBytes)
                    throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_SIZE_MISMATCH");
            }

            var hash = await ComputeSha256Async(temp, cancellationToken);
            if (!string.Equals(hash, manifest.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SELF_UPDATE_SHA256_MISMATCH");

            File.SetUnixFileMode(temp,
                UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute
                | UnixFileMode.GroupRead | UnixFileMode.GroupExecute
                | UnixFileMode.OtherRead | UnixFileMode.OtherExecute);
            File.Move(temp, stagedPath, true);
        }
        finally
        {
            try { if (File.Exists(temp)) File.Delete(temp); } catch { }
        }
    }

    private static async Task<bool> IsValidStagedFileAsync(
        string stagedPath,
        LinuxBridgeUpdateManifest manifest,
        CancellationToken cancellationToken)
    {
        try
        {
            var info = new FileInfo(stagedPath);
            return info.Exists
                && info.Length == manifest.SizeBytes
                && string.Equals(await ComputeSha256Async(stagedPath, cancellationToken), manifest.Sha256, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static async Task<string> ComputeSha256Async(string path, CancellationToken cancellationToken)
    {
        await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, useAsync: true);
        var hash = await SHA256.HashDataAsync(stream, cancellationToken);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static void LaunchInstaller(PreparedLinuxBridgeUpdate prepared)
    {
        var start = new ProcessStartInfo
        {
            FileName = prepared.StagedPath,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        start.ArgumentList.Add("--apply-update");
        start.ArgumentList.Add(Environment.ProcessId.ToString());
        start.ArgumentList.Add(prepared.TargetPath);
        start.ArgumentList.Add(prepared.Sha256);
        start.ArgumentList.Add(prepared.BuildNumber.ToString());

        if (Process.Start(start) is null)
            throw new InvalidOperationException("SELF_UPDATE_INSTALLER_START_FAILED");
    }

    private static async Task WriteStatusAsync(
        string state,
        LinuxBridgeUpdateManifest? manifest,
        string? error,
        CancellationToken cancellationToken)
    {
        try
        {
            Directory.CreateDirectory(BridgeConfig.LocalAppDirectory);
            var path = Path.Combine(BridgeConfig.LocalAppDirectory, StatusFileName);
            var payload = JsonSerializer.Serialize(new
            {
                state,
                checkedAt = DateTimeOffset.UtcNow,
                currentBuildNumber = CurrentBuildNumber(),
                availableBuildNumber = manifest?.BuildNumber,
                version = manifest?.Version,
                error = string.IsNullOrWhiteSpace(error) ? null : Bound(error)
            }, BridgeConfig.JsonOptions);
            await File.WriteAllTextAsync(path, payload, cancellationToken);
            BridgeConfig.TryRestrictFile(path);
        }
        catch
        {
        }
    }

    public static void CleanupPreviousExecutable()
    {
        try
        {
            var target = Environment.ProcessPath;
            if (string.IsNullOrWhiteSpace(target)) return;
            var backup = target + ".old";
            if (File.Exists(backup)) File.Delete(backup);
        }
        catch
        {
        }
    }

    private static string Bound(string value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "UNBEKANNTER_FEHLER" : value.Trim();
        return text.Length <= 500 ? text : text[..500];
    }

    public async ValueTask DisposeAsync()
    {
        _cts.Cancel();
        if (_loop is not null)
        {
            try { await _loop; } catch (OperationCanceledException) { }
        }
        _cts.Dispose();
        _httpClient.Dispose();
    }
}

public static class LinuxBridgeUpdateBootstrap
{
    public static bool IsApplyUpdateMode(string[] args) =>
        args.Length >= 5 && string.Equals(args[0], "--apply-update", StringComparison.Ordinal);

    public static async Task<int> ApplyAsync(string[] args)
    {
        try
        {
            if (!OperatingSystem.IsLinux()) throw new PlatformNotSupportedException();
            var request = Parse(args);
            await WaitForParentAsync(request.ParentPid);

            var installer = Environment.ProcessPath
                ?? throw new InvalidOperationException("SELF_UPDATE_INSTALLER_PATH_MISSING");
            if (!string.Equals(await HashAsync(installer), request.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SELF_UPDATE_INSTALLER_HASH_MISMATCH");

            var backup = request.TargetPath + ".old";
            if (File.Exists(backup)) File.Delete(backup);
            if (File.Exists(request.TargetPath)) File.Move(request.TargetPath, backup, true);

            File.Copy(installer, request.TargetPath, true);
            File.SetUnixFileMode(request.TargetPath,
                UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute
                | UnixFileMode.GroupRead | UnixFileMode.GroupExecute
                | UnixFileMode.OtherRead | UnixFileMode.OtherExecute);

            if (!string.Equals(await HashAsync(request.TargetPath), request.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SELF_UPDATE_INSTALLED_HASH_MISMATCH");

            var restarted = Process.Start(new ProcessStartInfo
            {
                FileName = request.TargetPath,
                UseShellExecute = false,
                WorkingDirectory = Path.GetDirectoryName(request.TargetPath) ?? Environment.CurrentDirectory
            });
            if (restarted is null) throw new InvalidOperationException("SELF_UPDATE_RESTART_FAILED");

            await WriteApplyStatusAsync("APPLIED", request, null);
            return 0;
        }
        catch (Exception error)
        {
            try
            {
                var request = TryParse(args);
                if (request is not null)
                {
                    var backup = request.TargetPath + ".old";
                    if (File.Exists(backup))
                    {
                        File.Copy(backup, request.TargetPath, true);
                        File.SetUnixFileMode(request.TargetPath,
                            UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute
                            | UnixFileMode.GroupRead | UnixFileMode.GroupExecute
                            | UnixFileMode.OtherRead | UnixFileMode.OtherExecute);
                        Process.Start(new ProcessStartInfo { FileName = request.TargetPath, UseShellExecute = false });
                    }
                    await WriteApplyStatusAsync("APPLY_FAILED", request, error.Message);
                }
            }
            catch
            {
            }
            return 1;
        }
    }

    private sealed record ApplyRequest(int ParentPid, string TargetPath, string Sha256, long BuildNumber);

    private static ApplyRequest Parse(string[] args) =>
        TryParse(args) ?? throw new InvalidOperationException("SELF_UPDATE_ARGUMENTS_INVALID");

    private static ApplyRequest? TryParse(string[] args)
    {
        if (args.Length < 5 || args[0] != "--apply-update") return null;
        if (!int.TryParse(args[1], out var parentPid) || parentPid <= 0) return null;
        var target = Path.GetFullPath(args[2]);
        if (!string.Equals(Path.GetFileName(target), LinuxBridgeSelfUpdater.AssetFileName, StringComparison.Ordinal)) return null;
        var sha = args[3].ToLowerInvariant();
        if (sha.Length != 64 || sha.Any(c => !Uri.IsHexDigit(c))) return null;
        if (!long.TryParse(args[4], out var build) || build <= 0) return null;
        return new ApplyRequest(parentPid, target, sha, build);
    }

    private static async Task WaitForParentAsync(int parentPid)
    {
        for (var i = 0; i < 120; i++)
        {
            try
            {
                using var process = Process.GetProcessById(parentPid);
                if (process.HasExited) return;
            }
            catch (ArgumentException)
            {
                return;
            }
            await Task.Delay(250);
        }
        throw new InvalidOperationException("SELF_UPDATE_PARENT_DID_NOT_EXIT");
    }

    private static async Task<string> HashAsync(string path)
    {
        await using var stream = File.OpenRead(path);
        var hash = await SHA256.HashDataAsync(stream);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static async Task WriteApplyStatusAsync(string state, ApplyRequest request, string? error)
    {
        try
        {
            Directory.CreateDirectory(BridgeConfig.LocalAppDirectory);
            var path = Path.Combine(BridgeConfig.LocalAppDirectory, LinuxBridgeSelfUpdater.StatusFileName);
            await File.WriteAllTextAsync(path, JsonSerializer.Serialize(new
            {
                state,
                appliedAt = DateTimeOffset.UtcNow,
                buildNumber = request.BuildNumber,
                target = LinuxBridgeSelfUpdater.AssetFileName,
                error = string.IsNullOrWhiteSpace(error) ? null : Bound(error)
            }, BridgeConfig.JsonOptions));
            BridgeConfig.TryRestrictFile(path);
        }
        catch
        {
        }
    }

    private static string Bound(string value)
    {
        var text = value.Trim();
        return text.Length <= 500 ? text : text[..500];
    }
}
