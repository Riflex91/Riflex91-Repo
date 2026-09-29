using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record LinuxBridgeUpdateManifest(int SchemaVersion, long BuildNumber, string Version, string AssetUrl, string Sha256, long SizeBytes, DateTimeOffset PublishedAt);

public sealed class LinuxBridgeSelfUpdater : IAsyncDisposable
{
    public const string ReleaseTag = "linux-bridge-latest";
    public const string AssetFileName = "AioBotLinuxBridge";
    public const string AssetUrl = "https://github.com/Riflex91/Riflex91-Repo/releases/download/linux-bridge-latest/AioBotLinuxBridge";
    public const string ManifestUrl = "https://github.com/Riflex91/Riflex91-Repo/releases/download/linux-bridge-latest/AioBotLinuxBridge.version.json";
    public const long MaxAssetBytes = 512L * 1024 * 1024;
    private static readonly Regex ShaRegex = new("^[0-9a-f]{40}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex HashRegex = new("^[0-9a-f]{64}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex InfoRegex = new("^1\\.0\\.(?<build>[0-9]+)\\+(?<sha>[0-9a-f]{40})$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private readonly BridgeConfig _config;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromMinutes(3) };
    private readonly CancellationTokenSource _stop = new();
    private Task? _loop;

    public LinuxBridgeSelfUpdater(BridgeConfig config) { _config = config; _http.DefaultRequestHeaders.UserAgent.ParseAdd("AioBotLinuxBridge-SelfUpdater/1.0"); }
    public void Start() => _loop ??= Task.Run(() => RunAsync(_stop.Token));

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                if (await CheckAndApplyAsync(cancellationToken))
                {
                    await WriteStatusAsync("APPLIED_RESTART_REQUIRED", null, cancellationToken);
                    Environment.Exit(75);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { return; }
            catch (Exception error) { await WriteStatusAsync("CHECK_FAILED", error.GetType().Name + ": " + error.Message, CancellationToken.None); }
            try { await Task.Delay(TimeSpan.FromSeconds(_config.SelfUpdateIntervalSeconds), cancellationToken); } catch (OperationCanceledException) { return; }
        }
    }

    public async Task<bool> CheckAndApplyAsync(CancellationToken cancellationToken)
    {
        await WriteStatusAsync("CHECKING", null, cancellationToken);
        var manifest = await LoadManifestAsync(cancellationToken);
        Validate(manifest);
        var current = CurrentBuild();
        if ((current.Build > 0 && manifest.BuildNumber <= current.Build) || (current.Build == 0 && string.Equals(current.Sha, manifest.Version, StringComparison.OrdinalIgnoreCase)))
        {
            await WriteStatusAsync("UP_TO_DATE", null, cancellationToken);
            return false;
        }

        var target = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(target) || !File.Exists(target) || !string.Equals(Path.GetFileName(target), AssetFileName, StringComparison.Ordinal))
        {
            await WriteStatusAsync("UPDATE_AVAILABLE_MANUAL_INSTALL_REQUIRED", null, cancellationToken);
            return false;
        }

        var dir = Path.GetDirectoryName(target)!;
        var stage = Path.Combine(dir, "." + AssetFileName + ".update");
        var backup = target + ".previous";
        await DownloadAsync(manifest, stage, cancellationToken);
        File.SetUnixFileMode(stage, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute | UnixFileMode.GroupRead | UnixFileMode.GroupExecute | UnixFileMode.OtherRead | UnixFileMode.OtherExecute);
        try
        {
            if (File.Exists(backup)) File.Delete(backup);
            File.Move(target, backup);
            File.Move(stage, target);
        }
        catch
        {
            try { if (!File.Exists(target) && File.Exists(backup)) File.Move(backup, target); } catch { }
            throw;
        }
        await WriteStatusAsync("APPLIED", null, cancellationToken);
        return true;
    }

    private async Task<LinuxBridgeUpdateManifest> LoadManifestAsync(CancellationToken cancellationToken)
    {
        using var response = await _http.GetAsync(ManifestUrl + "?check=" + DateTimeOffset.UtcNow.ToUnixTimeSeconds(), cancellationToken);
        response.EnsureSuccessStatusCode();
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        if (bytes.Length > 64 * 1024) throw new InvalidOperationException("SELF_UPDATE_MANIFEST_TOO_LARGE");
        return JsonSerializer.Deserialize<LinuxBridgeUpdateManifest>(bytes, BridgeConfig.JsonOptions) ?? throw new InvalidOperationException("SELF_UPDATE_MANIFEST_INVALID");
    }

    private async Task DownloadAsync(LinuxBridgeUpdateManifest manifest, string stage, CancellationToken cancellationToken)
    {
        using var response = await _http.GetAsync(manifest.AssetUrl + "?build=" + manifest.BuildNumber, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var input = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var output = new FileStream(stage, FileMode.Create, FileAccess.Write, FileShare.None, 64 * 1024, true);
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var buffer = new byte[64 * 1024];
        long total = 0;
        while (true)
        {
            var read = await input.ReadAsync(buffer, cancellationToken);
            if (read == 0) break;
            total += read;
            if (total > manifest.SizeBytes || total > MaxAssetBytes) throw new InvalidOperationException("SELF_UPDATE_DOWNLOAD_TOO_LARGE");
            hash.AppendData(buffer, 0, read);
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
        await output.FlushAsync(cancellationToken);
        var actual = Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant();
        if (total != manifest.SizeBytes) throw new InvalidOperationException("SELF_UPDATE_SIZE_MISMATCH");
        if (!string.Equals(actual, manifest.Sha256, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("SELF_UPDATE_SHA256_MISMATCH");
    }

    public static void Validate(LinuxBridgeUpdateManifest manifest)
    {
        if (manifest.SchemaVersion != 1 || manifest.BuildNumber <= 0 || !ShaRegex.IsMatch(manifest.Version)
            || !HashRegex.IsMatch(manifest.Sha256) || manifest.SizeBytes <= 0 || manifest.SizeBytes > MaxAssetBytes
            || !string.Equals(manifest.AssetUrl, AssetUrl, StringComparison.Ordinal))
            throw new InvalidOperationException("SELF_UPDATE_MANIFEST_REJECTED");
    }

    public static (long Build, string? Sha) CurrentBuild()
    {
        var info = Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "";
        var match = InfoRegex.Match(info.Trim());
        if (match.Success && long.TryParse(match.Groups["build"].Value, out var build)) return (build, match.Groups["sha"].Value.ToLowerInvariant());
        var sha = info.Split(['+', '.', '-'], StringSplitOptions.RemoveEmptyEntries).FirstOrDefault(x => ShaRegex.IsMatch(x));
        return (0, sha?.ToLowerInvariant());
    }

    private static async Task WriteStatusAsync(string state, string? error, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(BridgeConfig.StateDirectory);
        await File.WriteAllTextAsync(BridgeConfig.SelfUpdateStatusPath,
            JsonSerializer.Serialize(new { schemaVersion = 1, state, at = DateTimeOffset.UtcNow, error }, BridgeConfig.JsonOptions), cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        _stop.Cancel();
        if (_loop is not null) { try { await _loop; } catch (OperationCanceledException) { } }
        _stop.Dispose();
        _http.Dispose();
    }
}
