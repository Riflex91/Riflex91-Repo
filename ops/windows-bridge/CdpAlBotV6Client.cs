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
    public const string DashboardVisualType = "ALBOT_V6_DASHBOARD_VISUAL";
    public const int CdpCommandTimeoutSeconds = 12;
    public const int ExecutionContextDrainMilliseconds = 250;
    public const int DashboardTerrainMaxChars = 400_000;

    private readonly HttpClient _httpClient;
    private readonly Uri _cdpEndpoint;
    private readonly Uri _allowedOrigin;
    private int _nextCommandId;
    private string? _lastDiscoveryWarning;

    public string? LastDiscoveryWarning => _lastDiscoveryWarning;

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
            try
            {
                var contextIds = await CollectTargetExecutionContextsAsync(
                    target.WebSocketDebuggerUrl,
                    cancellationToken);
                using var socket = new ClientWebSocket();
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                if (await FindV6ContextAsync(socket, contextIds, cancellationToken) is not null)
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
        var rosterCharacters = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var terrainMaps = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var probeDiagnostics = new List<string>();
        _lastDiscoveryWarning = null;

        async Task<bool> TryReadCharacterAsync(
            ClientWebSocket socket,
            int contextId,
            string? requestedCharacter,
            string targetUrl,
            string? sessionId = null)
        {
            var snapshot = await EvaluateAsync(
                socket,
                BuildSnapshotExpression(includeDeepDiagnostics, requestedCharacter),
                contextId,
                sessionId,
                cancellationToken);
            if (!IsV6Snapshot(snapshot))
                throw new InvalidOperationException("ALBOT_V6_SNAPSHOT_INVALID");

            var characterName = ReadCharacterName(snapshot);
            if (string.IsNullOrWhiteSpace(characterName))
                throw new InvalidOperationException("ALBOT_V6_CHARACTER_NAME_MISSING");

            if (!string.IsNullOrWhiteSpace(requestedCharacter)
                && !string.Equals(
                    characterName,
                    requestedCharacter,
                    StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    "ALBOT_V6_REQUESTED_CHARACTER_MISMATCH:"
                    + Bounded(requestedCharacter)
                    + "!="
                    + Bounded(characterName));

            rosterCharacters.Add(characterName);
            if (seenCharacters.Contains(characterName))
                return true;

            JsonElement? dashboardVisual = null;
            try
            {
                var mapId = ReadCharacterMap(snapshot);
                var includeTerrain = !string.IsNullOrWhiteSpace(mapId)
                    && !terrainMaps.Contains(mapId);
                var visual = await EvaluateAsync(
                    socket,
                    BuildDashboardVisualExpression(characterName, includeTerrain),
                    contextId,
                    sessionId,
                    cancellationToken);
                if (IsDashboardVisual(visual))
                {
                    dashboardVisual = visual.Clone();
                    if (includeTerrain
                        && !string.IsNullOrWhiteSpace(mapId)
                        && HasUsableDashboardTerrain(visual))
                        terrainMaps.Add(mapId);
                }
            }
            catch (InvalidOperationException error)
            {
                AddProbeDiagnostic(
                    probeDiagnostics,
                    targetUrl,
                    contextId,
                    Bounded(characterName) + ":DASHBOARD_VISUAL:" + error.Message);
            }

            var afterSeq = Math.Max(0, afterSeqForCharacter(characterName));
            var eventBatch = await EvaluateEventsAdaptiveAsync(
                socket,
                characterName,
                afterSeq,
                eventLimit,
                contextId,
                sessionId,
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
                targetUrl,
                dashboardVisual));
            seenCharacters.Add(characterName);
            return true;
        }

        foreach (var target in await FindTargetsAsync(cancellationToken))
        {
            var targetCharacter = CharacterNameFromTargetUrl(target.Url);
            if (!string.IsNullOrWhiteSpace(targetCharacter))
                rosterCharacters.Add(targetCharacter);

            var targetResolved = false;
            try
            {
                var contextIds = await CollectTargetExecutionContextsAsync(
                    target.WebSocketDebuggerUrl,
                    cancellationToken);
                using var socket = new ClientWebSocket();
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);

                // Discover every active Adventure Land character reachable from this
                // target before reading snapshots. AL Final exposes secondary runners
                // through iframe[data-name] / get_active_characters(), so the target URL
                // is only a hint and must never be treated as the full character roster.
                var catalogCharacters = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var contextId in contextIds)
                {
                    try
                    {
                        var catalog = await EvaluateAsync(
                            socket,
                            CharacterCatalogExpression,
                            contextId,
                            cancellationToken);
                        if (catalog.ValueKind != JsonValueKind.Array)
                            continue;

                        foreach (var row in catalog.EnumerateArray())
                        {
                            if (row.ValueKind != JsonValueKind.Object)
                                continue;
                            var name = ReadString(row, "character")?.Trim();
                            if (string.IsNullOrWhiteSpace(name))
                                continue;
                            catalogCharacters.Add(name);
                            rosterCharacters.Add(name);
                        }
                    }
                    catch (InvalidOperationException error)
                    {
                        AddProbeDiagnostic(
                            probeDiagnostics,
                            target.Url,
                            contextId,
                            "CHARACTER_CATALOG:" + error.Message);
                    }
                }

                // Same-process frames are covered by Runtime.enable above. Chromium
                // may isolate secondary Adventure Land characters as OOPIF targets,
                // which require a flattened child CDP session.
                var attachedContexts = await DiscoverAttachedIframeContextsAsync(
                    socket,
                    target,
                    cancellationToken);

                foreach (var attached in attachedContexts)
                {
                    try
                    {
                        var catalog = await EvaluateAsync(
                            socket,
                            CharacterCatalogExpression,
                            attached.ContextId,
                            attached.SessionId,
                            cancellationToken);
                        if (catalog.ValueKind != JsonValueKind.Array)
                            continue;

                        foreach (var row in catalog.EnumerateArray())
                        {
                            if (row.ValueKind != JsonValueKind.Object)
                                continue;
                            var name = ReadString(row, "character")?.Trim();
                            if (string.IsNullOrWhiteSpace(name))
                                continue;
                            catalogCharacters.Add(name);
                            rosterCharacters.Add(name);
                        }
                    }
                    catch (InvalidOperationException error)
                    {
                        AddProbeDiagnostic(
                            probeDiagnostics,
                            target.Url,
                            attached.ContextId,
                            "OOPIF_CHARACTER_CATALOG:" + error.Message);
                    }
                }

                var candidates = MergeCharacterCandidates(targetCharacter, catalogCharacters);
                if (candidates.Count > 0)
                {
                    foreach (var candidateCharacter in candidates)
                    {
                        if (seenCharacters.Contains(candidateCharacter))
                        {
                            targetResolved = true;
                            continue;
                        }

                        var characterResolved = false;
                        foreach (var contextId in contextIds)
                        {
                            try
                            {
                                if (!await TryReadCharacterAsync(
                                        socket,
                                        contextId,
                                        candidateCharacter,
                                        target.Url))
                                    continue;
                                characterResolved = true;
                                targetResolved = true;
                                break;
                            }
                            catch (InvalidOperationException error)
                            {
                                AddProbeDiagnostic(
                                    probeDiagnostics,
                                    target.Url,
                                    contextId,
                                    Bounded(candidateCharacter) + ":" + error.Message);
                            }
                        }

                        if (!characterResolved)
                        {
                            foreach (var attached in attachedContexts)
                            {
                                try
                                {
                                    if (!await TryReadCharacterAsync(
                                            socket,
                                            attached.ContextId,
                                            candidateCharacter,
                                            target.Url,
                                            attached.SessionId))
                                        continue;
                                    characterResolved = true;
                                    targetResolved = true;
                                    break;
                                }
                                catch (InvalidOperationException error)
                                {
                                    AddProbeDiagnostic(
                                        probeDiagnostics,
                                        target.Url,
                                        attached.ContextId,
                                        "OOPIF:"
                                        + Bounded(candidateCharacter)
                                        + ":"
                                        + error.Message);
                                }
                            }
                        }

                        if (!characterResolved)
                            AddProbeDiagnostic(
                                probeDiagnostics,
                                target.Url,
                                null,
                                "CHARACTER_BRIDGE_MISSING:" + Bounded(candidateCharacter));
                    }
                }
                else
                {
                    // Compatibility fallback for layouts where Adventure Land's roster
                    // API is unavailable but one V6 bridge is still directly reachable.
                    foreach (var contextId in contextIds)
                    {
                        try
                        {
                            if (!await TryReadCharacterAsync(
                                    socket,
                                    contextId,
                                    requestedCharacter: null,
                                    target.Url))
                                continue;
                            targetResolved = true;
                            break;
                        }
                        catch (InvalidOperationException error)
                        {
                            AddProbeDiagnostic(probeDiagnostics, target.Url, contextId, error.Message);
                        }
                    }

                    if (!targetResolved)
                    {
                        foreach (var attached in attachedContexts)
                        {
                            try
                            {
                                if (!await TryReadCharacterAsync(
                                        socket,
                                        attached.ContextId,
                                        requestedCharacter: null,
                                        target.Url,
                                        attached.SessionId))
                                    continue;
                                targetResolved = true;
                                break;
                            }
                            catch (InvalidOperationException error)
                            {
                                AddProbeDiagnostic(
                                    probeDiagnostics,
                                    target.Url,
                                    attached.ContextId,
                                    "OOPIF:" + error.Message);
                            }
                        }
                    }
                }
            }
            catch (WebSocketException error)
            {
                AddProbeDiagnostic(probeDiagnostics, target.Url, null, "WS:" + error.Message);
            }
            catch (InvalidOperationException error)
            {
                AddProbeDiagnostic(probeDiagnostics, target.Url, null, error.Message);
            }

            if (!targetResolved && !string.IsNullOrWhiteSpace(targetCharacter))
                AddProbeDiagnostic(
                    probeDiagnostics,
                    target.Url,
                    null,
                    "TARGET_CHARACTER_BRIDGE_MISSING:" + Bounded(targetCharacter));
        }

        var missingCharacters = rosterCharacters
            .Where(name => !seenCharacters.Contains(name))
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (missingCharacters.Length > 0)
        {
            _lastDiscoveryWarning =
                "ALBOT_V6_CHARACTER_DISCOVERY_INCOMPLETE:"
                + seenCharacters.Count
                + "/"
                + rosterCharacters.Count
                + ":missing="
                + string.Join(",", missingCharacters.Select(Bounded));
        }

        if (reads.Count == 0)
        {
            var detail = probeDiagnostics.Count == 0
                ? "NO_TARGET_BOUND_V6_CONTEXTS"
                : string.Join("|", probeDiagnostics
                    .GroupBy(row => row.Split(':', 2)[0], StringComparer.OrdinalIgnoreCase)
                    .Select(group => group.FirstOrDefault(row =>
                        !row.Contains("/a0/", StringComparison.Ordinal)
                        && !row.EndsWith(":NO_DIAG", StringComparison.Ordinal))
                        ?? group.First())
                    .Take(6));
            throw new InvalidOperationException("ALBOT_V6_BRIDGE_UNAVAILABLE:" + Bounded(detail));
        }

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
            try
            {
                var contextIds = await CollectTargetExecutionContextsAsync(
                    target.WebSocketDebuggerUrl,
                    cancellationToken);
                using var socket = new ClientWebSocket();
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                foreach (var contextId in contextIds)
                {
                    try
                    {
                        var probe = await EvaluateAsync(
                            socket,
                            ProbeExpression,
                            contextId,
                            cancellationToken);
                        if (probe.ValueKind != JsonValueKind.Object
                            || !ReadBoolean(probe, "valid", false)
                            || !probe.TryGetProperty("identity", out var identity)
                            || !IsV6Identity(identity))
                            continue;

                        if (!string.IsNullOrWhiteSpace(characterName))
                        {
                            var snapshot = await EvaluateAsync(
                                socket,
                                BuildSnapshotExpression(deep: false, characterName: characterName),
                                contextId,
                                cancellationToken);
                            var currentCharacter = ReadCharacterName(snapshot);
                            if (!string.Equals(
                                    currentCharacter,
                                    characterName,
                                    StringComparison.OrdinalIgnoreCase))
                                continue;
                        }

                        var value = await EvaluateAsync(
                            socket,
                            BuildAcknowledgeExpression(maxSeq, characterName),
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

    public static bool IsSupportedTargetType(string? targetType) =>
        string.Equals(targetType, "page", StringComparison.OrdinalIgnoreCase)
        || string.Equals(targetType, "iframe", StringComparison.OrdinalIgnoreCase);

    public static bool IsTrustedAttachedIframeDescriptor(
        string? targetType,
        string? targetUrl,
        string? parentId,
        string? parentFrameId,
        string allowedOrigin,
        IEnumerable<string> trustedParentIds)
    {
        if (!string.Equals(targetType, "iframe", StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(parentId)
            || string.IsNullOrWhiteSpace(allowedOrigin))
            return false;

        var trusted = new HashSet<string>(
            trustedParentIds ?? Array.Empty<string>(),
            StringComparer.Ordinal);
        if (!trusted.Contains(parentId.Trim()))
            return false;

        if (!Uri.TryCreate(allowedOrigin, UriKind.Absolute, out var allowed))
            return false;

        var raw = (targetUrl ?? string.Empty).Trim();
        if (Uri.TryCreate(raw, UriKind.Absolute, out var targetUri)
            && SameOrigin(targetUri, allowed))
            return true;

        if (raw.StartsWith("blob:", StringComparison.OrdinalIgnoreCase)
            && Uri.TryCreate(raw[5..], UriKind.Absolute, out var blobOrigin)
            && SameOrigin(blobOrigin, allowed))
            return true;

        if ((string.Equals(raw, "about:blank", StringComparison.OrdinalIgnoreCase)
             || string.Equals(raw, "about:srcdoc", StringComparison.OrdinalIgnoreCase)
             || raw.Length == 0)
            && !string.IsNullOrWhiteSpace(parentFrameId))
            return true;

        return false;
    }

    public static IReadOnlyList<string> MergeCharacterCandidates(
        string? targetCharacter,
        IEnumerable<string?> catalogCharacters)
    {
        var rows = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(targetCharacter))
            rows.Add(targetCharacter.Trim());
        foreach (var candidate in catalogCharacters ?? Array.Empty<string?>())
        {
            if (!string.IsNullOrWhiteSpace(candidate))
                rows.Add(candidate.Trim());
        }
        return rows.OrderBy(value => value, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    public static string BuildCharacterCatalogExpression() => CharacterCatalogExpression;

    private static bool HasUsableDashboardTerrain(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object
            || !value.TryGetProperty("terrain", out var terrain)
            || terrain.ValueKind != JsonValueKind.Object
            || ReadBoolean(terrain, "omitted", false)
            || !terrain.TryGetProperty("t", out var tiles)
            || tiles.ValueKind != JsonValueKind.Array)
            return false;
        return tiles.GetArrayLength() > 0;
    }

    private static bool IsDashboardVisual(JsonElement value) =>
        value.ValueKind == JsonValueKind.Object
        && string.Equals(ReadString(value, "type"), DashboardVisualType, StringComparison.Ordinal)
        && ReadBoolean(value, "available", false);

    private static string? ReadCharacterMap(JsonElement snapshot)
    {
        if (snapshot.ValueKind != JsonValueKind.Object
            || !snapshot.TryGetProperty("character", out var character)
            || character.ValueKind != JsonValueKind.Object)
            return null;
        return ReadString(character, "map")?.Trim();
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

    public static string BuildLocalProbeExpression() => LocalProbeExpression;

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

    private async Task<int?> FindV6ContextAsync(
        ClientWebSocket socket,
        IReadOnlyList<int> contextIds,
        CancellationToken cancellationToken)
    {
        foreach (var contextId in contextIds)
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
        var payload = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        List<Target> targets;
        try
        {
            targets = JsonSerializer.Deserialize<List<Target>>(payload, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? [];
        }
        catch (JsonException error)
        {
            throw new InvalidOperationException(
                "CDP_TARGET_LIST_INVALID_JSON:" + PayloadPreview(payload),
                error);
        }

        var matches = new List<Target>();
        foreach (var target in targets)
        {
            if (!IsSupportedTargetType(target.Type)) continue;
            if (string.IsNullOrWhiteSpace(target.Url) || string.IsNullOrWhiteSpace(target.WebSocketDebuggerUrl)) continue;
            if (!Uri.TryCreate(target.Url, UriKind.Absolute, out var pageUri)) continue;
            if (!SameOrigin(pageUri, _allowedOrigin)) continue;
            matches.Add(target);
        }
        if (matches.Count == 0)
            throw new InvalidOperationException("ADVENTURE_LAND_CDP_TARGET_NOT_FOUND");
        return matches;
    }

    private async Task<JsonElement> SendCommandForResultAsync(
        ClientWebSocket socket,
        string method,
        object? parameters,
        string? sessionId,
        CancellationToken cancellationToken)
    {
        using var commandCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        commandCts.CancelAfter(TimeSpan.FromSeconds(CdpCommandTimeoutSeconds));
        var token = commandCts.Token;
        var id = Interlocked.Increment(ref _nextCommandId);
        var payload = new Dictionary<string, object?>
        {
            ["id"] = id,
            ["method"] = method,
            ["params"] = parameters ?? new { }
        };
        if (!string.IsNullOrWhiteSpace(sessionId))
            payload["sessionId"] = sessionId;

        await socket.SendAsync(
            JsonSerializer.SerializeToUtf8Bytes(payload),
            WebSocketMessageType.Text,
            true,
            token);

        try
        {
            while (true)
            {
                var message = await ReceiveJsonAsync(socket, id, token);
                if (message is null) continue;
                using (message)
                {
                    var root = message.RootElement;
                    if (!root.TryGetProperty("id", out var idNode)
                        || !idNode.TryGetInt32(out var responseId)
                        || responseId != id
                        || !SessionMatches(root, sessionId))
                        continue;
                    if (root.TryGetProperty("error", out var error))
                        throw new InvalidOperationException(
                            "CDP_COMMAND_FAILED:" + Bounded(error.ToString()));
                    if (!root.TryGetProperty("result", out var result))
                        throw new InvalidOperationException("CDP_RESULT_MISSING");
                    return result.Clone();
                }
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("CDP_COMMAND_TIMEOUT");
        }
    }

    private async Task<IReadOnlyList<AttachedExecutionContext>> DiscoverAttachedIframeContextsAsync(
        ClientWebSocket socket,
        Target rootTarget,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rootTarget.Id))
            return Array.Empty<AttachedExecutionContext>();

        var result = await SendCommandForResultAsync(
            socket,
            "Target.getTargets",
            new { },
            sessionId: null,
            cancellationToken);
        if (!result.TryGetProperty("targetInfos", out var infosNode)
            || infosNode.ValueKind != JsonValueKind.Array)
            return Array.Empty<AttachedExecutionContext>();

        var infos = new List<AttachedTargetInfo>();
        foreach (var row in infosNode.EnumerateArray())
        {
            if (row.ValueKind != JsonValueKind.Object)
                continue;
            var targetId = ReadString(row, "targetId")?.Trim();
            if (string.IsNullOrWhiteSpace(targetId))
                continue;
            infos.Add(new AttachedTargetInfo(
                targetId,
                ReadString(row, "type") ?? string.Empty,
                ReadString(row, "url") ?? string.Empty,
                ReadString(row, "parentId"),
                ReadString(row, "parentFrameId")));
        }

        var trustedIds = new HashSet<string>(StringComparer.Ordinal) { rootTarget.Id };
        var trustedChildren = new List<AttachedTargetInfo>();
        var changed = true;
        while (changed)
        {
            changed = false;
            foreach (var info in infos)
            {
                if (trustedIds.Contains(info.TargetId))
                    continue;
                if (!IsTrustedAttachedIframeDescriptor(
                        info.Type,
                        info.Url,
                        info.ParentId,
                        info.ParentFrameId,
                        _allowedOrigin.GetLeftPart(UriPartial.Authority),
                        trustedIds))
                    continue;
                trustedIds.Add(info.TargetId);
                trustedChildren.Add(info);
                changed = true;
            }
        }

        var contexts = new List<AttachedExecutionContext>();
        foreach (var child in trustedChildren)
        {
            try
            {
                var attach = await SendCommandForResultAsync(
                    socket,
                    "Target.attachToTarget",
                    new { targetId = child.TargetId, flatten = true },
                    sessionId: null,
                    cancellationToken);
                var sessionId = ReadString(attach, "sessionId")?.Trim();
                if (string.IsNullOrWhiteSpace(sessionId))
                    continue;

                foreach (var contextId in await EnableRuntimeAndCollectContextsAsync(
                             socket,
                             sessionId,
                             cancellationToken))
                    contexts.Add(new AttachedExecutionContext(contextId, sessionId, child.TargetId));
            }
            catch (InvalidOperationException)
            {
            }
        }

        return contexts
            .DistinctBy(row => (row.SessionId, row.ContextId))
            .ToArray();
    }

    private async Task<IReadOnlyList<int>> EnableRuntimeAndCollectContextsAsync(
        ClientWebSocket socket,
        string sessionId,
        CancellationToken cancellationToken)
    {
        using var commandCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        commandCts.CancelAfter(TimeSpan.FromSeconds(CdpCommandTimeoutSeconds));
        var token = commandCts.Token;
        var contexts = new List<int>();

        async Task WaitForResponseAsync(int expectedId)
        {
            while (true)
            {
                var message = await ReceiveJsonAsync(socket, expectedId, token);
                if (message is null) continue;
                using (message)
                {
                    var root = message.RootElement;
                    if (SessionMatches(root, sessionId)
                        && root.TryGetProperty("method", out var methodNode)
                        && string.Equals(
                            methodNode.GetString(),
                            "Runtime.executionContextCreated",
                            StringComparison.Ordinal)
                        && root.TryGetProperty("params", out var paramsNode)
                        && paramsNode.TryGetProperty("context", out var contextNode)
                        && TryGetExecutionContextId(contextNode, out var contextId))
                        contexts.Add(contextId);

                    if (!root.TryGetProperty("id", out var idNode)
                        || !idNode.TryGetInt32(out var responseId)
                        || responseId != expectedId
                        || !SessionMatches(root, sessionId))
                        continue;

                    if (root.TryGetProperty("error", out var error))
                        throw new InvalidOperationException(
                            "CDP_COMMAND_FAILED:" + Bounded(error.ToString()));
                    return;
                }
            }
        }

        try
        {
            var enableId = Interlocked.Increment(ref _nextCommandId);
            var enablePayload = new Dictionary<string, object?>
            {
                ["id"] = enableId,
                ["method"] = "Runtime.enable",
                ["sessionId"] = sessionId
            };
            await socket.SendAsync(
                JsonSerializer.SerializeToUtf8Bytes(enablePayload),
                WebSocketMessageType.Text,
                true,
                token);
            await WaitForResponseAsync(enableId);

            // A no-op evaluation is a per-session ordering barrier. Any existing
            // executionContextCreated notifications caused by Runtime.enable must be
            // observed before the barrier response.
            var barrierId = Interlocked.Increment(ref _nextCommandId);
            var barrierPayload = new Dictionary<string, object?>
            {
                ["id"] = barrierId,
                ["method"] = "Runtime.evaluate",
                ["params"] = new
                {
                    expression = "0",
                    returnByValue = true,
                    awaitPromise = false,
                    userGesture = false
                },
                ["sessionId"] = sessionId
            };
            await socket.SendAsync(
                JsonSerializer.SerializeToUtf8Bytes(barrierPayload),
                WebSocketMessageType.Text,
                true,
                token);
            await WaitForResponseAsync(barrierId);

            return contexts.Distinct().ToArray();
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("CDP_COMMAND_TIMEOUT");
        }
    }

    private async Task<IReadOnlyList<int>> CollectTargetExecutionContextsAsync(
        string webSocketDebuggerUrl,
        CancellationToken cancellationToken)
    {
        // ClientWebSocket treats cancellation of an in-flight ReceiveAsync as a terminal
        // socket abort. The bounded quiet-period drain below is therefore isolated on a
        // disposable discovery connection. Snapshot/event/ACK evaluation always uses a
        // freshly opened socket and can never inherit the drain's Aborted state.
        using var socket = new ClientWebSocket();
        await socket.ConnectAsync(new Uri(webSocketDebuggerUrl), cancellationToken);

        using var commandCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        commandCts.CancelAfter(TimeSpan.FromSeconds(CdpCommandTimeoutSeconds));
        var token = commandCts.Token;
        try
        {
            var id = Interlocked.Increment(ref _nextCommandId);
            var command = JsonSerializer.SerializeToUtf8Bytes(new { id, method = "Runtime.enable" });
            await socket.SendAsync(command, WebSocketMessageType.Text, true, token);

            var contexts = new List<int>();
            var responseSeen = false;
            while (true)
            {
                JsonDocument? message;
                if (!responseSeen)
                {
                    message = await ReceiveJsonAsync(socket, id, token);
                }
                else
                {
                    using var drainCts = CancellationTokenSource.CreateLinkedTokenSource(token);
                    drainCts.CancelAfter(TimeSpan.FromMilliseconds(ExecutionContextDrainMilliseconds));
                    try
                    {
                        message = await ReceiveJsonAsync(socket, id, drainCts.Token);
                    }
                    catch (OperationCanceledException) when (
                        !token.IsCancellationRequested
                        && !cancellationToken.IsCancellationRequested)
                    {
                        break;
                    }
                }

                if (message is null) continue;
                using (message)
                {
                    var root = message.RootElement;
                    if (root.ValueKind == JsonValueKind.Object
                        && root.TryGetProperty("method", out var methodNode)
                        && string.Equals(
                            methodNode.GetString(),
                            "Runtime.executionContextCreated",
                            StringComparison.Ordinal)
                        && root.TryGetProperty("params", out var paramsNode)
                        && paramsNode.TryGetProperty("context", out var contextNode)
                        && TryGetExecutionContextId(contextNode, out var contextId))
                        contexts.Add(contextId);

                    if (!root.TryGetProperty("id", out var idNode)
                        || !idNode.TryGetInt32(out var responseId)
                        || responseId != id)
                        continue;

                    if (root.TryGetProperty("error", out var error))
                        throw new InvalidOperationException(
                            "CDP_COMMAND_FAILED:" + Bounded(error.ToString()));

                    // CDP may emit some existing executionContextCreated events just
                    // after the Runtime.enable response. Keep draining until a short
                    // quiet period so nested Adventure Land character/runner contexts
                    // are not missed nondeterministically.
                    responseSeen = true;
                }
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

        // FindTargetsAsync already restricts the CDP target itself to the configured
        // Adventure Land origin. Adventure Land runs secondary CODE characters in
        // sandboxed frames. Chromium can report those default-frame execution
        // contexts with an empty/omitted origin or with the literal opaque origin
        // "null" / "://".
        if (!context.TryGetProperty("origin", out var originNode)
            || originNode.ValueKind != JsonValueKind.String)
            return true;

        var origin = originNode.GetString();
        if (string.IsNullOrWhiteSpace(origin))
            return true;

        if (string.Equals(origin, "null", StringComparison.OrdinalIgnoreCase)
            || string.Equals(origin, "://", StringComparison.Ordinal))
            return IsTrustedOpaqueFrameContext(context);

        // Explicit foreign origins remain fail-closed. This prevents a cross-origin
        // child frame from self-reporting a forged ALBot V6 identity and having its
        // data forwarded with host credentials.
        return Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            && SameOrigin(uri, _allowedOrigin);
    }

    private static bool IsTrustedOpaqueFrameContext(JsonElement context)
    {
        if (!context.TryGetProperty("auxData", out var auxData)
            || auxData.ValueKind != JsonValueKind.Object)
            return false;

        if (!auxData.TryGetProperty("isDefault", out var isDefaultNode)
            || isDefaultNode.ValueKind is not JsonValueKind.True)
            return false;

        if (!auxData.TryGetProperty("frameId", out var frameIdNode)
            || frameIdNode.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(frameIdNode.GetString()))
            return false;

        if (auxData.TryGetProperty("type", out var typeNode)
            && typeNode.ValueKind == JsonValueKind.String
            && !string.Equals(typeNode.GetString(), "default", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private Task<JsonElement> EvaluateAsync(
        ClientWebSocket socket,
        string expression,
        int contextId,
        CancellationToken cancellationToken) =>
        EvaluateAsync(socket, expression, contextId, sessionId: null, cancellationToken);

    private async Task<JsonElement> EvaluateAsync(
        ClientWebSocket socket,
        string expression,
        int contextId,
        string? sessionId,
        CancellationToken cancellationToken)
    {
        using var commandCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        commandCts.CancelAfter(TimeSpan.FromSeconds(CdpCommandTimeoutSeconds));
        var token = commandCts.Token;
        try
        {
            var id = Interlocked.Increment(ref _nextCommandId);
            var payload = new Dictionary<string, object?>
            {
                ["id"] = id,
                ["method"] = "Runtime.evaluate",
                ["params"] = new
                {
                    expression,
                    contextId,
                    returnByValue = true,
                    awaitPromise = true,
                    userGesture = false
                }
            };
            if (!string.IsNullOrWhiteSpace(sessionId))
                payload["sessionId"] = sessionId;

            var command = JsonSerializer.SerializeToUtf8Bytes(payload);
            await socket.SendAsync(command, WebSocketMessageType.Text, true, token);
            while (true)
            {
                var message = await ReceiveJsonAsync(socket, id, token);
                if (message is null) continue;
                using (message)
                {
                    var root = message.RootElement;
                    if (!root.TryGetProperty("id", out var idNode)
                        || !idNode.TryGetInt32(out var responseId)
                        || responseId != id)
                        continue;
                    if (!SessionMatches(root, sessionId))
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
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("CDP_COMMAND_TIMEOUT");
        }
    }

    private static bool SessionMatches(JsonElement message, string? expectedSessionId)
    {
        var actual = message.ValueKind == JsonValueKind.Object
            && message.TryGetProperty("sessionId", out var sessionNode)
            && sessionNode.ValueKind == JsonValueKind.String
                ? sessionNode.GetString()
                : null;
        return string.Equals(actual, expectedSessionId, StringComparison.Ordinal);
    }

    private const int MaxCdpMessageBytes = 1024 * 1024;

    private static async Task<JsonDocument?> ReceiveJsonAsync(
        ClientWebSocket socket,
        int expectedResponseId,
        CancellationToken cancellationToken)
    {
        var buffer = new byte[16 * 1024];
        using var stream = new MemoryStream();
        WebSocketMessageType? messageType = null;
        var oversized = false;
        long totalBytes = 0;

        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, cancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
                throw new InvalidOperationException("CDP_SOCKET_CLOSED");
            messageType ??= result.MessageType;
            if (result.MessageType != messageType)
                throw new InvalidOperationException("CDP_FRAME_TYPE_CHANGED");

            if (result.Count > 0)
            {
                totalBytes += result.Count;
                if (!oversized)
                {
                    var remaining = MaxCdpMessageBytes - (int)stream.Length;
                    if (remaining > 0)
                        stream.Write(buffer, 0, Math.Min(remaining, result.Count));
                    if (totalBytes > MaxCdpMessageBytes)
                        oversized = true;
                }
            }

            if (result.EndOfMessage) break;
        }

        var payload = stream.ToArray();
        if (messageType != WebSocketMessageType.Text)
            throw new InvalidOperationException(
                "CDP_NON_TEXT_FRAME:" + (messageType?.ToString() ?? "UNKNOWN") + ":" + PayloadPreview(payload));

        if (oversized)
        {
            var kind = ClassifyCdpEnvelopePrefix(payload, expectedResponseId);
            if (string.Equals(kind, "expected-response", StringComparison.Ordinal))
                throw new InvalidOperationException(
                    "CDP_RESPONSE_TOO_LARGE:id=" + expectedResponseId + ":bytes>" + MaxCdpMessageBytes);
            if (string.Equals(kind, "event", StringComparison.Ordinal)
                || string.Equals(kind, "other-response", StringComparison.Ordinal))
                return null;

            throw new InvalidOperationException(
                "CDP_MESSAGE_TOO_LARGE_UNCLASSIFIED:bytes>" + MaxCdpMessageBytes + ":" + PayloadPreview(payload));
        }

        return ParseCdpJson(payload);
    }

    private static string ClassifyCdpEnvelopePrefix(byte[] prefix, int expectedResponseId)
    {
        if (prefix is null || prefix.Length == 0) return "unknown";
        try
        {
            var reader = new Utf8JsonReader(prefix, isFinalBlock: false, state: default);
            if (!reader.Read() || reader.TokenType != JsonTokenType.StartObject)
                return "unknown";

            var inspectedProperties = 0;
            while (inspectedProperties < 8 && reader.Read())
            {
                if (reader.TokenType != JsonTokenType.PropertyName)
                    continue;

                inspectedProperties++;
                var name = reader.GetString();
                if (!reader.Read()) break;

                if (string.Equals(name, "id", StringComparison.Ordinal)
                    && reader.TokenType == JsonTokenType.Number
                    && reader.TryGetInt32(out var id))
                    return id == expectedResponseId ? "expected-response" : "other-response";

                if (string.Equals(name, "method", StringComparison.Ordinal)
                    && reader.TokenType == JsonTokenType.String)
                    return "event";

                if (reader.TokenType is JsonTokenType.StartObject or JsonTokenType.StartArray)
                    return "unknown";
            }
        }
        catch (JsonException)
        {
        }

        return "unknown";
    }

    private static JsonDocument ParseCdpJson(byte[] payload)
    {
        if (payload is null || payload.Length == 0)
            throw new InvalidOperationException("CDP_EMPTY_JSON_FRAME");
        try
        {
            return JsonDocument.Parse(payload);
        }
        catch (JsonException error)
        {
            throw new InvalidOperationException(
                "CDP_FRAME_INVALID_JSON:" + PayloadPreview(payload),
                error);
        }
    }

    private static string PayloadPreview(byte[] payload)
    {
        if (payload is null || payload.Length == 0) return "EMPTY";
        var length = Math.Min(payload.Length, 96);
        string text;
        try
        {
            text = System.Text.Encoding.UTF8.GetString(payload, 0, length);
        }
        catch
        {
            return "UNDECODABLE";
        }

        var cleaned = new string(text.Select(ch => char.IsControl(ch) ? ' ' : ch).ToArray()).Trim();
        return Bounded(cleaned);
    }

    private const string BridgeResolverSource = """
    const roots = [];
    const seen = new Set();
    const visit = candidate => {
      if (!candidate || roots.length >= 96) return;
      try {
        if (seen.has(candidate)) return;
        seen.add(candidate);
        void candidate.location.href;
      } catch { return; }
      roots.push(candidate);
      try { if (candidate.parent && candidate.parent !== candidate) visit(candidate.parent); } catch {}
      try { if (candidate.top && candidate.top !== candidate) visit(candidate.top); } catch {}

      // Adventure Land keeps secondary characters in iframe[data-name] windows.
      // Prioritize those character roots before generic frames so unrelated page
      // frames cannot consume the bounded traversal budget first.
      try {
        const doc = candidate.document;
        const characterFrames = doc && doc.querySelectorAll
          ? doc.querySelectorAll('iframe[data-name]')
          : [];
        for (let i = 0; i < characterFrames.length && i < 16; i += 1) {
          const frame = characterFrames[i];
          if (frame && frame.contentWindow) visit(frame.contentWindow);
        }
      } catch {}

      try {
        const frames = candidate.frames;
        for (let i = 0; frames && i < frames.length && i < 48; i += 1) visit(frames[i]);
      } catch {}
    };
    visit(globalThis);

    const isValidBridgeCandidate = (candidate, requiredMethod) => {
      try {
        const bridge = candidate && candidate.bridge;
        const identity = bridge && typeof bridge.identity === 'function' ? bridge.identity() : null;
        return !!identity
          && identity.product === 'AL Bot'
          && Number(identity.generation) === 6
          && identity.bridgeProtocol === 'albot-v6-bridge-v1'
          && identity.transportOnly === true
          && identity.gameplayActionAuthority === false
          && identity.acceptsLegacyGenerations === false
          && typeof bridge[requiredMethod] === 'function';
      } catch { return false; }
    };

    const candidatesFromRoots = candidateRoots => {
      const rows = [];
      const rowSet = new Set();
      const pushCandidate = candidate => {
        if (!candidate || rowSet.has(candidate)) return;
        rowSet.add(candidate);
        rows.push(candidate);
      };
      for (const candidateRoot of candidateRoots) {
        try { if (candidateRoot.ALBot) pushCandidate(candidateRoot.ALBot); } catch {}
        try {
          const shared = candidateRoot.__ALBOT_SHARED_RUNTIME__;
          const runner = shared && shared.runnerRoot;
          if (runner && runner.ALBot) pushCandidate(runner.ALBot);
        } catch {}
      }
      return rows;
    };

    const candidates = candidatesFromRoots(roots);
    const validBridgeApis = requiredMethod =>
      candidates.filter(candidate => isValidBridgeCandidate(candidate, requiredMethod));
    const findBridgeApi = requiredMethod => validBridgeApis(requiredMethod)[0] || null;

    const characterNameOfRoot = candidateRoot => {
      try {
        const row = candidateRoot && candidateRoot.character;
        return String(row && row.name || '').trim();
      } catch { return ''; }
    };

    const findAdventureLandCharacterRoot = requestedCharacter => {
      const wanted = String(requestedCharacter || '').trim().toLowerCase();
      if (!wanted) return null;

      // Prefer an exact character window over a runner proxy.
      for (const candidateRoot of roots) {
        try {
          const doc = candidateRoot.document;
          const frames = doc && doc.querySelectorAll
            ? doc.querySelectorAll('iframe[data-name]')
            : [];
          for (let i = 0; i < frames.length && i < 32; i += 1) {
            const frame = frames[i];
            const declared = String(frame && frame.dataset && frame.dataset.name || '').trim().toLowerCase();
            const windowRoot = frame && frame.contentWindow;
            if (!windowRoot) continue;
            void windowRoot.location.href;
            const actual = characterNameOfRoot(windowRoot).toLowerCase();
            if (actual === wanted || (!actual && declared === wanted)) return windowRoot;
          }
        } catch {}
      }

      for (const candidateRoot of roots) {
        if (characterNameOfRoot(candidateRoot).toLowerCase() === wanted)
          return candidateRoot;
      }
      return null;
    };

    const collectCharacterScopeRoots = seed => {
      const scoped = [];
      const scopedSeen = new Set();
      const walk = candidate => {
        if (!candidate || scoped.length >= 32) return;
        try {
          if (scopedSeen.has(candidate)) return;
          scopedSeen.add(candidate);
          void candidate.location.href;
        } catch { return; }
        scoped.push(candidate);
        try {
          const frames = candidate.frames;
          for (let i = 0; frames && i < frames.length && i < 24; i += 1) {
            const frame = frames[i];
            // A nested iframe carrying data-name is another Adventure Land
            // character and must not leak into this character's scoped lookup.
            try {
              const element = frame && frame.frameElement;
              if (element && element.dataset && element.dataset.name) continue;
            } catch {}
            walk(frame);
          }
        } catch {}
      };
      walk(seed);
      return scoped;
    };

    const findBridgeApiForCharacter = (requiredMethod, requestedCharacter) => {
      const wanted = String(requestedCharacter || '').trim().toLowerCase();
      if (!wanted) return null;

      const characterRoot = findAdventureLandCharacterRoot(requestedCharacter);
      if (characterRoot) {
        const scopedCandidates = candidatesFromRoots(collectCharacterScopeRoots(characterRoot));
        for (const candidate of scopedCandidates) {
          try {
            if (!isValidBridgeCandidate(candidate, requiredMethod)) continue;
            const bridge = candidate.bridge;
            if (typeof bridge.snapshot !== 'function') continue;
            const snapshot = bridge.snapshot({ deep: false });
            const name = snapshot && snapshot.character && snapshot.character.name;
            if (String(name || '').trim().toLowerCase() === wanted) return candidate;
          } catch {}
        }
      }

      // Keep the generic lookup as a compatibility path for layouts without
      // Adventure Land's named character iframes.
      for (const candidate of validBridgeApis(requiredMethod)) {
        try {
          const bridge = candidate && candidate.bridge;
          if (!bridge || typeof bridge.snapshot !== 'function') continue;
          const snapshot = bridge.snapshot({ deep: false });
          const name = snapshot && snapshot.character && snapshot.character.name;
          if (String(name || '').trim().toLowerCase() === wanted) return candidate;
        } catch {}
      }
      return null;
    };
    """;

    private static readonly string CharacterCatalogExpression =
        "(() => {\n"
        + BridgeResolverSource
        + """
const roster = new Map();
const addRosterName = (name, state, source) => {
  const clean = String(name || '').trim();
  if (!clean) return;
  const key = clean.toLowerCase();
  if (!roster.has(key)) roster.set(key, {
    character: clean,
    state: String(state || ''),
    source: String(source || '')
  });
};

// Adventure Land's own liveness API is the authoritative way to enumerate
// same-account runner names, including child characters whose V6 bridge lives
// in a nested runner iframe.
for (const candidateRoot of roots) {
  try {
    const fn = candidateRoot && candidateRoot.get_active_characters;
    if (typeof fn === 'function') {
      const active = fn.call(candidateRoot);
      if (active && typeof active === 'object') {
        for (const [name, state] of Object.entries(active))
          addRosterName(name, state, 'get_active_characters');
      }
    }
  } catch {}
  try {
    const name = characterNameOfRoot(candidateRoot);
    if (name) addRosterName(name, 'visible', 'character');
  } catch {}
}

// Preserve compatibility with layouts where the bridge is visible even when
// get_active_characters() is unavailable.
for (const api of validBridgeApis('snapshot')) {
  try {
    const snapshot = api.bridge.snapshot({ deep: false });
    const name = snapshot && snapshot.character && snapshot.character.name;
    if (name) addRosterName(name, 'bridge', 'bridge');
  } catch {}
}

const rows = [];
for (const row of roster.values()) {
  const api = findBridgeApiForCharacter('snapshot', row.character);
  if (!api) {
    rows.push({
      character: row.character,
      state: row.state,
      source: row.source,
      bridgeAvailable: false
    });
    continue;
  }
  try {
    const snapshot = api.bridge.snapshot({ deep: false });
    const actual = String(snapshot && snapshot.character && snapshot.character.name || '').trim();
    if (!actual || actual.toLowerCase() !== row.character.toLowerCase()) {
      rows.push({
        character: row.character,
        state: row.state,
        source: row.source,
        bridgeAvailable: false
      });
      continue;
    }
    rows.push({
      character: actual,
      state: row.state,
      source: row.source,
      bridgeAvailable: true
    });
  } catch {
    rows.push({
      character: row.character,
      state: row.state,
      source: row.source,
      bridgeAvailable: false
    });
  }
}
return rows;
})()
""";

    private static string BuildSnapshotExpression(bool deep, string? characterName = null)
    {
        var selector = string.IsNullOrWhiteSpace(characterName)
            ? "findBridgeApi('snapshot')"
            : "findBridgeApiForCharacter('snapshot', "
                + JsonSerializer.Serialize(characterName.Trim())
                + ")";
        return "(() => {\n"
            + BridgeResolverSource
            + "\nconst api = " + selector + ";\n"
            + "if (!api) throw new Error('ALBOT_V6_BRIDGE_UNAVAILABLE');\n"
            + "return api.bridge.snapshot({ deep: " + (deep ? "true" : "false") + " });\n"
            + "})()";
    }

    public static string BuildDashboardVisualExpression(string characterName, bool includeTerrain = true)
    {
        var requestedCharacter = JsonSerializer.Serialize((characterName ?? string.Empty).Trim());
        return "(() => {\n"
            + BridgeResolverSource
            + "\nconst requestedCharacter = " + requestedCharacter + ";\n"
            + "\nconst includeTerrain = " + (includeTerrain ? "true" : "false") + ";\n"
            + $$"""
const wanted = String(requestedCharacter || '').trim().toLowerCase();
const characterRoot = findAdventureLandCharacterRoot(requestedCharacter);
if (!wanted || !characterRoot) return {
  schemaVersion: 1,
  type: 'ALBOT_V6_DASHBOARD_VISUAL',
  character: requestedCharacter,
  available: false,
  reason: 'CHARACTER_ROOT_UNAVAILABLE'
};

const scopedRoots = collectCharacterScopeRoots(characterRoot);
const runtimeRoot = scopedRoots.find(candidate => {
  try {
    const row = candidate && candidate.character;
    return String(row && row.name || '').trim().toLowerCase() === wanted;
  } catch { return false; }
}) || characterRoot;

const character = (() => {
  try {
    const direct = runtimeRoot && runtimeRoot.character;
    if (direct && String(direct.name || '').trim().toLowerCase() === wanted) return direct;
  } catch {}
  try {
    const direct = characterRoot && characterRoot.character;
    if (direct && String(direct.name || '').trim().toLowerCase() === wanted) return direct;
  } catch {}
  return null;
})();

const gameData = (() => {
  const candidates = [];
  const add = candidate => {
    if (!candidate || candidates.includes(candidate)) return;
    candidates.push(candidate);
  };
  add(runtimeRoot);
  add(characterRoot);
  for (const candidate of scopedRoots) add(candidate);
  for (const candidate of candidates) {
    try {
      if (candidate.G && typeof candidate.G === 'object') return candidate.G;
    } catch {}
    try {
      if (candidate.parent && candidate.parent.G && typeof candidate.parent.G === 'object')
        return candidate.parent.G;
    } catch {}
  }
  return null;
})();

if (!character || !gameData) return {
  schemaVersion: 1,
  type: 'ALBOT_V6_DASHBOARD_VISUAL',
  character: requestedCharacter,
  available: false,
  reason: !character ? 'CHARACTER_STATE_UNAVAILABLE' : 'GAME_DATA_UNAVAILABLE'
};

const mapId = String(character.map || '').trim();
const geometry = gameData.geometry && gameData.geometry[mapId] || null;
const mapDef = gameData.maps && gameData.maps[mapId] || {};

const finite = value => Number.isFinite(Number(value));
const boundedText = (value, max) => String(value == null ? '' : value).slice(0, max);
const mapBounds = geometry && finite(geometry.min_x) && finite(geometry.min_y)
    && finite(geometry.max_x) && finite(geometry.max_y)
  ? {
      minX: Number(geometry.min_x),
      minY: Number(geometry.min_y),
      maxX: Number(geometry.max_x),
      maxY: Number(geometry.max_y)
    }
  : {
      minX: Number(character.x || character.real_x || 0) - 1200,
      minY: Number(character.y || character.real_y || 0) - 1200,
      maxX: Number(character.x || character.real_x || 0) + 1200,
      maxY: Number(character.y || character.real_y || 0) + 1200
    };

const mapVisual = { npcs: [], doors: [] };
try {
  for (const raw of (Array.isArray(mapDef.npcs) ? mapDef.npcs : []).slice(0, 80)) {
    const id = Array.isArray(raw) ? raw[0] : raw && raw.id;
    const x = Array.isArray(raw) ? raw[1] : raw && raw.x;
    const y = Array.isArray(raw) ? raw[2] : raw && raw.y;
    if (finite(x) && finite(y))
      mapVisual.npcs.push({ id: boundedText(id, 40), x: Number(x), y: Number(y) });
  }
} catch {}
try {
  for (const raw of (Array.isArray(mapDef.doors) ? mapDef.doors : []).slice(0, 80)) {
    const x = Array.isArray(raw) ? raw[0] : raw && raw.x;
    const y = Array.isArray(raw) ? raw[1] : raw && raw.y;
    const to = Array.isArray(raw) ? raw[4] : raw && (raw.map || raw.to);
    if (finite(x) && finite(y))
      mapVisual.doors.push({ x: Number(x), y: Number(y), to: boundedText(to, 40) });
  }
} catch {}

const positionFromImageSets = skin => {
  try {
    for (const [packName, pack] of Object.entries(gameData.imagesets || {})) {
      const matrix = Array.isArray(pack && pack.matrix) ? pack.matrix : [];
      for (let y = 0; y < matrix.length; y += 1) {
        const row = Array.isArray(matrix[y]) ? matrix[y] : [];
        for (let x = 0; x < row.length; x += 1) {
          const cell = row[x];
          if (cell === skin || (Array.isArray(cell) && cell.includes(skin)))
            return [packName, x, y];
        }
      }
    }
  } catch {}
  return null;
};
const skin = String(character.skin || '').trim();
const directPosition = skin && gameData.positions && gameData.positions[skin];
const position = Array.isArray(directPosition) ? directPosition : positionFromImageSets(skin);
let sprite = null;
if (skin && Array.isArray(position)) {
  const packName = position[0] || 'pack_20';
  const pack = gameData.imagesets && gameData.imagesets[packName] || null;
  let rows = Number(pack && pack.rows);
  if (!(rows > 0) && Array.isArray(pack && pack.matrix)) rows = pack.matrix.length;
  if (!(rows > 0)) {
    let maxY = -1;
    try {
      for (const row of Object.values(gameData.positions || {})) {
        if (!Array.isArray(row) || (row[0] || 'pack_20') !== packName) continue;
        const py = Number(row[2]);
        if (Number.isFinite(py) && py >= 0) maxY = Math.max(maxY, py);
      }
    } catch {}
    rows = maxY >= 0 ? maxY + 1 : 0;
  }
  const file = String(pack && pack.file || '');
  const size = Number(pack && pack.size);
  const columns = Number(pack && pack.columns);
  const column = Number(position[1]);
  const row = Number(position[2]);
  if (file && size > 0 && columns > 0 && rows > 0
      && Number.isFinite(column) && Number.isFinite(row)) {
    sprite = {
      skin,
      file,
      size,
      columns,
      rows,
      column,
      row,
      x: column,
      y: row
    };
  }
}

const compactLines = (rows, limit = 420) => (Array.isArray(rows) ? rows : [])
  .slice(0, limit)
  .map(row => Array.isArray(row) ? row.slice(0, 3).map(value => Number(value) || 0) : null)
  .filter(Boolean);
const vectorFallback = geometry ? {
  x: compactLines(geometry.x_lines),
  y: compactLines(geometry.y_lines)
} : { x: [], y: [] };

const packRows = rows => (Array.isArray(rows) ? rows : [])
  .map(row => (Array.isArray(row) ? row : [])
    .map(value => {
      if (value == null) return '';
      const number = Number(value);
      return Number.isFinite(number) ? Math.round(number).toString(36) : '';
    })
    .join(','))
  .join(';');

let terrain = null;
if (geometry) {
  if (!includeTerrain) {
    terrain = {
      map: mapId,
      omitted: true,
      reason: 'PER_MAP_DEDUP',
      source: 'Adventure Land G.geometry/G.tilesets',
      v: vectorFallback
    };
  } else if (Array.isArray(geometry.tiles) && Array.isArray(geometry.placements)) {
    const used = {};
    for (const tile of geometry.tiles) {
      if (tile && tile[0] != null) used[String(tile[0])] = true;
    }
    const sets = {};
    for (const id of Object.keys(used)) {
      const tileset = gameData.tilesets && gameData.tilesets[id];
      if (tileset && tileset.file) sets[id] = String(tileset.file);
    }
    const groups = Array.isArray(geometry.groups) ? geometry.groups : [];
    const animations = Array.isArray(geometry.animations) ? geometry.animations : [];
    terrain = {
      map: mapId,
      d: geometry.default,
      t: geometry.tiles,
      pc: packRows(geometry.placements),
      gc: groups.map(packRows),
      ac: packRows(animations),
      s: sets,
      source: 'Adventure Land G.geometry/G.tilesets',
      encoding: 'base36-all-v2',
      v: vectorFallback
    };
    let terrainChars = 0;
    try { terrainChars = JSON.stringify(terrain).length; } catch { terrainChars = {{DashboardTerrainMaxChars + 1}}; }
    terrain.bytes = terrainChars;
    if (terrainChars > {{DashboardTerrainMaxChars}}) {
      terrain = {
        map: mapId,
        omitted: true,
        bytes: terrainChars,
        reason: 'DASHBOARD_TERRAIN_BUDGET',
        source: 'Adventure Land G.geometry/G.tilesets',
        encoding: 'base36-all-v2',
        v: vectorFallback
      };
    }
  } else {
    terrain = {
      map: mapId,
      omitted: true,
      reason: 'GEOMETRY_TILES_UNAVAILABLE',
      source: 'Adventure Land G.geometry',
      v: vectorFallback
    };
  }
}

return {
  schemaVersion: 1,
  type: 'ALBOT_V6_DASHBOARD_VISUAL',
  character: String(character.name || requestedCharacter),
  map: mapId,
  available: true,
  sprite,
  mapBounds,
  mapVisual,
  terrain
};
})()
""";
    }

    public static IReadOnlyList<int> AdaptiveEventLimits(int requestedLimit)
    {
        var bounded = Math.Clamp(requestedLimit, 1, 200);
        var values = new List<int> { bounded };
        foreach (var fallback in new[] { 24, 12, 6, 3, 1 })
            if (fallback < bounded && !values.Contains(fallback))
                values.Add(fallback);
        return values;
    }

    private async Task<JsonElement> EvaluateLocalEventsAdaptiveAsync(
        ClientWebSocket socket,
        string characterName,
        long afterSeq,
        int eventLimit,
        int contextId,
        CancellationToken cancellationToken)
    {
        InvalidOperationException? oversized = null;
        foreach (var limit in AdaptiveEventLimits(eventLimit))
        {
            try
            {
                return await EvaluateAsync(
                    socket,
                    BuildEventsExpression(characterName: null, afterSeq, limit),
                    contextId,
                    cancellationToken);
            }
            catch (InvalidOperationException error) when (
                error.Message.StartsWith("CDP_RESPONSE_TOO_LARGE", StringComparison.Ordinal))
            {
                oversized = error;
            }
        }

        throw new InvalidOperationException(
            "ALBOT_V6_EVENTS_TOO_LARGE:"
            + Bounded(characterName)
            + ":"
            + (oversized?.Message ?? "CDP_RESPONSE_TOO_LARGE"));
    }

    private Task<JsonElement> EvaluateEventsAdaptiveAsync(
        ClientWebSocket socket,
        string characterName,
        long afterSeq,
        int eventLimit,
        int contextId,
        CancellationToken cancellationToken) =>
        EvaluateEventsAdaptiveAsync(
            socket,
            characterName,
            afterSeq,
            eventLimit,
            contextId,
            sessionId: null,
            cancellationToken);

    private async Task<JsonElement> EvaluateEventsAdaptiveAsync(
        ClientWebSocket socket,
        string characterName,
        long afterSeq,
        int eventLimit,
        int contextId,
        string? sessionId,
        CancellationToken cancellationToken)
    {
        InvalidOperationException? oversized = null;
        foreach (var limit in AdaptiveEventLimits(eventLimit))
        {
            try
            {
                return await EvaluateAsync(
                    socket,
                    BuildEventsExpression(characterName, afterSeq, limit),
                    contextId,
                    sessionId,
                    cancellationToken);
            }
            catch (InvalidOperationException error) when (
                error.Message.StartsWith("CDP_RESPONSE_TOO_LARGE", StringComparison.Ordinal))
            {
                oversized = error;
            }
        }

        throw new InvalidOperationException(
            "ALBOT_V6_EVENTS_TOO_LARGE:"
            + Bounded(characterName)
            + ":"
            + (oversized?.Message ?? "CDP_RESPONSE_TOO_LARGE"));
    }

    private static string BuildEventsExpression(string? characterName, long afterSeq, int limit)
    {
        var after = Math.Max(0, afterSeq);
        var boundedLimit = Math.Clamp(limit, 1, 200);
        var selector = string.IsNullOrWhiteSpace(characterName)
            ? "findBridgeApi('events')"
            : "findBridgeApiForCharacter('events', "
                + JsonSerializer.Serialize(characterName.Trim())
                + ")";
        return "(() => {\n"
            + BridgeResolverSource
            + "\nconst api = " + selector + ";\n"
            + "if (!api) throw new Error('ALBOT_V6_BRIDGE_UNAVAILABLE');\n"
            + "return api.bridge.events(" + after + ", " + boundedLimit + ");\n"
            + "})()";
    }

    private static string BuildEventsExpression(long afterSeq, int limit) =>
        BuildEventsExpression(characterName: null, afterSeq, limit);

    private static string BuildAcknowledgeExpression(long maxSeq, string? characterName = null)
    {
        var bounded = Math.Max(0, maxSeq);
        var selector = string.IsNullOrWhiteSpace(characterName)
            ? "findBridgeApi('acknowledgeTelemetry')"
            : "findBridgeApiForCharacter('acknowledgeTelemetry', "
                + JsonSerializer.Serialize(characterName.Trim())
                + ")";
        return "(() => {\n"
            + BridgeResolverSource
            + "\nconst api = " + selector + ";\n"
            + "if (!api) throw new Error('ALBOT_V6_BRIDGE_UNAVAILABLE');\n"
            + "return api.bridge.acknowledgeTelemetry(" + bounded + ");\n"
            + "})()";
    }

    private static readonly string LocalProbeExpression =
        """
(() => {
  const candidates = [];
  const seen = new Set();
  const add = candidate => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    candidates.push(candidate);
  };

  try { add(globalThis.ALBot); } catch {}
  try {
    const shared = globalThis.__ALBOT_SHARED_RUNTIME__;
    const runner = shared && shared.runnerRoot;
    if (runner) add(runner.ALBot);
  } catch {}

  const api = candidates.find(candidate => {
    try {
      const bridge = candidate && candidate.bridge;
      const identity = bridge && typeof bridge.identity === 'function' ? bridge.identity() : null;
      return !!identity
        && identity.product === 'AL Bot'
        && Number(identity.generation) === 6
        && identity.bridgeProtocol === 'albot-v6-bridge-v1'
        && identity.transportOnly === true
        && identity.gameplayActionAuthority === false
        && identity.acceptsLegacyGenerations === false
        && typeof bridge.snapshot === 'function'
        && typeof bridge.events === 'function'
        && typeof bridge.acknowledgeTelemetry === 'function';
    } catch { return false; }
  }) || null;

  if (!api) return { valid: false, identity: null, candidateCount: candidates.length };
  try {
    return {
      valid: true,
      identity: api.bridge.identity(),
      candidateCount: candidates.length
    };
  } catch {
    return { valid: false, identity: null, candidateCount: candidates.length };
  }
})()
""";

    private static readonly string ProbeExpression =
        "(() => {\n"
        + BridgeResolverSource
        + """
const summarize = candidate => {
  try {
    const bridge = candidate && candidate.bridge;
    let identity = null;
    try { identity = bridge && typeof bridge.identity === 'function' ? bridge.identity() : null; } catch {}
    return {
      product: candidate && candidate.product || null,
      version: candidate && candidate.version || null,
      hasBridge: !!bridge,
      identity: identity ? {
        product: identity.product || null,
        generation: Number(identity.generation) || 0,
        bridgeProtocol: identity.bridgeProtocol || null,
        transportOnly: identity.transportOnly === true,
        gameplayActionAuthority: identity.gameplayActionAuthority === true,
        acceptsLegacyGenerations: identity.acceptsLegacyGenerations === true
      } : null
    };
  } catch {
    return { product: null, version: null, hasBridge: false, identity: null };
  }
};
const diagnostics = {
  rootCount: roots.length,
  candidateCount: candidates.length,
  directAlBotCount: roots.filter(root => {
    try { return !!root.ALBot; } catch { return false; }
  }).length,
  sharedRuntimeCount: roots.filter(root => {
    try { return !!root.__ALBOT_SHARED_RUNTIME__; } catch { return false; }
  }).length,
  runnerRootCount: roots.filter(root => {
    try {
      const shared = root.__ALBOT_SHARED_RUNTIME__;
      return !!(shared && shared.runnerRoot);
    } catch { return false; }
  }).length,
  candidates: candidates.slice(0, 4).map(summarize)
};
const api = findBridgeApi('identity');
if (!api) return { valid: false, identity: null, diagnostics };
try { return { valid: true, identity: api.bridge.identity(), diagnostics }; }
catch { return { valid: false, identity: null, diagnostics }; }
})()
""";

    private static void AddProbeDiagnostic(
        List<string> diagnostics,
        string targetUrl,
        int? contextId,
        JsonElement probe)
    {
        if (diagnostics.Count >= 12) return;
        var label = TargetLabel(targetUrl);
        var context = contextId is null ? "ctx?" : "ctx" + contextId.Value;
        if (probe.ValueKind != JsonValueKind.Object
            || !probe.TryGetProperty("diagnostics", out var detail)
            || detail.ValueKind != JsonValueKind.Object)
        {
            diagnostics.Add(label + ":" + context + ":NO_DIAG");
            return;
        }

        var roots = ReadInt64(detail, "rootCount", 0);
        var candidates = ReadInt64(detail, "candidateCount", 0);
        var direct = ReadInt64(detail, "directAlBotCount", 0);
        var shared = ReadInt64(detail, "sharedRuntimeCount", 0);
        var runner = ReadInt64(detail, "runnerRootCount", 0);
        var candidateSummary = "none";

        if (detail.TryGetProperty("candidates", out var rows)
            && rows.ValueKind == JsonValueKind.Array
            && rows.GetArrayLength() > 0)
        {
            var first = rows[0];
            var version = ReadString(first, "version") ?? "?";
            var hasBridge = ReadBoolean(first, "hasBridge", false);
            var protocol = "?";
            var generation = 0L;
            if (first.TryGetProperty("identity", out var identity)
                && identity.ValueKind == JsonValueKind.Object)
            {
                protocol = ReadString(identity, "bridgeProtocol") ?? "?";
                generation = ReadInt64(identity, "generation", 0);
            }
            candidateSummary = "v=" + Bounded(version)
                + ",bridge=" + (hasBridge ? "1" : "0")
                + ",g=" + generation
                + ",p=" + Bounded(protocol);
        }

        diagnostics.Add(
            label + ":" + context
            + ":r" + roots
            + "/a" + candidates
            + "/d" + direct
            + "/s" + shared
            + "/rr" + runner
            + ":" + candidateSummary);
    }

    private static void AddProbeDiagnostic(
        List<string> diagnostics,
        string targetUrl,
        int? contextId,
        string? error)
    {
        if (diagnostics.Count >= 12) return;
        var label = TargetLabel(targetUrl);
        var context = contextId is null ? "ctx?" : "ctx" + contextId.Value;
        diagnostics.Add(label + ":" + context + ":" + Bounded(error));
    }

    public static string? CharacterNameFromTargetUrl(string? targetUrl)
    {
        if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var uri))
            return null;
        var parts = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var characterIndex = Array.FindIndex(parts, value =>
            string.Equals(value, "character", StringComparison.OrdinalIgnoreCase));
        if (characterIndex < 0 || characterIndex + 1 >= parts.Length)
            return null;
        var name = Uri.UnescapeDataString(parts[characterIndex + 1]).Trim();
        return string.IsNullOrWhiteSpace(name) ? null : name;
    }

    private static string TargetLabel(string targetUrl) =>
        Bounded(CharacterNameFromTargetUrl(targetUrl) ?? "target");

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

    private sealed record AttachedTargetInfo(
        string TargetId,
        string Type,
        string Url,
        string? ParentId,
        string? ParentFrameId);

    private sealed record AttachedExecutionContext(
        int ContextId,
        string SessionId,
        string TargetId);

    private sealed record Target
    {
        public string Id { get; init; } = string.Empty;
        public string Type { get; init; } = string.Empty;
        public string Url { get; init; } = string.Empty;
        public string WebSocketDebuggerUrl { get; init; } = string.Empty;
    }
}
