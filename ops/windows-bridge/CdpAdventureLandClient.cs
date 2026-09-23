using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
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
        var targets = await RankTargetsByBotPreferenceAsync(
            await FindTargetsAsync(cancellationToken),
            cancellationToken);
        if (targets.Count > 0) return targets[0].Target.Url;
        throw new InvalidOperationException("AIO_V3_OPERATIONS_UNAVAILABLE");
    }

    public const string V5AutonomousTestManifestUrl =
        "https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/main/v5/roadmap/v5-autonomous-test-manifest.json";
    public const int V5AutonomousTestManifestMaxBytes = 32 * 1024;
    public const int V5AutonomousTestPackageHardMaxBytes = 128 * 1024;

    public async Task<V5AutonomousTestDeploymentResult> EnsureV5AutonomousTestAsync(
        CancellationToken cancellationToken)
    {
        var manifestBytes = await DownloadBoundedAsync(
            V5AutonomousTestManifestUrl,
            V5AutonomousTestManifestMaxBytes,
            cancellationToken);
        var manifestJson = Encoding.UTF8.GetString(manifestBytes);
        var manifest = ParseAndValidateV5AutonomousTestManifest(manifestJson);

        var targets = await FindTargetsAsync(cancellationToken);
        foreach (var target in targets)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var contexts = await CollectAllowedExecutionContextsAsync(socket, cancellationToken);
                foreach (var contextId in contexts)
                {
                    JsonElement probe;
                    try
                    {
                        probe = await EvaluateAsync(socket, V5DeploymentProbeExpression, contextId, cancellationToken);
                    }
                    catch (InvalidOperationException)
                    {
                        continue;
                    }

                    if (!string.Equals(ReadString(probe, "ctype"), "merchant", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var currentTestId = ReadString(probe, "currentTestId");
                    var currentTerminal = ReadBoolean(probe, "currentTerminal", false);
                    if (!ShouldDeployV5AutonomousTest(manifest.TestId, currentTestId, currentTerminal))
                    {
                        var same = string.Equals(currentTestId, manifest.TestId, StringComparison.Ordinal);
                        return new V5AutonomousTestDeploymentResult(
                            same ? "ALREADY_PRESENT" : "BLOCKED_ACTIVE_TEST",
                            Changed: false,
                            manifest.TestId,
                            target.Url);
                    }

                    var packageUrl = BuildV5AutonomousTestPackageUrl(manifest);
                    var packageBytes = await DownloadBoundedAsync(
                        packageUrl,
                        manifest.MaxPackageBytes,
                        cancellationToken);
                    var actualSha256 = Convert.ToHexString(SHA256.HashData(packageBytes)).ToLowerInvariant();
                    if (!string.Equals(actualSha256, manifest.PackageSha256, StringComparison.Ordinal))
                        throw new InvalidOperationException("V5_TEST_PACKAGE_SHA256_MISMATCH");

                    var packageSource = Encoding.UTF8.GetString(packageBytes);
                    if (!packageSource.Contains(manifest.TestId, StringComparison.Ordinal)
                        || !packageSource.Contains(manifest.ExpectedGlobal, StringComparison.Ordinal))
                        throw new InvalidOperationException("V5_TEST_PACKAGE_MARKER_MISSING");

                    var expression = "(() => {\n" + packageSource + "\n; return { installed: true }; })()";
                    await EvaluateAsync(socket, expression, contextId, cancellationToken);

                    var verify = await EvaluateAsync(socket, V5DeploymentProbeExpression, contextId, cancellationToken);
                    if (!string.Equals(ReadString(verify, "currentTestId"), manifest.TestId, StringComparison.Ordinal)
                        || !string.Equals(ReadString(verify, "desiredApiVersion"), manifest.ControllerVersion, StringComparison.Ordinal))
                        throw new InvalidOperationException("V5_TEST_DEPLOYMENT_HANDSHAKE_FAILED");

                    return new V5AutonomousTestDeploymentResult(
                        "DEPLOYED",
                        Changed: true,
                        manifest.TestId,
                        target.Url);
                }
            }
            catch (WebSocketException)
            {
                // Try another same-origin Adventure Land target.
            }
        }

        return new V5AutonomousTestDeploymentResult(
            "MERCHANT_CONTEXT_NOT_FOUND",
            Changed: false,
            manifest.TestId,
            TargetUrl: null);
    }

    public async Task<V5LegacyRosterRecoveryResult> EnsureLegacyPr206RosterRecoveryAsync(
        CancellationToken cancellationToken)
    {
        var targets = await FindTargetsAsync(cancellationToken);
        foreach (var target in targets)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var contexts = await CollectAllowedExecutionContextsAsync(socket, cancellationToken);
                foreach (var contextId in contexts)
                {
                    JsonElement probe;
                    try
                    {
                        probe = await EvaluateAsync(socket, V5DeploymentProbeExpression, contextId, cancellationToken);
                    }
                    catch (InvalidOperationException)
                    {
                        continue;
                    }

                    if (!string.Equals(ReadString(probe, "ctype"), "merchant", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var currentTestId = ReadString(probe, "currentTestId");
                    if (string.IsNullOrWhiteSpace(currentTestId))
                        continue;

                    var allowed = ShouldAttemptLegacyPr206RosterRecovery(
                        currentTestId,
                        ReadString(probe, "currentVersion"),
                        ReadString(probe, "currentStatus"),
                        ReadString(probe, "currentPhase"),
                        ReadBoolean(probe, "currentTerminal", true),
                        ReadInt64(probe, "currentGameplayWrites", long.MaxValue),
                        ReadInt64(probe, "currentRawWriteCalls", long.MaxValue),
                        ReadBoolean(probe, "currentSameIntentRetry", true),
                        (int)Math.Clamp(ReadInt64(probe, "currentIntentCount", int.MaxValue), 0, int.MaxValue));

                    if (!allowed)
                    {
                        return new V5LegacyRosterRecoveryResult(
                            "NOT_APPLICABLE",
                            Changed: false,
                            StartedCount: 0,
                            currentTestId,
                            target.Url);
                    }

                    var recovery = await EvaluateAsync(
                        socket,
                        V5LegacyPr206RosterRecoveryExpression,
                        contextId,
                        cancellationToken);
                    var startedCount = (int)Math.Clamp(
                        ReadInt64(recovery, "startedCount", 0),
                        0,
                        3);
                    var state = ReadString(recovery, "state") ?? "UNKNOWN";

                    return new V5LegacyRosterRecoveryResult(
                        state,
                        Changed: startedCount > 0,
                        StartedCount: startedCount,
                        currentTestId,
                        target.Url);
                }
            }
            catch (WebSocketException)
            {
                // Try another same-origin Adventure Land target.
            }
        }

        return new V5LegacyRosterRecoveryResult(
            "MERCHANT_CONTEXT_NOT_FOUND",
            Changed: false,
            StartedCount: 0,
            TestId: null,
            TargetUrl: null);
    }

    public static bool ShouldAttemptLegacyPr206RosterRecovery(
        string? currentTestId,
        string? currentVersion,
        string? currentStatus,
        string? currentPhase,
        bool currentTerminal,
        long currentGameplayWrites,
        long currentRawWriteCalls,
        bool currentSameIntentRetry,
        int currentIntentCount)
    {
        return string.Equals(
                currentTestId,
                "pr20-6-mluck-autonomous-live-5m",
                StringComparison.Ordinal)
            && string.Equals(currentVersion, "1.0.0", StringComparison.Ordinal)
            && string.Equals(
                currentStatus,
                "WAITING_FOR_4_CHARACTERS",
                StringComparison.Ordinal)
            && string.Equals(currentPhase, "ROSTER", StringComparison.Ordinal)
            && !currentTerminal
            && currentGameplayWrites == 0
            && currentRawWriteCalls == 0
            && !currentSameIntentRetry
            && currentIntentCount == 0;
    }

    public static V5AutonomousTestManifest ParseAndValidateV5AutonomousTestManifest(string json)
    {
        var manifest = JsonSerializer.Deserialize<V5AutonomousTestManifest>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("V5_TEST_MANIFEST_INVALID");

        if (manifest.SchemaVersion != 1
            || !manifest.Enabled
            || !string.Equals(manifest.Repository, "Riflex91/Riflex91-Repo", StringComparison.Ordinal)
            || !string.Equals(manifest.Branch, "main", StringComparison.Ordinal)
            || !string.Equals(manifest.CoordinatorClass, "merchant", StringComparison.Ordinal)
            || !string.Equals(manifest.WorkerDistribution, "PACKAGE_OWNED_COMMAND_CHARACTER", StringComparison.Ordinal))
            throw new InvalidOperationException("V5_TEST_MANIFEST_SCOPE_INVALID");

        if (!IsLowerHex(manifest.SourceCommit, 40)
            || !IsLowerHex(manifest.PackageSha256, 64))
            throw new InvalidOperationException("V5_TEST_MANIFEST_DIGEST_INVALID");

        var path = (manifest.PackagePath ?? string.Empty).Replace('\\', '/');
        if (!path.StartsWith("v5/werkzeuge/", StringComparison.Ordinal)
            || !path.EndsWith(".js", StringComparison.Ordinal)
            || path.Contains("..", StringComparison.Ordinal)
            || path.Contains("//", StringComparison.Ordinal)
            || path.Length > 180)
            throw new InvalidOperationException("V5_TEST_MANIFEST_PACKAGE_PATH_INVALID");

        if (string.IsNullOrWhiteSpace(manifest.Gate)
            || string.IsNullOrWhiteSpace(manifest.TestId)
            || string.IsNullOrWhiteSpace(manifest.ControllerVersion)
            || string.IsNullOrWhiteSpace(manifest.ExpectedGlobal))
            throw new InvalidOperationException("V5_TEST_MANIFEST_FIELDS_MISSING");

        if (manifest.MaxPackageBytes is < 1024 or > V5AutonomousTestPackageHardMaxBytes)
            throw new InvalidOperationException("V5_TEST_MANIFEST_PACKAGE_LIMIT_INVALID");

        return manifest with { PackagePath = path };
    }

    public static string BuildV5AutonomousTestPackageUrl(V5AutonomousTestManifest manifest) =>
        $"https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/{manifest.SourceCommit}/{manifest.PackagePath}";

    public static bool ShouldDeployV5AutonomousTest(
        string desiredTestId,
        string? currentTestId,
        bool currentTerminal)
    {
        if (string.IsNullOrWhiteSpace(currentTestId)) return true;
        if (string.Equals(currentTestId, desiredTestId, StringComparison.Ordinal)) return false;
        return currentTerminal;
    }

    private async Task<byte[]> DownloadBoundedAsync(
        string url,
        int maximumBytes,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.CacheControl = new System.Net.Http.Headers.CacheControlHeaderValue
        {
            NoCache = true,
            NoStore = true
        };
        using var response = await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        response.EnsureSuccessStatusCode();

        if (response.Content.Headers.ContentLength is long declared && declared > maximumBytes)
            throw new InvalidOperationException("V5_TEST_DOWNLOAD_TOO_LARGE");

        await using var input = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var output = new MemoryStream();
        var buffer = new byte[16 * 1024];
        while (true)
        {
            var read = await input.ReadAsync(buffer, cancellationToken);
            if (read == 0) break;
            if (output.Length + read > maximumBytes)
                throw new InvalidOperationException("V5_TEST_DOWNLOAD_TOO_LARGE");
            output.Write(buffer, 0, read);
        }

        if (output.Length == 0)
            throw new InvalidOperationException("V5_TEST_DOWNLOAD_EMPTY");
        return output.ToArray();
    }

    private static bool IsLowerHex(string? value, int length)
    {
        if (value is null || value.Length != length) return false;
        foreach (var ch in value)
        {
            if (!((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f')))
                return false;
        }
        return true;
    }

    public Task<DebugReadResult> ReadAsync(long afterSeq, int eventLimit, CancellationToken cancellationToken) =>
        ReadAsync(afterSeq, eventLimit, includeDeepDiagnostics: false, cancellationToken);

    public async Task<DebugReadResult> ReadAsync(
        long afterSeq,
        int eventLimit,
        bool includeDeepDiagnostics,
        CancellationToken cancellationToken)
    {
        var targets = await RankTargetsByBotPreferenceAsync(
            await FindTargetsAsync(cancellationToken),
            cancellationToken);
        foreach (var ranked in targets)
        {
            var target = ranked.Target;
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var context = await FindOperationsContextAsync(socket, cancellationToken);
                if (context is null) continue;

                var snapshot = await EvaluateAsync(
                    socket,
                    includeDeepDiagnostics ? DeepSnapshotExpression : SnapshotExpression,
                    context.ContextId,
                    cancellationToken);
                var eventBatch = await EvaluateAsync(socket, BuildEventsExpression(afterSeq, eventLimit), context.ContextId, cancellationToken);

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

        var targets = await RankTargetsByBotPreferenceAsync(
            await FindTargetsAsync(cancellationToken),
            cancellationToken);
        foreach (var ranked in targets)
        {
            var target = ranked.Target;
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var context = await FindOperationsContextAsync(socket, cancellationToken);
                if (context is null) continue;

                var value = await EvaluateAsync(socket, BuildAcknowledgeExpression(maxSeq), context.ContextId, cancellationToken);
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

    private sealed record OperationsContextCandidate(int ContextId, int Priority);
    private sealed record RankedTarget(CdpTarget Target, int Priority);

    public static int OperationsContextPriority(
        bool valid,
        bool hasV5AutonomousTest,
        string? v5Status,
        string? v5Phase,
        string? ctype)
    {
        if (!valid) return 0;
        if (!hasV5AutonomousTest) return 10;

        var status = (v5Status ?? string.Empty).Trim();
        var phase = (v5Phase ?? string.Empty).Trim();
        var characterClass = (ctype ?? string.Empty).Trim();

        if (string.Equals(status, "WORKER", StringComparison.OrdinalIgnoreCase)
            || string.Equals(phase, "HEARTBEAT", StringComparison.OrdinalIgnoreCase))
            return 50;

        if (string.Equals(characterClass, "merchant", StringComparison.OrdinalIgnoreCase))
            return 200;

        return 100;
    }

    private async Task<IReadOnlyList<RankedTarget>> RankTargetsByBotPreferenceAsync(
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
                var context = await FindOperationsContextAsync(socket, cancellationToken);
                if (context is not null)
                    ranked.Add(new RankedTarget(target, context.Priority));
            }
            catch (WebSocketException)
            {
            }
            catch (InvalidOperationException)
            {
            }
        }

        return ranked
            .OrderByDescending(x => x.Priority)
            .ToArray();
    }

    private async Task<OperationsContextCandidate?> FindOperationsContextAsync(
        ClientWebSocket socket,
        CancellationToken cancellationToken)
    {
        var contexts = await CollectAllowedExecutionContextsAsync(socket, cancellationToken);
        OperationsContextCandidate? best = null;
        foreach (var contextId in contexts)
        {
            try
            {
                var probe = await EvaluateAsync(socket, OperationsProbeExpression, contextId, cancellationToken);
                if (probe.ValueKind != JsonValueKind.Object) continue;

                var valid = ReadBoolean(probe, "valid", false);
                var hasV5 = ReadBoolean(probe, "hasV5AutonomousTest", false);
                var status = ReadString(probe, "v5Status");
                var phase = ReadString(probe, "v5Phase");
                var ctype = ReadString(probe, "ctype");
                var priority = OperationsContextPriority(valid, hasV5, status, phase, ctype);
                if (priority <= 0) continue;

                if (best is null || priority > best.Priority)
                    best = new OperationsContextCandidate(contextId, priority);
            }
            catch (InvalidOperationException)
            {
                // Contexts can disappear while Adventure Land changes frames. Try the next allowed context.
            }
        }

        return best;
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

    private static string? ReadString(JsonElement value, string property)
    {
        if (value.ValueKind == JsonValueKind.Object
            && value.TryGetProperty(property, out var node)
            && node.ValueKind == JsonValueKind.String)
            return node.GetString();
        return null;
    }

    private const string V5DeploymentProbeExpression = """
    (() => {
      let ctype = '';
      try {
        const character = globalThis.character
          || (globalThis.parent && globalThis.parent.character)
          || null;
        ctype = String(character && character.ctype || '').toLowerCase();
      } catch {}

      let current = null;
      try {
        const aio = globalThis.AIO_V3
          || (globalThis.parent && globalThis.parent.AIO_V3)
          || null;
        const operations = aio && aio.operations;
        const status = typeof operations?.status === 'function' ? operations.status() : null;
        current = status && status.v5AutonomousTest && typeof status.v5AutonomousTest === 'object'
          ? status.v5AutonomousTest
          : null;
      } catch {}

      let desiredApiVersion = null;
      try {
        const api = globalThis.V5PR206MluckTest
          || (globalThis.parent && globalThis.parent.V5PR206MluckTest)
          || null;
        desiredApiVersion = api && typeof api.version === 'string' ? api.version : null;
      } catch {}

      return {
        ctype,
        currentTestId: current ? String(current.testId || '') : null,
        currentVersion: current ? String(current.version || '') : null,
        currentStatus: current ? String(current.status || '') : null,
        currentPhase: current ? String(current.phase || '') : null,
        currentTerminal: current ? current.terminal === true : false,
        currentGameplayWrites: current ? Math.max(0, Number(current.gameplayWrites) || 0) : null,
        currentRawWriteCalls: current ? Math.max(0, Number(current.rawWriteCalls) || 0) : null,
        currentSameIntentRetry: current ? current.sameIntentRetry === true : null,
        currentIntentCount: current && Array.isArray(current.intents) ? current.intents.length : 0,
        desiredApiVersion
      };
    })()
    """;

    private const string V5LegacyPr206RosterRecoveryExpression = """
    (() => {
      const TARGET_TEST_ID = 'pr20-6-mluck-autonomous-live-5m';
      const LEGACY_VERSION = '1.0.0';
      const REQUIRED_CLASSES = ['ranger', 'priest', 'mage'];
      const ACTIVE_STATES = new Set(['self', 'starting', 'loading', 'active', 'code']);

      const local = globalThis;
      let host = globalThis;
      try {
        if (globalThis.parent && globalThis.parent !== globalThis)
          host = globalThis.parent;
      } catch {}

      const bind = (name) => {
        if (local && typeof local[name] === 'function')
          return { fn: local[name], owner: local };
        if (host && typeof host[name] === 'function')
          return { fn: host[name], owner: host };
        return null;
      };

      let character = null;
      try { character = local.character || host.character || null; } catch {}
      if (String(character && character.ctype || '').toLowerCase() !== 'merchant')
        return { state: 'NOT_MERCHANT', startedCount: 0, started: [], blockers: ['NOT_MERCHANT'] };

      let current = null;
      try {
        const aio = local.AIO_V3 || host.AIO_V3 || null;
        const operations = aio && aio.operations;
        const status = typeof operations?.status === 'function' ? operations.status() : null;
        current = status && status.v5AutonomousTest && typeof status.v5AutonomousTest === 'object'
          ? status.v5AutonomousTest
          : null;
      } catch {}

      const safe = !!current
        && String(current.testId || '') === TARGET_TEST_ID
        && String(current.version || '') === LEGACY_VERSION
        && String(current.status || '') === 'WAITING_FOR_4_CHARACTERS'
        && String(current.phase || '') === 'ROSTER'
        && current.terminal !== true
        && (Number(current.gameplayWrites) || 0) === 0
        && (Number(current.rawWriteCalls) || 0) === 0
        && current.sameIntentRetry !== true
        && (!Array.isArray(current.intents) || current.intents.length === 0);
      if (!safe)
        return { state: 'STATE_CHANGED_BLOCKED', startedCount: 0, started: [], blockers: ['STATE_CHANGED_BLOCKED'] };

      const getCharacters = bind('get_characters');
      const getActive = bind('get_active_characters');
      const startCharacter = bind('start_character');
      if (!getCharacters || !getActive || !startCharacter)
        return { state: 'LIFECYCLE_API_UNAVAILABLE', startedCount: 0, started: [], blockers: ['LIFECYCLE_API_UNAVAILABLE'] };

      let accountRaw = null;
      let activeRaw = null;
      try {
        accountRaw = getCharacters.fn.call(getCharacters.owner);
        activeRaw = getActive.fn.call(getActive.owner);
      } catch {
        return { state: 'ROSTER_READ_FAILED', startedCount: 0, started: [], blockers: ['ROSTER_READ_FAILED'] };
      }

      const accountRows = Array.isArray(accountRaw)
        ? accountRaw
        : (accountRaw && typeof accountRaw === 'object' ? Object.values(accountRaw) : []);
      const active = activeRaw && typeof activeRaw === 'object' ? activeRaw : {};
      const started = [];
      const blockers = [];

      for (const ctype of REQUIRED_CLASSES) {
        const matches = accountRows.filter((row) =>
          row
          && typeof row === 'object'
          && String(row.name || '').trim()
          && String(row.ctype || row.type || '').toLowerCase() === ctype);
        if (matches.length !== 1) {
          blockers.push('ACCOUNT_' + ctype.toUpperCase() + (matches.length ? '_MEHRDEUTIG' : '_FEHLT'));
          continue;
        }

        const name = String(matches[0].name || '').trim();
        if (ACTIVE_STATES.has(String(active[name] || '')))
          continue;

        try {
          const result = startCharacter.fn.call(startCharacter.owner, name);
          if (result && typeof result.catch === 'function')
            result.catch(() => {});
          started.push(name);
        } catch {
          blockers.push('START_' + ctype.toUpperCase() + '_FAILED');
        }
      }

      return {
        state: blockers.length
          ? (started.length ? 'START_REQUESTED_WITH_BLOCKERS' : 'BLOCKED')
          : (started.length ? 'START_REQUESTED' : 'ROSTER_ALREADY_LOCAL'),
        startedCount: started.length,
        started,
        blockers
      };
    })()
    """;

    private const string OperationsProbeExpression = """
    (() => {
      const aio = globalThis.AIO_V3;
      const operations = aio && aio.operations;
      const valid = !!operations
        && typeof operations === 'object'
        && typeof operations.status === 'function'
        && typeof operations.hostHeartbeat === 'function'
        && typeof operations.reconciliationStatus === 'function'
        && typeof operations.peekTelemetry === 'function';
      if (!valid) {
        return {
          valid: false,
          hasV5AutonomousTest: false,
          v5Status: null,
          v5Phase: null,
          ctype: null
        };
      }

      let status = null;
      try { status = operations.status(); } catch {}
      const v5 = status && status.v5AutonomousTest && typeof status.v5AutonomousTest === 'object'
        ? status.v5AutonomousTest
        : null;

      let ctype = '';
      try {
        const character = globalThis.character
          || (globalThis.parent && globalThis.parent.character)
          || null;
        ctype = String(character && character.ctype || '').toLowerCase();
      } catch {}

      return {
        valid: true,
        hasV5AutonomousTest: !!v5,
        v5Status: v5 ? String(v5.status || '') : null,
        v5Phase: v5 ? String(v5.phase || '') : null,
        ctype
      };
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

public sealed record V5AutonomousTestManifest(
    int SchemaVersion,
    bool Enabled,
    string Repository,
    string Branch,
    string Gate,
    string TestId,
    string ControllerVersion,
    string CoordinatorClass,
    string WorkerDistribution,
    string SourceCommit,
    string PackagePath,
    string PackageSha256,
    int MaxPackageBytes,
    string ExpectedGlobal,
    bool NormalRuntimeAllowed);

public sealed record V5AutonomousTestDeploymentResult(
    string State,
    bool Changed,
    string TestId,
    string? TargetUrl);

public sealed record V5LegacyRosterRecoveryResult(
    string State,
    bool Changed,
    int StartedCount,
    string? TestId,
    string? TargetUrl);

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
