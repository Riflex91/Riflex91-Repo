using System.Reflection;
using System.Text;
using System.Text.Json;

namespace AioBotLinuxBridge;

public sealed record V5ReadinessPruefpunkt(string Kennung, string Status, string Detail);

public sealed record V5ReadinessBericht(
    int SchemaVersion,
    string Test,
    string TestVersion,
    string BridgeAssemblyVersion,
    string ErstelltAm,
    string Status,
    string? GitHubKonto,
    IReadOnlyList<V5ReadinessPruefpunkt> Pruefpunkte,
    IReadOnlyList<string> ManuelleNachweise);

public sealed class V5ReadinessSystemtest
{
    public const string TestKennung = "V5_LINUX_BRIDGE_READINESS";
    public const string TestVersion = "1.0.0";
    private readonly GitHubAnmeldung _githubAnmeldung;

    public V5ReadinessSystemtest(GitHubAnmeldung githubAnmeldung) => _githubAnmeldung = githubAnmeldung;

    public static IReadOnlyList<V5ReadinessPruefpunkt> PruefeStatischeKonfiguration(BridgeConfig config)
    {
        var punkte = new List<V5ReadinessPruefpunkt>();
        void Pruefe(string kennung, bool ok, string detail) =>
            punkte.Add(new V5ReadinessPruefpunkt(kennung, ok ? "BESTANDEN" : "NICHT_BESTANDEN", detail));

        try
        {
            config.Validate();
            Pruefe("BRIDGE_KONFIGURATION", true, "BridgeConfig.Validate() erfolgreich.");
        }
        catch (Exception error)
        {
            Pruefe("BRIDGE_KONFIGURATION", false, Begrenze(error.Message));
        }

        Pruefe("PLATTFORM_LINUX", OperatingSystem.IsLinux(), Environment.OSVersion.ToString());
        Pruefe("CONFIG_VERSION", config.ConfigVersion == BridgeConfig.CurrentConfigVersion,
            $"installiert={config.ConfigVersion}; erwartet={BridgeConfig.CurrentConfigVersion}");
        Pruefe("V5_SUPABASE_STATUS_TAKT",
            config.PollIntervalSeconds == 5 && config.SupabaseStatusIntervalSeconds == 60,
            $"lokal={config.PollIntervalSeconds}s; Supabase={config.SupabaseStatusIntervalSeconds}s; Terminal=sofort");
        Pruefe("WISSENSWAECHTER_AKTIV", config.WissenswaechterAktiv,
            config.WissenswaechterAktiv ? "aktiv" : "deaktiviert");
        Pruefe("WISSENSWAECHTER_INTERVALL", config.WissenswaechterIntervallMinuten == 60,
            $"{config.WissenswaechterIntervallMinuten} Minuten");
        Pruefe("GITHUB_AUTH_MODUS",
            GitHubAnmeldung.Authentifizierungsmodus == "FINE_GRAINED_PAT"
            && GitHubAnmeldung.MinimalBerechtigungsprofil == "REPOSITORY_ONLY_CONTENTS_WRITE",
            $"modus={GitHubAnmeldung.Authentifizierungsmodus}; profil={GitHubAnmeldung.MinimalBerechtigungsprofil}");
        Pruefe("KNOWLEDGE_REPOSITORY",
            GitArbeitskopie.RepositoryUrl == "https://github.com/Riflex91/Riflex91-Repo.git",
            GitArbeitskopie.RepositoryUrl);
        Pruefe("KNOWLEDGE_BRANCH",
            GitArbeitskopie.BasisBranch == "main"
            && GitArbeitskopie.WissensBranch == "v5/wissenswaechter-automatisch"
            && GitArbeitskopie.PushZielRef == "HEAD:v5/wissenswaechter-automatisch",
            $"basis={GitArbeitskopie.BasisBranch}; knowledge={GitArbeitskopie.WissensBranch}; push={GitArbeitskopie.PushZielRef}");
        Pruefe("KNOWLEDGE_SCOPE",
            GitArbeitskopie.WissensbasisPfad == "v5/wissensbasis"
            && GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/manifest.json")
            && !GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/dokumentation/V5-MASTER-ROADMAP.md"),
            GitArbeitskopie.WissensbasisPfad + "/**");
        Pruefe("KNOWLEDGE_SYNC_LEAST_PRIVILEGE",
            GitArbeitskopie.SyncStrategie == "KNOWLEDGE_ONLY_NO_MAIN_MERGE" && !GitArbeitskopie.IntegriertBasisVorPush,
            $"strategie={GitArbeitskopie.SyncStrategie}; mainIntegration={GitArbeitskopie.IntegriertBasisVorPush}");

        var livePfad = config.LiveWissensdatenbankPfad;
        var livePfadKonfiguriert = config.LiveWissensimportAktiv
            && !string.IsNullOrWhiteSpace(livePfad)
            && Path.IsPathFullyQualified(livePfad)
            && !string.Equals(Path.TrimEndingDirectorySeparator(livePfad), Path.GetPathRoot(livePfad), StringComparison.Ordinal);
        Pruefe("LIVE_WISSEN_PFAD", livePfadKonfiguriert,
            livePfadKonfiguriert
                ? (Directory.Exists(livePfad) ? "konfiguriert; lokale Datenbank gefunden" : "konfiguriert; wartet auf V5-Bot")
                : "ungueltig oder deaktiviert");

        Pruefe("DASHBOARD_LOOPBACK",
            Uri.TryCreate(config.DashboardListenUrl, UriKind.Absolute, out var uri)
            && (uri.Host == "127.0.0.1" || uri.Host == "localhost" || uri.Host == "::1" || uri.Host == "[::1]"),
            config.DashboardListenUrl);

        Pruefe("TEST_OHNE_GAMEPLAY_WRITE", true,
            "Readiness-Systemtest fuehrt keine Gameplay-Aktion, keinen Raw Game Write und keinen Knowledge-Push aus.");

        return punkte;
    }

