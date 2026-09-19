namespace AioBotWindowsBridge;

public sealed class GitArbeitskopie
{
    public const string RepositoryUrl = "https://github.com/Riflex91/Riflex91-Repo.git";
    public const string ZielBranch = "main";
    public const string AutomatischerWissensPfad = "v5/wissensbasis/automatisch";

    private readonly string _wurzel;
    private string? _basisCommit;

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
                ["clone", "--branch", ZielBranch, "--single-branch", RepositoryUrl, _wurzel],
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

            if (!string.Equals(NormalisiereRemote(remote.Ausgabe), NormalisiereRemote(RepositoryUrl), StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("GIT_REMOTE_UNERWARTET");
        }

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["fetch", "--prune", "origin", ZielBranch],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_FETCH_FEHLGESCHLAGEN");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["checkout", "-B", ZielBranch, $"origin/{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_CHECKOUT_FEHLGESCHLAGEN");

        var basis = await GitHubAnmeldung.FuehreGitAusAsync(
            ["rev-parse", "HEAD"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(15));
        VerlangeErfolg(basis, "GIT_BASIS_COMMIT_NICHT_LESBAR");
        _basisCommit = basis.Ausgabe.Trim();

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

    public string LoeseWissensPfadAuf(string relativerPfad)
    {
        if (!IstErlaubterWissensPfad(relativerPfad))
            throw new InvalidOperationException("WISSENS_PFAD_NICHT_ERLAUBT");

        var kombiniert = Path.Combine(
            _wurzel,
            relativerPfad.Replace('/', Path.DirectorySeparatorChar));
        var voll = Path.GetFullPath(kombiniert);
        var erlaubteWurzel = Path.GetFullPath(Path.Combine(_wurzel, AutomatischerWissensPfad));

        if (!voll.StartsWith(erlaubteWurzel + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(voll, erlaubteWurzel, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("WISSENS_PFAD_AUSBRUCH_VERHINDERT");

        return voll;
    }

    public static bool IstErlaubterWissensPfad(string? relativerPfad)
    {
        if (string.IsNullOrWhiteSpace(relativerPfad)) return false;
        var normalisiert = relativerPfad.Replace('\\', '/').Trim('/');
        if (normalisiert.Contains("../", StringComparison.Ordinal)
            || normalisiert.EndsWith("/..", StringComparison.Ordinal)
            || normalisiert == "..")
            return false;

        return string.Equals(normalisiert, AutomatischerWissensPfad, StringComparison.Ordinal)
            || normalisiert.StartsWith(AutomatischerWissensPfad + "/", StringComparison.Ordinal);
    }

    public async Task<bool> CommitUndPushAsync(
        string commitNachricht,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_basisCommit))
            throw new InvalidOperationException("GIT_BASIS_COMMIT_FEHLT");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["fetch", "origin", ZielBranch],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_FETCH_VOR_PUSH_FEHLGESCHLAGEN");

        var remoteKopf = await GitHubAnmeldung.FuehreGitAusAsync(
            ["rev-parse", $"origin/{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(15));
        VerlangeErfolg(remoteKopf, "GIT_REMOTE_KOPF_NICHT_LESBAR");

        if (!string.Equals(_basisCommit, remoteKopf.Ausgabe.Trim(), StringComparison.Ordinal))
            throw new InvalidOperationException("REPO_WAEHREND_WISSENSLAUF_GEAENDERT");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["add", "--", AutomatischerWissensPfad],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30)), "GIT_ADD_FEHLGESCHLAGEN");

        var diff = await GitHubAnmeldung.FuehreGitAusAsync(
            ["diff", "--cached", "--quiet", "--", AutomatischerWissensPfad],
            _wurzel,
            cancellationToken,
            TimeSpan.FromSeconds(30));

        if (diff.ExitCode == 0) return false;
        if (diff.ExitCode != 1)
            throw new InvalidOperationException("GIT_DIFF_FEHLGESCHLAGEN:" + diff.Fehlerausgabe);

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["commit", "-m", commitNachricht],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(1)), "GIT_COMMIT_FEHLGESCHLAGEN");

        VerlangeErfolg(await GitHubAnmeldung.FuehreGitAusAsync(
            ["push", "origin", $"HEAD:{ZielBranch}"],
            _wurzel,
            cancellationToken,
            TimeSpan.FromMinutes(2)), "GIT_PUSH_FEHLGESCHLAGEN");

        return true;
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
