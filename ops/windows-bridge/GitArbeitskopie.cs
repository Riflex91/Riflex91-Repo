namespace AioBotWindowsBridge;

public sealed class GitArbeitskopie
{
    public const string RepositoryUrl = "https://github.com/Riflex91/Riflex91-Repo.git";
    public const string BasisBranch = "main";
    public const string WissensBranch = "v5/wissenswaechter-automatisch";
    public static string PushZielRef => "HEAD:" + WissensBranch;
    public const string WissensbasisPfad = "v5/wissensbasis";
    public const string DatenbankPfad = WissensbasisPfad + "/datenbank";
    public const string LiveWissenPfad = WissensbasisPfad + "/live";
    public const string SyncStrategie = "KNOWLEDGE_ONLY_NO_MAIN_MERGE";
    public const bool IntegriertBasisVorPush = false;

    private readonly string _wurzel;

    public GitArbeitskopie(string? wurzel = null)
    {
        _wurzel = wurzel ?? Path.Combine(BridgeConfig.LocalAppDirectory, "WissensRepo");
    }

    public string Wurzel => _wurzel;

    public async Task BereiteVorAsync(string githubKonto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(githubKonto))
            throw new InvalidOperationException("GITHUB_KONTO_FEHLT");

        Directory.CreateDirectory(Path.GetDirectoryName(_wurzel)!);

        if (!Directory.Exists(Path.Combine(_wurzel, ".git")))
        {
            if (Directory.Exists(_wurzel))
                Directory.Delete(_wurzel, recursive: true);

            var clone = await GitHubAnmeldung.FuehreGitAusAsync(
                [
                    "clone",
                    "--filter=blob:none",
                    "--sparse",
                    "--no-checkout",
                    "--branch", BasisBranch,
                    "--single-branch",
                    RepositoryUrl,
                    _wurzel
                ],
                cancellationToken: cancellationToken,
                timeout: TimeSpan.FromMinutes(3));
            VerlangeErfolg(clone, "GIT_CLONE_FEHLGESCHLAGEN");
        }
        else
        {
            var remote = await GitHubAnmeldung.FuehreGitAusAsync(
                ["remote", "get-url", "origin"],
                _wurzel,
                cancellationToken,
                TimeSpan.FromSeconds(20));
            VerlangeErfolg(remote, "GIT_REMOTE_NICHT_LESBAR");

            if (!string.Equals(
                    NormalisiereRemote(remote.Ausgabe),
                    NormalisiereRemote(RepositoryUrl),
                    StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("GIT_REMOTE_UNERWARTET");
        }

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["fetch", "--prune", "origin", BasisBranch],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_FETCH_FEHLGESCHLAGEN");

        // Der Waechter arbeitet mit Sparse Checkout. Im Arbeitsbaum ist ausschliesslich
        // v5/wissensbasis sichtbar; andere Repo-Bereiche werden nicht ausgecheckt.
        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["sparse-checkout", "init", "--cone"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_SPARSE_CHECKOUT_INIT_FEHLGESCHLAGEN");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["sparse-checkout", "set", WissensbasisPfad],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_SPARSE_CHECKOUT_SET_FEHLGESCHLAGEN");

        var wissensBranchVorhanden = await RemoteBranchExistiertAsync(WissensBranch, cancellationToken);
        if (wissensBranchVorhanden)
        {
            VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
                ["fetch", "origin", $"{WissensBranch}:refs/remotes/origin/{WissensBranch}"],
                _wurzel,
                cancellationToken,
                TimeSpan.FromMinutes(2)), "GIT_WISSENSBRANCH_FETCH_FEHLGESCHLAGEN");
        }

        var startpunkt = wissensBranchVorhanden
            ? $"origin/{WissensBranch}"
            : $"origin/{BasisBranch}";

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["checkout", "-B", WissensBranch, startpunkt],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_CHECKOUT_FEHLGESCHLAGEN");

        // main wird absichtlich NICHT in den Knowledge-Branch gemerged oder rebased.
        // Dadurch erzeugt der lokale Wissenswaechter ausschliesslich Knowledge-Commits
        // und benoetigt keine Berechtigung zum Schreiben von .github/workflows/** oder
        // anderen main-Aenderungen. Ein spaeterer PR-Konflikt bleibt fail-closed serverseitig.
        await VerifiziereLetztenCommitBereichNurWennVorhandenAsync(cancellationToken);

        await VerifiziereArbeitsbereichAsync(cancellationToken);

