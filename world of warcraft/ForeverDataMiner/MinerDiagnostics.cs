namespace ForeverDataMiner;

public sealed record DiagnosticCheck(
    string Name,
    bool Passed,
    string Details,
    bool Required = true);

public sealed class DiagnosticReport
{
    public List<DiagnosticCheck> Checks { get; } = [];
    public bool Passed => Checks.Where(x => x.Required).All(x => x.Passed);

    public string ToDisplayText()
    {
        var lines = new List<string>
        {
            Passed ? "GESAMT: PASS" : "GESAMT: FAIL",
            ""
        };

        foreach (var check in Checks)
        {
            var marker = check.Passed ? "PASS" : check.Required ? "FAIL" : "INFO";
            lines.Add($"[{marker}] {check.Name}");
            lines.Add("       " + check.Details);
        }

        return string.Join(Environment.NewLine, lines);
    }
}

public static class MinerDiagnostics
{
    public static async Task<DiagnosticReport> RunAsync(
        string selectedPath,
        Uri? providerUri,
        bool manageProvider,
        CancellationToken cancellationToken = default)
    {
        var report = new DiagnosticReport();

        var wowRoot = WowPathResolver.ResolveRoot(selectedPath);
        report.Checks.Add(new DiagnosticCheck(
            "WoW-/Forever-Pfad",
            wowRoot is not null,
            wowRoot is null
                ? "Pfad konnte nicht auf einen WoW-Hauptordner mit .build.info aufgelöst werden."
                : $"Auswahl: {selectedPath} | WoW-Root: {wowRoot}"));

        if (wowRoot is null)
            return report;

        BuildIdentity? build = null;
        try
        {
            build = BuildInfoReader.Read(wowRoot);
            report.Checks.Add(new DiagnosticCheck(
                "Forever-Build",
                build.Version.StartsWith("1.60.", StringComparison.OrdinalIgnoreCase),
                $"Version={build.Version}, Build={build.BuildNumber}, Interface={build.InterfaceVersion}, Product={build.Product}"));
        }
        catch (Exception ex)
        {
            report.Checks.Add(new DiagnosticCheck("Forever-Build", false, ex.Message));
            return report;
        }

        var productPath = Path.Combine(wowRoot, "_classic_beta_");
        report.Checks.Add(new DiagnosticCheck(
            "Forever-Produktordner",
            Directory.Exists(productPath),
            Directory.Exists(productPath)
                ? productPath
                : "_classic_beta_ wurde unter dem WoW-Root nicht gefunden."));

        var caches = Directory.Exists(productPath)
            ? Directory.EnumerateFiles(productPath, "DBCache.bin", SearchOption.AllDirectories).Take(8).ToArray()
            : [];
        report.Checks.Add(new DiagnosticCheck(
            "Hotfix-Cache",
            caches.Length > 0,
            caches.Length > 0
                ? string.Join(" | ", caches.Select(x => $"{x} ({new FileInfo(x).Length:N0} Bytes)"))
                : "Kein DBCache.bin im Forever-Produktordner gefunden."));

        var wowRunning = ProcessState.IsWowRunning();
        report.Checks.Add(new DiagnosticCheck(
            "WoW geschlossen",
            !wowRunning,
            wowRunning ? "Ein WoW-Prozess läuft noch." : "Kein WoW-Prozess erkannt."));

        var battleNetRunning = ProcessState.IsBattleNetRunning();
        report.Checks.Add(new DiagnosticCheck(
            "Battle.net / Blizzard Agent geschlossen",
            !battleNetRunning,
            battleNetRunning ? "Battle.net oder Blizzard Agent läuft noch." : "Kein Battle.net-/Agent-Prozess erkannt."));

        if (providerUri is null)
        {
            report.Checks.Add(new DiagnosticCheck(
                "DB2-Provider-Adresse",
                false,
                "Keine gültige Provider-Adresse konfiguriert."));
            return report;
        }

        report.Checks.Add(new DiagnosticCheck(
            "DB2-Provider-Adresse",
            true,
            providerUri.ToString()));

        var installed = WowToolsProviderBootstrapper.IsInstalled();
        report.Checks.Add(new DiagnosticCheck(
            "Managed Provider installiert",
            !manageProvider || installed,
            manageProvider
                ? installed
                    ? "wow.tools.local ist lokal installiert."
                    : "Managed Mode ist aktiv, aber wow.tools.local ist nicht installiert."
                : "Managed Mode ist deaktiviert; externer Provider wird erwartet."));

        ManagedWowToolsProcess? managedProcess = null;
        try
        {
            var available = await WowToolsLocalClient.IsAvailableAsync(providerUri, cancellationToken);

            if (!available && manageProvider && installed && !wowRunning && !battleNetRunning)
            {
                managedProcess = await WowToolsProviderBootstrapper.StartInstalledAsync(
                    wowRoot,
                    build.Product,
                    providerUri,
                    cancellationToken: cancellationToken);

                available = await WowToolsLocalClient.IsAvailableAsync(providerUri, cancellationToken);
            }

            report.Checks.Add(new DiagnosticCheck(
                "Provider erreichbar",
                available,
                available
                    ? $"{providerUri} antwortet."
                    : $"{providerUri} ist nicht erreichbar."));

            if (!available)
                return report;

            using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };
            var client = new WowToolsLocalClient(http, providerUri);

            byte[]? probe = null;
            Exception? probeError = null;
            foreach (var table in new[] { "QuestV2", "Item", "Map" })
            {
                try
                {
                    probe = await client.ExportTableAsync(table, build, cancellationToken);
                    if (probe is { Length: > 32 })
                    {
                        report.Checks.Add(new DiagnosticCheck(
                            "DB2-Probeexport",
                            true,
                            $"{table}.csv erfolgreich exportiert ({probe.Length:N0} Bytes)."));
                        break;
                    }
                }
                catch (Exception ex)
                {
                    probeError = ex;
                }
            }

            if (!report.Checks.Any(x => x.Name == "DB2-Probeexport"))
            {
                report.Checks.Add(new DiagnosticCheck(
                    "DB2-Probeexport",
                    false,
                    probeError is null
                        ? "QuestV2, Item und Map lieferten keine verwertbaren CSV-Daten."
                        : probeError.Message));
            }
        }
        catch (Exception ex)
        {
            report.Checks.Add(new DiagnosticCheck(
                "Provider-Systemtest",
                false,
                ex.Message));
        }
        finally
        {
            if (managedProcess is not null)
                await managedProcess.DisposeAsync();
        }

        return report;
    }
}
