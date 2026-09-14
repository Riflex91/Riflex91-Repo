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
        var targets = await FindTargetsAsync(cancellationToken);
        foreach (var target in targets)
        {
            try
            {
                using var socket = new ClientWebSocket();
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var contextId = await FindOperationsContextAsync(socket, cancellationToken);
                if (contextId.HasValue) return target.Url;
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        throw new InvalidOperationException("AIO_V3_OPERATIONS_UNAVAILABLE");
    }

    public async Task<DebugReadResult> ReadAsync(long afterSeq, int eventLimit, CancellationToken cancellationToken)
    {
        var targets = await FindTargetsAsync(cancellationToken);
        foreach (var target in targets)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var contextId = await FindOperationsContextAsync(socket, cancellationToken);
                if (!contextId.HasValue) continue;

                var snapshot = await EvaluateAsync(socket, SnapshotExpression, contextId.Value, cancellationToken);
                var eventBatch = await EvaluateAsync(socket, BuildEventsExpression(afterSeq, eventLimit), contextId.Value, cancellationToken);

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

                long maxSeq = afterSeq;
                foreach (var row in events.EnumerateArray())
                {
                    if (row.ValueKind == JsonValueKind.Object
                        && row.TryGetProperty("seq", out var seqNode)
                        && seqNode.TryGetInt64(out var seq))
                    {
                        maxSeq = Math.Max(maxSeq, seq);
                    }
                }

                return new DebugReadResult(snapshot.Clone(), events, maxSeq, target.Url);
            }
            catch (WebSocketException)
            {
                // Another same-origin Adventure Land target may contain the running bot.
            }
        }

        throw new InvalidOperationException("AIO_V3_OPERATIONS_UNAVAILABLE");
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

    private async Task<int?> FindOperationsContextAsync(ClientWebSocket socket, CancellationToken cancellationToken)
    {
        var contexts = await CollectAllowedExecutionContextsAsync(socket, cancellationToken);
        foreach (var contextId in contexts)
        {
            try
            {
                var probe = await EvaluateAsync(socket, OperationsProbeExpression, contextId, cancellationToken);
                if (probe.ValueKind == JsonValueKind.True) return contextId;
            }
            catch (InvalidOperationException)
            {
                // Contexts can disappear while Adventure Land changes frames. Try the next allowed context.
            }
        }

        return null;
    }

    private async Task<IReadOnlyList<int>> CollectAllowedExecutionContextsAsync(ClientWebSocket socket, CancellationToken cancellationToken)
    {
        var id = Interlocked.Increment(ref _nextCommandId);
        var command = JsonSerializer.SerializeToUtf8Bytes(new
        {
            id,
            method = "Runtime.enable"
        });
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
            {
                contexts.Add(contextId);
            }

            if (!root.TryGetProperty("id", out var idNode)
                || !idNode.TryGetInt32(out var responseId)
                || responseId != id)
            {
                continue;
            }

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
        {
            return false;
        }

        return true;
    }

    private static bool SameOrigin(Uri left, Uri right) =>
        string.Equals(left.Scheme, right.Scheme, StringComparison.OrdinalIgnoreCase)
        && string.Equals(left.Host, right.Host, StringComparison.OrdinalIgnoreCase)
        && left.Port == right.Port;

    private async Task<JsonElement> EvaluateAsync(ClientWebSocket socket, string expression, int contextId, CancellationToken cancellationToken)
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
            if (!root.TryGetProperty("id", out var idNode) || !idNode.TryGetInt32(out var responseId) || responseId != id)
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
          const aio = globalThis.AIO_V3;
          const operations = aio && aio.operations;
          if (!operations || typeof operations !== 'object') throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
          if (typeof operations.peekTelemetry !== 'function') throw new Error('DEBUG_EVENTS_UNAVAILABLE');
          const afterSeq = {{boundedAfter}};
          const limit = {{boundedLimit}};
          const rows = operations.peekTelemetry(2000);
          const events = Array.isArray(rows)
            ? rows.filter((row) => row && Number(row.seq) > afterSeq).slice(0, limit)
            : [];
          return { schemaVersion: 1, type: 'AIO_V3_DEBUG_EVENTS', afterSeq, events };
        })()
        """;
    }

    private const string OperationsProbeExpression = """
    (() => {
      const operations = globalThis.AIO_V3 && globalThis.AIO_V3.operations;
      return !!operations
        && typeof operations === 'object'
        && typeof operations.status === 'function'
        && typeof operations.hostHeartbeat === 'function'
        && typeof operations.reconciliationStatus === 'function'
        && typeof operations.peekTelemetry === 'function';
    })()
    """;

    private const string SnapshotExpression = """
    (() => {
      const aio = globalThis.AIO_V3;
      const operations = aio && aio.operations;
      if (!operations || typeof operations !== 'object') throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
      if (typeof operations.status !== 'function') throw new Error('DEBUG_STATUS_UNAVAILABLE');
      if (typeof operations.hostHeartbeat !== 'function') throw new Error('DEBUG_HEARTBEAT_UNAVAILABLE');
      if (typeof operations.reconciliationStatus !== 'function') throw new Error('DEBUG_RECONCILIATION_UNAVAILABLE');
      return {
        schemaVersion: 1,
        type: 'AIO_V3_DEBUG_SNAPSHOT',
        status: operations.status(),
        heartbeat: operations.hostHeartbeat(),
        reconciliation: operations.reconciliationStatus()
      };
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

public sealed record DebugReadResult(JsonElement Snapshot, JsonElement Events, long MaxSeq, string TargetUrl)
{
    public int EventCount => Events.ValueKind == JsonValueKind.Array ? Events.GetArrayLength() : 0;
}