    public async Task<V5ReadinessBericht> FuehreAusAsync(
        BridgeConfig config,
        CancellationToken cancellationToken = default)
    {
        var punkte = PruefeStatischeKonfiguration(config).ToList();
        var github = await _githubAnmeldung.LiesStatusAsync(cancellationToken);

        punkte.Add(new V5ReadinessPruefpunkt(
            "GIT_CREDENTIAL_MANAGER",
            github.Verfuegbar ? "BESTANDEN" : "NICHT_BESTANDEN",
            github.Verfuegbar ? "verfuegbar" : Begrenze(github.Fehler)));
        punkte.Add(new V5ReadinessPruefpunkt(
            "GITHUB_ANMELDUNG",
            github.Angemeldet && !string.IsNullOrWhiteSpace(github.Konto) ? "BESTANDEN" : "NICHT_BESTANDEN",
            github.Angemeldet ? github.Konto ?? "angemeldet" : "nicht angemeldet"));

        if (Directory.Exists(config.LiveWissensdatenbankPfad))
        {
            try
            {
                var ssd = await SsdVolumeGesundheitsPruefer.PruefeAsync(config.LiveWissensdatenbankPfad, cancellationToken);
                punkte.Add(new V5ReadinessPruefpunkt(
                    "LIVE_WISSEN_SSD",
                    ssd.Gesund ? "BESTANDEN" : "NICHT_BESTANDEN",
                    $"{ssd.Grund}; frei={(ssd.FreiProzent.HasValue ? ssd.FreiProzent.Value.ToString("F1") + "%" : "unbekannt")}"));
            }
            catch (Exception error)
            {
                punkte.Add(new V5ReadinessPruefpunkt("LIVE_WISSEN_SSD", "NICHT_BESTANDEN", Begrenze(error.Message)));
            }
        }
        else
        {
            punkte.Add(new V5ReadinessPruefpunkt(
                "LIVE_WISSEN_SSD",
                "MANUELL_NACHWEISEN",
                "Live-Wissenspfad existiert noch nicht; SSD-/Mount-Nachweis wird bei vorhandenem Pfad automatisch ausgefuehrt."));
        }

        if (github.Angemeldet && !string.IsNullOrWhiteSpace(github.Konto))
        {
            var testWurzel = Path.Combine(Path.GetTempPath(), "AioBotLinuxBridge", "V5Readiness", Guid.NewGuid().ToString("N"));
            string? cleanupFehler = null;
            try
            {
                var arbeitskopie = new GitArbeitskopie(testWurzel);
                await arbeitskopie.BereiteVorAsync(github.Konto, cancellationToken);
                punkte.Add(new V5ReadinessPruefpunkt(
                    "KNOWLEDGE_REPO_LIVE_PRUEFUNG", "BESTANDEN",
                    "Exaktes Repository erreichbar; main/Knowledge-Branch und Sparse-Checkout wurden isoliert fail-closed vorbereitet. Kein Push ausgefuehrt."));
            }
            catch (Exception error)
            {
                punkte.Add(new V5ReadinessPruefpunkt("KNOWLEDGE_REPO_LIVE_PRUEFUNG", "NICHT_BESTANDEN", Begrenze(error.Message)));
            }
            finally
            {
                cleanupFehler = await EntferneTempArbeitskopieAsync(testWurzel);
            }

            punkte.Add(new V5ReadinessPruefpunkt(
                "TEMP_ARBEITSKOPIE_CLEANUP",
                cleanupFehler is null ? "BESTANDEN" : "NICHT_BESTANDEN",
                cleanupFehler ?? "Isolierte Readiness-Arbeitskopie wurde vollstaendig entfernt."));
        }
        else
        {
            punkte.Add(new V5ReadinessPruefpunkt("KNOWLEDGE_REPO_LIVE_PRUEFUNG", "NICHT_BESTANDEN", "GitHub-Anmeldung fehlt."));
            punkte.Add(new V5ReadinessPruefpunkt("TEMP_ARBEITSKOPIE_CLEANUP", "BESTANDEN", "Keine temporaere Arbeitskopie angelegt."));
        }

        punkte.Add(new V5ReadinessPruefpunkt(
            "LINUX_SECRET_SERVICE",
            LinuxSecretStore.IsAvailable() ? "BESTANDEN" : "MANUELL_NACHWEISEN",
            LinuxSecretStore.IsAvailable()
                ? "secret-tool/libsecret verfuegbar."
                : "Kein Secret Service gefunden; Secrets muessen ueber Umgebungsvariablen bereitgestellt werden. Klartextdateien werden nicht verwendet."));

        punkte.Add(new V5ReadinessPruefpunkt(
            "GITHUB_LEAST_PRIVILEGE", "MANUELL_NACHWEISEN",
            "Fine-grained PAT: Resource owner Riflex91, nur Riflex91-Repo, Contents=Read and write; keine zusaetzlichen Schreibrechte."));

        var automatischBestanden = punkte
            .Where(p => p.Status != "MANUELL_NACHWEISEN")
            .All(p => p.Status == "BESTANDEN");

        return new V5ReadinessBericht(
            1, TestKennung, TestVersion,
            Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "UNBEKANNT",
            DateTimeOffset.UtcNow.ToString("O"),
            automatischBestanden
                ? "AUTOMATISCHE_PRUEFUNGEN_BESTANDEN_MANUELLE_NACHWEISE_OFFEN"
                : "NICHT_BESTANDEN",
            github.Angemeldet ? github.Konto : null,
            punkte,
            [
                "V5-ANF-WISSEN-012: Fine-grained PAT auf das einzelne Repository begrenzen.",
                "Falls kein libsecret-Keyring verfuegbar ist: Secrets ausschliesslich als Prozess-/systemd-Umgebungsvariablen bereitstellen."
            ]);
    }

