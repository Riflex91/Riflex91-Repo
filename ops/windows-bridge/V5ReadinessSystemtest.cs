using System.Reflection;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record V5ReadinessPruefpunkt(
    string Kennung,
    string Status,
    string Detail);

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
    public const string TestKennung = "V5_WINDOWS_BRIDGE_READINESS";
    public const string TestVersion = "1.0.0";

    private readonly GitHubAnmeldung _githubAnmeldung;

    public V5ReadinessSystemtest(GitHubAnmeldung githubAnmeldung)
    {
        _githubAnmeldung = githubAnmeldung;
    }

    public static IReadOnlyList<V5ReadinessPruefpunkt> PruefeStatischeKonfiguration(
        BridgeConfig config)
    {
        var punkte = new List<V5ReadinessPruefpunkt>();

        void Pruefe(string kennung, bool ok, string detail)
            => punkte.Add(new V5ReadinessPruefpunkt(
                kennung,
                ok ? "BESTANDEN" : "NICHT_BESTANDEN",
                detail));

        try
        {
            config.Validate();
            Pruefe("BRIDGE_KONFIGURATION", true, "BridgeConfig.Validate() erfolgreich.");
        }
        catch (Exception error)
        {
            Pruefe("BRIDGE_KONFIGURATION", false, Begrenze(error.Message));
        }

        Pruefe(
            "CONFIG_VERSION",
            config.ConfigVersion == BridgeConfig.CurrentConfigVersion
                && BridgeConfig.CurrentConfigVersion == 7,
            $"installiert={config.ConfigVersion}; erwartet={BridgeConfig.CurrentConfigVersion}");

        Pruefe(
            "WISSENSWAECHTER_AKTIV",
            config.WissenswaechterAktiv,
            config.WissenswaechterAktiv ? "aktiv" : "deaktiviert");

        Pruefe(
            "WISSENSWAECHTER_INTERVALL",
            config.WissenswaechterIntervallMinuten == 60,
            $"{config.WissenswaechterIntervallMinuten} Minuten");

        Pruefe(
            "KNOWLEDGE_REPOSITORY",
            GitArbeitskopie.RepositoryUrl == "https://github.com/Riflex91/Riflex91-Repo.git",
            GitArbeitskopie.RepositoryUrl);

        Pruefe(
            "KNOWLEDGE_BRANCH",
            GitArbeitskopie.BasisBranch == "main"
                && GitArbeitskopie.WissensBranch == "v5/wissenswaechter-automatisch"
                && GitArbeitskopie.PushZielRef == "HEAD:v5/wissenswaechter-automatisch",
            $"basis={GitArbeitskopie.BasisBranch}; knowledge={GitArbeitskopie.WissensBranch}; push={GitArbeitskopie.PushZielRef}");

        Pruefe(
            "KNOWLEDGE_SCOPE",
            GitArbeitskopie.WissensbasisPfad == "v5/wissensbasis"
                && GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/wissensbasis/manifest.json")
                && !GitArbeitskopie.IstErlaubterWissensbasisPfad("v5/dokumentation/V5-MASTER-ROADMAP.md"),
            GitArbeitskopie.WissensbasisPfad + "/**");

        var livePfad = config.LiveWissensdatenbankPfad;
        var livePfadKonfiguriert = config.LiveWissensimportAktiv
            && !string.IsNullOrWhiteSpace(livePfad)
            && livePfad.StartsWith(@"D:\", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(livePfad.TrimEnd('\\'), @"D:", StringComparison.OrdinalIgnoreCase);
        Pruefe(
            "LIVE_WISSEN_PFAD",
            livePfadKonfiguriert,
            livePfadKonfiguriert
                ? (Directory.Exists(livePfad) ? "konfiguriert; lokale Datenbank gefunden" : "konfiguriert; wartet auf V5-Bot")
                : "ungueltig oder deaktiviert");

        Pruefe(
            "TEST_OHNE_GAMEPLAY_WRITE",
            true,
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
            github.Angemeldet && !string.IsNullOrWhiteSpace(github.Konto)
                ? "BESTANDEN"
                : "NICHT_BESTANDEN",
            github.Angemeldet ? github.Konto ?? "angemeldet" : "nicht angemeldet"));

        if (github.Angemeldet && !string.IsNullOrWhiteSpace(github.Konto))
        {
            var testWurzel = Path.Combine(
                Path.GetTempPath(),
                "AioBotWindowsBridge",
                "V5Readiness",
                Guid.NewGuid().ToString("N"));
            try
            {
                var arbeitskopie = new GitArbeitskopie(testWurzel);
                await arbeitskopie.BereiteVorAsync(github.Konto, cancellationToken);
                punkte.Add(new V5ReadinessPruefpunkt(
                    "KNOWLEDGE_REPO_LIVE_PRUEFUNG",
                    "BESTANDEN",
                    "Exaktes Repository erreichbar; main/Knowledge-Branch und Sparse-Checkout wurden in isolierter Test-Arbeitskopie fail-closed vorbereitet. Kein Push ausgefuehrt."));
            }
            catch (Exception error)
            {
                punkte.Add(new V5ReadinessPruefpunkt(
                    "KNOWLEDGE_REPO_LIVE_PRUEFUNG",
                    "NICHT_BESTANDEN",
                    Begrenze(error.Message)));
            }
            finally
            {
                try
                {
                    if (Directory.Exists(testWurzel))
                        Directory.Delete(testWurzel, recursive: true);
                }
                catch
                {
                    // Temporaere Readiness-Arbeitskopie wird beim naechsten Temp-Cleanup entfernt.
                }
            }
        }
        else
        {
            punkte.Add(new V5ReadinessPruefpunkt(
                "KNOWLEDGE_REPO_LIVE_PRUEFUNG",
                "NICHT_BESTANDEN",
                "GitHub-Anmeldung fehlt."));
        }

        punkte.Add(new V5ReadinessPruefpunkt(
            "GITHUB_LEAST_PRIVILEGE",
            "MANUELL_NACHWEISEN",
            "Der Test liest oder protokolliert niemals das GitHub-Token. Repository-Begrenzung und minimal erforderliche Rechte muessen in der GitHub-Autorisierung separat bestaetigt werden."));

        var automatischBestanden = punkte
            .Where(p => p.Status != "MANUELL_NACHWEISEN")
            .All(p => p.Status == "BESTANDEN");

        var bericht = new V5ReadinessBericht(
            SchemaVersion: 1,
            Test: TestKennung,
            TestVersion: TestVersion,
            BridgeAssemblyVersion: Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "UNBEKANNT",
            ErstelltAm: DateTimeOffset.UtcNow.ToString("O"),
            Status: automatischBestanden
                ? "AUTOMATISCHE_PRUEFUNGEN_BESTANDEN_MANUELLER_AUTORISIERUNGSNACHWEIS_OFFEN"
                : "NICHT_BESTANDEN",
            GitHubKonto: github.Angemeldet ? github.Konto : null,
            Pruefpunkte: punkte,
            ManuelleNachweise:
            [
                "V5-ANF-WISSEN-012: GitHub-Autorisierung auf Riflex91/Riflex91-Repo begrenzt und ohne Administration/Secrets/Deployment/Workflow-Schreibrechte nachweisen."
            ]);

        return bericht;
    }

    public static string FormatiereBericht(V5ReadinessBericht bericht)
    {
        var json = JsonSerializer.Serialize(
            bericht,
            new JsonSerializerOptions { WriteIndented = true });
        var text = new StringBuilder();
        text.AppendLine("V5 READINESS TESTBERICHT");
        text.AppendLine("Test: Windows Bridge · globale V5-Readiness");
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

    private static string Begrenze(string? wert, int maximal = 512)
    {
        var text = string.IsNullOrWhiteSpace(wert) ? "UNBEKANNTER_FEHLER" : wert.Trim();
        return text.Length <= maximal ? text : text[..maximal];
    }
}
