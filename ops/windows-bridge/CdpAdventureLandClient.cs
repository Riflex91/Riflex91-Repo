using System.Net.WebSockets;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed class CdpAdventureLandClient
{
    private readonly HttpClient _httpClient;
    private readonly Uri _cdpEndpoint;
    private readonly Uri _allowedOrigin;
    private int _nextCommandId;

    public CdpAdventureLandClient(HttpClient httpClient, BridgeConfig config)
    {
        _httpClient = httpClient;
        _cdpEndpoint = new Uri(config.CdpEndpoint.TrimEnd('/') + "/");
        _allowedOrigin = new Uri(config.AllowedOrigin);
    }

    public async Task<string> FindTargetUrlAsync(CancellationToken cancellationToken)
    {
        var targets = await FindTargetsAsync(cancellationToken);
        return targets[0].Url;
    }

    public async Task<string> FindBotTargetUrlAsync(CancellationToken cancellationToken)
    {
        var ranked = await RankTargetsAsync(await FindTargetsAsync(cancellationToken), cancellationToken);
        if (ranked.Count == 0) throw new InvalidOperationException("AIO_V5_TELEMETRY_UNAVAILABLE");
        return ranked[0].Target.Url;
    }

    public Task<DebugReadResult> ReadAsync(long afterSeq, int eventLimit, CancellationToken cancellationToken) =>
        ReadAsync(afterSeq, eventLimit, includeDeepDiagnostics: false, cancellationToken);

    public async Task<DebugReadResult> ReadAsync(
        long afterSeq,
        int eventLimit,
        bool includeDeepDiagnostics,
        CancellationToken cancellationToken)
    {
        var ranked = await RankTargetsAsync(await FindTargetsAsync(cancellationToken), cancellationToken);
        foreach (var candidate in ranked)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(candidate.Target.WebSocketDebuggerUrl), cancellationToken);
                var context = await FindTelemetryContextAsync(socket, cancellationToken);
                if (context is null) continue;

                var snapshot = await EvaluateAsync(
                    socket,
                    SnapshotExpression,
                    context.ContextId,
                    cancellationToken);
                var eventBatch = await EvaluateAsync(
                    socket,
                    BuildEventsExpression(afterSeq, eventLimit),
                    context.ContextId,
                    cancellationToken);

                JsonElement events;
                if (eventBatch.ValueKind == JsonValueKind.Object
                    && eventBatch.TryGetProperty("events", out var eventsNode)
                    && eventsNode.ValueKind == JsonValueKind.Array)
                {
                    events = eventsNode.Clone();
                }
                else
                {
                    using var empty = JsonDocument.Parse("[]");
                    events = empty.RootElement.Clone();
                }

                var requestedAfterSeq = ReadInt64(eventBatch, "requestedAfterSeq", Math.Max(0, afterSeq));
                var effectiveAfterSeq = ReadInt64(eventBatch, "effectiveAfterSeq", requestedAfterSeq);
                var lastCapturedSeq = ReadInt64(eventBatch, "lastCapturedSeq", 0);
                var hasMoreEvents = ReadBoolean(eventBatch, "hasMore", false);

                long maxSeq = effectiveAfterSeq;
                foreach (var row in events.EnumerateArray())
                {
                    if (row.ValueKind == JsonValueKind.Object
                        && row.TryGetProperty("seq", out var seqNode)
                        && seqNode.TryGetInt64(out var seq))
                        maxSeq = Math.Max(maxSeq, seq);
                }

                return new DebugReadResult(
                    snapshot.Clone(),
                    events,
                    requestedAfterSeq,
                    effectiveAfterSeq,
                    maxSeq,
                    lastCapturedSeq,
                    hasMoreEvents,
                    candidate.Target.Url);
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        throw new InvalidOperationException("AIO_V5_TELEMETRY_UNAVAILABLE");
    }

    public async Task<TelemetryAckResult> AcknowledgeThroughAsync(long maxSeq, CancellationToken cancellationToken)
    {
        if (maxSeq <= 0) return TelemetryAckResult.Empty;

        var ranked = await RankTargetsAsync(await FindTargetsAsync(cancellationToken), cancellationToken);
        foreach (var candidate in ranked)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(candidate.Target.WebSocketDebuggerUrl), cancellationToken);
                var context = await FindTelemetryContextAsync(socket, cancellationToken);
                if (context is null) continue;

                var value = await EvaluateAsync(
                    socket,
                    BuildAcknowledgeExpression(maxSeq),
                    context.ContextId,
                    cancellationToken);
                if (value.ValueKind != JsonValueKind.Object) return TelemetryAckResult.Empty;

                return new TelemetryAckResult(
                    ReadBoolean(value, "supported", true),
                    (int)Math.Clamp(ReadInt64(value, "acknowledged", 0), 0, int.MaxValue),
                    (int)Math.Clamp(ReadInt64(value, "remaining", 0), 0, int.MaxValue),
                    ReadInt64(value, "lastAcknowledgedSeq", 0),
                    ReadInt64(value, "lastCapturedSeq", 0),
                    (int)Math.Clamp(ReadInt64(value, "dropped", 0), 0, int.MaxValue));
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        throw new InvalidOperationException("AIO_V5_TELEMETRY_UNAVAILABLE");
    }

    public static int TelemetryContextPriority(
        bool valid,
        string? role,
        string? ctype,
        string? runtimeMode)
    {
        if (!valid) return 0;
        var normalizedRole = (role ?? string.Empty).Trim().ToUpperInvariant();
        var normalizedClass = (ctype ?? string.Empty).Trim().ToLowerInvariant();
        var normalizedMode = (runtimeMode ?? string.Empty).Trim().ToUpperInvariant();

        if (normalizedRole == "COORDINATOR") return 400;
        if (normalizedRole == "RUNTIME") return 350;
        if (normalizedClass == "merchant" && normalizedRole != "WORKER") return 300;
        if (normalizedMode == "PRODUCTION") return 250;
        if (normalizedRole == "WORKER") return 100;
        return 50;
    }

    private async Task<List<CdpTarget>> FindTargetsAsync(CancellationToken cancellationToken)
    {
        var listUri = new Uri(_cdpEndpoint, "json/list");
        using var response = await _httpClient.GetAsync(listUri, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var targets = await JsonSerializer.DeserializeAsync<List<CdpTarget>>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }, cancellationToken) ?? [];

        var matches = new List<CdpTarget>();
        foreach (var target in targets)
        {
            if (!string.Equals(target.Type, "page", StringComparison.OrdinalIgnoreCase)) continue;
            if (string.IsNullOrWhiteSpace(target.Url) || string.IsNullOrWhiteSpace(target.WebSocketDebuggerUrl)) continue;
            if (!Uri.TryCreate(target.Url, UriKind.Absolute, out var pageUri)) continue;
            if (!SameOrigin(pageUri, _allowedOrigin)) continue;
            matches.Add(target);
        }

        if (matches.Count == 0)
            throw new InvalidOperationException("ADVENTURE_LAND_CDP_TARGET_NOT_FOUND");
        return matches;
    }

    private sealed record TelemetryContext(int ContextId, int Priority);
    private sealed record RankedTarget(CdpTarget Target, int Priority);

    private async Task<IReadOnlyList<RankedTarget>> RankTargetsAsync(
        IReadOnlyList<CdpTarget> targets,
        CancellationToken cancellationToken)
    {
        var ranked = new List<RankedTarget>();
        foreach (var target in targets)
        {
            try
            {
                using var socket = new ClientWebSocket();
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var context = await FindTelemetryContextAsync(socket, cancellationToken);
                if (context is not null) ranked.Add(new RankedTarget(target, context.Priority));
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }
        return ranked.OrderByDescending(x => x.Priority).ToArray();
    }

    private async Task<TelemetryContext?> FindTelemetryContextAsync(
        ClientWebSocket socket,
        CancellationToken cancellationToken)
    {
        var contexts = await CollectAllowedExecutionContextsAsync(socket, cancellationToken);
        TelemetryContext? best = null;
        foreach (var contextId in contexts)
        {
            try
            {
                var probe = await EvaluateAsync(socket, TelemetryProbeExpression, contextId, cancellationToken);
                if (probe.ValueKind != JsonValueKind.Object) continue;

                var valid = ReadBoolean(probe, "valid", false);
                var priority = TelemetryContextPriority(
                    valid,
                    ReadString(probe, "role"),
                    ReadString(probe, "ctype"),
                    ReadString(probe, "runtimeMode"));
                if (priority <= 0) continue;
                if (best is null || priority > best.Priority)
                    best = new TelemetryContext(contextId, priority);
            }
            catch (InvalidOperationException)
            {
            }
        }
        return best;
    }

    private async Task<IReadOnlyList<int>> CollectAllowedExecutionContextsAsync(
        ClientWebSocket socket,
        CancellationToken cancellationToken)
    {
        var id = Interlocked.Increment(ref _nextCommandId);
        var command = JsonSerializer.SerializeToUtf8Bytes(new { id, method = "Runtime.enable" });
        await socket.SendAsync(command, WebSocketMessageType.Text, true, cancellationToken);

        var contexts = new List<int>();
        while (true)
        {
            using var message = await ReceiveJsonAsync(socket, cancellationToken);
            var root = message.RootElement;
            if (root.ValueKind == JsonValueKind.Object
                && root.TryGetProperty("method", out var methodNode)
                && string.Equals(methodNode.GetString(), "Runtime.executionContextCreated", StringComparison.Ordinal)
                && root.TryGetProperty("params", out var paramsNode)
                && paramsNode.ValueKind == JsonValueKind.Object
                && paramsNode.TryGetProperty("context", out var contextNode)
                && TryGetAllowedContextId(contextNode, out var contextId))
                contexts.Add(contextId);

            if (!root.TryGetProperty("id", out var idNode)
                || !idNode.TryGetInt32(out var responseId)
                || responseId != id)
                continue;
            if (root.TryGetProperty("error", out var error))
                throw new InvalidOperationException("CDP_COMMAND_FAILED:" + Bounded(error.ToString()));
            break;
        }
        return contexts.Distinct().ToArray();
    }

    private bool TryGetAllowedContextId(JsonElement context, out int contextId)
    {
        contextId = 0;
        if (context.ValueKind != JsonValueKind.Object) return false;
        if (!context.TryGetProperty("id", out var idNode) || !idNode.TryGetInt32(out contextId)) return false;
        if (!context.TryGetProperty("origin", out var originNode)) return false;
        var origin = originNode.GetString();
        if (string.IsNullOrWhiteSpace(origin) || !Uri.TryCreate(origin, UriKind.Absolute, out var originUri)) return false;
        if (!SameOrigin(originUri, _allowedOrigin)) return false;

        if (context.TryGetProperty("auxData", out var auxData)
            && auxData.ValueKind == JsonValueKind.Object
            && auxData.TryGetProperty("isDefault", out var isDefault)
            && isDefault.ValueKind == JsonValueKind.False)
            return false;
        return true;
    }

    private static bool SameOrigin(Uri left, Uri right) =>
        string.Equals(left.Scheme, right.Scheme, StringComparison.OrdinalIgnoreCase)
        && string.Equals(left.Host, right.Host, StringComparison.OrdinalIgnoreCase)
        && left.Port == right.Port;

    private async Task<JsonElement> EvaluateAsync(
        ClientWebSocket socket,
        string expression,
        int contextId,
        CancellationToken cancellationToken)
    {
        var id = Interlocked.Increment(ref _nextCommandId);
        var command = JsonSerializer.SerializeToUtf8Bytes(new
        {
            id,
            method = "Runtime.evaluate",
            @params = new
            {
                expression,
                contextId,
                returnByValue = true,
                awaitPromise = true,
                userGesture = false
            }
        });
        await socket.SendAsync(command, WebSocketMessageType.Text, true, cancellationToken);

        while (true)
        {
            using var message = await ReceiveJsonAsync(socket, cancellationToken);
            var root = message.RootElement;
            if (!root.TryGetProperty("id", out var idNode)
                || !idNode.TryGetInt32(out var responseId)
                || responseId != id)
                continue;
            if (root.TryGetProperty("error", out var error))
                throw new InvalidOperationException("CDP_COMMAND_FAILED:" + Bounded(error.ToString()));

            var result = root.GetProperty("result");
            if (result.TryGetProperty("exceptionDetails", out var exception))
                throw new InvalidOperationException("CDP_EVALUATION_FAILED:" + Bounded(exception.ToString()));
            var remoteObject = result.GetProperty("result");
            if (!remoteObject.TryGetProperty("value", out var value))
                throw new InvalidOperationException("CDP_RESULT_VALUE_MISSING");
            return value.Clone();
        }
    }

    private static async Task<JsonDocument> ReceiveJsonAsync(ClientWebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[16 * 1024];
        using var stream = new MemoryStream();
        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, cancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
                throw new InvalidOperationException("CDP_SOCKET_CLOSED");
            if (result.Count > 0) stream.Write(buffer, 0, result.Count);
            if (stream.Length > 1024 * 1024)
                throw new InvalidOperationException("CDP_RESPONSE_TOO_LARGE");
            if (result.EndOfMessage) break;
        }
        return JsonDocument.Parse(stream.ToArray());
    }

    private static string BuildEventsExpression(long afterSeq, int limit)
    {
        var boundedAfter = Math.Max(0, afterSeq);
        var boundedLimit = Math.Clamp(limit, 1, 200);
        return $$"""
        (() => {
          const telemetry = globalThis.AIO_V5 && globalThis.AIO_V5.telemetry;
          if (!telemetry || typeof telemetry.peekEvents !== 'function' || typeof telemetry.snapshot !== 'function') {
            throw new Error('AIO_V5_TELEMETRY_UNAVAILABLE');
          }
          const requestedAfterSeq = {{boundedAfter}};
          const limit = {{boundedLimit}};
          const rows = telemetry.peekEvents(2000);
          const snap = telemetry.snapshot();
          const transport = snap && snap.transport || {};
          const lastCapturedSeq = Math.max(0, Number(transport.lastCapturedSeq) || 0);
          const effectiveAfterSeq = lastCapturedSeq > 0 && requestedAfterSeq > lastCapturedSeq ? 0 : requestedAfterSeq;
          const candidates = Array.isArray(rows)
            ? rows.filter(row => row && Number(row.seq) > effectiveAfterSeq)
            : [];
          const events = candidates.slice(0, limit);
          return {
            schemaVersion: 1,
            type: 'AIO_V5_TELEMETRY_EVENTS',
            requestedAfterSeq,
            effectiveAfterSeq,
            lastCapturedSeq,
            availableAfterSeq: candidates.length,
            hasMore: candidates.length > events.length,
            cursorReset: effectiveAfterSeq !== requestedAfterSeq,
            events
          };
        })()
        """;
    }

    private static string BuildAcknowledgeExpression(long maxSeq)
    {
        var boundedMax = Math.Max(0, maxSeq);
        return $$"""
        (() => {
          const telemetry = globalThis.AIO_V5 && globalThis.AIO_V5.telemetry;
          if (!telemetry || typeof telemetry.acknowledgeThrough !== 'function') {
            return {
              schemaVersion:1,
              supported:false,
              acknowledged:0,
              remaining:0,
              lastAcknowledgedSeq:0,
              lastCapturedSeq:0,
              dropped:0
            };
          }
          const before = telemetry.snapshot && telemetry.snapshot();
          const beforeTransport = before && before.transport || {};
          const result = telemetry.acknowledgeThrough({{boundedMax}}) || {};
          const after = telemetry.snapshot && telemetry.snapshot();
          const transport = after && after.transport || {};
          const beforeQueued = Math.max(0, Number(beforeTransport.queued) || 0);
          const remaining = Math.max(0, Number(transport.queued) || Number(result.remaining) || 0);
          return {
            schemaVersion:1,
            supported:true,
            acknowledged:Math.max(0, beforeQueued - remaining),
            remaining,
            lastAcknowledgedSeq:Math.max(0, Number(transport.lastAcknowledgedSeq) || Number(result.acknowledgedThrough) || 0),
            lastCapturedSeq:Math.max(0, Number(transport.lastCapturedSeq) || Number(result.lastCapturedSeq) || 0),
            dropped:Math.max(0, Number(transport.dropped) || 0)
          };
        })()
        """;
    }

    private static long ReadInt64(JsonElement value, string property, long fallback)
    {
        if (value.ValueKind == JsonValueKind.Object
            && value.TryGetProperty(property, out var node)
            && node.TryGetInt64(out var result))
            return result;
        return fallback;
    }

    private static bool ReadBoolean(JsonElement value, string property, bool fallback)
    {
        if (value.ValueKind == JsonValueKind.Object && value.TryGetProperty(property, out var node))
        {
            if (node.ValueKind == JsonValueKind.True) return true;
            if (node.ValueKind == JsonValueKind.False) return false;
        }
        return fallback;
    }

    private static string? ReadString(JsonElement value, string property)
    {
        if (value.ValueKind == JsonValueKind.Object
            && value.TryGetProperty(property, out var node)
            && node.ValueKind == JsonValueKind.String)
            return node.GetString();
        return null;
    }

    private const string TelemetryProbeExpression = """
    (() => {
      const telemetry = globalThis.AIO_V5 && globalThis.AIO_V5.telemetry;
      const valid = !!telemetry
        && typeof telemetry === 'object'
        && typeof telemetry.snapshot === 'function'
        && typeof telemetry.peekEvents === 'function';
      if (!valid) return { valid:false, role:null, ctype:null, runtimeMode:null };
      let snap = null;
      try { snap = telemetry.snapshot(); } catch {}
      let role = '';
      try { role = typeof telemetry.role === 'function' ? String(telemetry.role() || '') : String(snap && snap.role || ''); } catch {}
      const ctype = String(snap && snap.character && snap.character.ctype || '').toLowerCase();
      const runtimeMode = String(snap && snap.runtime && snap.runtime.mode || '').toUpperCase();
      return { valid:true, role, ctype, runtimeMode };
    })()
    """;

    private const string SnapshotExpression = """
    (() => {
      const telemetry = globalThis.AIO_V5 && globalThis.AIO_V5.telemetry;
      if (!telemetry || typeof telemetry.snapshot !== 'function') throw new Error('AIO_V5_TELEMETRY_UNAVAILABLE');
      const value = telemetry.snapshot();
      if (!value || typeof value !== 'object') throw new Error('AIO_V5_TELEMETRY_SNAPSHOT_INVALID');
      return value;
    })()
    """;

    private static string Bounded(string value) => value.Length <= 256 ? value : value[..256];

    private sealed record CdpTarget
    {
        public string Type { get; init; } = string.Empty;
        public string Url { get; init; } = string.Empty;
        public string WebSocketDebuggerUrl { get; init; } = string.Empty;
    }
}

public sealed record DebugReadResult(
    JsonElement Snapshot,
    JsonElement Events,
    long RequestedAfterSeq,
    long EffectiveAfterSeq,
    long MaxSeq,
    long LastCapturedSeq,
    bool HasMoreEvents,
    string TargetUrl)
{
    public int EventCount => Events.ValueKind == JsonValueKind.Array ? Events.GetArrayLength() : 0;
    public bool CursorWasReset => EffectiveAfterSeq != RequestedAfterSeq;
}

public sealed record TelemetryAckResult(
    bool Supported,
    int Acknowledged,
    int Remaining,
    long LastAcknowledgedSeq,
    long LastCapturedSeq,
    int Dropped)
{
    public static TelemetryAckResult Empty { get; } = new(false, 0, 0, 0, 0, 0);
}