        var benutzername = githubKonto.Trim();
        var email = $"{benutzername}@users.noreply.github.com";

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["config", "user.name", benutzername],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(15)), "GIT_BENUTZERNAME_KONFIGURATION_FEHLGESCHLAGEN");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["config", "user.email", email],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(15)), "GIT_EMAIL_KONFIGURATION_FEHLGESCHLAGEN");
    }

    public string LoeseWissensbasisPfadAuf(string relativerPfad)
    {
        if (!IstErlaubterWissensbasisPfad(relativerPfad))
            throw new InvalidOperationException("WISSENSBASIS_PFAD_NICHT_ERLAUBT");

        var kombiniert = Path.Combine(
            _wurzel,
            relativerPfad.Replace('/', Path.DirectorySeparatorChar));
        var voll = Path.GetFullPath(kombiniert);
        var erlaubteWurzel = Path.GetFullPath(Path.Combine(_wurzel, WissensbasisPfad));

        if (!voll.StartsWith(erlaubteWurzel + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(voll, erlaubteWurzel, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("WISSENSBASIS_PFAD_AUSBRUCH_VERHINDERT");

        return voll;
    }

    public string LoeseDatenbankPfadAuf(string relativerPfad)
    {
        if (!IstErlaubterDatenbankPfad(relativerPfad))
            throw new InvalidOperationException("DATENBANK_PFAD_NICHT_ERLAUBT");

        var kombiniert = Path.Combine(
            _wurzel,
            relativerPfad.Replace('/', Path.DirectorySeparatorChar));
        var voll = Path.GetFullPath(kombiniert);
        var erlaubteWurzel = Path.GetFullPath(Path.Combine(_wurzel, DatenbankPfad));

        if (!voll.StartsWith(erlaubteWurzel + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(voll, erlaubteWurzel, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("DATENBANK_PFAD_AUSBRUCH_VERHINDERT");

        return voll;
    }

    public static bool IstErlaubterWissensbasisPfad(string? relativerPfad)
    {
        if (string.IsNullOrWhiteSpace(relativerPfad)) return false;

        var normalisiert = relativerPfad.Replace('\\', '/').Trim('/');
        if (normalisiert.Contains("../", StringComparison.Ordinal)
            || normalisiert.EndsWith("/..", StringComparison.Ordinal)
            || normalisiert == "..")
            return false;

        return string.Equals(normalisiert, WissensbasisPfad, StringComparison.Ordinal)
            || normalisiert.StartsWith(WissensbasisPfad + "/", StringComparison.Ordinal);
    }

    public static bool IstErlaubterDatenbankPfad(string? relativerPfad)
    {
        if (string.IsNullOrWhiteSpace(relativerPfad)) return false;

        var normalisiert = relativerPfad.Replace('\\', '/').Trim('/');
        if (normalisiert.Contains("../", StringComparison.Ordinal)
            || normalisiert.EndsWith("/..", StringComparison.Ordinal)
            || normalisiert == "..")
            return false;

        return string.Equals(normalisiert, DatenbankPfad, StringComparison.Ordinal)
            || normalisiert.StartsWith(DatenbankPfad + "/", StringComparison.Ordinal);
    }

    public async Task<bool> CommitUndPushAsync(
        string commitNachricht,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(commitNachricht))
            throw new InvalidOperationException("GIT_COMMIT_NACHRICHT_FEHLT");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["add", "--", WissensbasisPfad],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_ADD_FEHLGESCHLAGEN");

        var diff = await GitHubAnmeldung.FuehreGitAusAsync(
            ["diff", "--cached", "--quiet", "--", WissensbasisPfad],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30));

        if (diff.ExitCode == 0) return false;
        if (diff.ExitCode != 1)
            throw new InvalidOperationException("GIT_DIFF_FEHLGESCHLAGEN:" + diff.Fehlerausgabe);

        await VerifiziereGestagetePfadeAsync(cancellationToken);

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["commit", "-m", commitNachricht],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(1)), "GIT_COMMIT_FEHLGESCHLAGEN");

        // Der Waechter darf ausschliesslich innerhalb von v5/wissensbasis schreiben.
        // Er pusht niemals direkt auf main, sondern nur auf den dedizierten Knowledge-Branch.
        // Vor dem Push wird der aktuelle main nur gefetcht, niemals gemerged/rebased. Der
        // Drei-Punkt-Diff prueft den Branch-Anteil ab Merge-Base und ignoriert main-only
        // Aenderungen. So bleibt ein repository-begrenzter Contents-Write-Token ausreichend.
        // Force-Push ist verboten; konkurrierende Remote-Aenderungen lassen den Push scheitern.
        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["fetch", "origin", BasisBranch],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_FETCH_VOR_PUSH_FEHLGESCHLAGEN");

        await VerifiziereLetztenCommitAsync(cancellationToken);
        await VerifiziereLetztenCommitBereichNurWennVorhandenAsync(cancellationToken);

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["push", "origin", PushZielRef],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_PUSH_FEHLGESCHLAGEN");

        return true;
    }

    private async Task<bool> RemoteBranchExistiertAsync(
        string branch,
        CancellationToken cancellationToken)
    {
        var ergebnis = await GitHubAnmeldung.FuehreGitAusAsync(
            ["ls-remote", "--exit-code", "--heads", "origin", branch],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30));

        if (ergebnis.ExitCode == 0) return true;
        if (ergebnis.ExitCode == 2) return false;
        throw new InvalidOperationException("GIT_REMOTE_BRANCH_PRUEFUNG_FEHLGESCHLAGEN:" + ergebnis.Fehlerausgabe);
    }

    private async Task VerifiziereLetztenCommitBereichNurWennVorhandenAsync(
        CancellationToken cancellationToken)
    {
        var zaehler = await GitHubAnmeldung.FuehreGitAusAsync(
            ["rev-list", "--count", $"origin/{BasisBranch}..HEAD"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(20));
        VerlangeErfolg(zaehler, "GIT_WISSENSBRANCH_ZAEHLER_FEHLGESCHLAGEN");

        if (!int.TryParse(zaehler.Ausgabe.Trim(), out var commits) || commits < 0)
            throw new InvalidOperationException("GIT_WISSENSBRANCH_ZAEHLER_UNGUELTIG");

        if (commits > 0)
            await VerifiziereCommitBereichAsync($"origin/{BasisBranch}...HEAD", cancellationToken);
    }

    private async Task VerifiziereCommitBereichAsync(
        string bereich,
        CancellationToken cancellationToken)
    {
        var liste = await GitHubAnmeldung.FuehreGitAusAsync(
            ["diff", "--name-only", bereich],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(20));
        VerlangeErfolg(liste, "GIT_COMMIT_BEREICH_LISTE_FEHLGESCHLAGEN");

        foreach (var pfad in ZerlegePfade(liste.Ausgabe))
        {
            if (!IstErlaubterWissensbasisPfad(pfad))
                throw new InvalidOperationException("GIT_COMMIT_BEREICH_AUSSERHALB_WISSENSBASIS:" + pfad);
        }
    }

    private async Task VerifiziereArbeitsbereichAsync(CancellationToken cancellationToken)
    {
        var sparse = await GitHubAnmeldung.FuehreGitAusAsync(
            ["sparse-checkout", "list"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(20));
        VerlangeErfolg(sparse, "GIT_SPARSE_CHECKOUT_LISTE_FEHLGESCHLAGEN");

        var pfade = ZerlegePfade(sparse.Ausgabe).ToArray();
        if (pfade.Length != 1 || !string.Equals(
                pfade[0].Replace('\\', '/').Trim('/'),
                WissensbasisPfad,
                StringComparison.Ordinal))
            throw new InvalidOperationException("WISSENSWAECHTER_ARBEITSBEREICH_UNGUELTIG");
    }

    private async Task VerifiziereGestagetePfadeAsync(CancellationToken cancellationToken)
    {
        var liste = await GitHubAnmeldung.FuehreGitAusAsync(
            ["diff", "--cached", "--name-only"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(20));
        VerlangeErfolg(liste, "GIT_STAGE_LISTE_FEHLGESCHLAGEN");

        foreach (var pfad in ZerlegePfade(liste.Ausgabe))
        {
            if (!IstErlaubterWissensbasisPfad(pfad))
                throw new InvalidOperationException("GIT_STAGE_AUSSERHALB_WISSENSBASIS:" + pfad);
        }
    }

    private async Task VerifiziereLetztenCommitAsync(CancellationToken cancellationToken)
    {
        var liste = await GitHubAnmeldung.FuehreGitAusAsync(
            ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(20));
        VerlangeErfolg(liste, "GIT_COMMIT_LISTE_FEHLGESCHLAGEN");

        foreach (var pfad in ZerlegePfade(liste.Ausgabe))
        {
            if (!IstErlaubterWissensbasisPfad(pfad))
                throw new InvalidOperationException("GIT_COMMIT_AUSSERHALB_WISSENSBASIS:" + pfad);
        }
    }

    private static IEnumerable<string> ZerlegePfade(string ausgabe)
    {
        return ausgabe.Split(
            ['\r', '\n'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static string NormalisiereRemote(string wert)
    {
        var text = wert.Trim().TrimEnd('/');
        return text.EndsWith(".git", StringComparison.OrdinalIgnoreCase) ? text : text + ".git";
    }

    private static void VerlangeErfolg(GitProzessErgebnis ergebnis, string fehler)
    {
        if (!ergebnis.Erfolgreich)
            throw new InvalidOperationException(fehler + ":" + ergebnis.Fehlerausgabe);
    }
}
