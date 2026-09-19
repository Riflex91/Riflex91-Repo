using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record WissenswaechterStatus(
    string Zustand,
    DateTimeOffset? LetzterLauf,
    DateTimeOffset? NaechsterLauf,
    int GepruefteQuellen,
    int GeaenderteQuellen,
    int NeueKandidaten,
    bool Hochgeladen,
    string? Fehler,
    int LiveImportiert = 0,
    int LiveUebersprungen = 0,
    string? LiveFehler = null);

public sealed class WissenswaechterDienst : IAsyncDisposable
{
    private const int MaximalerQuellinhaltBytes = 8 * 1024 * 1024;
    private static readonly JsonSerializerOptions JsonZeilenOptionen = new(BridgeConfig.JsonOptions) { WriteIndented = false };

    private readonly BridgeConfig _config;
    private readonly GitHubAnmeldung _githubAnmeldung;
    private readonly GitArbeitskopie _arbeitskopie;
    private readonly HttpClient _httpClient;
    private readonly SemaphoreSlim _laufSperre = new(1, 1);
    private CancellationTokenSource? _schleifenAbbruch;
    private Task? _schleife;

    public WissenswaechterDienst(
        BridgeConfig config,
        GitHubAnmeldung githubAnmeldung,
        GitArbeitskopie? arbeitskopie = null)
    {
        _config = config;
        _githubAnmeldung = githubAnmeldung;
        _arbeitskopie = arbeitskopie ?? new GitArbeitskopie();
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    public event Action<WissenswaechterStatus>? StatusGeaendert;

    public bool IstAktiv => _schleife is { IsCompleted: false };

    public Task StarteAsync()
    {
        if (IstAktiv) return Task.CompletedTask;

        _schleifenAbbruch = new CancellationTokenSource();
        _schleife = Task.Run(() => FuehreSchleifeAusAsync(_schleifenAbbruch.Token));
        return Task.CompletedTask;
    }

    public async Task StoppeAsync()
    {
        if (_schleifenAbbruch is null) return;

        _schleifenAbbruch.Cancel();
        try
        {
            if (_schleife is not null) await _schleife;
        }
        catch (OperationCanceledException)
        {
        }
        finally
        {
            _schleifenAbbruch.Dispose();
            _schleifenAbbruch = null;
            _schleife = null;
        }

        MeldeStatus(new WissenswaechterStatus(
            "GESTOPPT",
            null,
            null,
            0,
            0,
            0,
            false,
            null));
    }

    public async Task FuehreAktualisierungJetztAusAsync(CancellationToken cancellationToken = default)
    {
        await FuehreEinzelnenLaufAusAsync(cancellationToken);
    }

    private async Task FuehreSchleifeAusAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            await FuehreEinzelnenLaufAusAsync(cancellationToken);

            await Task.Delay(
                TimeSpan.FromMinutes(_config.WissenswaechterIntervallMinuten),
                cancellationToken);
        }
    }

    private async Task FuehreEinzelnenLaufAusAsync(CancellationToken cancellationToken)
    {
        if (!await _laufSperre.WaitAsync(0, cancellationToken))
            return;

        var gestartetAm = DateTimeOffset.UtcNow;
        try
        {
            MeldeStatus(new WissenswaechterStatus(
                "PRUEFT_GITHUB",
                null,
                null,
                0,
                0,
                0,
                false,
                null));

            var github = await _githubAnmeldung.LiesStatusAsync(cancellationToken);
            if (!github.Verfuegbar)
                throw new InvalidOperationException("GITHUB_CREDENTIAL_MANAGER_NICHT_VERFUEGBAR");
            if (!github.Angemeldet || string.IsNullOrWhiteSpace(github.Konto))
                throw new InvalidOperationException("GITHUB_ANMELDUNG_FEHLT");

            MeldeStatus(new WissenswaechterStatus(
                "SYNCHRONISIERT_REPO",
                null,
                null,
                0,
                0,
                0,
                false,
                null));

            await _arbeitskopie.BereiteVorAsync(github.Konto, cancellationToken);

            var liveImporteur = new LiveWissenImporteur(_config, _arbeitskopie);
            var liveErgebnis = await liveImporteur.ImportiereAsync(gestartetAm, cancellationToken);

            MeldeStatus(new WissenswaechterStatus(
                "IMPORTIERT_LIVE_WISSEN",
                null,
                null,
                0,
                0,
                0,
                false,
                null,
                liveErgebnis.ImportierteDateien,
                liveErgebnis.UebersprungeneDateien,
                liveErgebnis.Fehler));

            var quellen = await LadeQuellenregisterAsync(cancellationToken);
            var alterStatus = await LadeQuellenstatusAsync(cancellationToken);
            var alterStatusNachKennung = alterStatus.Quellen.ToDictionary(
                eintrag => eintrag.Kennung,
                StringComparer.OrdinalIgnoreCase);

            var neueStatusEintraege = new List<QuellenStatusEintrag>();
            var aenderungen = new List<AenderungsEintrag>();
            var geprueft = 0;
            var geaendert = 0;

            MeldeStatus(new WissenswaechterStatus(
                "PRUEFT_QUELLEN",
                null,
                null,
                0,
                0,
                0,
                false,
                null));

            foreach (var quelle in quellen.Take(_config.WissenswaechterMaxQuellenProLauf))
            {
                cancellationToken.ThrowIfCancellationRequested();
                geprueft++;

                var pruefung = await PruefeQuelleAsync(quelle, cancellationToken);
                alterStatusNachKennung.TryGetValue(quelle.Kennung, out var vorher);

                var hatSichGeaendert = pruefung.Fehler is null
                    && !string.IsNullOrWhiteSpace(pruefung.InhaltSha256)
                    && !string.Equals(vorher?.InhaltSha256, pruefung.InhaltSha256, StringComparison.OrdinalIgnoreCase);

                if (hatSichGeaendert)
                {
                    geaendert++;
                    if (pruefung.Inhalt is not null)
                        await SpeichereAktuellenQuellinhaltAsync(quelle.Kennung, pruefung.Inhalt, cancellationToken);

                    aenderungen.Add(new AenderungsEintrag(
                        quelle.Kennung,
                        quelle.Titel,
                        quelle.Adresse,
                        quelle.Vertrauen,
                        vorher?.InhaltSha256,
                        pruefung.InhaltSha256,
                        gestartetAm,
                        vorher is null ? "NEU_ERFASST" : "INHALT_GEAENDERT"));
                }

                neueStatusEintraege.Add(new QuellenStatusEintrag(
                    quelle.Kennung,
                    quelle.Titel,
                    quelle.Adresse,
                    quelle.Vertrauen,
                    pruefung.AbrufAdresse,
                    gestartetAm,
                    pruefung.HttpStatus,
                    pruefung.InhaltSha256 ?? vorher?.InhaltSha256,
                    pruefung.ETag,
                    pruefung.LetzteAenderung,
                    pruefung.Bytes,
                    pruefung.Gekuerzt,
                    pruefung.Fehler));
            }

            var neueKandidaten = 0;
            if (_config.WissenswaechterWebSucheAktiv)
            {
                MeldeStatus(new WissenswaechterStatus(
                    "SUCHT_IM_WEB",
                    null,
                    null,
                    geprueft,
                    geaendert,
                    0,
                    false,
                    null));

                var entdecker = new WebQuellenEntdecker(_httpClient);
                var funde = await entdecker.SucheAsync(cancellationToken);
                neueKandidaten = await AktualisiereKandidatenAsync(funde, quellen, gestartetAm, cancellationToken);
            }

            await SpeichereQuellenstatusAsync(
                new QuellenStatusDokument(1, gestartetAm, neueStatusEintraege),
                cancellationToken);

            if (aenderungen.Count > 0)
                await FuegeAenderungsprotokollHinzuAsync(aenderungen, cancellationToken);

            var laufbericht = new WissenslaufBericht(
                1,
                gestartetAm,
                DateTimeOffset.UtcNow,
                _config.WissenswaechterIntervallMinuten,
                geprueft,
                geaendert,
                neueKandidaten,
                quellen.Count,
                "GITHUB_PUSH_GEPLANT",
                "Automatische Funde werden nur nach bestaetigtem Bezug zu Adventure Land - The Code MMORPG gespeichert. Bot-Livewissen wird aus dem lokal konfigurierten Ordner importiert; der absolute SSD-Pfad wird nicht ins Repo geschrieben.",
                liveErgebnis.Konfiguriert,
                liveErgebnis.GefundeneDateien,
                liveErgebnis.ImportierteDateien,
                liveErgebnis.UnveraenderteDateien,
                liveErgebnis.UebersprungeneDateien,
                liveErgebnis.ImportierteBytes,
                liveErgebnis.Fehler);
            await SpeichereJsonAsync(
                GitArbeitskopie.DatenbankPfad + "/letzter-lauf.json",
                laufbericht,
                cancellationToken);

            MeldeStatus(new WissenswaechterStatus(
                "LAEDT_HOCH",
                gestartetAm,
                null,
                geprueft,
                geaendert,
                neueKandidaten,
                false,
                null,
                liveErgebnis.ImportierteDateien,
                liveErgebnis.UebersprungeneDateien,
                liveErgebnis.Fehler));

            var commitNachricht = $"wissen: stuendlicher Adventure-Land-Lauf {gestartetAm:yyyy-MM-dd HH:mm} UTC";
            var hochgeladen = await _arbeitskopie.CommitUndPushAsync(commitNachricht, cancellationToken);

            MeldeStatus(new WissenswaechterStatus(
                hochgeladen ? "AKTUELL" : "KEINE_AENDERUNGEN",
                gestartetAm,
                DateTimeOffset.Now.AddMinutes(_config.WissenswaechterIntervallMinuten),
                geprueft,
                geaendert,
                neueKandidaten,
                hochgeladen,
                null,
                liveErgebnis.ImportierteDateien,
                liveErgebnis.UebersprungeneDateien,
                liveErgebnis.Fehler));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            MeldeStatus(new WissenswaechterStatus(
                "FEHLER",
                gestartetAm,
                DateTimeOffset.Now.AddMinutes(_config.WissenswaechterIntervallMinuten),
                0,
                0,
                0,
                false,
                Begrenze(error.Message)));
        }
        finally
        {
            _laufSperre.Release();
        }
    }

    private async Task<List<RegistrierteQuelle>> LadeQuellenregisterAsync(CancellationToken cancellationToken)
    {
        var pfad = _arbeitskopie.LoeseWissensbasisPfadAuf(
            GitArbeitskopie.WissensbasisPfad + "/quellen/quellen.json");

        if (!File.Exists(pfad))
            throw new InvalidOperationException("QUELLENREGISTER_FEHLT");

        await using var stream = File.OpenRead(pfad);
        using var dokument = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        if (!dokument.RootElement.TryGetProperty("sources", out var quellenKnoten)
            || quellenKnoten.ValueKind != JsonValueKind.Array)
            throw new InvalidOperationException("QUELLENREGISTER_UNGUELTIG");

        var ergebnis = new List<RegistrierteQuelle>();
        foreach (var knoten in quellenKnoten.EnumerateArray())
        {
            var kennung = LiesText(knoten, "id");
            var titel = LiesText(knoten, "title");
            var adresse = LiesText(knoten, "url");
            var vertrauen = LiesText(knoten, "trust") ?? "UNBEKANNT";
            var typ = LiesText(knoten, "type") ?? "UNBEKANNT";

            if (string.IsNullOrWhiteSpace(kennung)
                || string.IsNullOrWhiteSpace(adresse)
                || !Uri.TryCreate(adresse, UriKind.Absolute, out _))
                continue;

            ergebnis.Add(new RegistrierteQuelle(
                kennung!,
                titel ?? kennung!,
                adresse!,
                vertrauen,
                typ));
        }

        return ergebnis;
    }

    private async Task<QuellenPruefung> PruefeQuelleAsync(
        RegistrierteQuelle quelle,
        CancellationToken cancellationToken)
    {
        var abrufAdresse = ErzeugeAbrufAdresse(quelle.Adresse);

        try
        {
            using var anfrage = new HttpRequestMessage(HttpMethod.Get, abrufAdresse);
            anfrage.Headers.UserAgent.ParseAdd("AioBotWindowsBridge-Wissenswaechter/1.0");
            anfrage.Headers.Accept.ParseAdd("*/*");

            using var antwort = await _httpClient.SendAsync(
                anfrage,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            var httpStatus = (int)antwort.StatusCode;
            if (!antwort.IsSuccessStatusCode)
            {
                return new QuellenPruefung(
                    abrufAdresse,
                    httpStatus,
                    null,
                    antwort.Headers.ETag?.Tag,
                    antwort.Content.Headers.LastModified,
                    0,
                    false,
                    null,
                    "HTTP_" + httpStatus);
            }

            var angegebeneLaenge = antwort.Content.Headers.ContentLength;
            if (angegebeneLaenge is > MaximalerQuellinhaltBytes)
            {
                return new QuellenPruefung(
                    abrufAdresse,
                    httpStatus,
                    null,
                    antwort.Headers.ETag?.Tag,
                    antwort.Content.Headers.LastModified,
                    angegebeneLaenge.Value,
                    true,
                    null,
                    "QUELLINHALT_ZU_GROSS");
            }

            var (bytes, gekuerzt) = await LiesBegrenztAsync(
                antwort.Content,
                MaximalerQuellinhaltBytes,
                cancellationToken);
            var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
            var text = IstTextInhalt(antwort.Content.Headers.ContentType?.MediaType)
                ? Encoding.UTF8.GetString(bytes)
                : null;

            return new QuellenPruefung(
                abrufAdresse,
                httpStatus,
                hash,
                antwort.Headers.ETag?.Tag,
                antwort.Content.Headers.LastModified,
                bytes.LongLength,
                gekuerzt,
                text,
                null);
        }
        catch (Exception error) when (error is not OperationCanceledException)
        {
            return new QuellenPruefung(
                abrufAdresse,
                null,
                null,
                null,
                null,
                0,
                false,
                null,
                Begrenze(error.Message));
        }
    }

    private async Task<int> AktualisiereKandidatenAsync(
        IReadOnlyList<WebFund> funde,
        IReadOnlyList<RegistrierteQuelle> registrierteQuellen,
        DateTimeOffset zeitpunkt,
        CancellationToken cancellationToken)
    {
        var bekannteAdressen = registrierteQuellen
            .Select(q => WebQuellenEntdecker.NormalisiereAdresse(q.Adresse))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var pfad = GitArbeitskopie.DatenbankPfad + "/kandidaten.json";
        KandidatenDokument dokument;
        var vollPfad = _arbeitskopie.LoeseDatenbankPfadAuf(pfad);
        if (File.Exists(vollPfad))
        {
            try
            {
                var json = await File.ReadAllTextAsync(vollPfad, cancellationToken);
                dokument = JsonSerializer.Deserialize<KandidatenDokument>(json, BridgeConfig.JsonOptions)
                    ?? new KandidatenDokument(2, []);
            }
            catch
            {
                dokument = new KandidatenDokument(2, []);
            }
        }
        else
        {
            dokument = new KandidatenDokument(2, []);
        }

        // Kandidaten ohne den von der aktuellen Erkennung erzeugten Spielnachweis
        // werden fail-closed verworfen. Damit verschwinden auch Altlasten aus
        // frueheren, zu breiten Suchlaeufen automatisch.
        var nachAdresse = dokument.Kandidaten
            .Where(kandidat =>
                !string.IsNullOrWhiteSpace(kandidat.Relevanznachweis)
                && kandidat.Relevanznachweis.StartsWith(
                    "ADVENTURE_LAND_",
                    StringComparison.Ordinal))
            .ToDictionary(
                kandidat => kandidat.Adresse,
                StringComparer.OrdinalIgnoreCase);
        var neue = 0;

        foreach (var fund in funde)
        {
            if (bekannteAdressen.Contains(fund.Adresse)) continue;

            if (nachAdresse.TryGetValue(fund.Adresse, out var vorhanden))
            {
                nachAdresse[fund.Adresse] = vorhanden with
                {
                    LetzteSichtung = zeitpunkt,
                    Titel = fund.Titel,
                    Vertrauensklasse = fund.Vertrauensklasse,
                    Relevanznachweis = fund.Relevanznachweis,
                    Suchanfragen = vorhanden.Suchanfragen
                        .Append(fund.Suchanfrage)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .Take(20)
                        .ToArray()
                };
                continue;
            }

            neue++;
            nachAdresse[fund.Adresse] = new WissensKandidat(
                fund.Adresse,
                fund.Titel,
                fund.Vertrauensklasse,
                "KANDIDAT",
                zeitpunkt,
                zeitpunkt,
                [fund.Suchanfrage],
                fund.Relevanznachweis);
        }

        var aktualisiert = new KandidatenDokument(
            2,
            nachAdresse.Values
                .OrderByDescending(k => k.LetzteSichtung)
                .Take(_config.WissenswaechterMaxKandidaten)
                .ToArray());

        await SpeichereJsonAsync(pfad, aktualisiert, cancellationToken);
        return neue;
    }

    private async Task<QuellenStatusDokument> LadeQuellenstatusAsync(CancellationToken cancellationToken)
    {
        var pfad = _arbeitskopie.LoeseDatenbankPfadAuf(
            GitArbeitskopie.DatenbankPfad + "/quellenstatus.json");
        if (!File.Exists(pfad)) return new QuellenStatusDokument(1, DateTimeOffset.MinValue, []);

        try
        {
            var json = await File.ReadAllTextAsync(pfad, cancellationToken);
            return JsonSerializer.Deserialize<QuellenStatusDokument>(json, BridgeConfig.JsonOptions)
                ?? new QuellenStatusDokument(1, DateTimeOffset.MinValue, []);
        }
        catch
        {
            return new QuellenStatusDokument(1, DateTimeOffset.MinValue, []);
        }
    }

    private async Task SpeichereQuellenstatusAsync(
        QuellenStatusDokument dokument,
        CancellationToken cancellationToken)
    {
        await SpeichereJsonAsync(
            GitArbeitskopie.DatenbankPfad + "/quellenstatus.json",
            dokument,
            cancellationToken);
    }

    private async Task SpeichereAktuellenQuellinhaltAsync(
        string kennung,
        string inhalt,
        CancellationToken cancellationToken)
    {
        var sichereKennung = Regex.Replace(kennung, "[^A-Za-z0-9._-]", "_");
        var pfad = _arbeitskopie.LoeseDatenbankPfadAuf(
            GitArbeitskopie.DatenbankPfad + "/aktuell/" + sichereKennung + ".txt");
        Directory.CreateDirectory(Path.GetDirectoryName(pfad)!);
        await File.WriteAllTextAsync(pfad, inhalt, new UTF8Encoding(false), cancellationToken);
    }

    private async Task FuegeAenderungsprotokollHinzuAsync(
        IReadOnlyList<AenderungsEintrag> aenderungen,
        CancellationToken cancellationToken)
    {
        var pfad = _arbeitskopie.LoeseDatenbankPfadAuf(
            GitArbeitskopie.DatenbankPfad + "/aenderungsprotokoll.jsonl");
        Directory.CreateDirectory(Path.GetDirectoryName(pfad)!);

        await using var stream = new FileStream(
            pfad,
            FileMode.Append,
            FileAccess.Write,
            FileShare.Read,
            4096,
            useAsync: true);
        await using var writer = new StreamWriter(stream, new UTF8Encoding(false));

        foreach (var aenderung in aenderungen)
        {
            var json = JsonSerializer.Serialize(aenderung, JsonZeilenOptionen);
            await writer.WriteLineAsync(json.AsMemory(), cancellationToken);
        }
    }

    private async Task SpeichereJsonAsync<T>(
        string relativerPfad,
        T wert,
        CancellationToken cancellationToken)
    {
        var pfad = _arbeitskopie.LoeseDatenbankPfadAuf(relativerPfad);
        Directory.CreateDirectory(Path.GetDirectoryName(pfad)!);
        var temporaer = pfad + ".tmp";

        await using (var stream = File.Create(temporaer))
        {
            await JsonSerializer.SerializeAsync(
                stream,
                wert,
                BridgeConfig.JsonOptions,
                cancellationToken);
        }

        File.Move(temporaer, pfad, overwrite: true);
    }

    private static string ErzeugeAbrufAdresse(string adresse)
    {
        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri)
            || !string.Equals(uri.Host, "github.com", StringComparison.OrdinalIgnoreCase))
            return adresse;

        var teile = uri.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (teile.Length >= 5 && string.Equals(teile[2], "blob", StringComparison.OrdinalIgnoreCase))
        {
            var owner = teile[0];
            var repo = teile[1];
            var branch = teile[3];
            var pfad = string.Join('/', teile.Skip(4));
            return $"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{pfad}";
        }

        if (teile.Length == 2)
            return $"https://api.github.com/repos/{teile[0]}/{teile[1]}/commits?per_page=1";

        return adresse;
    }

    private static async Task<(byte[] Bytes, bool Gekuerzt)> LiesBegrenztAsync(
        HttpContent inhalt,
        int maximum,
        CancellationToken cancellationToken)
    {
        await using var eingang = await inhalt.ReadAsStreamAsync(cancellationToken);
        using var ausgang = new MemoryStream();
        var puffer = new byte[64 * 1024];
        var gesamt = 0;

        while (true)
        {
            var gelesen = await eingang.ReadAsync(puffer.AsMemory(0, puffer.Length), cancellationToken);
            if (gelesen == 0) break;

            if (gesamt + gelesen > maximum)
            {
                var rest = maximum - gesamt;
                if (rest > 0) await ausgang.WriteAsync(puffer.AsMemory(0, rest), cancellationToken);
                return (ausgang.ToArray(), true);
            }

            await ausgang.WriteAsync(puffer.AsMemory(0, gelesen), cancellationToken);
            gesamt += gelesen;
        }

        return (ausgang.ToArray(), false);
    }

    private static bool IstTextInhalt(string? mediaType)
    {
        if (string.IsNullOrWhiteSpace(mediaType)) return true;
        return mediaType.StartsWith("text/", StringComparison.OrdinalIgnoreCase)
            || mediaType.Contains("json", StringComparison.OrdinalIgnoreCase)
            || mediaType.Contains("javascript", StringComparison.OrdinalIgnoreCase)
            || mediaType.Contains("xml", StringComparison.OrdinalIgnoreCase);
    }

    private static string? LiesText(JsonElement element, string eigenschaft)
    {
        return element.TryGetProperty(eigenschaft, out var knoten)
            && knoten.ValueKind == JsonValueKind.String
                ? knoten.GetString()
                : null;
    }

    private void MeldeStatus(WissenswaechterStatus status)
    {
        try
        {
            StatusGeaendert?.Invoke(status);
        }
        catch
        {
        }
    }

    private static string Begrenze(string? wert, int maximal = 512)
    {
        var text = string.IsNullOrWhiteSpace(wert) ? "UNBEKANNTER_FEHLER" : wert.Trim();
        return text.Length <= maximal ? text : text[..maximal];
    }

    public async ValueTask DisposeAsync()
    {
        await StoppeAsync();
        _httpClient.Dispose();
        _laufSperre.Dispose();
    }

    private sealed record RegistrierteQuelle(
        string Kennung,
        string Titel,
        string Adresse,
        string Vertrauen,
        string Typ);

    private sealed record QuellenPruefung(
        string AbrufAdresse,
        int? HttpStatus,
        string? InhaltSha256,
        string? ETag,
        DateTimeOffset? LetzteAenderung,
        long Bytes,
        bool Gekuerzt,
        string? Inhalt,
        string? Fehler);

    private sealed record QuellenStatusDokument(
        int SchemaVersion,
        DateTimeOffset ErzeugtAm,
        IReadOnlyList<QuellenStatusEintrag> Quellen);

    private sealed record QuellenStatusEintrag(
        string Kennung,
        string Titel,
        string Adresse,
        string Vertrauen,
        string AbrufAdresse,
        DateTimeOffset LetztePruefung,
        int? HttpStatus,
        string? InhaltSha256,
        string? ETag,
        DateTimeOffset? LetzteAenderung,
        long Bytes,
        bool Gekuerzt,
        string? Fehler);

    private sealed record AenderungsEintrag(
        string Kennung,
        string Titel,
        string Adresse,
        string Vertrauen,
        string? VorherigerInhaltSha256,
        string? NeuerInhaltSha256,
        DateTimeOffset ErkanntAm,
        string Art);

    private sealed record KandidatenDokument(
        int SchemaVersion,
        IReadOnlyList<WissensKandidat> Kandidaten);

    private sealed record WissensKandidat(
        string Adresse,
        string Titel,
        string Vertrauensklasse,
        string Status,
        DateTimeOffset ErsteSichtung,
        DateTimeOffset LetzteSichtung,
        IReadOnlyList<string> Suchanfragen,
        string? Relevanznachweis = null);

    private sealed record WissenslaufBericht(
        int SchemaVersion,
        DateTimeOffset GestartetAm,
        DateTimeOffset BeendetAm,
        int IntervallMinuten,
        int GepruefteQuellen,
        int GeaenderteQuellen,
        int NeueKandidaten,
        int RegistrierteQuellen,
        string UploadStatus,
        string SicherheitsHinweis,
        bool LiveImportKonfiguriert,
        int LiveGefundeneDateien,
        int LiveImportierteDateien,
        int LiveUnveraenderteDateien,
        int LiveUebersprungeneDateien,
        long LiveImportierteBytes,
        string? LiveFehler);
}
