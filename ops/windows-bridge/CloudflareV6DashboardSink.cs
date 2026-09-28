using System.Net.Http.Headers;
using System.Text.Json;

namespace AioBotWindowsBridge;

/// <summary>
/// Direct host-side writer for the AL Bot V6 dashboard API.
/// The write key never enters the Adventure Land browser context.
/// </summary>
public sealed class CloudflareV6DashboardSink
{
    public const int MaxPayloadBytes = 480 * 1024;
    public const string RuntimePath = "/api/v6/runtime";

    private readonly HttpClient _httpClient;
    private readonly Uri _endpoint;
    private readonly string _writeKey;
    private readonly string _account;
    private readonly string _botId;

    public CloudflareV6DashboardSink(
        HttpClient httpClient,
        BridgeConfig config,
        string writeKey)
    {
        if (!SecureDashboardWriteKeyStore.IsValidWriteKey(writeKey))
            throw new InvalidOperationException("WEB_DASHBOARD_WRITE_KEY_INVALID");
        _httpClient = httpClient;
        _endpoint = new Uri(config.WebDashboardBaseUrl.TrimEnd('/') + RuntimePath);
        _writeKey = writeKey;
        _account = config.WebDashboardAccount;
        _botId = config.BotId;
    }

    public async Task SendAsync(DebugReadResult read, CancellationToken cancellationToken)
    {
        var character = ReadCharacterName(read.Snapshot);
        if (string.IsNullOrWhiteSpace(character))
            throw new InvalidOperationException("ALBOT_V6_DASHBOARD_CHARACTER_MISSING");

        var bytes = Serialize(read, character, read.Snapshot, read.Events);
        if (bytes.Length > MaxPayloadBytes)
        {
            var reduced = CreateReducedSnapshot(read.Snapshot);
            bytes = Serialize(read, character, reduced, read.Events);
        }
        if (bytes.Length > MaxPayloadBytes)
        {
            using var empty = JsonDocument.Parse("[]");
            bytes = Serialize(read, character, CreateReducedSnapshot(read.Snapshot), empty.RootElement);
        }
        if (bytes.Length > MaxPayloadBytes)
            throw new InvalidOperationException($"ALBOT_V6_DASHBOARD_PAYLOAD_TOO_LARGE:{bytes.Length}");

        using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
        request.Headers.TryAddWithoutValidation("x-albot-write-key", _writeKey);
        request.Headers.TryAddWithoutValidation("x-albot-bot-id", _botId);
        request.Headers.TryAddWithoutValidation("x-albot-generation", "6");
        request.Headers.TryAddWithoutValidation("x-albot-bridge-protocol", CdpAlBotV6Client.Protocol);
        request.Content = new ByteArrayContent(bytes);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json")
        {
            CharSet = "utf-8"
        };

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (body.Length > 256) body = body[..256];
            throw new InvalidOperationException($"ALBOT_V6_DASHBOARD_HTTP_{(int)response.StatusCode}:{body}");
        }
    }

    public static bool IsWithinPayloadBudget(int byteCount) =>
        byteCount >= 0 && byteCount <= MaxPayloadBytes;

    private byte[] Serialize(
        DebugReadResult read,
        string character,
        object snapshot,
        JsonElement events)
    {
        var payload = new
        {
            schemaVersion = 1,
            type = "ALBOT_V6_RUNTIME_PUSH",
            generation = 6,
            bridgeProtocol = CdpAlBotV6Client.Protocol,
            botId = _botId,
            account = _account,
            character,
            observedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            cursor = new
            {
                requestedAfterSeq = read.RequestedAfterSeq,
                effectiveAfterSeq = read.EffectiveAfterSeq,
                maxSeq = read.MaxSeq,
                lastCapturedSeq = read.LastCapturedSeq,
                hasMore = read.HasMoreEvents
            },
            status = snapshot,
            events
        };
        return JsonSerializer.SerializeToUtf8Bytes(payload);
    }

    private static string? ReadCharacterName(JsonElement snapshot)
    {
        if (snapshot.ValueKind != JsonValueKind.Object
            || !snapshot.TryGetProperty("character", out var character)
            || character.ValueKind != JsonValueKind.Object
            || !character.TryGetProperty("name", out var name)
            || name.ValueKind != JsonValueKind.String)
            return null;
        var value = name.GetString()?.Trim();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static object CreateReducedSnapshot(JsonElement snapshot)
    {
        var reduced = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 1,
            ["type"] = CdpAlBotV6Client.SnapshotType,
            ["diagnostics"] = new
            {
                omitted = true,
                reason = "DASHBOARD_PAYLOAD_BUDGET"
            }
        };
        if (snapshot.ValueKind == JsonValueKind.Object)
        {
            CopyIfPresent(snapshot, reduced, "identity");
            CopyIfPresent(snapshot, reduced, "observedAt");
            CopyIfPresent(snapshot, reduced, "character");
            CopyIfPresent(snapshot, reduced, "heartbeat");
            CopyIfPresent(snapshot, reduced, "status");
            CopyIfPresent(snapshot, reduced, "telemetry");
        }
        return reduced;
    }

    private static void CopyIfPresent(
        JsonElement source,
        IDictionary<string, object?> target,
        string property)
    {
        if (source.TryGetProperty(property, out var value))
            target[property] = value.Clone();
    }
}
