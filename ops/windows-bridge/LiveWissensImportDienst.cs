using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record LiveWissensImportErgebnis(
    string Zustand,
    long? Generation,
    int Dateien,
    long Bytes,
    string? SnapshotSha256,
    string? Hinweis);

public sealed class LiveWissensImportDienst
{
    public const string KanonischerSpielname = "Adventure Land - The Code MMORPG";
    public const string LokalesFormat = "ADVENTURE_LAND_V5_LIVE_WISSEN";
    public const int SchemaVersion = 1;

    private static readonly HashSet<string> ErlaubteDomaenen = new(StringComparer.Ordinal)
    {
        "KERN",
        "CHARAKTER",
        "INVENTAR",
        "SKILL",
        "MONSTER",
        "MAP",
        "EVENT",
        "QUEST",
        "MARKT",
        "BANK",
        "HANDWERK",
        "KAMPF",
        "NAVIGATION",
        "GRUPPE",
        "SERVER",
        "ITEM",
        "NPC"
    };

    private static readonly string[] VerboteneEigenschaftsFragmente =
    [
        "password",
        "passwort",
        "token",
        "secret",
        "credential",
        "applicationkey",
        "accesskey",
        "authorization",
        "cookie",
        "session"
    ];

    private readonly BridgeConfig _config;
    private readonly GitArbeitskopie _arbeitskopie;

    public LiveWissensImportDienst(BridgeConfig config, GitArbeitskopie arbeitskopie)
    {
        _config = config;
        _arbeitskopie = arbeitskopie;
    }