    public static string FormatiereBericht(V5ReadinessBericht bericht)
    {
        var json = JsonSerializer.Serialize(bericht, new JsonSerializerOptions { WriteIndented = true });
        var text = new StringBuilder();
        text.AppendLine("V5 READINESS TESTBERICHT");
        text.AppendLine("Test: Linux Bridge · globale V5-Readiness");
        text.AppendLine("Kennung: " + TestKennung);
        text.AppendLine("Test-Version: " + bericht.TestVersion);
        text.AppendLine("Bridge-Version: " + bericht.BridgeAssemblyVersion);
        text.AppendLine("Status: " + bericht.Status);
        text.AppendLine("Erstellt: " + bericht.ErstelltAm);
        text.AppendLine();
        text.AppendLine("=== ERGEBNIS ===");
        text.AppendLine(json);
        return text.ToString();
    }

    internal static async Task<string?> EntferneTempArbeitskopieAsync(string testWurzel)
    {
        Exception? letzterFehler = null;
        for (var versuch = 1; versuch <= 6; versuch++)
        {
            try
            {
                if (!Directory.Exists(testWurzel)) return null;
                Directory.Delete(testWurzel, recursive: true);
                if (!Directory.Exists(testWurzel)) return null;
                letzterFehler = new IOException("TEMP_ARBEITSKOPIE_NACH_DELETE_NOCH_VORHANDEN");
            }
            catch (Exception error) when (error is IOException or UnauthorizedAccessException)
            {
                letzterFehler = error;
            }

            if (versuch < 6) await Task.Delay(TimeSpan.FromMilliseconds(150 * versuch));
        }
        return "TEMP_ARBEITSKOPIE_CLEANUP_FEHLER_NACH_RETRY:" + Begrenze(letzterFehler?.Message);
    }

    private static string Begrenze(string? wert, int maximal = 512)
    {
        var text = string.IsNullOrWhiteSpace(wert) ? "UNBEKANNTER_FEHLER" : wert.Trim();
        return text.Length <= maximal ? text : text[..maximal];
    }
}
