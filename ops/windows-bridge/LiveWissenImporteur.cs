using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record LiveWissenImportErgebnis(
    bool Konfiguriert,
    int GefundeneDateien,
    int ImportierteDateien,
    int UnveraenderteDateien,
    int UebersprungeneDateien,
    long ImportierteBytes,
    string? Fehler);

public sealed class LiveWissenImporteur
{
    public const string ZielWurzel = GitArbeitskopie.DatenbankPfad + "/live-verifiziert";
    public const string AktuellWurzel = ZielWurzel + "/aktuell";
    public const string ManifestPfad = ZielWurzel + "/manifest.json";

    private const int MaxDateien = 5000;
    private const long MaxDateigroesseBytes = 8L * 1024 * 1024;
    private const long MaxGesamtBytes = 64L * 1024 * 1024;
    private static readonly TimeSpan Schreibruhe = TimeSpan.FromSeconds(2);

    private static readonly HashSet<string> ErlaubteErweiterungen = new(StringComparer.OrdinalIgnoreCase)
    {
        ".json", ".jsonl", ".ndjson", ".txt", ".md", ".csv", ".tsv", ".yaml", ".yml", ".log"
    };

    private static readonly Regex GeheimnisMuster = new(
        """(?ix)
        ["']?
        (?:password|passwort|token|secret|api[_-]?key|application[_-]?key|private[_-]?key|
           access[_-]?key|credential|credentials|bearer)
        ["']?
        \s*[:=]\s*
        ["']?(?!\s*(?:null|false|true|0|""|''))[A-Za-z0-9_+\-/=.]{12,}
        """,
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly BridgeConfig _config;
    private readonly GitArbeitskopie _arbeitskopie;

    public LiveWissenImporteur(BridgeConfig config, GitArbeitskopie arbeitskopie)
    {
        _config = config;
        _arbeitskopie = arbeitskopie;
    }

    public async Task<LiveWissenImportErgebnis> ImportiereAsync(
        DateTimeOffset zeitpunkt,
        CancellationToken cancellationToken = default)
    {
        if (!_config.LiveWissenImportAktiv || string.IsNullOrWhiteSpace(_config.LiveWissenQuellordner))
            return new LiveWissenImportErgebnis(false, 0, 0, 0, 0, 0, null);

        var quelle = _config.LiveWissenQuellordner.Trim();
        if (!Directory.Exists(quelle))
            return new LiveWissenImportErgebnis(true, 0, 0, 0, 0, 0, "LIVE_WISSEN_QUELLORDNER_FEHLT");

        IReadOnlyList<string> dateien;
        try
        {
            dateien = SammleDateienSicher(quelle);
        }
        catch (Exception error)
        {
            return new LiveWissenImportErgebnis(true, 0, 0, 0, 0, 0, "LIVE_WISSEN_SCAN_FEHLER:" + Begrenze(error.Message));
        }

        if (dateien.Count > MaxDateien)
            return new LiveWissenImportErgebnis(true, dateien.Count, 0, 0, dateien.Count, 0, "LIVE_WISSEN_ZU_VIELE_DATEIEN");

        var altesManifest = await LadeManifestAsync(cancellationToken);
        var altNachPfad = altesManifest.Dateien.ToDictionary(
            eintrag => eintrag.RelativerPfad,
            StringComparer.OrdinalIgnoreCase);

        var neueEintraege = new List<LiveWissenManifestEintrag>();
        var importiert = 0;
        var unveraendert = 0;
        var uebersprungen = 0;
        long importierteBytes = 0;
        long gesamtBytes = 0;

        foreach (var datei in dateien)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var relativ = Path.GetRelativePath(quelle, datei).Replace('\\', '/');
            if (!IstSichererRelativerPfad(relativ) || !IstUnterstuetzteLiveWissenDatei(relativ))
            {
                uebersprungen++;
                continue;
            }

            FileInfo info;
            try
            {
                info = new FileInfo(datei);
                if (!info.Exists
                    || info.Attributes.HasFlag(FileAttributes.ReparsePoint)
                    || info.Length > MaxDateigroesseBytes
                    || DateTimeOffset.UtcNow - info.LastWriteTimeUtc < Schreibruhe)
                {
                    uebersprungen++;
                    continue;
                }
            }
            catch
            {
                uebersprungen++;
                continue;
            }

            gesamtBytes += info.Length;
            if (gesamtBytes > MaxGesamtBytes)
                return new LiveWissenImportErgebnis(
                    true, dateien.Count, importiert, unveraendert, uebersprungen, importierteBytes,
                    "LIVE_WISSEN_GESAMTGROESSE_UEBERSCHRITTEN");

            byte[] bytes;
            DateTime letzteAenderungVorher;
            long laengeVorher;
            try
            {
                letzteAenderungVorher = info.LastWriteTimeUtc;
                laengeVorher = info.Length;
                bytes = await File.ReadAllBytesAsync(datei, cancellationToken);

                info.Refresh();
                if (!info.Exists
                    || info.Length != laengeVorher
                    || info.LastWriteTimeUtc != letzteAenderungVorher)
                {
                    uebersprungen++;
                    continue;
                }
            }
            catch
            {
                uebersprungen++;
                continue;
            }

            if (EnthaeltMoeglicheGeheimnisse(relativ, bytes))
            {
                uebersprungen++;
                neueEintraege.Add(new LiveWissenManifestEintrag(
                    relativ,
                    null,
                    bytes.LongLength,
                    new DateTimeOffset(letzteAenderungVorher, TimeSpan.Zero),
                    zeitpunkt,
                    "BLOCKIERT_SENSIBLE_DATEN",
                    null));
                continue;
            }

            var sha = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
            var repoRelativ = BerechneZielRelativpfad(relativ);

            if (altNachPfad.TryGetValue(relativ, out var vorher)
                && string.Equals(vorher.Sha256, sha, StringComparison.OrdinalIgnoreCase)
                && File.Exists(_arbeitskopie.LoeseWissensbasisPfadAuf(repoRelativ)))
            {
                unveraendert++;
            }
            else
            {
                var ziel = _arbeitskopie.LoeseWissensbasisPfadAuf(repoRelativ);
                Directory.CreateDirectory(Path.GetDirectoryName(ziel)!);
                var temporaer = ziel + ".tmp";
                await File.WriteAllBytesAsync(temporaer, bytes, cancellationToken);
                File.Move(temporaer, ziel, overwrite: true);
                importiert++;
                importierteBytes += bytes.LongLength;
            }

            neueEintraege.Add(new LiveWissenManifestEintrag(
                relativ,
                sha,
                bytes.LongLength,
                new DateTimeOffset(letzteAenderungVorher, TimeSpan.Zero),
                zeitpunkt,
                "LIVE_VERIFIZIERT_DURCH_BOT",
                repoRelativ));
        }

        // Eine ploetzlich leere Quelle kann ein nicht gemountetes Laufwerk oder einen
        // Bot-Startzustand bedeuten. In diesem Fall werden vorhandene Live-Daten nicht
        // automatisch geloescht.
        if (dateien.Count > 0)
            EntferneNichtMehrVorhandeneLiveDateien(altesManifest, neueEintraege);

        var manifest = new LiveWissenManifest(
            1,
            zeitpunkt,
            "BOT_LIVE_ORDNER",
            "LIVE_VERIFIZIERT_DURCH_BOT",
            AktuellWurzel,
            neueEintraege
                .OrderBy(x => x.RelativerPfad, StringComparer.OrdinalIgnoreCase)
                .ToArray());

        await SpeichereManifestAsync(manifest, cancellationToken);

        return new LiveWissenImportErgebnis(
            true,
            dateien.Count,
            importiert,
            unveraendert,
            uebersprungen,
            importierteBytes,
            null);
    }

