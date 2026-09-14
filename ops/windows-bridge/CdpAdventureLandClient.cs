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

    public Task<DebugReadResult> ReadAsync(long afterSeq, int eventLimit, CancellationToken cancellationToken) =>
        ReadAsync(afterSeq, eventLimit, includeDeepDiagnostics: false, cancellationToken);

    public async Task<DebugReadResult> ReadAsync(
        long afterSeq,
        int eventLimit,
        bool includeDeepDiagnostics,
        CancellationToken cancellationToken)
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

                var snapshot = await EvaluateAsync(
                    socket,
                    includeDeepDiagnostics ? DeepSnapshotExpression : SnapshotExpression,
                    contextId.Value,
                    cancellationToken);
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
                    {
                        maxSeq = Math.Max(maxSeq, seq);
                    }
                }

                return new DebugReadResult(
                    snapshot.Clone(),
                    events,
                    requestedAfterSeq,
                    effectiveAfterSeq,
                    maxSeq,
                    lastCapturedSeq,
                    hasMoreEvents,
                    target.Url);
            }
            catch (WebSocketException)
            {
                // Another same-origin Adventure Land target may contain the running bot.
            }
        }

        throw new InvalidOperationException("AIO_V3_OPERATIONS_UNAVAILABLE");
    }

    public async Task<TelemetryAckResult> AcknowledgeThroughAsync(long maxSeq, CancellationToken cancellationToken)
    {
        if (maxSeq <= 0) return TelemetryAckResult.Empty;

        var targets = await FindTargetsAsync(cancellationToken);
        foreach (var target in targets)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var contextId = await FindOperationsContextAsync(socket, cancellationToken);
                if (!contextId.HasValue) continue;

                var value = await EvaluateAsync(socket, BuildAcknowledgeExpression(maxSeq), contextId.Value, cancellationToken);
                if (value.ValueKind != JsonValueKind.Object)
                    return TelemetryAckResult.Empty;

                return new TelemetryAckResult(
                    ReadBoolean(value, "supported", false),
                    (int)Math.Clamp(ReadInt64(value, "acknowledged", 0), 0, int.MaxValue),
                    (int)Math.Clamp(ReadInt64(value, "remaining", 0), 0, int.MaxValue),
                    ReadInt64(value, "lastAcknowledgedSeq", 0),
                    ReadInt64(value, "lastCapturedSeq", 0),
                    (int)Math.Clamp(ReadInt64(value, "dropped", 0), 0, int.MaxValue));
            }
            catch (WebSocketException)
            {
                // Try another same-origin Adventure Land target.
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
          const requestedAfterSeq = {{boundedAfter}};
          const limit = {{boundedLimit}};
          const rows = operations.peekTelemetry(2000);
          const internalOutbox = aio && aio.__operations && aio.__operations.telemetry;
          const telemetry = internalOutbox && typeof internalOutbox.status === 'function'
            ? internalOutbox.status()
            : ((operations.status() || {}).telemetry || {});
          const lastCapturedSeq = Math.max(0, Number(telemetry.lastCapturedSeq) || 0);
          const effectiveAfterSeq = lastCapturedSeq > 0 && requestedAfterSeq > lastCapturedSeq
            ? 0
            : requestedAfterSeq;
          const candidates = Array.isArray(rows)
            ? rows.filter((row) => row && Number(row.seq) > effectiveAfterSeq)
            : [];
          const events = candidates.slice(0, limit);
          return {
            schemaVersion: 2,
            type: 'AIO_V3_DEBUG_EVENTS',
            requestedAfterSeq,
            effectiveAfterSeq,
            lastCapturedSeq,
            availableAfterSeq: candidates.length,
            hasMore: candidates.length > events.length,
            cursorReset: effectiveAfterSeq !== requestedAfterSeq,
            telemetry,
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
          const aio = globalThis.AIO_V3;
          const operations = aio && aio.operations;
          if (!operations || typeof operations !== 'object') throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
          const internalOutbox = aio && aio.__operations && aio.__operations.telemetry;
          const status = () => internalOutbox && typeof internalOutbox.status === 'function'
            ? internalOutbox.status()
            : ((operations.status() || {}).telemetry || {});
          if (!internalOutbox || typeof internalOutbox.ackThrough !== 'function') {
            const telemetry = status();
            return {
              schemaVersion: 1,
              type: 'AIO_V3_TELEMETRY_ACK',
              supported: false,
              acknowledged: 0,
              remaining: Number(telemetry.queued) || 0,
              lastAcknowledgedSeq: Number(telemetry.lastAcknowledgedSeq) || 0,
              lastCapturedSeq: Number(telemetry.lastCapturedSeq) || 0,
              dropped: Number(telemetry.dropped) || 0
            };
          }
          const result = internalOutbox.ackThrough({{boundedMax}});
          const telemetry = status();
          return {
            schemaVersion: 1,
            type: 'AIO_V3_TELEMETRY_ACK',
            supported: true,
            acknowledged: Number(result && result.acknowledged) || 0,
            remaining: Number(telemetry.queued) || 0,
            lastAcknowledgedSeq: Number(telemetry.lastAcknowledgedSeq) || 0,
            lastCapturedSeq: Number(telemetry.lastCapturedSeq) || 0,
            dropped: Number(telemetry.dropped) || 0
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
        schemaVersion: 2,
        type: 'AIO_V3_DEBUG_SNAPSHOT',
        status: operations.status(),
        heartbeat: operations.hostHeartbeat(),
        reconciliation: operations.reconciliationStatus(),
        diagnostics: null
      };
    })()
    """;

    private const string DeepSnapshotExpression = """
    (() => {
      const aio = globalThis.AIO_V3;
      const operations = aio && aio.operations;
      if (!operations || typeof operations !== 'object') throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
      if (typeof operations.status !== 'function') throw new Error('DEBUG_STATUS_UNAVAILABLE');
      if (typeof operations.hostHeartbeat !== 'function') throw new Error('DEBUG_HEARTBEAT_UNAVAILABLE');
      if (typeof operations.reconciliationStatus !== 'function') throw new Error('DEBUG_RECONCILIATION_UNAVAILABLE');

      const clone = (value) => {
        if (value === undefined) return null;
        return value == null ? value : JSON.parse(JSON.stringify(value));
      };
      const safe = (fn) => {
        try { return clone(typeof fn === 'function' ? fn() : null); }
        catch (error) {
          const message = String(error && error.message || error || 'DIAGNOSTIC_READ_FAILED');
          return { unavailable: true, error: message.slice(0, 160) };
        }
      };

      const status = operations.status();
      const heartbeat = operations.hostHeartbeat();
      const reconciliation = operations.reconciliationStatus();
      const diagnostics = {
        schemaVersion: 1,
        type: 'AIO_V3_AUTONOMY_DIAGNOSTICS',
        generatedAt: Date.now(),
        version: aio && aio.version || null,
        monitor: safe(() => aio.monitor && aio.monitor.summary && aio.monitor.summary()),
        farmer: {
          status: safe(() => aio.farmer && aio.farmer.status && aio.farmer.status()),
          loot: safe(() => aio.farmer && aio.farmer.lootStatus && aio.farmer.lootStatus()),
          localFarming: safe(() => aio.localFarming && aio.localFarming.status && aio.localFarming.status())
        },
        brain: {
          status: safe(() => aio.brain && aio.brain.status && aio.brain.status()),
          replay: safe(() => aio.brain && aio.brain.replay && aio.brain.replay(16))
        },
        supervisor: safe(() => aio.supervisor && aio.supervisor.status && aio.supervisor.status()),
        contentDrift: {
          status: safe(() => aio.contentDrift && aio.contentDrift.status && aio.contentDrift.status()),
          records: safe(() => aio.contentDrift && aio.contentDrift.records && aio.contentDrift.records(32))
        },
        inventory: {
          status: safe(() => aio.inventory && aio.inventory.status && aio.inventory.status()),
          entries: safe(() => aio.inventory && aio.inventory.entries && aio.inventory.entries(64))
        },
        gearProgression: {
          status: safe(() => aio.gearProgression && aio.gearProgression.status && aio.gearProgression.status()),
          goals: safe(() => aio.gearProgression && aio.gearProgression.goals && aio.gearProgression.goals(64))
        },
        economy: {
          status: safe(() => aio.economy && aio.economy.status && aio.economy.status()),
          transactions: {
            status: safe(() => aio.economy && aio.economy.transactions && aio.economy.transactions.status && aio.economy.transactions.status()),
            recent: safe(() => aio.economy && aio.economy.transactions && aio.economy.transactions.list && aio.economy.transactions.list(32))
          },
          bankCapacity: safe(() => aio.economy && aio.economy.bankCapacity && aio.economy.bankCapacity.status && aio.economy.bankCapacity.status()),
          bankExpansion: {
            status: safe(() => aio.economy && aio.economy.bankExpansion && aio.economy.bankExpansion.status && aio.economy.bankExpansion.status()),
            recent: safe(() => aio.economy && aio.economy.bankExpansion && aio.economy.bankExpansion.list && aio.economy.bankExpansion.list(16))
          },
          spaceRecovery: {
            status: safe(() => aio.economy && aio.economy.spaceRecovery && aio.economy.spaceRecovery.status && aio.economy.spaceRecovery.status()),
            recent: safe(() => aio.economy && aio.economy.spaceRecovery && aio.economy.spaceRecovery.list && aio.economy.spaceRecovery.list(16))
          }
        },
        travel: {
          status: safe(() => aio.travel && aio.travel.status && aio.travel.status()),
          recent: safe(() => aio.travel && aio.travel.list && aio.travel.list(32))
        },
        merchantService: safe(() => aio.merchantService && aio.merchantService.status && aio.merchantService.status()),
        party: {
          status: safe(() => aio.party && aio.party.status && aio.party.status()),
          registry: safe(() => aio.party && aio.party.registry && aio.party.registry()),
          decision: safe(() => aio.party && aio.party.decision && aio.party.decision()),
          fingerprints: safe(() => aio.party && aio.party.fingerprints && aio.party.fingerprints()),
          performance: safe(() => aio.party && aio.party.performance && aio.party.performance()),
          telemetry: safe(() => aio.party && aio.party.telemetry && aio.party.telemetry()),
          transition: safe(() => aio.party && aio.party.transition && aio.party.transition()),
          controlLease: safe(() => aio.party && aio.party.controlLease && aio.party.controlLease()),
          lifecycle: {
            status: safe(() => aio.party && aio.party.lifecycle && aio.party.lifecycle.status && aio.party.lifecycle.status()),
            characters: safe(() => aio.party && aio.party.lifecycle && aio.party.lifecycle.characters && aio.party.lifecycle.characters()),
            controlled: safe(() => aio.party && aio.party.lifecycle && aio.party.lifecycle.controlled && aio.party.lifecycle.controlled.status && aio.party.lifecycle.controlled.status()),
            aura: safe(() => aio.party && aio.party.lifecycle && aio.party.lifecycle.aura && aio.party.lifecycle.aura.status && aio.party.lifecycle.aura.status())
          }
        },
        backgroundExecution: safe(() => aio.backgroundExecution && aio.backgroundExecution.status && aio.backgroundExecution.status()),
        autoRespawn: safe(() => aio.autoRespawn && aio.autoRespawn.status && aio.autoRespawn.status()),
        alerts: safe(() => operations.peekAlerts && operations.peekAlerts(50)),
        stateReplica: safe(() => operations.peekStateReplica && operations.peekStateReplica())
      };

      let approxChars = 0;
      try { approxChars = JSON.stringify(diagnostics).length; } catch (_) {}
      if (approxChars > 350000) {
        diagnostics.sizeLimited = true;
        diagnostics.stateReplica = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        if (diagnostics.inventory) diagnostics.inventory.entries = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        if (diagnostics.gearProgression) diagnostics.gearProgression.goals = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        if (diagnostics.contentDrift) diagnostics.contentDrift.records = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        if (diagnostics.brain) diagnostics.brain.replay = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        if (diagnostics.economy && diagnostics.economy.transactions) diagnostics.economy.transactions.recent = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        if (diagnostics.travel) diagnostics.travel.recent = { omitted: true, reason: 'DIAGNOSTIC_BUNDLE_SIZE_LIMIT' };
        try { approxChars = JSON.stringify(diagnostics).length; } catch (_) {}
      }
      diagnostics.approxChars = approxChars;

      return {
        schemaVersion: 2,
        type: 'AIO_V3_DEBUG_SNAPSHOT',
        status,
        heartbeat,
        reconciliation,
        diagnostics
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
