using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed class SupabaseTelemetrySink
{
    private readonly HttpClient _httpClient;
    private readonly Uri _endpoint;
    private readonly string _token;
    private readonly string _botId;
    private readonly long _startedAt;

    public SupabaseTelemetrySink(HttpClient httpClient, BridgeConfig config, string token)
    {
        _httpClient = httpClient;
        _endpoint = new Uri(config.TelemetryIngestUrl);
        _token = token;
        _botId = config.BotId;
        _startedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }

    public async Task SendAsync(DebugReadResult read, long afterSeq, CancellationToken cancellationToken)
    {
        var payload = new
        {
            schemaVersion = 1,
            type = "AIO_V3_DEBUG_TELEMETRY_BATCH",
            botId = _botId,
            observedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            cursor = new { afterSeq, maxSeq = read.MaxSeq },
            host = new
            {
                processRunning = true,
                restartCount = 0,
                harnessStartedAt = _startedAt,
                platform = "windows-desktop-bridge"
            },
            snapshot = read.Snapshot,
            events = read.Events
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        request.Headers.TryAddWithoutValidation("x-aio-v3-bot-id", _botId);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (body.Length > 256) body = body[..256];
            throw new InvalidOperationException($"TELEMETRY_HTTP_{(int)response.StatusCode}:{body}");
        }
    }
}
