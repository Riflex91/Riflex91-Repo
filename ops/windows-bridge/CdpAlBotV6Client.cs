using System.Net.WebSockets;
using System.Text.Json;

namespace AioBotWindowsBridge;

/// <summary>
/// Narrow CDP reader for AL Bot generation 6. It accepts only the explicit
/// ALBot.bridge transport contract and never falls back to AIO_V3/V4/V5.
/// </summary>
public sealed class CdpAlBotV6Client
{
    public const int Generation = 6;
    public const string Product = "AL Bot";
    public const string Protocol = "albot-v6-bridge-v1";
    public const string SnapshotType = "ALBOT_V6_DEBUG_SNAPSHOT";
    public const string EventsType = "ALBOT_V6_DEBUG_EVENTS";
    public const string AckType = "ALBOT_V6_TELEMETRY_ACK";
    public const int CdpCommandTimeoutSeconds = 12;

    private readonly HttpClient _httpClient;
    private readonly Uri _cdpEndpoint;
    private readonly Uri _allowedOrigin;
    private int _nextCommandId;

    public CdpAlBotV6Client(HttpClient httpClient, BridgeConfig config)
    {
        _httpClient = httpClient;
        _cdpEndpoint = new Uri(config.CdpEndpoint.TrimEnd('/') + "/");
        _allowedOrigin = new Uri(config.AllowedOrigin);
    }

