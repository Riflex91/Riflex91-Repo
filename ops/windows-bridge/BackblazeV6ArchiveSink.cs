using System.Globalization;
using System.IO.Compression;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record BackblazeV6ArchiveResult(
    bool Stored,
    bool Verified,
    string Bucket,
    string Key,
    long Bytes,
    string Sha256,
    string? VersionId);

/// <summary>
/// Host-side AL Bot V6 archive transport for the existing Backblaze B2 bucket.
/// Credentials never enter Adventure Land or the browser runtime.
/// </summary>
public sealed class BackblazeV6ArchiveSink
{
    public const string ArchiveType = "ALBOT_V6_ARCHIVE_BATCH";
    public const string SelfTestType = "ALBOT_V6_BACKBLAZE_SELF_TEST";
    public const int SnapshotArchiveIntervalSeconds = 300;
    public const int MaxCompressedPayloadBytes = 2 * 1024 * 1024;
    public const string HashMetadataHeader = "x-amz-meta-aio-sha256";

    private const string EmptySha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    private readonly HttpClient _httpClient;
    private readonly BridgeConfig _config;
    private readonly BackblazeCredentials _credentials;

    public BackblazeV6ArchiveSink(
        HttpClient httpClient,
        BridgeConfig config,
        BackblazeCredentials credentials)
    {
        if (!config.BackblazeEnabled)
            throw new InvalidOperationException("BACKBLAZE_V6_DISABLED");
        if (credentials is not { IsValid: true })
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_INVALID");

        config.Validate();
        _httpClient = httpClient;
        _config = config;
        _credentials = credentials;
    }

    public static bool ShouldArchive(
        DebugReadResult read,
        DateTimeOffset? lastArchiveAt,
        DateTimeOffset now)
    {
        if (read.EventCount > 0) return true;
        if (!lastArchiveAt.HasValue) return true;
        return now - lastArchiveAt.Value >= TimeSpan.FromSeconds(SnapshotArchiveIntervalSeconds);
    }

