using System.Net.Http.Headers;
using System.Text.Json;

namespace AioBotLinuxBridge;

public sealed class SupabaseTelemetrySink
{
    // The existing bot-debug-ingest Edge Function rejects bodies above 512 KiB.
    // Keep explicit headroom for HTTP/JSON growth and future small schema additions.
    public const int MaxPayloadBytes = 480 * 1024;

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
        var observedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payloadBytes = SerializePayload(read, afterSeq, observedAt, read.Snapshot);

        if (!IsWithinPayloadBudget(payloadBytes.Length))
        {
            var fallbackSnapshot = CreateBudgetFallbackSnapshot(read.Snapshot);
            payloadBytes = SerializePayload(read, afterSeq, observedAt, fallbackSnapshot);
        }

        if (!IsWithinPayloadBudget(payloadBytes.Length))
            throw new InvalidOperationException($"TELEMETRY_PAYLOAD_TOO_LARGE:{payloadBytes.Length}");

        using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        request.Headers.TryAddWithoutValidation("x-aio-v3-bot-id", _botId);
        request.Content = new ByteArrayContent(payloadBytes);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json")
        {
            CharSet = "utf-8"
        };

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (body.Length > 256) body = body[..256];
            throw new InvalidOperationException($"TELEMETRY_HTTP_{(int)response.StatusCode}:{body}");
        }
    }

    public static bool IsWithinPayloadBudget(int byteCount) => byteCount >= 0 && byteCount <= MaxPayloadBytes;

    private byte[] SerializePayload(DebugReadResult read, long afterSeq, long observedAt, object snapshot)
    {
        var payload = new
        {
            schemaVersion = 1,
            type = "AIO_V3_DEBUG_TELEMETRY_BATCH",
            botId = _botId,
            observedAt,
            cursor = new { afterSeq, maxSeq = read.MaxSeq },
            host = new
            {
                processRunning = true,
                restartCount = 0,
                harnessStartedAt = _startedAt,
                platform = "linux-bridge"
            },
            snapshot,
            events = read.Events
        };

        return JsonSerializer.SerializeToUtf8Bytes(payload);
    }

    private static object CreateBudgetFallbackSnapshot(JsonElement snapshot)
    {
        var fallback = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 2,
            ["type"] = "AIO_V3_DEBUG_SNAPSHOT",
            ["diagnostics"] = new
            {
                schemaVersion = 1,
                type = "AIO_V3_AUTONOMY_DIAGNOSTICS",
                sizeLimited = true,
                omitted = true,
                reason = "INGEST_PAYLOAD_BUDGET"
            }
        };

        if (snapshot.ValueKind == JsonValueKind.Object)
        {
            CopyIfPresent(snapshot, fallback, "schemaVersion");
            CopyIfPresent(snapshot, fallback, "type");
            CopyIfPresent(snapshot, fallback, "status");
            CopyIfPresent(snapshot, fallback, "heartbeat");
            CopyIfPresent(snapshot, fallback, "reconciliation");
        }

        return fallback;
    }

    private static void CopyIfPresent(JsonElement source, IDictionary<string, object?> target, string propertyName)
    {
        if (source.TryGetProperty(propertyName, out var value)) target[propertyName] = value.Clone();
    }
}
