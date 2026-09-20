using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Xml.Linq;

namespace AioBotWindowsBridge;

public sealed record WebFund(
    string Adresse,
    string Titel,
    string Beschreibung,
    string Suchanfrage,
    string Vertrauensklasse,
    string Relevanznachweis);

public sealed class WebQuellenEntdecker
{
    private const int MaximalerPruefinhaltBytes = 512 * 1024;

    public static readonly string[] Suchanfragen =
    [
        "\"Adventure Land - The Code MMORPG\"",
        "\"Adventure Land\" MMORPG \"adventure.land\"",
        "\"Adventure Land\" \"The Code MMORPG\" update",
        "\"Adventure Land\" \"adventure.land\" skills monsters items",
        "\"Adventure Land\" \"adventure.land\" API CODE",
        "\"Adventure Land\" \"adventure.land\" patch notes",
        "site:github.com \"Adventure Land\" \"adventure.land\"",
        "site:github.com \"Adventure Land - The Code MMORPG\"",
        "site:steamcommunity.com/app/777150 \"Adventure Land\"",
        "site:adventure.land \"Adventure Land\""
    ];

    private readonly HttpClient _httpClient;

    public WebQuellenEntdecker(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<WebFund>> SucheAsync(CancellationToken cancellationToken = default)
        => await SucheAsync(DateTimeOffset.UtcNow, cancellationToken);

    public async Task<IReadOnlyList<WebFund>> SucheAsync(
        DateTimeOffset zeitpunkt,
        CancellationToken cancellationToken = default)
    {
        var funde = new Dictionary<string, WebFund>(StringComparer.OrdinalIgnoreCase);

        foreach (var suchanfrage in WaehleRotierendeSuchanfragen(zeitpunkt))
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                var adresse = "https://www.bing.com/search?format=rss&q=" + Uri.EscapeDataString(suchanfrage);
                using var anfrage = new HttpRequestMessage(HttpMethod.Get, adresse);
                anfrage.Headers.UserAgent.ParseAdd("AioBotWindowsBridge-Wissenswaechter/1.0");

                using var antwort = await _httpClient.SendAsync(
                    anfrage,
                    HttpCompletionOption.ResponseContentRead,
                    cancellationToken);
                if (!antwort.IsSuccessStatusCode) continue;

                var xml = await antwort.Content.ReadAsStringAsync(cancellationToken);
                var dokument = XDocument.Parse(xml, LoadOptions.None);
                foreach (var eintrag in dokument.Descendants("item").Take(10))
                {
                    var link = eintrag.Element("link")?.Value?.Trim();
                    var titel = WebUtility.HtmlDecode(eintrag.Element("title")?.Value?.Trim() ?? string.Empty);
                    var beschreibung = WebUtility.HtmlDecode(eintrag.Element("description")?.Value?.Trim() ?? string.Empty);
                    if (!IstGueltigeWebAdresse(link)) continue;

                    var normalisiert = NormalisiereAdresse(link!);
                    var anzeigetitel = string.IsNullOrWhiteSpace(titel) ? normalisiert : titel;

                    // Suchmaschinen koennen Query-/site:-Operatoren ignorieren. Deshalb
                    // werden Suchanfrage und Trefferposition niemals als Relevanzbeweis benutzt.
                    if (!HatAusreichendenAdventureLandHinweis(normalisiert, anzeigetitel, beschreibung))
                        continue;

                    var relevanznachweis = await BestaetigeAdventureLandBezugAsync(
                        normalisiert,
                        anzeigetitel,
                        beschreibung,
                        cancellationToken);
                    if (relevanznachweis is null)
                        continue;

                    funde[normalisiert] = new WebFund(
                        normalisiert,
                        anzeigetitel,
                        beschreibung,
                        suchanfrage,
                        BestimmeVertrauensklasse(normalisiert),
                        relevanznachweis);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                // Suchmaschinen- oder Kandidatenfehler duerfen den Wissenslauf nicht abbrechen.
                // Unklare Treffer werden fail-closed verworfen.
            }
        }

        return funde.Values
            .OrderBy(fund => fund.Adresse, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static IReadOnlyList<string> WaehleRotierendeSuchanfragen(
        DateTimeOffset zeitpunkt,
        int maximalAnfragen = 4)
    {
        if (maximalAnfragen <= 0)
            throw new ArgumentOutOfRangeException(nameof(maximalAnfragen));
        if (Suchanfragen.Length == 0)
            return Array.Empty<string>();

        var anzahl = Math.Min(maximalAnfragen, Suchanfragen.Length);
        var stundenIndex = Math.Abs(zeitpunkt.ToUnixTimeSeconds() / 3600);
        var start = (int)(stundenIndex % Suchanfragen.Length);
        var auswahl = new string[anzahl];

        for (var i = 0; i < anzahl; i++)
            auswahl[i] = Suchanfragen[(start + i) % Suchanfragen.Length];

        return auswahl;
    }

    private async Task<string?> BestaetigeAdventureLandBezugAsync(
        string adresse,
        string titel,
        string beschreibung,
        CancellationToken cancellationToken)
    {
        if (IstOffizielleAdventureLandAdresse(adresse))
            return "ADVENTURE_LAND_OFFIZIELLE_ADRESSE";

        try
        {
            using var anfrage = new HttpRequestMessage(HttpMethod.Get, adresse);
            anfrage.Headers.UserAgent.ParseAdd("AioBotWindowsBridge-Wissenswaechter/1.0");
            anfrage.Headers.Accept.ParseAdd("text/html, text/plain, application/json, application/xml;q=0.9, */*;q=0.1");

            using var antwort = await _httpClient.SendAsync(
                anfrage,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);
            if (!antwort.IsSuccessStatusCode)
                return null;

            if (!IstGueltigeWebAdresse(antwort.RequestMessage?.RequestUri?.ToString()))
                return null;

            var mediaType = antwort.Content.Headers.ContentType?.MediaType;
            if (!IstTextInhalt(mediaType))
                return null;

            var bytes = await LiesBegrenztAsync(
                antwort.Content,
                MaximalerPruefinhaltBytes,
                cancellationToken);
            var inhalt = Encoding.UTF8.GetString(bytes);

            var kombinierterText = string.Join(
                "\n",
                adresse,
                titel,
                beschreibung,
                antwort.RequestMessage?.RequestUri?.ToString() ?? string.Empty,
                inhalt);

            return HatDirektenAdventureLandSpielbezug(kombinierterText)
                ? "ADVENTURE_LAND_SEITENINHALT_BESTAETIGT"
                : null;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    public static bool HatAusreichendenAdventureLandHinweis(
        string adresse,
        string? titel,
        string? beschreibung)
    {
        if (!IstGueltigeWebAdresse(adresse))
            return false;
        if (IstOffizielleAdventureLandAdresse(adresse))
            return true;

        var kombiniert = string.Join("\n", adresse, titel ?? string.Empty, beschreibung ?? string.Empty);
        if (HatDirektenAdventureLandSpielbezug(kombiniert))
            return true;

        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri))
            return false;

        if (string.Equals(uri.Host, "github.com", StringComparison.OrdinalIgnoreCase))
        {
            var pfad = uri.AbsolutePath.ToLowerInvariant();
            return pfad.Contains("adventureland", StringComparison.Ordinal)
                || pfad.Contains("adventure-land", StringComparison.Ordinal);
        }

        return false;
    }

    public static bool HatDirektenAdventureLandSpielbezug(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        var wert = WebUtility.HtmlDecode(text).ToLowerInvariant();

        if (wert.Contains("adventure land - the code mmorpg", StringComparison.Ordinal)
            || wert.Contains("adventure land – the code mmorpg", StringComparison.Ordinal)
            || wert.Contains("adventure land — the code mmorpg", StringComparison.Ordinal)
            || wert.Contains("adventure land: the code mmorpg", StringComparison.Ordinal))
            return true;

        if (wert.Contains("adventure.land", StringComparison.Ordinal)
            || wert.Contains("/app/777150", StringComparison.Ordinal)
            || wert.Contains("app/777150", StringComparison.Ordinal)
            || wert.Contains("kaansoral/adventureland_mongodb", StringComparison.Ordinal))
            return true;

        var hatSpielname = wert.Contains("adventure land", StringComparison.Ordinal);
        var hatSpielkontext = wert.Contains("mmorpg", StringComparison.Ordinal)
            || wert.Contains("the code mmorpg", StringComparison.Ordinal)
            || wert.Contains("code mmorpg", StringComparison.Ordinal);

        return hatSpielname && hatSpielkontext;
    }

    public static bool IstOffizielleAdventureLandAdresse(string adresse)
    {
        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri))
            return false;

        var host = uri.Host.ToLowerInvariant();
        if (host == "adventure.land" || host.EndsWith(".adventure.land", StringComparison.Ordinal))
            return true;

        if ((host == "steamcommunity.com" || host == "store.steampowered.com")
            && uri.AbsolutePath.Contains("/app/777150", StringComparison.Ordinal))
            return true;

        return host == "github.com"
            && uri.AbsolutePath.StartsWith("/kaansoral/", StringComparison.OrdinalIgnoreCase);
    }