    public async Task<string> FindBotTargetUrlAsync(CancellationToken cancellationToken)
    {
        foreach (var target in await FindTargetsAsync(cancellationToken))
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                if (await FindV6ContextAsync(socket, cancellationToken) is not null)
                    return target.Url;
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }
        throw new InvalidOperationException("ALBOT_V6_BRIDGE_UNAVAILABLE");
    }

    public Task<DebugReadResult> ReadAsync(long afterSeq, int eventLimit, CancellationToken cancellationToken) =>
        ReadAsync(afterSeq, eventLimit, includeDeepDiagnostics: false, cancellationToken);

    public async Task<DebugReadResult> ReadAsync(
        long afterSeq,
        int eventLimit,
        bool includeDeepDiagnostics,
        CancellationToken cancellationToken)
    {
        var reads = await ReadAllAsync(
            _ => Math.Max(0, afterSeq),
            eventLimit,
            includeDeepDiagnostics,
            cancellationToken);
        return reads[0];
    }

    public async Task<IReadOnlyList<DebugReadResult>> ReadAllAsync(
        Func<string, long> afterSeqForCharacter,
        int eventLimit,
        bool includeDeepDiagnostics,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(afterSeqForCharacter);

        var reads = new List<DebugReadResult>();
        var seenCharacters = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var target in await FindTargetsAsync(cancellationToken))
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                foreach (var contextId in await CollectTargetExecutionContextsAsync(socket, cancellationToken))
                {
                    try
                    {
                        var probe = await EvaluateAsync(socket, ProbeExpression, contextId, cancellationToken);
                        if (probe.ValueKind != JsonValueKind.Object
                            || !ReadBoolean(probe, "valid", false)
                            || !probe.TryGetProperty("identity", out var identity)
                            || !IsV6Identity(identity))
                            continue;

                        var snapshot = await EvaluateAsync(
                            socket,
                            BuildSnapshotExpression(includeDeepDiagnostics),
                            contextId,
                            cancellationToken);
                        if (!IsV6Snapshot(snapshot))
                            continue;

                        var characterName = ReadCharacterName(snapshot);
                        if (string.IsNullOrWhiteSpace(characterName)
                            || !seenCharacters.Add(characterName))
                            continue;

                        var afterSeq = Math.Max(0, afterSeqForCharacter(characterName));
                        var eventBatch = await EvaluateAsync(
                            socket,
                            BuildEventsExpression(afterSeq, eventLimit),
                            contextId,
                            cancellationToken);
                        if (!IsV6EventBatch(eventBatch))
                            throw new InvalidOperationException("ALBOT_V6_EVENTS_INVALID");

                        JsonElement events;
                        if (eventBatch.TryGetProperty("events", out var eventsNode)
                            && eventsNode.ValueKind == JsonValueKind.Array)
                            events = eventsNode.Clone();
                        else
                        {
                            using var empty = JsonDocument.Parse("[]");
                            events = empty.RootElement.Clone();
                        }

                        var requestedAfterSeq = ReadInt64(eventBatch, "requestedAfterSeq", afterSeq);
                        var effectiveAfterSeq = ReadInt64(eventBatch, "effectiveAfterSeq", requestedAfterSeq);
                        var lastCapturedSeq = ReadInt64(eventBatch, "lastCapturedSeq", 0);
                        var maxSeq = effectiveAfterSeq;
                        foreach (var row in events.EnumerateArray())
                        {
                            if (row.ValueKind == JsonValueKind.Object
                                && row.TryGetProperty("seq", out var seqNode)
                                && seqNode.TryGetInt64(out var seq))
                                maxSeq = Math.Max(maxSeq, seq);
                        }

                        reads.Add(new DebugReadResult(
                            snapshot.Clone(),
                            events,
                            requestedAfterSeq,
                            effectiveAfterSeq,
                            maxSeq,
                            lastCapturedSeq,
                            ReadBoolean(eventBatch, "hasMore", false),
                            target.Url));
                    }
                    catch (InvalidOperationException)
                    {
                        // A single stale/non-bot execution context must not hide the
                        // remaining live V6 characters in the same browser page.
                    }
                }
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        if (reads.Count == 0)
            throw new InvalidOperationException("ALBOT_V6_BRIDGE_UNAVAILABLE");

        return reads
            .OrderBy(read => ReadCharacterName(read.Snapshot), StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public Task<TelemetryAckResult> AcknowledgeThroughAsync(long maxSeq, CancellationToken cancellationToken) =>
        AcknowledgeThroughAsync(characterName: null, maxSeq, cancellationToken);

    public async Task<TelemetryAckResult> AcknowledgeThroughAsync(
        string? characterName,
        long maxSeq,
        CancellationToken cancellationToken)
    {
        if (maxSeq <= 0) return TelemetryAckResult.Empty;

        foreach (var target in await FindTargetsAsync(cancellationToken))
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                foreach (var contextId in await CollectTargetExecutionContextsAsync(socket, cancellationToken))
                {
                    try
                    {
                        var probe = await EvaluateAsync(socket, ProbeExpression, contextId, cancellationToken);
                        if (probe.ValueKind != JsonValueKind.Object
                            || !ReadBoolean(probe, "valid", false)
                            || !probe.TryGetProperty("identity", out var identity)
                            || !IsV6Identity(identity))
                            continue;

                        if (!string.IsNullOrWhiteSpace(characterName))
                        {
                            var snapshot = await EvaluateAsync(
                                socket,
                                BuildSnapshotExpression(deep: false),
                                contextId,
                                cancellationToken);
                            var currentCharacter = ReadCharacterName(snapshot);
                            if (!string.Equals(currentCharacter, characterName, StringComparison.OrdinalIgnoreCase))
                                continue;
                        }

                        var value = await EvaluateAsync(
                            socket,
                            BuildAcknowledgeExpression(maxSeq),
                            contextId,
                            cancellationToken);
                        if (value.ValueKind != JsonValueKind.Object
                            || !string.Equals(ReadString(value, "type"), AckType, StringComparison.Ordinal))
                            throw new InvalidOperationException("ALBOT_V6_ACK_INVALID");

                        return new TelemetryAckResult(
                            ReadBoolean(value, "supported", false),
                            (int)Math.Clamp(ReadInt64(value, "acknowledged", 0), 0, int.MaxValue),
                            (int)Math.Clamp(ReadInt64(value, "remaining", 0), 0, int.MaxValue),
                            ReadInt64(value, "lastAcknowledgedSeq", 0),
                            ReadInt64(value, "lastCapturedSeq", 0),
                            (int)Math.Clamp(ReadInt64(value, "dropped", 0), 0, int.MaxValue));
                    }
                    catch (InvalidOperationException)
                    {
                    }
                }
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        throw new InvalidOperationException(
            string.IsNullOrWhiteSpace(characterName)
                ? "ALBOT_V6_BRIDGE_UNAVAILABLE"
                : "ALBOT_V6_CHARACTER_CONTEXT_UNAVAILABLE:" + Bounded(characterName));
    }

    public static bool IsV6Identity(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object) return false;
        return string.Equals(ReadString(value, "product"), Product, StringComparison.Ordinal)
            && ReadInt64(value, "generation", 0) == Generation
            && string.Equals(ReadString(value, "bridgeProtocol"), Protocol, StringComparison.Ordinal)
            && ReadBoolean(value, "transportOnly", false)
            && !ReadBoolean(value, "gameplayActionAuthority", true)
            && !ReadBoolean(value, "acceptsLegacyGenerations", true);
    }

    public static string BuildProbeExpression() => ProbeExpression;

    public static string? ReadCharacterName(JsonElement snapshot)
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

    private static bool IsV6Snapshot(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object
            || !string.Equals(ReadString(value, "type"), SnapshotType, StringComparison.Ordinal)
            || !value.TryGetProperty("identity", out var identity))
            return false;
        return IsV6Identity(identity);
    }

    private static bool IsV6EventBatch(JsonElement value) =>
        value.ValueKind == JsonValueKind.Object
        && string.Equals(ReadString(value, "type"), EventsType, StringComparison.Ordinal);

    private async Task<int?> FindV6ContextAsync(ClientWebSocket socket, CancellationToken cancellationToken)
    {
        foreach (var contextId in await CollectTargetExecutionContextsAsync(socket, cancellationToken))
        {
            try
            {
                var probe = await EvaluateAsync(socket, ProbeExpression, contextId, cancellationToken);
                if (probe.ValueKind == JsonValueKind.Object
                    && ReadBoolean(probe, "valid", false)
                    && probe.TryGetProperty("identity", out var identity)
                    && IsV6Identity(identity))
                    return contextId;
            }
            catch (InvalidOperationException)
            {
            }
        }
        return null;
    }

    private async Task<List<Target>> FindTargetsAsync(CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(new Uri(_cdpEndpoint, "json/list"), cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var targets = await JsonSerializer.DeserializeAsync<List<Target>>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }, cancellationToken) ?? [];

        var matches = new List<Target>();
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

    private async Task<IReadOnlyList<int>> CollectTargetExecutionContextsAsync(
        ClientWebSocket socket,
        CancellationToken cancellationToken)
    {
        using var commandCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        commandCts.CancelAfter(TimeSpan.FromSeconds(CdpCommandTimeoutSeconds));
        var token = commandCts.Token;
        try
        {
            var id = Interlocked.Increment(ref _nextCommandId);
            var command = JsonSerializer.SerializeToUtf8Bytes(new { id, method = "Runtime.enable" });
            await socket.SendAsync(command, WebSocketMessageType.Text, true, token);

            var contexts = new List<int>();
            while (true)
            {
                using var message = await ReceiveJsonAsync(socket, token);
                var root = message.RootElement;
                if (root.ValueKind == JsonValueKind.Object
                    && root.TryGetProperty("method", out var methodNode)
                    && string.Equals(methodNode.GetString(), "Runtime.executionContextCreated", StringComparison.Ordinal)
                    && root.TryGetProperty("params", out var paramsNode)
                    && paramsNode.TryGetProperty("context", out var contextNode)
                    && TryGetExecutionContextId(contextNode, out var contextId))
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
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("CDP_COMMAND_TIMEOUT");
        }
    }

    private bool TryGetExecutionContextId(JsonElement context, out int contextId)
    {
        contextId = 0;
        if (context.ValueKind != JsonValueKind.Object
            || !context.TryGetProperty("id", out var idNode)
            || !idNode.TryGetInt32(out contextId)
            || contextId <= 0)
            return false;

        // FindTargetsAsync already restricts the CDP page target itself to the
        // configured Adventure Land origin. Adventure Land may execute CODE in
        // same-page sandbox/about:blank contexts whose CDP "origin" is empty or
        // omitted, so those opaque contexts must remain eligible for the bounded
        // V6 identity probe.
        if (!context.TryGetProperty("origin", out var originNode)
            || originNode.ValueKind != JsonValueKind.String)
            return true;

        var origin = originNode.GetString();
        if (string.IsNullOrWhiteSpace(origin))
            return true;

        // Explicit foreign origins remain fail-closed. This prevents a cross-origin
        // child frame from self-reporting a forged ALBot V6 identity and having its
        // data forwarded with host credentials.
        return Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            && SameOrigin(uri, _allowedOrigin);
    }

    private async Task<JsonElement> EvaluateAsync(
        ClientWebSocket socket,
        string expression,
        int contextId,
        CancellationToken cancellationToken)
    {
        using var commandCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        commandCts.CancelAfter(TimeSpan.FromSeconds(CdpCommandTimeoutSeconds));
        var token = commandCts.Token;
        try
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
            await socket.SendAsync(command, WebSocketMessageType.Text, true, token);
            while (true)
            {
                using var message = await ReceiveJsonAsync(socket, token);
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
                var remote = result.GetProperty("result");
                if (!remote.TryGetProperty("value", out var value))
                    throw new InvalidOperationException("CDP_RESULT_VALUE_MISSING");
                return value.Clone();
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("CDP_COMMAND_TIMEOUT");
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

    private static string BuildSnapshotExpression(bool deep) => $$"""
    (() => {
      const roots = [globalThis];
      try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}
      const api = roots.map(root => root && root.ALBot).find(candidate => candidate && candidate.bridge) || null;
      if (!api || !api.bridge || typeof api.bridge.snapshot !== 'function')
        throw new Error('ALBOT_V6_BRIDGE_UNAVAILABLE');
      return api.bridge.snapshot({ deep: {{(deep ? "true" : "false")}} });
    })()
    """;

    private static string BuildEventsExpression(long afterSeq, int limit)
    {
        var after = Math.Max(0, afterSeq);
        var boundedLimit = Math.Clamp(limit, 1, 200);
        return $$"""
        (() => {
          const roots = [globalThis];
          try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}
          const api = roots.map(root => root && root.ALBot).find(candidate => candidate && candidate.bridge) || null;
          if (!api || !api.bridge || typeof api.bridge.events !== 'function')
            throw new Error('ALBOT_V6_BRIDGE_UNAVAILABLE');
          return api.bridge.events({{after}}, {{boundedLimit}});
        })()
        """;
    }

    private static string BuildAcknowledgeExpression(long maxSeq)
    {
        var bounded = Math.Max(0, maxSeq);
        return $$"""
        (() => {
          const roots = [globalThis];
          try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}
          const api = roots.map(root => root && root.ALBot).find(candidate => candidate && candidate.bridge) || null;
          if (!api || !api.bridge || typeof api.bridge.acknowledgeTelemetry !== 'function')
            throw new Error('ALBOT_V6_BRIDGE_UNAVAILABLE');
          return api.bridge.acknowledgeTelemetry({{bounded}});
        })()
        """;
    }

    private const string ProbeExpression = """
    (() => {
      const roots = [globalThis];
      try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}
      for (const root of roots) {
        try {
          const api = root && root.ALBot;
          const bridge = api && api.bridge;
          const identity = bridge && typeof bridge.identity === 'function' ? bridge.identity() : null;
          const valid = !!identity
            && identity.product === 'AL Bot'
            && Number(identity.generation) === 6
            && identity.bridgeProtocol === 'albot-v6-bridge-v1'
            && identity.transportOnly === true
            && identity.gameplayActionAuthority === false
            && identity.acceptsLegacyGenerations === false;
          if (valid) return { valid: true, identity };
        } catch {}
      }
      return { valid: false, identity: null };
    })()
    """;

    private static long ReadInt64(JsonElement value, string property, long fallback)
    {
        if (value.ValueKind == JsonValueKind.Object
            && value.TryGetProperty(property, out var node)
            && node.ValueKind == JsonValueKind.Number
            && node.TryGetInt64(out var parsed))
            return parsed;
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

    private static bool SameOrigin(Uri left, Uri right) =>
        string.Equals(left.Scheme, right.Scheme, StringComparison.OrdinalIgnoreCase)
        && string.Equals(left.Host, right.Host, StringComparison.OrdinalIgnoreCase)
        && left.Port == right.Port;

    private static string Bounded(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "ALBOT_V6_CDP_FAILED" : value;
        return text.Length <= 320 ? text : text[..320];
    }

    private sealed record Target
    {
        public string Type { get; init; } = string.Empty;
        public string Url { get; init; } = string.Empty;
        public string WebSocketDebuggerUrl { get; init; } = string.Empty;
    }
}
