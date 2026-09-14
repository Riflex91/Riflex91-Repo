using System.Net.Http.Headers;
using System.Text.Json;

namespace AioBotControlCenter.Services;

public sealed record PiControlStatus(string State, bool BotActive, string? RepoSha, bool Busy);
public sealed record PiCommandResult(bool Ok, string Message);

public sealed class PiControlService(HttpClient httpClient)
{
    public async Task<PiControlStatus> ReadAsync(ControlCenterConfig config, CancellationToken cancellationToken)
    {
        if (!TryBaseUri(config, out var baseUri)) return new PiControlStatus("NOT CONFIGURED", false, null, false);
        using var request = CreateRequest(config, HttpMethod.Get, new Uri(baseUri, "/v1/status"));
        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return new PiControlStatus("DEGRADED", false, null, false);
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = json.RootElement;
            return new PiControlStatus(
                "HEALTHY",
                FindBool(root, "bot", "active") ?? false,
                FindString(root, "repo", "sha"),
                !string.IsNullOrWhiteSpace(FindString(root, "daemon", "operationInFlight")));
        }
        catch (HttpRequestException) { return new PiControlStatus("OFFLINE", false, null, false); }
    }

    public Task<PiCommandResult> StartAsync(ControlCenterConfig config, CancellationToken token) => SendAsync(config, "/v1/bot/start", token);
    public Task<PiCommandResult> StopAsync(ControlCenterConfig config, CancellationToken token) => SendAsync(config, "/v1/bot/stop", token);
    public Task<PiCommandResult> RestartAsync(ControlCenterConfig config, CancellationToken token) => SendAsync(config, "/v1/bot/restart", token);
    public Task<PiCommandResult> DeployMainAsync(ControlCenterConfig config, CancellationToken token) => SendAsync(config, "/v1/deploy/main", token);
    public Task<PiCommandResult> RollbackAsync(ControlCenterConfig config, CancellationToken token) => SendAsync(config, "/v1/rollback", token);

    private async Task<PiCommandResult> SendAsync(ControlCenterConfig config, string path, CancellationToken token)
    {
        if (!TryBaseUri(config, out var baseUri)) return new PiCommandResult(false, "Pi control endpoint is not configured.");
        using var request = CreateRequest(config, HttpMethod.Post, new Uri(baseUri, path));
        request.Headers.Add("Idempotency-Key", $"windows:{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}:{Guid.NewGuid():N}");
        request.Content = new StringContent(string.Empty);
        try
        {
            using var response = await httpClient.SendAsync(request, token);
            var text = await response.Content.ReadAsStringAsync(token);
            if (response.IsSuccessStatusCode) return new PiCommandResult(true, "Command completed.");
            try
            {
                using var json = JsonDocument.Parse(text);
                return new PiCommandResult(false, FindString(json.RootElement, "error") ?? $"HTTP {(int)response.StatusCode}");
            }
            catch (JsonException) { return new PiCommandResult(false, $"HTTP {(int)response.StatusCode}"); }
        }
        catch (HttpRequestException error) { return new PiCommandResult(false, error.Message); }
    }

    private static bool TryBaseUri(ControlCenterConfig config, out Uri baseUri)
    {
        var ok = Uri.TryCreate(config.PiControlUrl, UriKind.Absolute, out var parsed);
        baseUri = parsed ?? new Uri("http://127.0.0.1");
        return ok && !string.IsNullOrWhiteSpace(config.PiControlToken);
    }

    private static HttpRequestMessage CreateRequest(ControlCenterConfig config, HttpMethod method, Uri uri)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.PiControlToken);
        return request;
    }

    private static string? FindString(JsonElement root, params string[] path)
    {
        var current = root;
        foreach (var part in path)
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(part, out current)) return null;
        return current.ValueKind == JsonValueKind.String ? current.GetString() : null;
    }
    private static bool? FindBool(JsonElement root, params string[] path)
    {
        var current = root;
        foreach (var part in path)
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(part, out current)) return null;
        return current.ValueKind is JsonValueKind.True or JsonValueKind.False ? current.GetBoolean() : null;
    }
}
