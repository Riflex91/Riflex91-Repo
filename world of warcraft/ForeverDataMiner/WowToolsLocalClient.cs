using System.Net;

namespace ForeverDataMiner;

public sealed class WowToolsLocalClient(HttpClient http, Uri baseUri)
{
    public static async Task<bool> IsAvailableAsync(Uri baseUri, CancellationToken cancellationToken = default)
    {
        try
        {
            using var probe = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            using var response = await probe.GetAsync(baseUri, cancellationToken);
            return response.IsSuccessStatusCode ||
                   response.StatusCode is HttpStatusCode.Redirect or
                       HttpStatusCode.MovedPermanently or
                       HttpStatusCode.TemporaryRedirect or
                       HttpStatusCode.PermanentRedirect;
        }
        catch
        {
            return false;
        }
    }

    private static readonly string[] Tables =
    [
        "QuestV2", "QuestInfo", "QuestLine", "QuestLineXQuest", "QuestObjective",
        "QuestPOIBlob", "QuestPOIPoint", "QuestPackageItem", "QuestXP", "QuestMoneyReward", "Item", "ItemSparse", "ItemEffect",
        "ChrClasses", "ChrRaces", "Map", "AreaTable", "TaxiNodes", "Talent",
        "SpellName", "SpellEffect"
    ];

    public async Task<IReadOnlyList<(string Table, byte[] Csv)>> ExportAsync(
        BuildIdentity build,
        CancellationToken cancellationToken)
    {
        var result = new List<(string Table, byte[] Csv)>();

        foreach (var table in Tables)
        {
            var url = new Uri(baseUri,
                $"dbc/export/csv?name={Uri.EscapeDataString(table)}&build={Uri.EscapeDataString(build.Version)}&useHotfixes=true&newLinesInStrings=false");

            using var response = await http.GetAsync(url, cancellationToken);
            if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.NoContent or HttpStatusCode.BadRequest)
                continue;

            response.EnsureSuccessStatusCode();
            result.Add((table, await response.Content.ReadAsByteArrayAsync(cancellationToken)));
        }

        return result;
    }
}
