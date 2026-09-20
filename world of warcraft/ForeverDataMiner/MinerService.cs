using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ForeverDataMiner;

public sealed class MinerService(MinerOptions options)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<string> ScanAsync(CancellationToken cancellationToken = default)
    {
        var build = BuildInfoReader.Read(options.WowRoot);
        Directory.CreateDirectory(options.OutputDirectory);

        var bundle = new FgdsBundle { Build = build };
        AddFingerprint(bundle, Path.Combine(options.WowRoot, ".build.info"), "client.build_info");

        foreach (var exe in CandidateExecutables())
            AddFingerprint(bundle, exe, "client.executable");

        foreach (var cache in CandidateHotfixCaches())
            AddFingerprint(bundle, cache, "hotfix.cache");

        var stamp = DateTimeOffset.UtcNow.ToString("yyyyMMdd-HHmmss");
        var safeBuild = string.Concat(build.Version.Select(c => char.IsLetterOrDigit(c) || c is '.' or '-' ? c : '_'));
        var zipPath = Path.Combine(options.OutputDirectory, $"ForeverDataMiner-{safeBuild}-{stamp}.fgds.zip");

        await using var file = File.Create(zipPath);
        using var archive = new ZipArchive(file, ZipArchiveMode.Create);

        if (options.WowToolsLocal is not null)
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
            var client = new WowToolsLocalClient(http, options.WowToolsLocal);
            try
            {
                var tables = await client.ExportAsync(build, cancellationToken);
                foreach (var (table, csv) in tables)
                {
                    var entry = archive.CreateEntry($"db2/{table}.csv", CompressionLevel.Optimal);
                    await using var stream = entry.Open();
                    await stream.WriteAsync(csv, cancellationToken);

                    bundle.Records.Add(new FgdsRecord(
                        "db2.export",
                        table,
                        DateTimeOffset.UtcNow,
                        "client-db2-hotfix-applied",
                        new Dictionary<string, object?>
                        {
                            ["table"] = table,
                            ["bytes"] = csv.Length,
                            ["sha256"] = Convert.ToHexString(SHA256.HashData(csv)).ToLowerInvariant()
                        }));
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                bundle.Records.Add(new FgdsRecord(
                    "provider.warning",
                    "wow.tools.local",
                    DateTimeOffset.UtcNow,
                    "miner",
                    new Dictionary<string, object?> { ["message"] = ex.Message }));
            }
        }

        var manifestEntry = archive.CreateEntry("manifest.fgds.json", CompressionLevel.Optimal);
        await using (var stream = manifestEntry.Open())
        {
            await JsonSerializer.SerializeAsync(stream, bundle, JsonOptions, cancellationToken);
        }

        return zipPath;
    }

    public async Task WatchAsync(CancellationToken cancellationToken = default)
    {
        string? lastState = null;

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var build = BuildInfoReader.Read(options.WowRoot);
                var state = BuildWatchState(build);

                if (!string.Equals(lastState, state, StringComparison.Ordinal))
                {
                    if (!await WaitForFilesToSettleAsync(cancellationToken))
                    {
                        await Task.Delay(options.PollInterval, cancellationToken);
                        continue;
                    }

                    var output = await ScanAsync(cancellationToken);
                    Console.WriteLine($"[{DateTimeOffset.Now:T}] Forever data state captured -> {output}");
                    lastState = BuildWatchState(BuildInfoReader.Read(options.WowRoot));
                }
            }
            catch (IOException ex)
            {
                Console.Error.WriteLine($"[{DateTimeOffset.Now:T}] WoW files are busy: {ex.Message}");
            }

            await Task.Delay(options.PollInterval, cancellationToken);
        }
    }

    private string BuildWatchState(BuildIdentity build)
    {
        var parts = new List<string>
        {
            build.Version,
            build.BuildKey ?? string.Empty,
            build.CdnKey ?? string.Empty,
        };

        foreach (var cache in CandidateHotfixCaches().OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
        {
            var info = new FileInfo(cache);
            parts.Add($"{cache}|{info.Length}|{info.LastWriteTimeUtc.Ticks}");
        }

        return string.Join(";", parts);
    }

    private async Task<bool> WaitForFilesToSettleAsync(CancellationToken cancellationToken)
    {
        var first = BuildWatchState(BuildInfoReader.Read(options.WowRoot));
        await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
        var second = BuildWatchState(BuildInfoReader.Read(options.WowRoot));
        return string.Equals(first, second, StringComparison.Ordinal);
    }

    private IEnumerable<string> CandidateExecutables()
    {
        var names = new[] { "Wow.exe", "WowClassic.exe" };
        foreach (var product in new[] { "_beta_", "_classic_", "_retail_", "" })
        foreach (var name in names)
        {
            var path = Path.Combine(options.WowRoot, product, name);
            if (File.Exists(path)) yield return path;
        }
    }

    private IEnumerable<string> CandidateHotfixCaches()
    {
        foreach (var product in new[] { "_beta_", "_classic_", "_retail_" })
        {
            var root = Path.Combine(options.WowRoot, product, "Cache");
            if (!Directory.Exists(root)) continue;

            IEnumerable<string> files;
            try
            {
                files = Directory.EnumerateFiles(root, "DBCache.bin", SearchOption.AllDirectories).Take(32).ToArray();
            }
            catch (UnauthorizedAccessException)
            {
                continue;
            }

            foreach (var file in files) yield return file;
        }
    }

    private static void AddFingerprint(FgdsBundle bundle, string path, string kind)
    {
        if (!File.Exists(path)) return;
        using var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        var hash = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        var info = new FileInfo(path);

        bundle.Records.Add(new FgdsRecord(
            kind,
            info.Name,
            DateTimeOffset.UtcNow,
            "local-client-file",
            new Dictionary<string, object?>
            {
                ["fileName"] = info.Name,
                ["length"] = info.Length,
                ["lastWriteUtc"] = info.LastWriteTimeUtc,
                ["sha256"] = hash
            }));
    }
}
