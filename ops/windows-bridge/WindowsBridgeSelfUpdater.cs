using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record WindowsBridgeUpdateManifest(
    int SchemaVersion,
    long BuildNumber,
    string Version,
    string AssetUrl,
    string Sha256,
    long SizeBytes,
    DateTimeOffset PublishedAt);

public sealed record PreparedWindowsBridgeUpdate(
    long BuildNumber,
    string Version,
    string StagedExecutablePath,
    string TargetExecutablePath,
    string Sha256);

public sealed class WindowsBridgeSelfUpdater : IAsyncDisposable
{
    public const int CheckIntervalSeconds = 60;
    public const long MaxManifestBytes = 64 * 1024;
    public const long MaxAssetBytes = 512L * 1024 * 1024;
    public const string ReleaseTag = "windows-bridge-latest";
    public const string AssetFileName = "AioBotWindowsBridge.exe";
    public const string ManifestFileName = "AioBotWindowsBridge.version.json";
    public const string StatusFileName = "self-update-status.json";
    public const string AssetUrl = "https://github.com/Riflex91/Riflex91-Repo/releases/download/windows-bridge-latest/AioBotWindowsBridge.exe";
    public const string ManifestUrl = "https://github.com/Riflex91/Riflex91-Repo/releases/download/windows-bridge-latest/AioBotWindowsBridge.version.json";