    public async Task<LiveWissensImportErgebnis> ImportiereAsync(CancellationToken cancellationToken = default)
    {
        if (!_config.LiveWissensimportAktiv)
            return new LiveWissensImportErgebnis("DEAKTIVIERT", null, 0, 0, null, null);

        var wurzel = BridgeConfig.NormalisiereLiveWissenspfad(_config.LiveWissensdatenbankPfad);
        if (!Directory.Exists(wurzel))
            return new LiveWissensImportErgebnis("WARTET_AUF_BOT", null, 0, 0, null, "LOKALE_LIVE_WISSENSDATENBANK_FEHLT");

        VerifiziereKeinReparsePunkt(wurzel, wurzel);

        var manifestPfad = Path.Combine(wurzel, "manifest.json");
        var statusPfad = Path.Combine(wurzel, "status.json");
        if (!File.Exists(manifestPfad) || !File.Exists(statusPfad))
            return new LiveWissensImportErgebnis("WARTET_AUF_BOT", null, 0, 0, null, "LIVE_MANIFEST_ODER_STATUS_FEHLT");

        VerifiziereKeinReparsePunkt(wurzel, manifestPfad);
        VerifiziereKeinReparsePunkt(wurzel, statusPfad);

        var manifestBytes = await LiesBegrenztAsync(manifestPfad, _config.LiveWissensMaxDateiBytes, cancellationToken);
        var statusVorherBytes = await LiesBegrenztAsync(statusPfad, _config.LiveWissensMaxDateiBytes, cancellationToken);
        var manifest = ParseManifest(manifestBytes);
        var statusVorher = ParseStatus(statusVorherBytes);

        if (!string.Equals(statusVorher.Zustand, "BEREIT", StringComparison.Ordinal))
            return new LiveWissensImportErgebnis("WARTET_AUF_BOT", statusVorher.Generation, 0, 0, null, "BOT_SCHREIBT_GERADE");

        var aktuellWurzel = Path.Combine(wurzel, manifest.AktuellVerzeichnis);
        if (!Directory.Exists(aktuellWurzel))
            return new LiveWissensImportErgebnis("WARTET_AUF_BOT", statusVorher.Generation, 0, 0, null, "LIVE_AKTUELL_VERZEICHNIS_FEHLT");

        VerifiziereKeinReparsePunkt(wurzel, aktuellWurzel);

        var dateien = Directory
            .EnumerateFiles(aktuellWurzel, "*.json", SearchOption.AllDirectories)
            .OrderBy(pfad => pfad, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (dateien.Length > _config.LiveWissensMaxDateienProLauf)
            throw new InvalidOperationException("LIVE_WISSEN_ZU_VIELE_DATEIEN");

        var validierteDateien = new List<ValidierteLiveDatei>(dateien.Length);
        long gesamtBytes = manifestBytes.LongLength + statusVorherBytes.LongLength;

        foreach (var datei in dateien)
        {
            cancellationToken.ThrowIfCancellationRequested();
            VerifiziereKeinReparsePunkt(wurzel, datei);

            var relativ = Path.GetRelativePath(aktuellWurzel, datei).Replace('\\', '/');
            if (!IstSichererRelativerPfad(relativ))
                throw new InvalidOperationException("LIVE_WISSEN_RELATIVER_PFAD_UNGUELTIG");

            var bytes = await LiesBegrenztAsync(datei, _config.LiveWissensMaxDateiBytes, cancellationToken);
            ValidiereLiveFaktJson(bytes);
            gesamtBytes += bytes.LongLength;

            if (gesamtBytes > _config.LiveWissensMaxGesamtBytesProLauf)
                throw new InvalidOperationException("LIVE_WISSEN_GESAMTGROESSE_UEBERSCHRITTEN");

            validierteDateien.Add(new ValidierteLiveDatei(
                relativ,
                bytes,
                Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant()));
        }

        var statusNachherBytes = await LiesBegrenztAsync(statusPfad, _config.LiveWissensMaxDateiBytes, cancellationToken);
        var statusNachher = ParseStatus(statusNachherBytes);
        if (!string.Equals(statusNachher.Zustand, "BEREIT", StringComparison.Ordinal)
            || statusNachher.Generation != statusVorher.Generation
            || !statusNachherBytes.AsSpan().SequenceEqual(statusVorherBytes))
            return new LiveWissensImportErgebnis("WARTET_AUF_STABILEN_SNAPSHOT", statusNachher.Generation, 0, 0, null, "LIVE_SNAPSHOT_HAT_SICH_WAEHREND_IMPORT_GEAENDERT");

        var snapshotHash = BerechneSnapshotHash(manifestBytes, statusNachherBytes, validierteDateien);
        await SpiegeleNachGitAsync(
            manifestBytes,
            statusNachherBytes,
            validierteDateien,
            statusNachher.Generation,
            gesamtBytes,
            snapshotHash,
            cancellationToken);

        return new LiveWissensImportErgebnis(
            "IMPORTIERT",
            statusNachher.Generation,
            validierteDateien.Count,
            gesamtBytes,
            snapshotHash,
            null);
    }

    public static void ValidiereLiveFaktJson(byte[] bytes)
    {
        using var dokument = JsonDocument.Parse(bytes);
        var root = dokument.RootElement;
        if (root.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("LIVE_FAKT_KEIN_OBJEKT");

        if (LiesInt(root, "schemaVersion") != SchemaVersion)
            throw new InvalidOperationException("LIVE_FAKT_SCHEMA_UNGUELTIG");
        if (!string.Equals(LiesText(root, "spiel"), KanonischerSpielname, StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_FAKT_FALSCHES_SPIEL");
        if (!string.Equals(LiesText(root, "status"), "LIVE_VERIFIZIERT", StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_FAKT_NICHT_VERIFIZIERT");

        var kennung = LiesText(root, "kennung");
        if (string.IsNullOrWhiteSpace(kennung) || kennung.Length > 200)
            throw new InvalidOperationException("LIVE_FAKT_KENNUNG_UNGUELTIG");

        var domaene = LiesText(root, "domaene");
        if (string.IsNullOrWhiteSpace(domaene) || !ErlaubteDomaenen.Contains(domaene))
            throw new InvalidOperationException("LIVE_FAKT_DOMAENE_UNGUELTIG");

        if (!root.TryGetProperty("wert", out _))
            throw new InvalidOperationException("LIVE_FAKT_WERT_FEHLT");

        var beobachtetAm = LiesZeit(root, "beobachtetAm");
        var verifiziertAm = LiesZeit(root, "verifiziertAm");
        var jetzt = DateTimeOffset.UtcNow;
        if (verifiziertAm < beobachtetAm)
            throw new InvalidOperationException("LIVE_FAKT_VERIFIKATION_VOR_BEOBACHTUNG");
        if (beobachtetAm > jetzt.AddMinutes(5) || verifiziertAm > jetzt.AddMinutes(5))
            throw new InvalidOperationException("LIVE_FAKT_ZEIT_LIEGT_IN_ZUKUNFT");

        if (!root.TryGetProperty("quelle", out var quelle) || quelle.ValueKind != JsonValueKind.Object)
            throw new InvalidOperationException("LIVE_FAKT_QUELLE_FEHLT");
        if (!string.Equals(LiesText(quelle, "art"), "LIVE_SPIEL", StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_FAKT_QUELLE_NICHT_LIVE_SPIEL");
        var methode = LiesText(quelle, "methode");
        if (string.IsNullOrWhiteSpace(methode) || methode.Length > 200)
            throw new InvalidOperationException("LIVE_FAKT_METHODE_UNGUELTIG");

        VerweigereGeheimnisEigenschaften(root);
    }

    public static bool IstSichererRelativerPfad(string? relativ)
    {
        if (string.IsNullOrWhiteSpace(relativ)) return false;
        var normalisiert = relativ.Replace('\\', '/').Trim('/');
        if (normalisiert.Length == 0
            || normalisiert.StartsWith(".", StringComparison.Ordinal)
            || normalisiert.Contains("../", StringComparison.Ordinal)
            || normalisiert.EndsWith("/..", StringComparison.Ordinal)
            || normalisiert.Contains("//", StringComparison.Ordinal)
            || Path.IsPathRooted(normalisiert)
            || !normalisiert.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return false;

        return normalisiert.Split('/').All(segment =>
            segment.Length is > 0 and <= 120
            && segment != "."
            && segment != ".."
            && segment.All(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_' or '.'));
    }

    private async Task SpiegeleNachGitAsync(
        byte[] manifestBytes,
        byte[] statusBytes,
        IReadOnlyList<ValidierteLiveDatei> dateien,
        long generation,
        long gesamtBytes,
        string snapshotHash,
        CancellationToken cancellationToken)
    {
        var liveWurzel = _arbeitskopie.LoeseWissensbasisPfadAuf(GitArbeitskopie.LiveWissenPfad);
        Directory.CreateDirectory(liveWurzel);

        var ziel = Path.Combine(liveWurzel, "snapshot");
        var staging = Path.Combine(liveWurzel, ".import-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(staging, "aktuell"));

        try
        {
            await File.WriteAllBytesAsync(Path.Combine(staging, "manifest.json"), manifestBytes, cancellationToken);
            await File.WriteAllBytesAsync(Path.Combine(staging, "status.json"), statusBytes, cancellationToken);

            foreach (var datei in dateien)
            {
                var zielDatei = Path.Combine(staging, "aktuell", datei.RelativerPfad.Replace('/', Path.DirectorySeparatorChar));
                Directory.CreateDirectory(Path.GetDirectoryName(zielDatei)!);
                await File.WriteAllBytesAsync(zielDatei, datei.Bytes, cancellationToken);
            }

            var importStatus = new
            {
                schemaVersion = 1,
                importiertAm = DateTimeOffset.UtcNow,
                generation,
                dateien = dateien.Count,
                bytes = gesamtBytes,
                snapshotSha256 = snapshotHash,
                quelle = "LOKALE_LIVE_WISSENSDATENBANK",
                spiel = KanonischerSpielname
            };
            var importBytes = JsonSerializer.SerializeToUtf8Bytes(importStatus, BridgeConfig.JsonOptions);
            await File.WriteAllBytesAsync(Path.Combine(staging, "import.json"), importBytes, cancellationToken);

            var backup = ziel + ".alt";
            if (Directory.Exists(backup)) Directory.Delete(backup, recursive: true);
            if (Directory.Exists(ziel)) Directory.Move(ziel, backup);
            Directory.Move(staging, ziel);
            if (Directory.Exists(backup)) Directory.Delete(backup, recursive: true);
        }
        finally
        {
            if (Directory.Exists(staging)) Directory.Delete(staging, recursive: true);
        }
    }

    private static LiveManifest ParseManifest(byte[] bytes)
    {
        using var dokument = JsonDocument.Parse(bytes);
        var root = dokument.RootElement;
        if (root.ValueKind != JsonValueKind.Object
            || LiesInt(root, "schemaVersion") != SchemaVersion
            || !string.Equals(LiesText(root, "format"), LokalesFormat, StringComparison.Ordinal)
            || !string.Equals(LiesText(root, "spiel"), KanonischerSpielname, StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_MANIFEST_UNGUELTIG");

        var aktuell = LiesText(root, "aktuellVerzeichnis");
        if (!string.Equals(aktuell, "aktuell", StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_MANIFEST_AKTUELL_VERZEICHNIS_UNGUELTIG");

        VerweigereGeheimnisEigenschaften(root);
        return new LiveManifest(aktuell);
    }

    private static LiveStatus ParseStatus(byte[] bytes)
    {
        using var dokument = JsonDocument.Parse(bytes);
        var root = dokument.RootElement;
        if (root.ValueKind != JsonValueKind.Object
            || LiesInt(root, "schemaVersion") != SchemaVersion
            || !string.Equals(LiesText(root, "spiel"), KanonischerSpielname, StringComparison.Ordinal))
            throw new InvalidOperationException("LIVE_STATUS_UNGUELTIG");

        var generation = LiesLong(root, "generation");
        if (generation < 0) throw new InvalidOperationException("LIVE_STATUS_GENERATION_UNGUELTIG");

        var zustand = LiesText(root, "zustand");
        if (zustand is not ("BEREIT" or "SCHREIBT"))
            throw new InvalidOperationException("LIVE_STATUS_ZUSTAND_UNGUELTIG");

        _ = LiesZeit(root, "aktualisiertAm");
        VerweigereGeheimnisEigenschaften(root);
        return new LiveStatus(generation, zustand);
    }

    private static async Task<byte[]> LiesBegrenztAsync(string pfad, int maxBytes, CancellationToken cancellationToken)
    {
        var info = new FileInfo(pfad);
        if (!info.Exists) throw new InvalidOperationException("LIVE_WISSEN_DATEI_FEHLT");
        if (info.Length <= 0 || info.Length > maxBytes)
            throw new InvalidOperationException("LIVE_WISSEN_DATEIGROESSE_UNGUELTIG");

        return await File.ReadAllBytesAsync(pfad, cancellationToken);
    }

    private static string BerechneSnapshotHash(
        byte[] manifestBytes,
        byte[] statusBytes,
        IReadOnlyList<ValidierteLiveDatei> dateien)
    {
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        hash.AppendData(manifestBytes);
        hash.AppendData(statusBytes);
        foreach (var datei in dateien.OrderBy(x => x.RelativerPfad, StringComparer.Ordinal))
        {
            hash.AppendData(Encoding.UTF8.GetBytes(datei.RelativerPfad));
            hash.AppendData(Encoding.UTF8.GetBytes(datei.Sha256));
        }
        return Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant();
    }

    private static void VerifiziereKeinReparsePunkt(string wurzel, string pfad)
    {
        var vollWurzel = Path.TrimEndingDirectorySeparator(Path.GetFullPath(wurzel));
        var vollPfad = Path.GetFullPath(pfad);

        if (!vollPfad.StartsWith(vollWurzel + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(vollPfad, vollWurzel, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("LIVE_WISSEN_PFAD_AUSBRUCH_VERHINDERT");

        FileSystemInfo? aktuell = Directory.Exists(vollPfad)
            ? new DirectoryInfo(vollPfad)
            : new FileInfo(vollPfad);

        while (aktuell is not null)
        {
            if ((aktuell.Attributes & FileAttributes.ReparsePoint) != 0)
                throw new InvalidOperationException("LIVE_WISSEN_REPARSE_POINT_VERBOTEN");

            if (string.Equals(
                    Path.TrimEndingDirectorySeparator(aktuell.FullName),
                    vollWurzel,
                    StringComparison.OrdinalIgnoreCase))
                break;

            aktuell = aktuell switch
            {
                FileInfo datei => datei.Directory,
                DirectoryInfo ordner => ordner.Parent,
                _ => null
            };
        }
    }

    private static void VerweigereGeheimnisEigenschaften(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var eigenschaft in element.EnumerateObject())
                {
                    var name = eigenschaft.Name.Replace("_", string.Empty, StringComparison.Ordinal)
                        .Replace("-", string.Empty, StringComparison.Ordinal)
                        .ToLowerInvariant();
                    if (VerboteneEigenschaftsFragmente.Any(fragment => name.Contains(fragment, StringComparison.Ordinal)))
                        throw new InvalidOperationException("LIVE_WISSEN_GEHEIMNISFELD_VERBOTEN");
                    VerweigereGeheimnisEigenschaften(eigenschaft.Value);
                }
                break;
            case JsonValueKind.Array:
                foreach (var wert in element.EnumerateArray()) VerweigereGeheimnisEigenschaften(wert);
                break;
        }
    }

    private static int LiesInt(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var wert) || !wert.TryGetInt32(out var zahl))
            throw new InvalidOperationException("LIVE_WISSEN_PFLICHTFELD_FEHLT:" + name);
        return zahl;
    }

    private static long LiesLong(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var wert) || !wert.TryGetInt64(out var zahl))
            throw new InvalidOperationException("LIVE_WISSEN_PFLICHTFELD_FEHLT:" + name);
        return zahl;
    }

    private static string LiesText(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var wert) || wert.ValueKind != JsonValueKind.String)
            throw new InvalidOperationException("LIVE_WISSEN_PFLICHTFELD_FEHLT:" + name);
        return wert.GetString() ?? string.Empty;
    }

    private static DateTimeOffset LiesZeit(JsonElement element, string name)
    {
        var text = LiesText(element, name);
        if (!DateTimeOffset.TryParse(text, out var zeit))
            throw new InvalidOperationException("LIVE_WISSEN_ZEIT_UNGUELTIG:" + name);
        return zeit.ToUniversalTime();
    }

    private sealed record LiveManifest(string AktuellVerzeichnis);
    private sealed record LiveStatus(long Generation, string Zustand);
    private sealed record ValidierteLiveDatei(string RelativerPfad, byte[] Bytes, string Sha256);
}
