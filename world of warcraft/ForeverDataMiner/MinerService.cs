using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
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

        var previousState = StateStore.Load(options.OutputDirectory);
        var currentWatchState = BuildWatchState(build);
        var nextState = CreateNextState(previousState, build, currentWatchState);

        var bundle = new FgdsBundle { Build = build };
        AddFingerprint(bundle, Path.Combine(options.WowRoot, ".build.info"), "client.build_info");

        foreach (var exe in CandidateExecutables())
            AddFingerprint(bundle, exe, "client.executable");

        foreach (var cache in CandidateHotfixCaches())
            AddFingerprint(bundle, cache, "hotfix.cache");

        bundle.Records.Add(new FgdsRecord(
            "client.update",
            build.BuildNumber,
            DateTimeOffset.UtcNow,
            "miner-state",
            new Dictionary<string, object?>
            {
                ["previousBuild"] = previousState?.BuildVersion,
                ["currentBuild"] = build.Version,
                ["buildChanged"] = previousState?.BuildVersion is not null &&
                                   !string.Equals(previousState.BuildVersion, build.Version, StringComparison.Ordinal),
                ["clientStateChanged"] = previousState?.WatchState is not null &&
                                         !string.Equals(previousState.WatchState, currentWatchState, StringComparison.Ordinal),
                ["baseline"] = previousState is null
            }));

        var stamp = DateTimeOffset.UtcNow.ToString("yyyyMMdd-HHmmss");
        var safeBuild = string.Concat(build.Version.Select(c => char.IsLetterOrDigit(c) || c is '.' or '-' ? c : '_'));
        var zipPath = Path.Combine(options.OutputDirectory, $"ForeverDataMiner-{safeBuild}-{stamp}.fgds.zip");

        await using var file = File.Create(zipPath);
        using var archive = new ZipArchive(file, ZipArchiveMode.Create);

        if (options.WowToolsLocal is not null && !IsWowRunning())
        {
            Process? providerProcess = null;
            using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
            var client = new WowToolsLocalClient(http, options.WowToolsLocal);
            try
            {
                providerProcess = await ProviderManager.EnsureRunningAsync(
                    options.WowToolsLocal,
                    options.WowRoot,
                    cancellationToken);

                if (providerProcess is not null)
                {
                    bundle.Records.Add(new FgdsRecord(
                        "provider.lifecycle",
                        "wow.tools.local",
                        DateTimeOffset.UtcNow,
                        "miner",
                        new Dictionary<string, object?>
                        {
                            ["autoStarted"] = true,
                            ["executable"] = Path.GetFileName(providerProcess.MainModule?.FileName)
                        }));
                }

                var tables = await client.ExportAsync(build, cancellationToken);
                foreach (var (table, csv) in tables)
                {
                    var entry = archive.CreateEntry($"db2/{table}.csv", CompressionLevel.Optimal);
                    await using (var stream = entry.Open())
                    {
                        await stream.WriteAsync(csv, cancellationToken);
                    }

                    var tableHash = Convert.ToHexString(SHA256.HashData(csv)).ToLowerInvariant();
                    bundle.Records.Add(new FgdsRecord(
                        "db2.export",
                        table,
                        DateTimeOffset.UtcNow,
                        "client-db2-hotfix-applied",
                        new Dictionary<string, object?>
                        {
                            ["table"] = table,
                            ["bytes"] = csv.Length,
                            ["sha256"] = tableHash
                        }));

                    Dictionary<string, string>? previousRows = null;
                    if (previousState is not null)
                        previousState.TableRows.TryGetValue(table, out previousRows);

                    var diff = CsvDiff.Compare(table, csv, previousRows);
                    nextState.TableRows[table] = diff.CurrentRows;

                    bundle.Records.Add(new FgdsRecord(
                        "db2.diff",
                        table,
                        DateTimeOffset.UtcNow,
                        "client-db2-diff",
                        new Dictionary<string, object?>
                        {
                            ["baseline"] = previousRows is null,
                            ["addedCount"] = diff.AddedCount,
                            ["modifiedCount"] = diff.ModifiedCount,
                            ["removedCount"] = diff.RemovedCount,
                            ["addedIds"] = diff.AddedIds,
                            ["modifiedIds"] = diff.ModifiedIds,
                            ["removedIds"] = diff.RemovedIds
                        }));
                }
            }
            catch (Exception ex) when (
                !cancellationToken.IsCancellationRequested &&
                ex is HttpRequestException or TaskCanceledException or InvalidOperationException or TimeoutException)
            {
                bundle.Records.Add(new FgdsRecord(
                    "provider.warning",
                    "wow.tools.local",
                    DateTimeOffset.UtcNow,
                    "miner",
                    new Dictionary<string, object?>
                    {
                        ["message"] = ex.Message,
                        ["autoProviderExecutableFound"] = ProviderManager.LocateWowToolsLocal() is not null
                    }));
            }
            finally
            {
                ProviderManager.Stop(providerProcess);
            }
        }
        else if (options.WowToolsLocal is not null)
        {
            bundle.Records.Add(new FgdsRecord(
                "provider.warning",
                "wow.tools.local",
                DateTimeOffset.UtcNow,
                "miner-safety",
                new Dictionary<string, object?>
                {
                    ["message"] = "DB2 export skipped because a WoW client process is running.",
                    ["retryWhenClientStops"] = true
                }));
        }

        var manifestEntry = archive.CreateEntry("manifest.fgds.json", CompressionLevel.Optimal);
        await using (var stream = manifestEntry.Open())
        {
            await JsonSerializer.SerializeAsync(stream, bundle, JsonOptions, cancellationToken);
        }

        StateStore.Save(options.OutputDirectory, nextState);
        return zipPath;
    }

    public async Task WatchAsync(CancellationToken cancellationToken = default)
    {
        string? lastState = StateStore.Load(options.OutputDirectory)?.WatchState;

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var build = BuildInfoReader.Read(options.WowRoot);
                var state = BuildWatchState(build);

                if (lastState is null || !string.Equals(lastState, state, StringComparison.Ordinal))
                {
                    if (!await WaitForFilesToSettleAsync(cancellationToken))
                    {
                        await Task.Delay(options.PollInterval, cancellationToken);
                        continue;
                    }

                    var output = await ScanAsync(cancellationToken);
                    Console.WriteLine($"[{DateTimeOffset.Now:T}] Forever data state captured -> {output}");
                    lastState = StateStore.Load(options.OutputDirectory)?.WatchState
                                ?? BuildWatchState(BuildInfoReader.Read(options.WowRoot));
                }
            }
            catch (IOException ex)
            {
                Console.Error.WriteLine($"[{DateTimeOffset.Now:T}] WoW files are busy: {ex.Message}");
            }

            await Task.Delay(options.PollInterval, cancellationToken);
        }
    }

    private static MinerState CreateNextState(
        MinerState? previous,
        BuildIdentity build,
        string watchState)
    {
        var next = new MinerState
        {
            BuildVersion = build.Version,
            WatchState = watchState
        };

        if (previous is null) return next;

        foreach (var table in previous.TableRows)
        {
            next.TableRows[table.Key] =
                new Dictionary<string, string>(table.Value, StringComparer.Ordinal);
        }

        return next;
    }

    private string BuildWatchState(BuildIdentity build)
    {
        var parts = new List<string>
        {
            build.Version,
            build.BuildKey ?? string.Empty,
            build.CdnKey ?? string.Empty,
            "wowRunning=" + IsWowRunning().ToString()
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

    private static bool IsWowRunning()
    {
        var processNames = new[] { "Wow", "WowClassic", "WowT", "WowClassicT" };

        foreach (var name in processNames)
        {
            try
            {
                if (Process.GetProcessesByName(name).Length > 0)
                    return true;
            }
            catch
            {
                // A process lookup failure should not break update detection.
            }
        }

        return false;
    }

    private IEnumerable<string> CandidateExecutables()
    {
        var names = new[] { "Wow.exe", "WowClassic.exe" };
        foreach (var productDirectory in CandidateProductDirectories())
        foreach (var name in names)
        {
            var path = Path.Combine(productDirectory, name);
            if (File.Exists(path)) yield return path;
        }
    }

    private IEnumerable<string> CandidateHotfixCaches()
    {
        foreach (var productDirectory in CandidateProductDirectories())
        {
            var root = Path.Combine(productDirectory, "Cache");
            if (!Directory.Exists(root)) continue;

            IEnumerable<string> files;
            try
            {
                files = Directory.EnumerateFiles(root, "DBCache.bin", SearchOption.AllDirectories)
                    .Take(64)
                    .ToArray();
            }
            catch (UnauthorizedAccessException)
            {
                continue;
            }

            foreach (var file in files) yield return file;
        }
    }

    private IEnumerable<string> CandidateProductDirectories()
    {
        yield return options.WowRoot;

        IEnumerable<string> directories;
        try
        {
            directories = Directory.EnumerateDirectories(options.WowRoot, "_*", SearchOption.TopDirectoryOnly)
                .ToArray();
        }
        catch (UnauthorizedAccessException)
        {
            yield break;
        }

        foreach (var directory in directories)
        {
            var looksLikeWowProduct =
                File.Exists(Path.Combine(directory, "Wow.exe")) ||
                File.Exists(Path.Combine(directory, "WowClassic.exe")) ||
                Directory.Exists(Path.Combine(directory, "Cache")) ||
                Directory.Exists(Path.Combine(directory, "Interface"));

            if (looksLikeWowProduct)
                yield return directory;
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