    private static readonly Regex GitShaRegex = new(
        "^[0-9a-f]{40}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex Sha256Regex = new(
        "^[0-9a-f]{64}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly Regex InformationalVersionRegex = new(
        "^1\\.0\\.(?<build>[0-9]+)\\+(?<sha>[0-9a-f]{40})$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly CancellationTokenSource _stop = new();
    private Task? _loop;

    public event Action<PreparedWindowsBridgeUpdate>? UpdateInstallerStarted;

    public WindowsBridgeSelfUpdater(HttpMessageHandler? handler = null)
    {
        _httpClient = handler is null
            ? new HttpClient()
            : new HttpClient(handler, disposeHandler: true);
        _httpClient.Timeout = TimeSpan.FromMinutes(3);
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("AioBotWindowsBridge-SelfUpdater/1.0");
        _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Cache-Control", "no-cache, no-store");
        _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Pragma", "no-cache");
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
            try
            {
                var prepared = await CheckAndPrepareAsync(cancellationToken);
                if (prepared is not null)
                {
                    LaunchInstaller(prepared);
                    var (currentBuildNumber, currentBuildId) = CurrentBuild();
                    await WriteCheckStatusAsync(
                        "INSTALLER_STARTED",
                        currentBuildNumber,
                        currentBuildId,
                        prepared.BuildNumber,
                        prepared.Version,
                        null);
                    try
                    {
                        UpdateInstallerStarted?.Invoke(prepared);
                    }
                    catch
                    {
                        // The installer is already running and waiting for this process.
                        // UI notification failures must not launch a second updater.
                    }
                    return;
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return;
            }
            catch
            {
                // Fail open for the currently installed Bridge. A transient GitHub,
                // network, disk or validation problem is retried on the next interval.
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(CheckIntervalSeconds), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    public async Task<PreparedWindowsBridgeUpdate?> CheckAndPrepareAsync(CancellationToken cancellationToken = default)
    {
        var (currentBuildNumber, currentBuildId) = CurrentBuild();
        WindowsBridgeUpdateManifest? manifest = null;

        await WriteCheckStatusAsync(
            "CHECKING",
            currentBuildNumber,
            currentBuildId,
            null,
            null,
            null);

        try
        {
            manifest = await LoadManifestAsync(cancellationToken);
            ValidateManifest(manifest);

            if (!IsUpdateRequired(currentBuildNumber, currentBuildId, manifest))
            {
                await WriteCheckStatusAsync(
                    "UP_TO_DATE",
                    currentBuildNumber,
                    currentBuildId,
                    manifest.BuildNumber,
                    manifest.Version,
                    null);
                return null;
            }

            await WriteCheckStatusAsync(
                "UPDATE_FOUND",
                currentBuildNumber,
                currentBuildId,
                manifest.BuildNumber,
                manifest.Version,
                null);

            var targetPath = Environment.ProcessPath;
            if (string.IsNullOrWhiteSpace(targetPath)
                || !string.Equals(Path.GetFileName(targetPath), AssetFileName, StringComparison.OrdinalIgnoreCase)
                || !File.Exists(targetPath))
                throw new InvalidOperationException("SELF_UPDATE_TARGET_INVALID");

            targetPath = Path.GetFullPath(targetPath);
            EnsureTargetDirectoryWritable(targetPath);

            var stagingDirectory = Path.Combine(
                BridgeConfig.LocalAppDirectory,
                "SelfUpdate",
                $"{manifest.BuildNumber}-{manifest.Version[..12].ToLowerInvariant()}");
            Directory.CreateDirectory(stagingDirectory);

            var stagedPath = Path.Combine(stagingDirectory, "AioBotWindowsBridge.update.exe");
            if (!await IsValidStagedFileAsync(stagedPath, manifest, cancellationToken))
                await DownloadAndVerifyAsync(manifest, stagedPath, cancellationToken);

            await WriteCheckStatusAsync(
                "READY_TO_INSTALL",
                currentBuildNumber,
                currentBuildId,
                manifest.BuildNumber,
                manifest.Version,
                null);

            return new PreparedWindowsBridgeUpdate(
                manifest.BuildNumber,
                manifest.Version.ToLowerInvariant(),
                stagedPath,
                targetPath,
                manifest.Sha256.ToLowerInvariant());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            await WriteCheckStatusAsync(
                "CHECK_FAILED",
                currentBuildNumber,
                currentBuildId,
                manifest?.BuildNumber,
                manifest?.Version,
                error.GetType().Name + ": " + error.Message);
            throw;
        }
    }

    public static void ValidateManifest(WindowsBridgeUpdateManifest manifest)
    {
        if (manifest.SchemaVersion != 1)
            throw new InvalidOperationException("SELF_UPDATE_MANIFEST_SCHEMA_UNSUPPORTED");
        if (manifest.BuildNumber <= 0)
            throw new InvalidOperationException("SELF_UPDATE_BUILD_NUMBER_INVALID");
        if (!GitShaRegex.IsMatch(manifest.Version))
            throw new InvalidOperationException("SELF_UPDATE_VERSION_INVALID");
        if (!string.Equals(manifest.AssetUrl, AssetUrl, StringComparison.Ordinal))
            throw new InvalidOperationException("SELF_UPDATE_ASSET_URL_INVALID");
        if (!Sha256Regex.IsMatch(manifest.Sha256))
            throw new InvalidOperationException("SELF_UPDATE_SHA256_INVALID");
        if (manifest.SizeBytes <= 0 || manifest.SizeBytes > MaxAssetBytes)
            throw new InvalidOperationException("SELF_UPDATE_SIZE_INVALID");
        if (manifest.PublishedAt == default)
            throw new InvalidOperationException("SELF_UPDATE_PUBLISHED_AT_INVALID");
    }

    public static bool IsUpdateRequired(
        long currentBuildNumber,
        string? currentBuildId,
        WindowsBridgeUpdateManifest manifest)
    {
        ValidateManifest(manifest);

        if (currentBuildNumber > 0)
            return manifest.BuildNumber > currentBuildNumber;

        if (!string.IsNullOrWhiteSpace(currentBuildId)
            && string.Equals(currentBuildId, manifest.Version, StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    public static (long BuildNumber, string? BuildId) CurrentBuild()
    {
        var informationalVersion = Assembly.GetEntryAssembly()?
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
            .InformationalVersion;

        if (string.IsNullOrWhiteSpace(informationalVersion))
            return (0, null);

        var match = InformationalVersionRegex.Match(informationalVersion.Trim());
        if (match.Success
            && long.TryParse(match.Groups["build"].Value, NumberStyles.None, CultureInfo.InvariantCulture, out var buildNumber))
        {
            return (buildNumber, match.Groups["sha"].Value.ToLowerInvariant());
        }

        var sha = informationalVersion
            .Split(['+', '.', '-'], StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault(part => GitShaRegex.IsMatch(part));
        return (0, sha?.ToLowerInvariant());
    }

    public static void CleanupPreviousExecutable()
    {
        var processPath = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(processPath)
            || !string.Equals(Path.GetFileName(processPath), AssetFileName, StringComparison.OrdinalIgnoreCase))
            return;

        try
        {
            var backupPath = processPath + ".previous";
            if (File.Exists(backupPath))
                File.Delete(backupPath);
        }
        catch
        {
            // Best effort only. A stale rollback copy is harmless.
        }
    }

    private async Task<WindowsBridgeUpdateManifest> LoadManifestAsync(CancellationToken cancellationToken)
    {
        var cacheBuster = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);
        using var request = new HttpRequestMessage(HttpMethod.Get, ManifestUrl + "?check=" + cacheBuster);
        using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        if (response.Content.Headers.ContentLength is long length && length > MaxManifestBytes)
            throw new InvalidOperationException("SELF_UPDATE_MANIFEST_TOO_LARGE");

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var buffer = new MemoryStream();
        var chunk = new byte[8192];
        while (true)
        {
            var read = await stream.ReadAsync(chunk, cancellationToken);
            if (read == 0) break;
            if (buffer.Length + read > MaxManifestBytes)
                throw new InvalidOperationException("SELF_UPDATE_MANIFEST_TOO_LARGE");
            await buffer.WriteAsync(chunk.AsMemory(0, read), cancellationToken);
        }

        var manifest = JsonSerializer.Deserialize<WindowsBridgeUpdateManifest>(
            buffer.ToArray(),
            JsonOptions);
        return manifest ?? throw new InvalidOperationException("SELF_UPDATE_MANIFEST_INVALID");
    }

    private async Task DownloadAndVerifyAsync(
        WindowsBridgeUpdateManifest manifest,
        string stagedPath,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(stagedPath)!);
        var temporaryPath = stagedPath + ".download";
        TryDelete(temporaryPath);

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                manifest.AssetUrl + "?build=" + manifest.BuildNumber.ToString(CultureInfo.InvariantCulture));
            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();

            if (response.Content.Headers.ContentLength is long contentLength
                && (contentLength > MaxAssetBytes || contentLength != manifest.SizeBytes))
                throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_SIZE_MISMATCH");

            long total = 0;
            string actualHash;

            // Close both HTTP/input and output file streams before renaming the
            // downloaded executable. Windows rejects File.Move while the output
            // handle is still open with FileShare.None.
            {
                await using var input = await response.Content.ReadAsStreamAsync(cancellationToken);
                await using var output = new FileStream(
                    temporaryPath,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None,
                    bufferSize: 64 * 1024,
                    options: FileOptions.Asynchronous | FileOptions.SequentialScan);
                using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);

                var buffer = new byte[64 * 1024];
                while (true)
                {
                    var read = await input.ReadAsync(buffer, cancellationToken);
                    if (read == 0) break;

                    total += read;
                    if (total > MaxAssetBytes || total > manifest.SizeBytes)
                        throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_TOO_LARGE");

                    hash.AppendData(buffer, 0, read);
                    await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                }

                await output.FlushAsync(cancellationToken);
                actualHash = Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant();
            }

            if (total != manifest.SizeBytes)
                throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_SIZE_MISMATCH");

            if (!string.Equals(actualHash, manifest.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SELF_UPDATE_SHA256_MISMATCH");

            File.Move(temporaryPath, stagedPath, overwrite: true);
        }
        finally
        {
            TryDelete(temporaryPath);
        }
    }

    private static async Task<bool> IsValidStagedFileAsync(
        string stagedPath,
        WindowsBridgeUpdateManifest manifest,
        CancellationToken cancellationToken)
    {
        try
        {
            var info = new FileInfo(stagedPath);
            if (!info.Exists || info.Length != manifest.SizeBytes)
                return false;

            var hash = await ComputeSha256Async(stagedPath, cancellationToken);
            return string.Equals(hash, manifest.Sha256, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static async Task<string> ComputeSha256Async(string path, CancellationToken cancellationToken)
    {
        await using var stream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 64 * 1024,
            options: FileOptions.Asynchronous | FileOptions.SequentialScan);
        using var sha = SHA256.Create();
        var bytes = await sha.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static void EnsureTargetDirectoryWritable(string targetPath)
    {
        var directory = Path.GetDirectoryName(targetPath);
        if (string.IsNullOrWhiteSpace(directory))
            throw new InvalidOperationException("SELF_UPDATE_TARGET_DIRECTORY_INVALID");

        var probe = Path.Combine(directory, ".aio-bridge-update-write-" + Guid.NewGuid().ToString("N") + ".tmp");
        try
        {
            using (new FileStream(probe, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
            }
        }
        catch (Exception error) when (error is UnauthorizedAccessException or IOException)
        {
            throw new InvalidOperationException("SELF_UPDATE_TARGET_DIRECTORY_NOT_WRITABLE", error);
        }
        finally
        {
            TryDelete(probe);
        }
    }

    private static void LaunchInstaller(PreparedWindowsBridgeUpdate prepared)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = prepared.StagedExecutablePath,
            WorkingDirectory = Path.GetDirectoryName(prepared.StagedExecutablePath)!,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        startInfo.ArgumentList.Add("--apply-update");
        startInfo.ArgumentList.Add(Environment.ProcessId.ToString(CultureInfo.InvariantCulture));
        startInfo.ArgumentList.Add(prepared.TargetExecutablePath);
        startInfo.ArgumentList.Add(prepared.Sha256);
        startInfo.ArgumentList.Add(prepared.BuildNumber.ToString(CultureInfo.InvariantCulture));

        if (Process.Start(startInfo) is null)
            throw new InvalidOperationException("SELF_UPDATE_INSTALLER_START_FAILED");
    }

    internal static async Task WriteCheckStatusAsync(
        string state,
        long currentBuildNumber,
        string? currentBuildId,
        long? latestBuildNumber,
        string? latestVersion,
        string? error)
    {
        try
        {
            Directory.CreateDirectory(BridgeConfig.LocalAppDirectory);
            var path = Path.Combine(BridgeConfig.LocalAppDirectory, StatusFileName);
            var temporaryPath = path + ".tmp";
            var boundedError = string.IsNullOrWhiteSpace(error)
                ? null
                : error.Length <= 1000 ? error : error[..1000];

            var payload = JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 2,
                    state,
                    currentBuildNumber,
                    currentBuildId,
                    latestBuildNumber,
                    latestVersion,
                    target = AssetFileName,
                    at = DateTimeOffset.UtcNow,
                    error = boundedError
                },
                BridgeConfig.JsonOptions);

            await File.WriteAllTextAsync(temporaryPath, payload, Encoding.UTF8);
            File.Move(temporaryPath, path, overwrite: true);
        }
        catch
        {
            // Diagnostics must never break or block the running Bridge.
        }
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
        }
    }

    public async ValueTask DisposeAsync()
    {
        _stop.Cancel();
        if (_loop is not null)
        {
            try
            {
                await _loop;
            }
            catch (OperationCanceledException)
            {
            }
        }

        _httpClient.Dispose();
        _stop.Dispose();
    }
}

public static class WindowsBridgeUpdateBootstrap
{
    private sealed record ApplyRequest(int ParentPid, string TargetPath, string Sha256, long BuildNumber);

    public static bool IsApplyUpdateMode(string[] args) =>
        args.Length > 0 && string.Equals(args[0], "--apply-update", StringComparison.Ordinal);

    public static async Task<int> ApplyAsync(string[] args)
    {
        ApplyRequest? request = null;
        string? backupPath = null;

        try
        {
            request = Parse(args);
            await WaitForParentAsync(request.ParentPid);

            var sourcePath = Environment.ProcessPath
                ?? throw new InvalidOperationException("SELF_UPDATE_INSTALLER_PATH_MISSING");
            sourcePath = Path.GetFullPath(sourcePath);

            if (string.Equals(sourcePath, request.TargetPath, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SELF_UPDATE_INSTALLER_EQUALS_TARGET");

            var sourceHash = await ComputeSha256Async(sourcePath);
            if (!string.Equals(sourceHash, request.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SELF_UPDATE_INSTALLER_HASH_MISMATCH");

            var targetDirectory = Path.GetDirectoryName(request.TargetPath)
                ?? throw new InvalidOperationException("SELF_UPDATE_TARGET_DIRECTORY_INVALID");
            Directory.CreateDirectory(targetDirectory);

            backupPath = request.TargetPath + ".previous";
            if (File.Exists(request.TargetPath))
                File.Copy(request.TargetPath, backupPath, overwrite: true);

            var replacementPath = request.TargetPath + ".new-" + Guid.NewGuid().ToString("N");
            try
            {
                File.Copy(sourcePath, replacementPath, overwrite: false);
                var replacementHash = await ComputeSha256Async(replacementPath);
                if (!string.Equals(replacementHash, request.Sha256, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("SELF_UPDATE_REPLACEMENT_HASH_MISMATCH");

                File.Move(replacementPath, request.TargetPath, overwrite: true);
            }
            finally
            {
                TryDelete(replacementPath);
            }

            StartTarget(request.TargetPath);
            await WriteStatusAsync("APPLIED", request, null);
            return 0;
        }
        catch (Exception error)
        {
            if (request is not null)
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(backupPath) && File.Exists(backupPath))
                        File.Copy(backupPath, request.TargetPath, overwrite: true);

                    if (File.Exists(request.TargetPath))
                        StartTarget(request.TargetPath);
                }
                catch
                {
                }

                await WriteStatusAsync("APPLY_FAILED", request, error.Message);
            }

            return 2;
        }
    }

    private static ApplyRequest Parse(string[] args)
    {
        if (args.Length != 5
            || !string.Equals(args[0], "--apply-update", StringComparison.Ordinal)
            || !int.TryParse(args[1], NumberStyles.None, CultureInfo.InvariantCulture, out var parentPid)
            || parentPid <= 0
            || string.IsNullOrWhiteSpace(args[2])
            || !Regex.IsMatch(args[3], "^[0-9a-f]{64}$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)
            || !long.TryParse(args[4], NumberStyles.None, CultureInfo.InvariantCulture, out var buildNumber)
            || buildNumber <= 0)
            throw new InvalidOperationException("SELF_UPDATE_ARGUMENTS_INVALID");

        var targetPath = Path.GetFullPath(args[2]);
        if (!string.Equals(Path.GetFileName(targetPath), WindowsBridgeSelfUpdater.AssetFileName, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("SELF_UPDATE_TARGET_INVALID");

        return new ApplyRequest(parentPid, targetPath, args[3].ToLowerInvariant(), buildNumber);
    }

    private static async Task WaitForParentAsync(int parentPid)
    {
        if (parentPid == Environment.ProcessId)
            throw new InvalidOperationException("SELF_UPDATE_PARENT_PID_INVALID");

        try
        {
            using var parent = Process.GetProcessById(parentPid);
            var exited = await Task.Run(() => parent.WaitForExit(60_000));
            if (!exited)
                throw new InvalidOperationException("SELF_UPDATE_PARENT_DID_NOT_EXIT");
        }
        catch (ArgumentException)
        {
            // Parent already exited.
        }
    }

    private static async Task<string> ComputeSha256Async(string path)
    {
        await using var stream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 64 * 1024,
            options: FileOptions.Asynchronous | FileOptions.SequentialScan);
        using var sha = SHA256.Create();
        var bytes = await sha.ComputeHashAsync(stream);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static void StartTarget(string targetPath)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = targetPath,
            WorkingDirectory = Path.GetDirectoryName(targetPath)!,
            UseShellExecute = true
        };

        if (Process.Start(startInfo) is null)
            throw new InvalidOperationException("SELF_UPDATE_RESTART_FAILED");
    }

    private static async Task WriteStatusAsync(string state, ApplyRequest request, string? error)
    {
        try
        {
            Directory.CreateDirectory(BridgeConfig.LocalAppDirectory);
            var path = Path.Combine(BridgeConfig.LocalAppDirectory, "self-update-status.json");
            var temporaryPath = path + ".tmp";
            var payload = JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 1,
                    state,
                    buildNumber = request.BuildNumber,
                    target = WindowsBridgeSelfUpdater.AssetFileName,
                    at = DateTimeOffset.UtcNow,
                    error = string.IsNullOrWhiteSpace(error)
                        ? null
                        : error.Length <= 512 ? error : error[..512]
                },
                BridgeConfig.JsonOptions);
            await File.WriteAllTextAsync(temporaryPath, payload, Encoding.UTF8);
            File.Move(temporaryPath, path, overwrite: true);
        }
        catch
        {
        }
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
        }
    }
}