    public static string BestimmeVertrauensklasse(string adresse)
    {
        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri)) return "UNBEKANNT";
        var host = uri.Host.ToLowerInvariant();

        if (IstOffizielleAdventureLandAdresse(adresse))
            return "OFFIZIELL";
        if (host == "github.com")
            return "COMMUNITY";

        return "KANDIDAT";
    }

    public static bool IstGueltigeWebAdresse(string? adresse)
    {
        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri)) return false;
        if (uri.Scheme is not ("https" or "http")) return false;
        if (!string.IsNullOrEmpty(uri.UserInfo)) return false;
        if (uri.IsLoopback) return false;

        var host = uri.Host;
        if (string.IsNullOrWhiteSpace(host)
            || string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
            || string.Equals(host, "www.bing.com", StringComparison.OrdinalIgnoreCase)
            || string.Equals(host, "bing.com", StringComparison.OrdinalIgnoreCase))
            return false;

        if (IPAddress.TryParse(host, out var ip) && !IstOeffentlicheIpAdresse(ip))
            return false;

        return true;
    }

    public static string NormalisiereAdresse(string adresse)
    {
        var uri = new Uri(adresse);
        var builder = new UriBuilder(uri)
        {
            Fragment = string.Empty
        };

        if (builder.Path.EndsWith("/", StringComparison.Ordinal) && builder.Path.Length > 1)
            builder.Path = builder.Path.TrimEnd('/');

        return builder.Uri.ToString();
    }

    private static bool IstTextInhalt(string? mediaType)
    {
        if (string.IsNullOrWhiteSpace(mediaType)) return true;
        return mediaType.StartsWith("text/", StringComparison.OrdinalIgnoreCase)
            || mediaType.Contains("json", StringComparison.OrdinalIgnoreCase)
            || mediaType.Contains("javascript", StringComparison.OrdinalIgnoreCase)
            || mediaType.Contains("xml", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<byte[]> LiesBegrenztAsync(
        HttpContent inhalt,
        int maximalBytes,
        CancellationToken cancellationToken)
    {
        await using var eingang = await inhalt.ReadAsStreamAsync(cancellationToken);
        using var ausgang = new MemoryStream();
        var puffer = new byte[16 * 1024];

        while (ausgang.Length < maximalBytes)
        {
            var rest = (int)Math.Min(puffer.Length, maximalBytes - ausgang.Length);
            var gelesen = await eingang.ReadAsync(puffer.AsMemory(0, rest), cancellationToken);
            if (gelesen <= 0) break;
            await ausgang.WriteAsync(puffer.AsMemory(0, gelesen), cancellationToken);
        }

        return ausgang.ToArray();
    }

    private static bool IstOeffentlicheIpAdresse(IPAddress adresse)
    {
        if (IPAddress.IsLoopback(adresse))
            return false;

        if (adresse.AddressFamily == AddressFamily.InterNetwork)
        {
            var bytes = adresse.GetAddressBytes();
            if (bytes[0] == 10
                || bytes[0] == 127
                || (bytes[0] == 169 && bytes[1] == 254)
                || (bytes[0] == 172 && bytes[1] is >= 16 and <= 31)
                || (bytes[0] == 192 && bytes[1] == 168))
                return false;
        }

        if (adresse.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (adresse.IsIPv6LinkLocal || adresse.IsIPv6SiteLocal)
                return false;
        }

        return true;
    }
}
