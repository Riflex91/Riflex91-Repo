using System.Diagnostics;

namespace AioBotLinuxBridge;

public sealed record GitHubAnmeldeStatus(
    bool Verfuegbar,
    bool Angemeldet,
    string? Konto,
    string? Fehler);

internal sealed record GitProzessErgebnis(int ExitCode, string Ausgabe, string Fehlerausgabe)
{
    public bool Erfolgreich => ExitCode == 0;
}

public sealed class GitHubAnmeldung
{
    public const string Authentifizierungsmodus = "FINE_GRAINED_PAT";
    public const string MinimalBerechtigungsprofil = "REPOSITORY_ONLY_CONTENTS_WRITE";
    public const string TokenVorlageUrl = "https://github.com/settings/personal-access-tokens/new?name=AioBot-Wissenswaechter&description=Repository-begrenzter+Token+fuer+den+V5-Wissenswaechter&target_name=Riflex91&expires_in=90&contents=write";

    public async Task<GitHubAnmeldeStatus> LiesStatusAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var version = await FuehreGitAusAsync(
                ["credential-manager", "--version"],
                cancellationToken: cancellationToken,
                timeout: TimeSpan.FromSeconds(15));

            if (!version.Erfolgreich)
                return new GitHubAnmeldeStatus(false, false, null, Begrenze(version.Fehlerausgabe));

            var liste = await FuehreGitAusAsync(
                ["credential-manager", "github", "list"],
                cancellationToken: cancellationToken,
                timeout: TimeSpan.FromSeconds(20));

            if (!liste.Erfolgreich)
                return new GitHubAnmeldeStatus(true, false, null, Begrenze(liste.Fehlerausgabe));

            var konto = liste.Ausgabe
                .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault(zeile => !string.IsNullOrWhiteSpace(zeile));

            return new GitHubAnmeldeStatus(true, konto is not null, konto, null);
        }
        catch (Exception error)
        {
            return new GitHubAnmeldeStatus(false, false, null, Begrenze(error.Message));
        }
    }

    public async Task<GitHubAnmeldeStatus> MeldeAnAsync(CancellationToken cancellationToken = default)
    {
        var verfuegbarkeit = await LiesStatusAsync(cancellationToken);
        if (!verfuegbarkeit.Verfuegbar)
            throw new InvalidOperationException("GITHUB_CREDENTIAL_MANAGER_NICHT_VERFUEGBAR");

        // Kein Browser-OAuth: Git Credential Manager wird auf den PAT-Modus begrenzt.
        // Das Token wird ausschliesslich im GCM-eigenen Prompt eingegeben und weder als
        // Prozessargument noch durch die Bridge gelesen oder protokolliert.
        var ergebnis = await FuehreGitAusAsync(
            ["-c", "credential.gitHubAuthModes=pat", "credential-manager", "github", "login", "--force"],
            cancellationToken: cancellationToken,
            timeout: TimeSpan.FromMinutes(5));

        if (!ergebnis.Erfolgreich)
            throw new InvalidOperationException("GITHUB_ANMELDUNG_FEHLGESCHLAGEN:" + Begrenze(ergebnis.Fehlerausgabe));

        var status = await LiesStatusAsync(cancellationToken);
        if (!status.Angemeldet || string.IsNullOrWhiteSpace(status.Konto))
            throw new InvalidOperationException("GITHUB_ANMELDUNG_NICHT_VERIFIZIERT");

        return status;
    }

    public async Task MeldeAbAsync(string konto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(konto))
            throw new InvalidOperationException("GITHUB_KONTO_FEHLT");

        var ergebnis = await FuehreGitAusAsync(
            ["credential-manager", "github", "logout", konto],
            cancellationToken: cancellationToken,
            timeout: TimeSpan.FromSeconds(30));

        if (!ergebnis.Erfolgreich)
            throw new InvalidOperationException("GITHUB_ABMELDUNG_FEHLGESCHLAGEN:" + Begrenze(ergebnis.Fehlerausgabe));
    }

    internal static async Task<GitProzessErgebnis> FuehreGitAusAsync(
        IReadOnlyList<string> argumente,
        string? arbeitsverzeichnis = null,
        CancellationToken cancellationToken = default,
        TimeSpan? timeout = null)
    {
        var start = new ProcessStartInfo
        {
            FileName = "git",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            WorkingDirectory = arbeitsverzeichnis ?? Environment.CurrentDirectory
        };

        foreach (var argument in argumente)
            start.ArgumentList.Add(argument);

        using var prozess = new Process { StartInfo = start };
        if (!prozess.Start())
            throw new InvalidOperationException("GIT_PROZESS_KONNTE_NICHT_GESTARTET_WERDEN");

        var ausgabeTask = prozess.StandardOutput.ReadToEndAsync();
        var fehlerTask = prozess.StandardError.ReadToEndAsync();

        using var timeoutQuelle = timeout.HasValue
            ? new CancellationTokenSource(timeout.Value)
            : new CancellationTokenSource();
        using var verbunden = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeoutQuelle.Token);

        try
        {
            await prozess.WaitForExitAsync(verbunden.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                if (!prozess.HasExited) prozess.Kill(entireProcessTree: true);
            }
            catch
            {
            }

            if (timeoutQuelle.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
                throw new TimeoutException("GIT_PROZESS_ZEITUEBERSCHREITUNG");
            throw;
        }

        var ausgabe = await ausgabeTask;
        var fehler = await fehlerTask;
        return new GitProzessErgebnis(
            prozess.ExitCode,
            Begrenze(ausgabe, 16_384),
            Begrenze(fehler, 16_384));
    }

    private static string Begrenze(string? wert, int maximal = 512)
    {
        var text = string.IsNullOrWhiteSpace(wert) ? string.Empty : wert.Trim();
        return text.Length <= maximal ? text : text[..maximal];
    }
}
