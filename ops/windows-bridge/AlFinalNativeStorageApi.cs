using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace AioBotWindowsBridge;

// Only an explicitly enabled Bridge instance listens on loopback. This native
// API replaces the Node.js SSD KV dependency, but telemetry remains separate
// until the remaining endpoints are migrated.
public sealed class AlFinalNativeKeyValueStore
{
    public const string DefaultRoot = @"D:\ALBot\state\durable-kv";
    public const int MaximumValueBytes = 3 * 1024 * 1024;
    private readonly string _root;
    private readonly object _gate = new();

    public AlFinalNativeKeyValueStore(string? root = null)
    {
        _root = Path.GetFullPath(root ?? DefaultRoot);
        Directory.CreateDirectory(_root);
    }

    public static void ValidateKey(string? key)
    {
        if (string.IsNullOrEmpty(key) || key.Length > 240
            || !Regex.IsMatch(key, @"^(albot:|aio-v3-content-drift-v1(?::|$)|cstore_AIO_V3_WORLD_MODEL$)")
            || key.Any(char.IsControl))
            throw new InvalidOperationException("SSD_KEY_INVALID");
    }

    private string FileForKey(string key)
    {
        ValidateKey(key);
        var sha = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key)))
            .ToLowerInvariant();
        return Path.Combine(_root, sha[..2], sha + ".json");
    }

    public (bool Found, string? Value, int Revision, long? ExpiresAtMs) Read(string key)
    {
        lock (_gate) return ReadLocked(key);
    }

    private (bool Found, string? Value, int Revision, long? ExpiresAtMs) ReadLocked(string key)
    {
        var file = FileForKey(key);
        if (!File.Exists(file)) return (false, null, 0, null);
        using var json = JsonDocument.Parse(File.ReadAllBytes(file));
        var root = json.RootElement;
        if (root.ValueKind != JsonValueKind.Object
            || !root.TryGetProperty("schemaVersion", out var schema)
            || schema.GetInt32() != 1
            || !root.TryGetProperty("key", out var savedKey)
            || savedKey.GetString() != key
            || !root.TryGetProperty("value", out var value)
            || value.ValueKind != JsonValueKind.String
            || !root.TryGetProperty("revision", out var revision)
            || !revision.TryGetInt32(out var rev) || rev < 1)
            throw new InvalidDataException("SSD_RECORD_CORRUPT");
        long? expiry = null;
        if (root.TryGetProperty("expiresAtMs", out var expiryField)
            && expiryField.ValueKind != JsonValueKind.Null)
        {
            if (!expiryField.TryGetInt64(out var timestamp))
                throw new InvalidDataException("SSD_EXPIRY_INVALID");
            expiry = timestamp;
        }
        return expiry.HasValue && DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() > expiry
            ? (false, null, rev, expiry)
            : (true, value.GetString(), rev, expiry);
    }

    public int Write(string key, string value, int? expectedRevision = null, long? expiresAtMs = null)
    {
        lock (_gate)
        {
            var file = FileForKey(key);
            if (value is null || Encoding.UTF8.GetByteCount(value) > MaximumValueBytes)
                throw new InvalidOperationException("SSD_VALUE_INVALID_OR_OVERSIZE");
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (expiresAtMs.HasValue && (expiresAtMs < now || expiresAtMs > now + 7L * 86400000))
                throw new InvalidOperationException("SSD_EXPIRY_INVALID");
            var prior = ReadLocked(key);
            if (expectedRevision.HasValue && expectedRevision != prior.Revision)
                throw new InvalidOperationException("SSD_REVISION_CONFLICT");

            var payload = JsonSerializer.SerializeToUtf8Bytes(new
            {
                schemaVersion = 1, key, value,
                revision = prior.Revision + 1,
                savedAtMs = now, expiresAtMs
            });
            Directory.CreateDirectory(Path.GetDirectoryName(file)!);
            var temp = file + ".tmp-" + Guid.NewGuid().ToString("N");
            try
            {
                using (var stream = new FileStream(temp, FileMode.CreateNew,
                    FileAccess.Write, FileShare.None, 64 * 1024, FileOptions.WriteThrough))
                {
                    stream.Write(payload);
                    stream.Flush(flushToDisk: true);
                }
                File.Move(temp, file, overwrite: true);
            }
            finally
            {
                if (File.Exists(temp)) File.Delete(temp);
            }
            return prior.Revision + 1;
        }
    }

    public bool Remove(string key)
    {
        lock (_gate)
        {
            var file = FileForKey(key);
            if (!File.Exists(file)) return false;
            File.Delete(file);
            return true;
        }
    }
}

public sealed class AlFinalNativeStorageApi : IAsyncDisposable
{
    public const int DefaultPort = 17392;
    private readonly AlFinalNativeKeyValueStore _store;
    private readonly int _port;
    private WebApplication? _server;

    public AlFinalNativeStorageApi(AlFinalNativeKeyValueStore? store = null, int port = DefaultPort)
    {
        if (port is < 1 or > 65535) throw new ArgumentOutOfRangeException(nameof(port));
        _store = store ?? new AlFinalNativeKeyValueStore();
        _port = port;
    }

