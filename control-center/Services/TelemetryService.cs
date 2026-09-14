using System.Net.Http.Headers;
using System.Text.Json;

namespace AioBotControlCenter.Services;

public sealed record TelemetryStatus(string State, string? LastIncident);

public sealed class TelemetryService(HttpClient httpClient)
{
    public async Task<TelemetryStatus> ReadAsync(ControlCenterConfig config, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(config.TelemetryReadUrl, UriKind.Absolute, out var uri))
            return new TelemetryStatus("OFFLINE", null);

        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        if (!string.IsNullOrWhiteSpace(config.TelemetryReadToken))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.TelemetryReadToken);

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return new TelemetryStatus("DEGRADED", $"HTTP {(int)response.StatusCode}");

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var incident = json.RootElement.TryGetProperty("lastIncident", out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
            return new TelemetryStatus("HEALTHY", incident);
        }
        catch (HttpRequestException error)
        {
            return new TelemetryStatus("OFFLINE", error.Message);
        }
    }
}
