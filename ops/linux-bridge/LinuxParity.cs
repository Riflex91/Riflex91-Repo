using System.Diagnostics;

namespace AioBotWindowsBridge;

public sealed record LinuxStorageHealth(
    string State,
    string ConfiguredPath,
    string? ExistingPath,
    string? MountPoint,
    string? Source,
    string? FileSystem,
    long? TotalBytes,
    long? FreeBytes,
    double? FreePercent,
    bool? SolidState,
    string? Detail);

public static class LinuxStorageHealthProbe
{
    public const int MinimumFreePercent = 15;

    public static async Task<LinuxStorageHealth> ProbeAsync(
        string configuredPath,
        CancellationToken cancellationToken = default)
    {
        string normalized;
        try
        {
            normalized = BridgeConfig.NormalisiereLiveWissenspfad(configuredPath);
        }
        catch (Exception error)
        {
            return new LinuxStorageHealth(
                "INVALID_PATH", configuredPath ?? string.Empty, null, null, null, null,
                null, null, null, null, error.Message);
        }

        var existing = NearestExistingDirectory(normalized);
        if (existing is null)
        {
            return new LinuxStorageHealth(
                "WAITING_FOR_PATH", normalized, null, null, null, null,
                null, null, null, null, "Der konfigurierte Pfad und seine Eltern existieren noch nicht.");
        }

        DriveInfo? drive = null;
        try
        {
            drive = DriveInfo.GetDrives()
                .Where(item => item.IsReady && IsUnder(existing, item.Name))
                .OrderByDescending(item => item.Name.Length)
                .FirstOrDefault();
        }
        catch
        {
        }

        long? total = null;
        long? free = null;
        double? freePercent = null;
        string? mount = null;
        string? fileSystem = null;
        if (drive is not null)
        {
            mount = drive.Name;
            fileSystem = drive.DriveFormat;
            total = drive.TotalSize;
            free = drive.AvailableFreeSpace;
            if (drive.TotalSize > 0)
                freePercent = drive.AvailableFreeSpace * 100d / drive.TotalSize;
        }

        var source = await TryRunAsync(
            "findmnt",
            ["-n", "-o", "SOURCE", "--target", existing],
            cancellationToken);

        bool? solidState = null;
        if (!string.IsNullOrWhiteSpace(source))
        {
            var cleanSource = source.Split('[', 2)[0].Trim();
            if (cleanSource.StartsWith("/dev/", StringComparison.Ordinal))
            {
                var rotational = await TryRunAsync(
                    "lsblk",
                    ["-dn", "-o", "ROTA", cleanSource],
                    cancellationToken);
                var first = rotational?
                    .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .FirstOrDefault();
                if (first == "0") solidState = true;
                else if (first == "1") solidState = false;
            }
        }

        var state = freePercent is < MinimumFreePercent
            ? "LOW_FREE_SPACE"
            : solidState == false
                ? "ROTATIONAL_STORAGE"
                : solidState == true
                    ? "SSD_OK"
                    : "STORAGE_OK_TYPE_UNKNOWN";

        return new LinuxStorageHealth(
            state,
            normalized,
            existing,
            mount,
            string.IsNullOrWhiteSpace(source) ? null : source.Trim(),
            fileSystem,
            total,
            free,
            freePercent,
            solidState,
            null);
    }

    private static string? NearestExistingDirectory(string path)
    {
        var current = path;
        while (!string.IsNullOrWhiteSpace(current))
        {
            if (Directory.Exists(current))
                return current;

            var parent = Directory.GetParent(current);
            if (parent is null)
                break;
            current = parent.FullName;
        }
        return null;
    }

    private static bool IsUnder(string path, string root)
    {
        var normalizedPath = Path.GetFullPath(path);
        var normalizedRoot = Path.TrimEndingDirectorySeparator(Path.GetFullPath(root));
        if (normalizedRoot == Path.DirectorySeparatorChar.ToString())
            return normalizedPath.StartsWith(normalizedRoot, StringComparison.Ordinal);

        return string.Equals(normalizedPath, normalizedRoot, StringComparison.Ordinal)
            || normalizedPath.StartsWith(normalizedRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal);
    }

    private static async Task<string?> TryRunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken)
    {
        if (FindInPath(fileName) is null)
            return null;

        try
        {
            var start = new ProcessStartInfo
            {
                FileName = fileName,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };
            foreach (var argument in arguments)
                start.ArgumentList.Add(argument);

            using var process = Process.Start(start);
            if (process is null)
                return null;

            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(5));
            var output = process.StandardOutput.ReadToEndAsync(timeout.Token);
            await process.WaitForExitAsync(timeout.Token);
            return process.ExitCode == 0 ? (await output).Trim() : null;
        }
        catch
        {
            return null;
        }
    }

    private static string? FindInPath(string fileName)
    {
        foreach (var dir in (Environment.GetEnvironmentVariable("PATH") ?? string.Empty)
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(dir, fileName);
            if (File.Exists(candidate))
                return candidate;
        }
        return null;
    }
}

public sealed record LinuxReadinessCheck(
    string Id,
    string Status,
    string Detail);

