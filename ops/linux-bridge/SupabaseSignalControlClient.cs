using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AioBotLinuxBridge;

public sealed record ChatGptSignalStatus(bool Enabled, DateTimeOffset? UpdatedAt, string? UpdatedBy);

public sealed class SupabaseSignalControlClient
{
    private readonly HttpClient _httpClient;
    private readonly BridgeConfig _config;
    private readonly string _token;

    public SupabaseSignalControlClient(HttpClient httpClient, BridgeConfig config, string token)
    {
        _httpClient = httpClient;
        _config = config;
        _token = token;
    }

    public async Task<ChatGptSignalStatus> ReadAsync(CancellationToken cancellationToken)
    {
        var builder = new UriBuilder(_config.SignalControlUrl)
        {
            Query = "botId=" + Uri.EscapeDataString(_config.BotId)
        };
        using var request = CreateRequest(HttpMethod.Get, builder.Uri);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ReadStatusAsync(response, cancellationToken);
    }

    public async Task<ChatGptSignalStatus> SetAsync(bool enabled, CancellationToken cancellationToken)
    {
        using var request = CreateRequest(HttpMethod.Post, new Uri(_config.SignalControlUrl));
        request.Content = new StringContent(JsonSerializer.Serialize(new
        {
            type = "AIO_CHATGPT_SIGNAL_CONTROL",
            schemaVersion = 1,
            botId = _config.BotId,
            enabled
        }), Encoding.UTF8, "application/json");
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ReadStatusAsync(response, cancellationToken);
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, Uri uri)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        request.Headers.TryAddWithoutValidation("x-aio-v3-bot-id", _config.BotId);
        return request;
    }

    private static async Task<ChatGptSignalStatus> ReadStatusAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            if (body.Length > 256) body = body[..256];
            throw new InvalidOperationException($"SIGNAL_CONTROL_HTTP_{(int)response.StatusCode}:{body}");
        }

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        var enabled = root.TryGetProperty("enabled", out var enabledNode) && enabledNode.ValueKind == JsonValueKind.True;
        DateTimeOffset? updatedAt = null;
        if (root.TryGetProperty("updatedAt", out var updatedNode)
            && updatedNode.ValueKind == JsonValueKind.String
            && DateTimeOffset.TryParse(updatedNode.GetString(), out var parsed))
            updatedAt = parsed;
        var updatedBy = root.TryGetProperty("updatedBy", out var byNode) && byNode.ValueKind == JsonValueKind.String
            ? byNode.GetString()
            : null;
        return new ChatGptSignalStatus(enabled, updatedAt, updatedBy);
    }
}
