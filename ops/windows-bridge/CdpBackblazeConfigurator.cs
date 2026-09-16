using System.Net.WebSockets;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record BackblazeProfileResult(bool Applied, int ContextsConfigured, string? TargetUrl);

public sealed class CdpBackblazeConfigurator
{
    public const string GlobalConfigName = "AIO_V3_BACKBLAZE_CONFIG";

    private readonly HttpClient _httpClient;
    private readonly Uri _cdpEndpoint;
    private readonly Uri _allowedOrigin;
    private int _nextCommandId;

    public CdpBackblazeConfigurator(HttpClient httpClient, BridgeConfig config)
    {
        _httpClient = httpClient;
        _cdpEndpoint = new Uri(config.CdpEndpoint.TrimEnd('/') + "/");
        _allowedOrigin = new Uri(config.AllowedOrigin);
    }

    public Task<BackblazeProfileResult> ApplyAsync(
        string endpoint,
        string region,
        string bucket,
        string prefix,
        BackblazeCredentials credentials,
        CancellationToken cancellationToken)
    {
        if (credentials is not { IsValid: true })
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_INVALID");

        var candidate = new BridgeConfig
        {
            BackblazeEnabled = true,
            BackblazeEndpoint = endpoint,
            BackblazeRegion = region,
            BackblazeBucket = bucket,
            BackblazePrefix = prefix
        };
        candidate.Validate();

        return EvaluateAcrossAllowedContextsAsync(
            BuildApplyExpression(endpoint, region, bucket, prefix, credentials),
            cancellationToken);
    }

    public Task<BackblazeProfileResult> ClearAsync(CancellationToken cancellationToken) =>
        EvaluateAcrossAllowedContextsAsync(ClearExpression, cancellationToken);

    private async Task<BackblazeProfileResult> EvaluateAcrossAllowedContextsAsync(
        string expression,
        CancellationToken cancellationToken)
    {
        var targets = await FindTargetsAsync(cancellationToken);
        var applied = 0;
        string? targetUrl = null;
        Exception? lastError = null;

        foreach (var target in targets)
        {
            using var socket = new ClientWebSocket();
            try
            {
                await socket.ConnectAsync(new Uri(target.WebSocketDebuggerUrl), cancellationToken);
                var contexts = await CollectAllowedExecutionContextsAsync(socket, cancellationToken);
                foreach (var contextId in contexts)
                {
                    try
                    {
                        var result = await EvaluateAsync(socket, expression, contextId, cancellationToken);
                        if (result.ValueKind == JsonValueKind.True)
                        {
                            applied++;
                            targetUrl ??= target.Url;
                        }
                    }
                    catch (InvalidOperationException error)
                    {
                        lastError = error;
                    }
                }
            }
            catch (WebSocketException error)
            {
                lastError = error;
            }
            catch (InvalidOperationException error)
            {
                lastError = error;
            }
        }

        if (applied == 0)
        {
            var detail = lastError is null ? "NO_ALLOWED_CONTEXT" : Bounded(lastError.Message);
            throw new InvalidOperationException("BACKBLAZE_PROFILE_APPLY_FAILED:" + detail);
        }

        return new BackblazeProfileResult(true, applied, targetUrl);
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

    private async Task<IReadOnlyList<int>> CollectAllowedExecutionContextsAsync(
        ClientWebSocket socket,
        CancellationToken cancellationToken)
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
            {
                continue;
            }

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
            if (stream.Length > 256 * 1024)
                throw new InvalidOperationException("CDP_RESPONSE_TOO_LARGE");
            if (result.EndOfMessage) break;
        }
        return JsonDocument.Parse(stream.ToArray());
    }

    private static string BuildApplyExpression(
        string endpoint,
        string region,
        string bucket,
        string prefix,
        BackblazeCredentials credentials)
    {
        var endpointLiteral = JsonSerializer.Serialize(endpoint.TrimEnd('/'));
        var regionLiteral = JsonSerializer.Serialize(region);
        var bucketLiteral = JsonSerializer.Serialize(bucket);
        var prefixLiteral = JsonSerializer.Serialize(prefix.Trim('/'));
        var keyIdLiteral = JsonSerializer.Serialize(credentials.KeyId);
        var applicationKeyLiteral = JsonSerializer.Serialize(credentials.ApplicationKey);

        return $$"""
        (() => {
          const config = Object.freeze({
            schemaVersion: 1,
            provider: 'backblaze-b2',
            endpoint: {{endpointLiteral}},
            region: {{regionLiteral}},
            bucket: {{bucketLiteral}},
            prefix: {{prefixLiteral}},
            keyId: {{keyIdLiteral}},
            applicationKey: {{applicationKeyLiteral}}
          });
          globalThis.AIO_V3_BACKBLAZE_CONFIG = config;
          return true;
        })()
        """;
    }

    private const string ClearExpression = """
    (() => {
      try { delete globalThis.AIO_V3_BACKBLAZE_CONFIG; }
      catch (_) { globalThis.AIO_V3_BACKBLAZE_CONFIG = undefined; }
      return true;
    })()
    """;

    private static bool SameOrigin(Uri left, Uri right) =>
        string.Equals(left.Scheme, right.Scheme, StringComparison.OrdinalIgnoreCase)
        && string.Equals(left.Host, right.Host, StringComparison.OrdinalIgnoreCase)
        && left.Port == right.Port;

    private static string Bounded(string value) => value.Length <= 256 ? value : value[..256];

    private sealed record CdpTarget
    {
        public string Type { get; init; } = string.Empty;
        public string Url { get; init; } = string.Empty;
        public string WebSocketDebuggerUrl { get; init; } = string.Empty;
    }
}