public sealed record LinuxReadinessReport(
    int SchemaVersion,
    string Test,
    string Status,
    DateTimeOffset CreatedAt,
    GitHubAnmeldeStatus GitHub,
    LinuxStorageHealth? Storage,
    IReadOnlyList<LinuxReadinessCheck> Checks,
    IReadOnlyList<string> ManualEvidence);

public sealed class LinuxReadinessSystemtest
{
    public const string TestId = "V6_LINUX_BRIDGE_READINESS";
    private readonly GitHubAnmeldung _github;

    public LinuxReadinessSystemtest(GitHubAnmeldung github)
    {
        _github = github;
    }

    public async Task<LinuxReadinessReport> RunAsync(
        BridgeConfig config,
        CancellationToken cancellationToken = default)
    {
        var checks = new List<LinuxReadinessCheck>();

        void Add(string id, string status, string detail) =>
            checks.Add(new LinuxReadinessCheck(id, status, detail));

        try
        {
            config.Validate();
            Add("BRIDGE_CONFIG", "PASSED", "BridgeConfig.Validate() erfolgreich.");
        }
        catch (Exception error)
        {
            Add("BRIDGE_CONFIG", "FAILED", error.Message);
        }

        Add(
            "V6_PROTOCOL",
            CdpAlBotV6Client.Generation == 6 && CdpAlBotV6Client.Protocol == "albot-v6-bridge-v1"
                ? "PASSED" : "FAILED",
            $"generation={CdpAlBotV6Client.Generation}; protocol={CdpAlBotV6Client.Protocol}");

        Add(
            "SYSTEMD_KEEPALIVE",
            LinuxWatchdogSupervisor.SystemdKeepaliveSeconds < 45 ? "PASSED" : "FAILED",
            $"keepalive={LinuxWatchdogSupervisor.SystemdKeepaliveSeconds}s; WatchdogSec=45s");

        Add(
            "KNOWLEDGE_SCOPE",
            GitArbeitskopie.WissensbasisPfad == "v5/wissensbasis"
                && GitArbeitskopie.SyncStrategie == "KNOWLEDGE_ONLY_NO_MAIN_MERGE"
                && !GitArbeitskopie.IntegriertBasisVorPush
                ? "PASSED" : "FAILED",
            $"{GitArbeitskopie.WissensbasisPfad}/** · {GitArbeitskopie.SyncStrategie}");

        var github = await _github.LiesStatusAsync(cancellationToken);
        Add(
            "GIT_CREDENTIAL_MANAGER",
            github.Verfuegbar ? "PASSED" : (config.WissenswaechterAktiv ? "FAILED" : "NOTE"),
            github.Verfuegbar ? "verfügbar" : github.Fehler ?? "nicht verfügbar");
        Add(
            "GITHUB_LOGIN",
            github.Angemeldet ? "PASSED" : (config.WissenswaechterAktiv ? "FAILED" : "NOTE"),
            github.Angemeldet ? github.Konto ?? "angemeldet" : "nicht angemeldet");

        LinuxStorageHealth? storage = null;
        if (config.LiveWissensimportAktiv)
        {
            storage = await LinuxStorageHealthProbe.ProbeAsync(
                config.LiveWissensdatenbankPfad,
                cancellationToken);

            var storageStatus = storage.State switch
            {
                "SSD_OK" or "STORAGE_OK_TYPE_UNKNOWN" => "PASSED",
                "WAITING_FOR_PATH" => "NOTE",
                _ => "FAILED"
            };
            Add(
                "LIVE_KNOWLEDGE_STORAGE",
                storageStatus,
                $"{storage.State}; path={storage.ConfiguredPath}; free={storage.FreePercent?.ToString("F1") ?? "?"}%");
        }
        else
        {
            Add("LIVE_KNOWLEDGE_STORAGE", "NOTE", "Live-Wissensimport ist deaktiviert.");
        }

        Add(
            "SECRET_STORAGE",
            LinuxSecretStore.IsAvailable() ? "PASSED" : "NOTE",
            LinuxSecretStore.IsAvailable()
                ? "Linux Secret Service/secret-tool verfügbar."
                : "secret-tool fehlt; Umgebungsvariablen bleiben als unattended Fallback verfügbar.");

        Add(
            "NO_GAMEPLAY_WRITE",
            "PASSED",
            "Readiness führt keine Bewegung, keinen Kampf und keinen generischen Browser-/Shell-Gameplay-Befehl aus.");

        var failed = checks.Any(row => row.Status == "FAILED");
        return new LinuxReadinessReport(
            1,
            TestId,
            failed
                ? "NICHT_BESTANDEN"
                : "AUTOMATISCHE_PRUEFUNGEN_BESTANDEN_MANUELLER_AUTORISIERUNGSNACHWEIS_OFFEN",
            DateTimeOffset.UtcNow,
            github,
            storage,
            checks,
            [
                "Fine-grained PAT manuell nachweisen: nur Riflex91/Riflex91-Repo, Contents=Read and write, Metadata=Read, keine zusätzlichen Schreibrechte."
            ]);
    }
}
