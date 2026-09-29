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

        object snapshot = read.Snapshot;
        object events = read.Events;
        var bytes = Serialize(read, character, snapshot, events);

        if (bytes.Length > MaxPayloadBytes)
        {
            snapshot = CreateReducedSnapshot(read.Snapshot);
            events = CreateCompactEvents(read.Events);
            bytes = Serialize(read, character, snapshot, events);
        }

        if (bytes.Length > MaxPayloadBytes)
        {
            snapshot = CreateCompactSnapshot(read.Snapshot);
            bytes = Serialize(read, character, snapshot, events);
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
        object events)
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

    private static IReadOnlyList<object> CreateCompactEvents(JsonElement events)
    {
        var rows = new List<JsonElement>();
        if (events.ValueKind == JsonValueKind.Array)
        {
            foreach (var row in events.EnumerateArray())
                if (row.ValueKind == JsonValueKind.Object)
                    rows.Add(row.Clone());
        }

        var compact = new List<object>();
        var start = Math.Max(0, rows.Count - 24);
        for (var index = start; index < rows.Count; index++)
        {
            var row = rows[index];
            var item = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["seq"] = ReadInt64(row, "seq"),
                ["id"] = ReadBoundedString(row, "id", 160),
                ["ts"] = ReadBoundedString(row, "ts", 80),
                ["at"] = ReadInt64(row, "at"),
                ["time"] = ReadBoundedString(row, "time", 80),
                ["createdAt"] = ReadBoundedString(row, "createdAt", 80),
                ["severity"] = ReadBoundedString(row, "severity", 20),
                ["component"] = ReadBoundedString(row, "component", 80),
                ["event"] = ReadBoundedString(row, "event", 120),
                ["reason"] = ReadBoundedString(row, "reason", 300),
                ["payloadCompacted"] = true
            };

            if (row.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            {
                item["data"] = new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    ["component"] = ReadBoundedString(data, "component", 80),
                    ["character"] = ReadBoundedString(data, "character", 160)
                };
            }

            compact.Add(item);
        }

        return compact;
    }

    private static object CreateCompactSnapshot(JsonElement snapshot)
    {
        var compact = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 1,
            ["type"] = CdpAlBotV6Client.SnapshotType,
            ["diagnostics"] = new
            {
                omitted = true,
                reason = "DASHBOARD_PAYLOAD_BUDGET_COMPACT"
            }
        };

        if (snapshot.ValueKind != JsonValueKind.Object) return compact;

        if (snapshot.TryGetProperty("identity", out var identity)
            && identity.ValueKind == JsonValueKind.Object)
        {
            compact["identity"] = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["product"] = ReadBoundedString(identity, "product", 80),
                ["generation"] = ReadInt64(identity, "generation"),
                ["bridgeProtocol"] = ReadBoundedString(identity, "bridgeProtocol", 100),
                ["runtimeVersion"] = ReadBoundedString(identity, "runtimeVersion", 160),
                ["transportOnly"] = ReadBoolean(identity, "transportOnly"),
                ["gameplayActionAuthority"] = ReadBoolean(identity, "gameplayActionAuthority"),
                ["acceptsLegacyGenerations"] = ReadBoolean(identity, "acceptsLegacyGenerations")
            };
        }

        CopyIfPresent(snapshot, compact, "observedAt");

        if (snapshot.TryGetProperty("character", out var character)
            && character.ValueKind == JsonValueKind.Object)
        {
            compact["character"] = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["name"] = ReadBoundedString(character, "name", 160),
                ["ctype"] = ReadBoundedString(character, "ctype", 80),
                ["type"] = ReadBoundedString(character, "type", 80),
                ["level"] = ReadNumber(character, "level"),
                ["hp"] = ReadNumber(character, "hp"),
                ["max_hp"] = ReadNumber(character, "max_hp"),
                ["maxHp"] = ReadNumber(character, "maxHp"),
                ["mp"] = ReadNumber(character, "mp"),
                ["max_mp"] = ReadNumber(character, "max_mp"),
                ["maxMp"] = ReadNumber(character, "maxMp"),
                ["gold"] = ReadNumber(character, "gold"),
                ["map"] = ReadBoundedString(character, "map", 160),
                ["x"] = ReadNumber(character, "x"),
                ["y"] = ReadNumber(character, "y"),
                ["real_x"] = ReadNumber(character, "real_x"),
                ["real_y"] = ReadNumber(character, "real_y")
            };
        }

        var task = ReadDashboardTask(snapshot);
        if (!string.IsNullOrWhiteSpace(task)) compact["task"] = task;

        compact["rates"] = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["xpPerHour"] = ReadDashboardRate(snapshot, "xpPerHour", "expPerHour"),
            ["expPerHour"] = ReadDashboardRate(snapshot, "expPerHour", "xpPerHour"),
            ["goldPerHour"] = ReadDashboardRate(snapshot, "goldPerHour")
        };

        var sprite = FindFirstObject(snapshot,
            ["sprite"],
            ["character", "sprite"],
            ["telemetry", "sprite"]);
        if (sprite is JsonElement spriteElement)
        {
            compact["sprite"] = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["file"] = ReadBoundedString(spriteElement, "file", 300),
                ["columns"] = ReadNumber(spriteElement, "columns"),
                ["rows"] = ReadNumber(spriteElement, "rows"),
                ["column"] = ReadNumber(spriteElement, "column"),
                ["row"] = ReadNumber(spriteElement, "row"),
                ["x"] = ReadNumber(spriteElement, "x"),
                ["y"] = ReadNumber(spriteElement, "y")
            };
        }

        var mapBounds = FindFirstObject(snapshot,
            ["mapBounds"],
            ["character", "mapBounds"],
            ["telemetry", "mapBounds"]);
        if (mapBounds is JsonElement boundsElement)
        {
            compact["mapBounds"] = new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["minX"] = ReadNumber(boundsElement, "minX"),
                ["minY"] = ReadNumber(boundsElement, "minY"),
                ["maxX"] = ReadNumber(boundsElement, "maxX"),
                ["maxY"] = ReadNumber(boundsElement, "maxY")
            };
        }

        return compact;
    }

    private static string? ReadDashboardTask(JsonElement snapshot)
    {
        string[][] paths =
        [
            ["task"],
            ["status", "task"],
            ["status", "currentTask"],
            ["operations", "currentTask"],
            ["farmer", "task"],
            ["merchant", "task"],
            ["telemetry", "task"],
            ["brain", "currentTask"],
            ["brain", "decision", "label"],
            ["status", "mode"],
            ["mode"]
        ];

        foreach (var path in paths)
        {
            if (!TryGetPath(snapshot, path, out var value)) continue;
            if (value.ValueKind == JsonValueKind.String)
                return Truncate(value.GetString(), 240);

            if (value.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in new[] { "label", "name", "task", "code" })
                {
                    var text = ReadBoundedString(value, property, 240);
                    if (!string.IsNullOrWhiteSpace(text)) return text;
                }
                return "Aktive Aufgabe";
            }
        }

        return null;
    }

    private static double? ReadDashboardRate(JsonElement snapshot, params string[] names)
    {
        string[][] ratePaths =
        [
            ["telemetry", "performance", "current", "rates"],
            ["performance", "current", "rates"],
            ["telemetry", "rates"],
            ["rates"]
        ];

        foreach (var path in ratePaths)
        {
            if (!TryGetPath(snapshot, path, out var rates) || rates.ValueKind != JsonValueKind.Object)
                continue;
            foreach (var name in names)
            {
                var value = ReadNumber(rates, name);
                if (value is not null) return value;
            }
        }

        foreach (var name in names)
        {
            var value = ReadNumber(snapshot, name);
            if (value is not null) return value;
        }

        return null;
    }

    private static JsonElement? FindFirstObject(JsonElement source, params string[][] paths)
    {
        foreach (var path in paths)
            if (TryGetPath(source, path, out var value) && value.ValueKind == JsonValueKind.Object)
                return value.Clone();
        return null;
    }

    private static bool TryGetPath(JsonElement source, IReadOnlyList<string> path, out JsonElement value)
    {
        value = source;
        foreach (var segment in path)
        {
            if (value.ValueKind != JsonValueKind.Object
                || !value.TryGetProperty(segment, out var next))
                return false;
            value = next;
        }
        return true;
    }

    private static string? ReadBoundedString(JsonElement source, string property, int max)
    {
        if (source.ValueKind != JsonValueKind.Object
            || !source.TryGetProperty(property, out var value)
            || value.ValueKind != JsonValueKind.String)
            return null;
        return Truncate(value.GetString(), max);
    }

    private static string? Truncate(string? text, int max)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= max) return text;
        var length = max;
        if (length > 0
            && length < text.Length
            && char.IsHighSurrogate(text[length - 1])
            && char.IsLowSurrogate(text[length]))
            length--;
        return text[..length];
    }

    private static long? ReadInt64(JsonElement source, string property)
    {
        if (source.ValueKind == JsonValueKind.Object
            && source.TryGetProperty(property, out var value)
            && value.ValueKind == JsonValueKind.Number
            && value.TryGetInt64(out var parsed))
            return parsed;
        return null;
    }

    private static double? ReadNumber(JsonElement source, string property)
    {
        if (source.ValueKind == JsonValueKind.Object
            && source.TryGetProperty(property, out var value)
            && value.ValueKind == JsonValueKind.Number
            && value.TryGetDouble(out var parsed))
            return parsed;
        return null;
    }

    private static bool? ReadBoolean(JsonElement source, string property)
    {
        if (source.ValueKind != JsonValueKind.Object
            || !source.TryGetProperty(property, out var value))
            return null;
        if (value.ValueKind == JsonValueKind.True) return true;
        if (value.ValueKind == JsonValueKind.False) return false;
        return null;
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
