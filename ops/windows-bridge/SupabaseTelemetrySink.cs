using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed class SupabaseTelemetrySink
{
    // The AL Bot V6 ingest Edge Function rejects bodies above 512 KiB.
    // Keep explicit headroom for HTTP/JSON growth and future small schema additions.
    public const int MaxPayloadBytes = 480 * 1024;
    public const int StrictEventStringMaxChars = 32;

    private static readonly Regex ImportantSignalPattern = new(
        @"(FAIL(?:ED|URE)?|ERROR|QUARANTIN|SAFE_MODE|RESTART_REQUIRED|CIRCUIT_OPEN|UNAVAILABLE|NOT_LIVE|\bDEAD\b|NO_PROGRESS|DRIFT_DETECTED|TIMEOUT|EXHAUSTED|DEGRADED|REJECTED|DISCONNECTED|OUTAGE)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

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
        object snapshot = read.Snapshot;
        object events = read.Events;
        var payloadBytes = SerializePayload(read, afterSeq, observedAt, snapshot, events);

        if (!IsWithinPayloadBudget(payloadBytes.Length))
        {
            snapshot = CreateBudgetFallbackSnapshot(read.Snapshot);
            payloadBytes = SerializePayload(read, afterSeq, observedAt, snapshot, events);
        }

        if (!IsWithinPayloadBudget(payloadBytes.Length))
        {
            events = CreateBudgetFallbackEvents(read.Events);
            payloadBytes = SerializePayload(read, afterSeq, observedAt, snapshot, events);
        }

        if (!IsWithinPayloadBudget(payloadBytes.Length))
        {
            snapshot = CreateMinimalBudgetSnapshot(read.Snapshot);
            payloadBytes = SerializePayload(read, afterSeq, observedAt, snapshot, events);
        }

        if (!IsWithinPayloadBudget(payloadBytes.Length))
        {
            // Live reads are hard-capped at 200 events. A 32 UTF-16-code-unit cap on every
            // signal string keeps even worst-case JSON escaping below the 480 KiB host budget
            // while preserving every event seq and all signal-relevant fields.
            events = CreateStrictBudgetFallbackEvents(read.Events);
            payloadBytes = SerializePayload(read, afterSeq, observedAt, snapshot, events);
        }

        if (!IsWithinPayloadBudget(payloadBytes.Length))
            throw new InvalidOperationException($"TELEMETRY_PAYLOAD_TOO_LARGE:{payloadBytes.Length}");

        using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        request.Headers.TryAddWithoutValidation("x-albot-bot-id", _botId);
        request.Headers.TryAddWithoutValidation("x-albot-generation", "6");
        request.Headers.TryAddWithoutValidation("x-albot-bridge-protocol", CdpAlBotV6Client.Protocol);
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

    private byte[] SerializePayload(
        DebugReadResult read,
        long afterSeq,
        long observedAt,
        object snapshot,
        object events)
    {
        var payload = new
        {
            schemaVersion = 1,
            type = "ALBOT_V6_TELEMETRY_BATCH",
            botId = _botId,
            observedAt,
            cursor = new { afterSeq, maxSeq = read.MaxSeq },
            host = new
            {
                processRunning = true,
                restartCount = 0,
                harnessStartedAt = _startedAt,
                platform = "windows-desktop-bridge"
            },
            snapshot,
            events
        };

        return JsonSerializer.SerializeToUtf8Bytes(payload);
    }

    private static object CreateBudgetFallbackSnapshot(JsonElement snapshot)
    {
        var fallback = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 1,
            ["type"] = CdpAlBotV6Client.SnapshotType,
            ["diagnostics"] = new
            {
                schemaVersion = 1,
                type = "ALBOT_V6_AUTONOMY_DIAGNOSTICS",
                sizeLimited = true,
                omitted = true,
                reason = "INGEST_PAYLOAD_BUDGET"
            }
        };

        if (snapshot.ValueKind == JsonValueKind.Object)
        {
            CopyIfPresent(snapshot, fallback, "identity");
            CopyIfPresent(snapshot, fallback, "observedAt");
            CopyIfPresent(snapshot, fallback, "character");
            CopyIfPresent(snapshot, fallback, "heartbeat");
            CopyIfPresent(snapshot, fallback, "status");
            CopyIfPresent(snapshot, fallback, "telemetry");
        }

        return fallback;
    }

    private static IReadOnlyList<object> CreateBudgetFallbackEvents(JsonElement events)
    {
        var compact = new List<object>();
        if (events.ValueKind != JsonValueKind.Array) return compact;

        foreach (var row in events.EnumerateArray())
        {
            if (row.ValueKind != JsonValueKind.Object) continue;

            var item = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["seq"] = ReadInt64(row, "seq"),
                ["ts"] = ReadBoundedString(row, "ts", 80),
                ["at"] = ReadInt64(row, "at"),
                ["severity"] = ReadBoundedString(row, "severity", 32),
                ["component"] = ReadBoundedString(row, "component", 160),
                ["event"] = ReadBoundedString(row, "event", 200),
                ["type"] = ReadBoundedString(row, "type", 200),
                ["reason"] = ReadBoundedString(row, "reason", 300),
                ["character"] = ReadBoundedString(row, "character", 160),
                ["dedupeKey"] = ReadBoundedString(row, "dedupeKey", 700),
                ["payloadCompacted"] = true
            };

            if (row.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            {
                var compactData = new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    ["component"] = ReadBoundedString(data, "component", 160),
                    ["character"] = ReadBoundedString(data, "character", 160)
                };
                item["data"] = compactData;
            }

            compact.Add(item);
        }

        return compact;
    }

    private static IReadOnlyList<object> CreateStrictBudgetFallbackEvents(JsonElement events)
    {
        var compact = new List<object>();
        if (events.ValueKind != JsonValueKind.Array) return compact;

        foreach (var row in events.EnumerateArray())
        {
            if (row.ValueKind != JsonValueKind.Object) continue;

            var item = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["seq"] = ReadInt64(row, "seq"),
                ["ts"] = ReadBoundedString(row, "ts", StrictEventStringMaxChars),
                ["at"] = ReadInt64(row, "at"),
                ["severity"] = ReadBoundedString(row, "severity", StrictEventStringMaxChars),
                ["component"] = ReadBoundedString(row, "component", StrictEventStringMaxChars),
                ["event"] = ReadSignalPreservingString(row, "event", StrictEventStringMaxChars),
                ["type"] = ReadSignalPreservingString(row, "type", StrictEventStringMaxChars),
                ["reason"] = ReadSignalPreservingString(row, "reason", StrictEventStringMaxChars),
                ["character"] = ReadBoundedString(row, "character", StrictEventStringMaxChars),
                ["dedupeKey"] = ReadOrSynthesizeDedupeKey(row, StrictEventStringMaxChars),
                ["payloadCompacted"] = true,
                ["payloadStrictBudget"] = true
            };

            if (row.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            {
                item["data"] = new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    ["component"] = ReadBoundedString(data, "component", StrictEventStringMaxChars),
                    ["character"] = ReadBoundedString(data, "character", StrictEventStringMaxChars)
                };
            }

            compact.Add(item);
        }

        return compact;
    }

    private static object CreateMinimalBudgetSnapshot(JsonElement snapshot)
    {
        var minimal = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 1,
            ["type"] = CdpAlBotV6Client.SnapshotType,
            ["diagnostics"] = new
            {
                schemaVersion = 1,
                type = "ALBOT_V6_AUTONOMY_DIAGNOSTICS",
                sizeLimited = true,
                omitted = true,
                reason = "INGEST_PAYLOAD_BUDGET_MINIMAL"
            }
        };

        if (snapshot.ValueKind == JsonValueKind.Object)
        {
            if (snapshot.TryGetProperty("identity", out var identity)
                && identity.ValueKind == JsonValueKind.Object)
            {
                minimal["identity"] = new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    ["product"] = ReadBoundedString(identity, "product", 80),
                    ["generation"] = ReadInt64(identity, "generation"),
                    ["bridgeProtocol"] = ReadBoundedString(identity, "bridgeProtocol", 80),
                    ["runtimeVersion"] = ReadBoundedString(identity, "runtimeVersion", 160),
                    ["transportOnly"] = ReadBoolean(identity, "transportOnly"),
                    ["gameplayActionAuthority"] = ReadBoolean(identity, "gameplayActionAuthority"),
                    ["acceptsLegacyGenerations"] = ReadBoolean(identity, "acceptsLegacyGenerations")
                };
            }

            CopyIfPresent(snapshot, minimal, "observedAt");

            if (snapshot.TryGetProperty("character", out var character)
                && character.ValueKind == JsonValueKind.Object)
            {
                minimal["character"] = new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    ["name"] = ReadBoundedString(character, "name", 160),
                    ["ctype"] = ReadBoundedString(character, "ctype", 80),
                    ["level"] = ReadInt64(character, "level"),
                    ["map"] = ReadBoundedString(character, "map", 160),
                    ["x"] = ReadNumber(character, "x"),
                    ["y"] = ReadNumber(character, "y")
                };
            }
        }

        return minimal;
    }

    private static string? ReadSignalPreservingString(JsonElement source, string propertyName, int max)
    {
        var text = ReadString(source, propertyName);
        if (string.IsNullOrEmpty(text) || text.Length <= max) return text;

        var important = ImportantSignalPattern.Match(text);
        return important.Success
            ? TruncateText(important.Value, max)
            : TruncateText(text, max);
    }

    private static string? ReadOrSynthesizeDedupeKey(JsonElement row, int max)
    {
        var explicitKey = ReadCollisionResistantBoundedString(row, "dedupeKey", max);
        if (!string.IsNullOrEmpty(explicitKey)) return explicitKey;
        if (max <= 0) return string.Empty;

        var component = ReadString(row, "component") ?? string.Empty;
        var eventType = ReadString(row, "event") ?? ReadString(row, "type") ?? string.Empty;
        var reason = ReadString(row, "reason") ?? string.Empty;
        var character = ReadString(row, "character") ?? string.Empty;
        if (row.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
        {
            if (string.IsNullOrEmpty(component)) component = ReadString(data, "component") ?? string.Empty;
            if (string.IsNullOrEmpty(character)) character = ReadString(data, "character") ?? string.Empty;
        }

        var source = string.Join("\u001F", component, eventType, reason, character);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(source)));
        var prefix = "auto#";
        if (max <= prefix.Length) return prefix[..max];

        return prefix + hash[..Math.Min(max - prefix.Length, hash.Length)];
    }

    private static string? ReadCollisionResistantBoundedString(JsonElement source, string propertyName, int max)
    {
        var text = ReadString(source, propertyName);
        if (string.IsNullOrEmpty(text) || text.Length <= max) return text;
        if (max <= 0) return string.Empty;

        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text)));
        if (max <= 17) return hash[..Math.Min(max, hash.Length)];

        var prefixLength = max - 17;
        var prefix = TruncateText(text, prefixLength);
        return prefix + "#" + hash[..16];
    }

    private static string? ReadString(JsonElement source, string propertyName)
    {
        if (source.ValueKind != JsonValueKind.Object
            || !source.TryGetProperty(propertyName, out var value)
            || value.ValueKind != JsonValueKind.String)
            return null;
        return value.GetString();
    }

    private static string TruncateText(string text, int max)
    {
        if (max <= 0) return string.Empty;
        if (text.Length <= max) return text;

        var length = max;
        if (length > 0
            && length < text.Length
            && char.IsHighSurrogate(text[length - 1])
            && char.IsLowSurrogate(text[length]))
            length--;

        return text[..length];
    }

    private static string? ReadBoundedString(JsonElement source, string propertyName, int max)
    {
        var text = ReadString(source, propertyName);
        if (string.IsNullOrEmpty(text)) return text;
        return TruncateText(text, max);
    }

    private static bool? ReadBoolean(JsonElement source, string propertyName)
    {
        if (source.ValueKind != JsonValueKind.Object
            || !source.TryGetProperty(propertyName, out var value))
            return null;
        if (value.ValueKind == JsonValueKind.True) return true;
        if (value.ValueKind == JsonValueKind.False) return false;
        return null;
    }

    private static long? ReadInt64(JsonElement source, string propertyName)
    {
        if (source.ValueKind == JsonValueKind.Object
            && source.TryGetProperty(propertyName, out var value)
            && value.ValueKind == JsonValueKind.Number
            && value.TryGetInt64(out var parsed))
            return parsed;
        return null;
    }

    private static double? ReadNumber(JsonElement source, string propertyName)
    {
        if (source.ValueKind == JsonValueKind.Object
            && source.TryGetProperty(propertyName, out var value)
            && value.ValueKind == JsonValueKind.Number
            && value.TryGetDouble(out var parsed))
            return parsed;
        return null;
    }

    private static void CopyIfPresent(JsonElement source, IDictionary<string, object?> target, string propertyName)
    {
        if (source.TryGetProperty(propertyName, out var value)) target[propertyName] = value.Clone();
    }
}