    public static bool IstUnterstuetzteLiveWissenDatei(string pfad)
    {
        var erweiterung = Path.GetExtension(pfad);
        return !string.IsNullOrWhiteSpace(erweiterung)
            && ErlaubteErweiterungen.Contains(erweiterung);
    }

    public static bool IstSichererRelativerPfad(string? pfad)
    {
        if (string.IsNullOrWhiteSpace(pfad)) return false;
        var normalisiert = pfad.Replace('\\', '/').Trim('/');
        if (Path.IsPathRooted(normalisiert)) return false;

        var segmente = normalisiert.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segmente.Length == 0) return false;

        return segmente.All(segment =>
            segment is not "." and not ".."
            && !string.Equals(segment, ".git", StringComparison.OrdinalIgnoreCase)
            && !segment.Any(char.IsControl)
            && !segment.Contains(':', StringComparison.Ordinal));
    }

    public static string BerechneZielRelativpfad(string relativerQuellpfad)
    {
        if (!IstSichererRelativerPfad(relativerQuellpfad))
            throw new InvalidOperationException("LIVE_WISSEN_RELATIVER_PFAD_UNGUELTIG");

        var normalisiert = relativerQuellpfad.Replace('\\', '/').Trim('/');
        var ziel = AktuellWurzel + "/" + normalisiert;

        if (!GitArbeitskopie.IstErlaubterWissensbasisPfad(ziel))
            throw new InvalidOperationException("LIVE_WISSEN_ZIEL_AUSSERHALB_WISSENSBASIS");

        return ziel;
    }

    public static bool EnthaeltMoeglicheGeheimnisse(string relativerPfad, byte[] bytes)
    {
        if (!IstUnterstuetzteLiveWissenDatei(relativerPfad))
            return true;

        if (bytes.Length == 0) return false;

        string text;
        try
        {
            text = Encoding.UTF8.GetString(bytes);
        }
        catch
        {
            return true;
        }

        return GeheimnisMuster.IsMatch(text);
    }

    private static IReadOnlyList<string> SammleDateienSicher(string wurzel)
    {
        var ergebnis = new List<string>();
        var stapel = new Stack<string>();
        stapel.Push(wurzel);

        while (stapel.Count > 0)
        {
            var ordner = stapel.Pop();
            var ordnerInfo = new DirectoryInfo(ordner);
            if (ordnerInfo.Attributes.HasFlag(FileAttributes.ReparsePoint))
                continue;

            foreach (var unterordner in Directory.EnumerateDirectories(ordner))
            {
                var info = new DirectoryInfo(unterordner);
                if (!info.Attributes.HasFlag(FileAttributes.ReparsePoint))
                    stapel.Push(unterordner);
            }

            foreach (var datei in Directory.EnumerateFiles(ordner))
            {
                var info = new FileInfo(datei);
                if (!info.Attributes.HasFlag(FileAttributes.ReparsePoint)
                    && IstUnterstuetzteLiveWissenDatei(info.Name))
                    ergebnis.Add(datei);
            }
        }

        return ergebnis;
    }

    private void EntferneNichtMehrVorhandeneLiveDateien(
        LiveWissenManifest altesManifest,
        IReadOnlyList<LiveWissenManifestEintrag> neueEintraege)
    {
        var aktuellePfade = neueEintraege
            .Where(x => x.RepoPfad is not null)
            .Select(x => x.RelativerPfad)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var alt in altesManifest.Dateien)
        {
            if (alt.RepoPfad is null || aktuellePfade.Contains(alt.RelativerPfad))
                continue;
            if (!alt.RepoPfad.StartsWith(AktuellWurzel + "/", StringComparison.Ordinal))
                continue;

            var ziel = _arbeitskopie.LoeseWissensbasisPfadAuf(alt.RepoPfad);
            if (File.Exists(ziel))
                File.Delete(ziel);
        }
    }

    private async Task<LiveWissenManifest> LadeManifestAsync(CancellationToken cancellationToken)
    {
        var pfad = _arbeitskopie.LoeseWissensbasisPfadAuf(ManifestPfad);
        if (!File.Exists(pfad))
            return new LiveWissenManifest(1, DateTimeOffset.MinValue, "BOT_LIVE_ORDNER", "LIVE_VERIFIZIERT_DURCH_BOT", AktuellWurzel, []);

        try
        {
            var json = await File.ReadAllTextAsync(pfad, cancellationToken);
            return JsonSerializer.Deserialize<LiveWissenManifest>(json, BridgeConfig.JsonOptions)
                ?? new LiveWissenManifest(1, DateTimeOffset.MinValue, "BOT_LIVE_ORDNER", "LIVE_VERIFIZIERT_DURCH_BOT", AktuellWurzel, []);
        }
        catch
        {
            return new LiveWissenManifest(1, DateTimeOffset.MinValue, "BOT_LIVE_ORDNER", "LIVE_VERIFIZIERT_DURCH_BOT", AktuellWurzel, []);
        }
    }

    private async Task SpeichereManifestAsync(
        LiveWissenManifest manifest,
        CancellationToken cancellationToken)
    {
        var pfad = _arbeitskopie.LoeseWissensbasisPfadAuf(ManifestPfad);
        Directory.CreateDirectory(Path.GetDirectoryName(pfad)!);
        var temporaer = pfad + ".tmp";

        await using (var stream = File.Create(temporaer))
        {
            await JsonSerializer.SerializeAsync(
                stream,
                manifest,
                BridgeConfig.JsonOptions,
                cancellationToken);
        }

        File.Move(temporaer, pfad, overwrite: true);
    }

    private static string Begrenze(string? wert, int maximal = 200)
    {
        var text = string.IsNullOrWhiteSpace(wert) ? "UNBEKANNT" : wert.Trim();
        return text.Length <= maximal ? text : text[..maximal];
    }

    private sealed record LiveWissenManifest(
        int SchemaVersion,
        DateTimeOffset ErzeugtAm,
        string Quellenart,
        string Vertrauensstufe,
        string RepoZiel,
        IReadOnlyList<LiveWissenManifestEintrag> Dateien);

    private sealed record LiveWissenManifestEintrag(
        string RelativerPfad,
        string? Sha256,
        long Bytes,
        DateTimeOffset LetzteLokaleAenderung,
        DateTimeOffset ImportiertAm,
        string Status,
        string? RepoPfad);
}