    public static bool AllowedOrigin(string? origin)
    {
        return string.IsNullOrEmpty(origin)
            || origin == "https://adventure.land"
            || origin == "https://www.adventure.land"
            || Regex.IsMatch(origin, @"^https://[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.adventure\.land$");
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (_server is not null) throw new InvalidOperationException("SSD_SERVER_ALREADY_STARTED");
        var builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseKestrel(options =>
        {
            options.Listen(IPAddress.Loopback, _port);
            options.Limits.MaxRequestBodySize = 4 * 1024 * 1024;
        });
        var server = builder.Build();
        server.Use(async (context, next) =>
        {
            // Origin allowlisting is defense in depth. The server binds to
            // 127.0.0.1 only and never exposes a generic filesystem endpoint.
            if (context.Request.Host.Host != "127.0.0.1"
                || context.Request.Host.Port != _port
                || !AllowedOrigin(context.Request.Headers.Origin.ToString()))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return;
            }
            var origin = context.Request.Headers.Origin.ToString();
            if (!string.IsNullOrEmpty(origin))
                context.Response.Headers.AccessControlAllowOrigin = origin;
            context.Response.Headers.AccessControlAllowMethods = "GET,POST,DELETE,OPTIONS";
            context.Response.Headers.AccessControlAllowHeaders = "Content-Type";
            context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
            context.Response.Headers["Cache-Control"] = "no-store";
            if (HttpMethods.IsOptions(context.Request.Method))
            {
                context.Response.StatusCode = StatusCodes.Status204NoContent;
                return;
            }
            await next();
        });
        server.MapGet("/v1/state/account", () =>
        {
            try { return Results.Json(new AlFinalNativeAccountSnapshot().ReadAccount()); }
            catch (Exception error) when (error is InvalidDataException or JsonException or IOException)
            {
                return Results.Json(new { ok = false, error = "ACCOUNT_SSD_READ_FAILED" },
                    statusCode: 503);
            }
        });
        // No native state POST until the old Node account writer is disabled.
        server.MapPost("/v1/state/account", () =>
            Results.Json(new { ok = false, error = "ACCOUNT_NATIVE_WRITE_NOT_ENABLED" },
                statusCode: 423));

        server.MapGet("/health", () => Results.Json(new
        {
            ok = true, service = "ALFinal Windows Bridge native SSD", schemaVersion = 1,
            processId = Environment.ProcessId, durableStore = new
            {
                schemaVersion = 1, maxValueBytes = AlFinalNativeKeyValueStore.MaximumValueBytes
            }
        }));
        server.MapMethods("/v1/storage", ["GET", "POST", "DELETE"], async (HttpContext ctx) =>
        {
            try
            {
                var key = ctx.Request.Query["key"].ToString();
                AlFinalNativeKeyValueStore.ValidateKey(key);
                if (HttpMethods.IsGet(ctx.Request.Method))
                {
                    var row = _store.Read(key);
                    return Results.Json(new { ok = true, found = row.Found,
                        value = row.Value, revision = row.Revision,
                        expiresAtMs = row.ExpiresAtMs });
                }
                if (HttpMethods.IsDelete(ctx.Request.Method))
                    return Results.Json(new { ok = true, removed = _store.Remove(key) });
                using var doc = await JsonDocument.ParseAsync(ctx.Request.Body,
                    new JsonDocumentOptions { MaxDepth = 16 }, ctx.RequestAborted);
                var body = doc.RootElement;
                if (body.ValueKind != JsonValueKind.Object
                    || !body.TryGetProperty("key", out var bodyKey)
                    || bodyKey.GetString() != key
                    || !body.TryGetProperty("value", out var data)
                    || data.ValueKind != JsonValueKind.String)
                    throw new InvalidOperationException("SSD_WRITE_PAYLOAD_INVALID");
                int? rev = null;
                if (body.TryGetProperty("expectedRevision", out var expected)
                    && expected.ValueKind != JsonValueKind.Null)
                    rev = expected.GetInt32();
                long? expiry = null;
                if (body.TryGetProperty("expiresAtMs", out var ttl)
                    && ttl.ValueKind != JsonValueKind.Null)
                    expiry = ttl.GetInt64();
                var result = _store.Write(key, data.GetString()!, rev, expiry);
                return Results.Json(new { ok = true, revision = result });
            }
            catch (InvalidOperationException e)
            {
                return Results.Json(new { ok = false, error = e.Message },
                    statusCode: e.Message == "SSD_REVISION_CONFLICT" ? 409 : 400);
            }
            catch (JsonException)
            {
                return Results.Json(new { ok = false, error = "SSD_WRITE_PAYLOAD_INVALID" },
                    statusCode: 400);
            }
            catch (InvalidDataException)
            {
                return Results.Json(new { ok = false, error = "SSD_RECORD_CORRUPT" },
                    statusCode: 503);
            }
        });
        try
        {
            await server.StartAsync(cancellationToken);
            _server = server;
        }
        catch
        {
            await server.DisposeAsync();
            throw;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_server is null) return;
        var server = _server;
        _server = null;
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await server.StopAsync(cancellation.Token);
        await server.DisposeAsync();
    }
}