    public async Task<BackblazeV6ArchiveResult> ArchiveAsync(
        DebugReadResult read,
        CancellationToken cancellationToken)
    {
        var observedAt = DateTimeOffset.UtcNow;
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            schemaVersion = 1,
            type = ArchiveType,
            product = CdpAlBotV6Client.Product,
            generation = CdpAlBotV6Client.Generation,
            bridgeProtocol = CdpAlBotV6Client.Protocol,
            botId = _config.BotId,
            observedAt,
            requestedAfterSeq = read.RequestedAfterSeq,
            effectiveAfterSeq = read.EffectiveAfterSeq,
            maxSeq = read.MaxSeq,
            lastCapturedSeq = read.LastCapturedSeq,
            hasMoreEvents = read.HasMoreEvents,
            targetUrl = read.TargetUrl,
            snapshot = read.Snapshot,
            events = read.Events
        }, BridgeConfig.JsonOptions);

        var compressed = await GzipAsync(payload, cancellationToken);
        if (compressed.Length > MaxCompressedPayloadBytes)
            throw new InvalidOperationException("BACKBLAZE_V6_ARCHIVE_PAYLOAD_TOO_LARGE");

        var relativeKey =
            $"telemetry/{observedAt:yyyy/MM/dd}/{SafePathSegment(_config.BotId)}/" +
            $"{observedAt:HHmmssfff}-{Math.Max(0, read.EffectiveAfterSeq)}-{Math.Max(0, read.MaxSeq)}-{Guid.NewGuid():N}.json.gz";

        return await PutAndVerifyAsync(
            relativeKey,
            compressed,
            "application/json",
            "gzip",
            cancellationToken);
    }

    public async Task<BackblazeV6ArchiveResult> SelfTestAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var body = JsonSerializer.SerializeToUtf8Bytes(new
        {
            schemaVersion = 1,
            type = SelfTestType,
            product = CdpAlBotV6Client.Product,
            generation = CdpAlBotV6Client.Generation,
            bridgeProtocol = CdpAlBotV6Client.Protocol,
            botId = _config.BotId,
            createdAt = now
        }, BridgeConfig.JsonOptions);

        var relativeKey = $"_health/{now:yyyy/MM/dd}/{now:HHmmssfff}-{Guid.NewGuid():N}.json";
        return await PutAndVerifyAsync(relativeKey, body, "application/json", null, cancellationToken);
    }

    private async Task<BackblazeV6ArchiveResult> PutAndVerifyAsync(
        string relativeKey,
        byte[] body,
        string contentType,
        string? contentEncoding,
        CancellationToken cancellationToken)
    {
        var sha256 = Sha256Hex(body);
        var key = ObjectKey(relativeKey);
        var target = ObjectUri(key);

        using (var request = CreateSignedRequest(
            HttpMethod.Put,
            target,
            body,
            contentType,
            contentEncoding,
            sha256,
            DateTimeOffset.UtcNow))
        using (var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken))
        {
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(ClassifyFailure("PUT", response.StatusCode));
        }

        using var headRequest = CreateSignedRequest(
            HttpMethod.Head,
            target,
            null,
            null,
            null,
            null,
            DateTimeOffset.UtcNow);
        using var headResponse = await _httpClient.SendAsync(headRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!headResponse.IsSuccessStatusCode)
            throw new InvalidOperationException(ClassifyFailure("HEAD", headResponse.StatusCode));

        var length = headResponse.Content.Headers.ContentLength;
        if (length != body.LongLength)
            throw new InvalidOperationException("BACKBLAZE_V6_VERIFY_SIZE_MISMATCH");

        var storedHash = HeaderValue(headResponse, HashMetadataHeader);
        if (string.IsNullOrWhiteSpace(storedHash))
            throw new InvalidOperationException("BACKBLAZE_V6_VERIFY_HASH_MISSING");
        if (!string.Equals(storedHash, sha256, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("BACKBLAZE_V6_VERIFY_HASH_MISMATCH");

        return new BackblazeV6ArchiveResult(
            Stored: true,
            Verified: true,
            Bucket: _config.BackblazeBucket,
            Key: key,
            Bytes: body.LongLength,
            Sha256: sha256,
            VersionId: HeaderValue(headResponse, "x-amz-version-id"));
    }

    private HttpRequestMessage CreateSignedRequest(
        HttpMethod method,
        Uri target,
        byte[]? body,
        string? contentType,
        string? contentEncoding,
        string? metadataSha256,
        DateTimeOffset now)
    {
        var payloadHash = body is null ? EmptySha256 : Sha256Hex(body);
        var timestamp = now.UtcDateTime.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);
        var dateStamp = timestamp[..8];

        var signedHeaders = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["host"] = target.Authority,
            ["x-amz-content-sha256"] = payloadHash,
            ["x-amz-date"] = timestamp
        };
        if (!string.IsNullOrWhiteSpace(contentType))
            signedHeaders["content-type"] = NormalizeHeaderValue(contentType);
        if (!string.IsNullOrWhiteSpace(contentEncoding))
            signedHeaders["content-encoding"] = NormalizeHeaderValue(contentEncoding);
        if (!string.IsNullOrWhiteSpace(metadataSha256))
            signedHeaders[HashMetadataHeader] = NormalizeHeaderValue(metadataSha256);

        var canonicalHeaders = string.Concat(signedHeaders.Select(pair => $"{pair.Key}:{pair.Value}\n"));
        var signedHeaderNames = string.Join(';', signedHeaders.Keys);
        var canonicalRequest = string.Join("\n",
            method.Method.ToUpperInvariant(),
            target.AbsolutePath,
            string.Empty,
            canonicalHeaders,
            signedHeaderNames,
            payloadHash);

        var credentialScope = $"{dateStamp}/{_config.BackblazeRegion}/s3/aws4_request";
        var stringToSign = string.Join("\n",
            "AWS4-HMAC-SHA256",
            timestamp,
            credentialScope,
            Sha256Hex(Encoding.UTF8.GetBytes(canonicalRequest)));

        var dateKey = Hmac(Encoding.UTF8.GetBytes("AWS4" + _credentials.ApplicationKey), dateStamp);
        var regionKey = Hmac(dateKey, _config.BackblazeRegion);
        var serviceKey = Hmac(regionKey, "s3");
        var signingKey = Hmac(serviceKey, "aws4_request");
        string signature;
        try
        {
            signature = Convert.ToHexString(Hmac(signingKey, stringToSign)).ToLowerInvariant();
        }
        finally
        {
            CryptographicOperations.ZeroMemory(dateKey);
            CryptographicOperations.ZeroMemory(regionKey);
            CryptographicOperations.ZeroMemory(serviceKey);
            CryptographicOperations.ZeroMemory(signingKey);
        }

        var authorization =
            $"AWS4-HMAC-SHA256 Credential={_credentials.KeyId}/{credentialScope}, " +
            $"SignedHeaders={signedHeaderNames}, Signature={signature}";

        var request = new HttpRequestMessage(method, target);
        request.Headers.Host = target.Authority;
        request.Headers.TryAddWithoutValidation("x-amz-content-sha256", payloadHash);
        request.Headers.TryAddWithoutValidation("x-amz-date", timestamp);
        request.Headers.TryAddWithoutValidation("Authorization", authorization);
        if (!string.IsNullOrWhiteSpace(metadataSha256))
            request.Headers.TryAddWithoutValidation(HashMetadataHeader, metadataSha256);

        if (body is not null)
        {
            var content = new ByteArrayContent(body);
            if (!string.IsNullOrWhiteSpace(contentType))
                content.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
            if (!string.IsNullOrWhiteSpace(contentEncoding))
                content.Headers.ContentEncoding.Add(contentEncoding);
            request.Content = content;
        }

        return request;
    }

    private string ObjectKey(string relativeKey)
    {
        var safeRelative = ValidateRelativeKey(relativeKey);
        var prefix = _config.BackblazePrefix.Trim('/');
        return prefix.Length == 0 ? safeRelative : $"{prefix}/{safeRelative}";
    }

    private Uri ObjectUri(string key)
    {
        var path = "/" + Rfc3986(_config.BackblazeBucket) + "/" +
            string.Join("/", key.Split('/').Select(Rfc3986));
        return new Uri(_config.BackblazeEndpoint.TrimEnd('/') + path, UriKind.Absolute);
    }

    private static string ValidateRelativeKey(string value)
    {
        var key = (value ?? string.Empty).Trim().TrimStart('/');
        if (key.Length == 0 || key.Length > 1024 || key.Any(char.IsControl))
            throw new InvalidOperationException("BACKBLAZE_V6_OBJECT_KEY_INVALID");
        var parts = key.Split('/');
        if (parts.Any(part => part.Length == 0 || part is "." or ".."))
            throw new InvalidOperationException("BACKBLAZE_V6_OBJECT_KEY_INVALID");
        return key;
    }

    private static string SafePathSegment(string value)
    {
        var safe = new string((value ?? string.Empty)
            .Select(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_' ? ch : '-')
            .ToArray()).Trim('-');
        return safe.Length == 0 ? "albot-v6" : safe[..Math.Min(100, safe.Length)];
    }

    private static string Rfc3986(string value) =>
        Uri.EscapeDataString(value ?? string.Empty)
            .Replace("!", "%21", StringComparison.Ordinal)
            .Replace("'", "%27", StringComparison.Ordinal)
            .Replace("(", "%28", StringComparison.Ordinal)
            .Replace(")", "%29", StringComparison.Ordinal)
            .Replace("*", "%2A", StringComparison.Ordinal);

    private static string NormalizeHeaderValue(string value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static byte[] Hmac(byte[] key, string data)
    {
        using var hmac = new HMACSHA256(key);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
    }

    private static string Sha256Hex(byte[] data) =>
        Convert.ToHexString(SHA256.HashData(data)).ToLowerInvariant();

    private static async Task<byte[]> GzipAsync(byte[] input, CancellationToken cancellationToken)
    {
        using var output = new MemoryStream();
        await using (var gzip = new GZipStream(output, CompressionLevel.SmallestSize, leaveOpen: true))
        {
            await gzip.WriteAsync(input, cancellationToken);
        }
        return output.ToArray();
    }

    private static string? HeaderValue(HttpResponseMessage response, string name)
    {
        if (response.Headers.TryGetValues(name, out var values))
            return values.FirstOrDefault();
        if (response.Content.Headers.TryGetValues(name, out var contentValues))
            return contentValues.FirstOrDefault();
        return null;
    }

    private static string ClassifyFailure(string operation, System.Net.HttpStatusCode status)
    {
        var code = (int)status;
        var category = code is 401 or 403
            ? "AUTH_OR_PERMISSION"
            : code == 404
                ? "NOT_FOUND"
                : code >= 500
                    ? "PROVIDER_UNAVAILABLE"
                    : "REQUEST_REJECTED";
        return $"BACKBLAZE_V6_{operation}_{category}:HTTP_{code}";
    }
}
