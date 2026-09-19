namespace AioBotWindowsBridge;

public sealed class GitArbeitskopie
{
    public const string RepositoryUrl = "https://github.com/Riflex91/Riflex91-Repo.git";
    public const string ZielBranch = "main";
    public const string WissensbasisPfad = "v5/wissensbasis";
    public const string DatenbankPfad = WissensbasisPfad + "/datenbank";

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
                    "--branch", ZielBranch,
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
            ["fetch", "--prune", "origin", ZielBranch],
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

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["checkout", "-B", ZielBranch, $"origin/{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_CHECKOUT_FEHLGESCHLAGEN");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["reset", "--hard", $"origin/{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_RESET_FEHLGESCHLAGEN");

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
            ["add", "--", DatenbankPfad],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_ADD_FEHLGESCHLAGEN");

        var diff = await GitHubAnmeldung.FuehreGitAusAsync(
            ["diff", "--cached", "--quiet", "--", DatenbankPfad],
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

        // Der Waechter darf jederzeit schreiben. Wenn main waehrend des Laufs weiterlief,
        // werden fremde Commits zuerst integriert. Nur Datenbankdateien befinden sich in
        // unserem Commit; Konflikte werden fail-closed behandelt und nie mit force gepusht.
        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["fetch", "origin", ZielBranch],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_FETCH_VOR_PUSH_FEHLGESCHLAGEN");

        var rebase = await GitHubAnmeldung.FuehreGitAusAsync(
            ["rebase", $"origin/{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2));

        if (!rebase.Erfolgreich)
        {
            await GitHubAnmeldung.FuehreGitAusAsync(
                ["rebase", "--abort"],
                _wurzel,
                cancellationToken,
                TimeSpan.FromSeconds(30));
            throw new InvalidOperationException("GIT_REBASE_KONFLIKT:" + rebase.Fehlerausgabe);
        }

        await VerifiziereLetztenCommitAsync(cancellationToken);

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["push", "origin", $"HEAD:{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_PUSH_FEHLGESCHLAGEN");

        return true;
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
            if (!IstErlaubterDatenbankPfad(pfad))
                throw new InvalidOperationException("GIT_STAGE_AUSSERHALB_DATENBANK:" + pfad);
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
            if (!IstErlaubterDatenbankPfad(pfad))
                throw new InvalidOperationException("GIT_COMMIT_AUSSERHALB_DATENBANK:" + pfad);
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
