using System.Net.Http.Headers;
using System.Text.Json;

namespace AioBotControlCenter.Services;

public sealed record PiHostStatus(string State, string BotHealth, int RestartCount, string? CharacterName, string? Map);

public sealed class PiHostService(HttpClient httpClient)
{
    public async Task<PiHostStatus> ReadAsync(ControlCenterConfig config, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(config.PiHostUrl, UriKind.Absolute, out var baseUri))
            return new PiHostStatus("OFFLINE", "UNKNOWN", 0, null, null);

        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "/v1/status"));
        if (!string.IsNullOrWhiteSpace(config.PiHostToken))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.PiHostToken);

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return new PiHostStatus("DEGRADED", "UNKNOWN", 0, null, null);

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = json.RootElement;
            var health = FindString(root, "health", "state") ?? FindString(root, "controller", "watchdog", "state") ?? "UNKNOWN";
            var restarts = FindInt(root, "launcher", "stats", "restarts") ?? 0;
            var character = FindString(root, "controller", "watchdog", "lastBeacon", "character", "name");
            var map = FindString(root, "controller", "watchdog", "lastBeacon", "character", "map");
            return new PiHostStatus("HEALTHY", health, restarts, character, map);
        }
        catch (HttpRequestException)
        {
            return new PiHostStatus("OFFLINE", "UNKNOWN", 0, null, null);
        }
    }

    private static string? FindString(JsonElement root, params string[] path)
    {
        var current = root;
        foreach (var part in path)
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(part, out current))
                return null;
        return current.ValueKind == JsonValueKind.String ? current.GetString() : null;
    }

    private static int? FindInt(JsonElement root, params string[] path)
    {
        var current = root;
        foreach (var part in path)
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(part, out current))
                return null;
        return current.TryGetInt32(out var value) ? value : null;
    }
}
