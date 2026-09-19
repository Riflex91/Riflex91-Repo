using System.Xml.Linq;

namespace AioBotWindowsBridge;

public sealed record WebFund(
    string Adresse,
    string Titel,
    string Suchanfrage,
    string Vertrauensklasse);

public sealed class WebQuellenEntdecker
{
    public static readonly string[] Suchanfragen =
    [
        "\"Adventure Land - The Code MMORPG\" update",
        "\"Adventure Land\" CODE MMORPG update",
        "\"Adventure Land\" item skill monster event",
        "\"Adventure Land\" API CODE functions",
        "\"Adventure Land\" guide documentation",
        "\"Adventure Land\" GitHub bot client",
        "\"Adventure Land\" patch notes",
        "\"Adventure Land\" new feature",
        "site:github.com \"Adventure Land\" MMORPG",
        "site:steamcommunity.com/app/777150 \"Adventure Land\""
    ];

    private readonly HttpClient _httpClient;

    public WebQuellenEntdecker(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<WebFund>> SucheAsync(CancellationToken cancellationToken = default)
    {
        var funde = new Dictionary<string, WebFund>(StringComparer.OrdinalIgnoreCase);

        foreach (var suchanfrage in Suchanfragen)
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
                    var titel = eintrag.Element("title")?.Value?.Trim();
                    if (!IstGueltigeWebAdresse(link)) continue;

                    var normalisiert = NormalisiereAdresse(link!);
                    funde[normalisiert] = new WebFund(
                        normalisiert,
                        string.IsNullOrWhiteSpace(titel) ? normalisiert : titel!,
                        suchanfrage,
                        BestimmeVertrauensklasse(normalisiert));
                }
            }
            catch
            {
                // Suchmaschinenfehler duerfen den Wissenslauf nicht abbrechen.
            }
        }

        return funde.Values
            .OrderBy(fund => fund.Adresse, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static string BestimmeVertrauensklasse(string adresse)
    {
        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri)) return "UNBEKANNT";
        var host = uri.Host.ToLowerInvariant();

        if (host == "adventure.land" || host.EndsWith(".adventure.land", StringComparison.Ordinal))
            return "OFFIZIELL";
        if (host == "steamcommunity.com" && uri.AbsolutePath.Contains("/app/777150", StringComparison.Ordinal))
            return "OFFIZIELL";
        if (host == "github.com" && uri.AbsolutePath.StartsWith("/kaansoral/", StringComparison.OrdinalIgnoreCase))
            return "OFFIZIELL";
        if (host == "github.com")
            return "COMMUNITY";

        return "KANDIDAT";
    }

    public static bool IstGueltigeWebAdresse(string? adresse)
    {
        if (!Uri.TryCreate(adresse, UriKind.Absolute, out var uri)) return false;
        return uri.Scheme is "https" or "http"
            && !string.Equals(uri.Host, "www.bing.com", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(uri.Host, "bing.com", StringComparison.OrdinalIgnoreCase);
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
}
