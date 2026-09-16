using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record ProblemMirrorFlushResult(int Uploaded, string Reason, string? Error = null);

internal sealed record ProblemMirrorMetadata(
    int SchemaVersion,
    string BundleId,
    string BotId,
    string CapturedAt,
    string Day,
    string Severity,
    string Reason,
    string Sha256,
    long Bytes,
    string Filename);

public sealed class SupabaseProblemDiagnosticsSink
{
    public const int MaxPayloadBytes = 700 * 1024;

    private readonly HttpClient _httpClient;
    private readonly BridgeConfig _config;
    private readonly string _token;

    public SupabaseProblemDiagnosticsSink(HttpClient httpClient, BridgeConfig config, string token)
    {
        _httpClient = httpClient;
        _config = config;
        _token = token;
    }

    public byte[] SerializePayload(JsonElement bundle, ProblemMirrorMetadata metadata, string expectedRemotePath)
    {
        var payload = new
        {
            schemaVersion = 1,
            type = "AIO_V3_PROBLEM_DIAGNOSTICS_MIRROR",
            botId = _config.BotId,
            archive = new
            {
                provider = "ftps",
                sha256 = metadata.Sha256,
                bytes = metadata.Bytes,
                filename = metadata.Filename,
                remotePath = expectedRemotePath
            },
            bundle
        };
        var bytes = JsonSerializer.SerializeToUtf8Bytes(payload, BridgeConfig.JsonOptions);
        if (!IsWithinPayloadBudget(bytes.LongLength))
            throw new InvalidOperationException("PROBLEM_MIRROR_PAYLOAD_TOO_LARGE");
        return bytes;
    }

    public async Task SendPayloadAsync(byte[] payload, CancellationToken cancellationToken = default)
    {
        if (!IsWithinPayloadBudget(payload.LongLength))
            throw new InvalidOperationException("PROBLEM_MIRROR_PAYLOAD_TOO_LARGE");

        using var request = new HttpRequestMessage(HttpMethod.Post, _config.TelemetryIngestUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        request.Headers.TryAddWithoutValidation("x-aio-v3-bot-id", _config.BotId);
        request.Content = new ByteArrayContent(payload);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json") { CharSet = "utf-8" };

        using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new InvalidOperationException($"PROBLEM_MIRROR_HTTP_{(int)response.StatusCode}:{Bounded(body, 240)}");
    }

    public static bool IsWithinPayloadBudget(long bytes) => bytes is > 0 and <= MaxPayloadBytes;

    private static string Bounded(string? value, int max)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "UNKNOWN" : value.Replace('\r', ' ').Replace('\n', ' ');
        return text.Length <= max ? text : text[..max];
    }
}

public sealed class ProblemDiagnosticsMirrorOutbox
{
    private const int MaxFilesPerFlush = 4;
    private const int MaxPendingFiles = 200;
    private const long MaxPendingBytes = 512L * 1024 * 1024;
    private static readonly TimeSpan BaseBackoff = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan MaxBackoff = TimeSpan.FromMinutes(30);

    private readonly BridgeConfig _config;
    private readonly SupabaseProblemDiagnosticsSink _sink;
    private readonly SemaphoreSlim _flushLock = new(1, 1);
    private DateTimeOffset _nextAttemptAt = DateTimeOffset.MinValue;
    private int _failuresInRow;

    public ProblemDiagnosticsMirrorOutbox(BridgeConfig config, SupabaseProblemDiagnosticsSink sink)
    {
        _config = config;
        _sink = sink;
    }

    public static string PendingDirectory => Path.Combine(BridgeConfig.DiagnosticsDirectory, "mirror-pending");

    public async Task<bool> EnqueueLatestAsync(CancellationToken cancellationToken = default)
    {
        var metadataPath = Path.Combine(BridgeConfig.DiagnosticsDirectory, "latest-problem.json");
        if (!File.Exists(metadataPath)) return false;

        ProblemMirrorMetadata? metadata;
        await using (var metadataStream = File.OpenRead(metadataPath))
        {
            metadata = await JsonSerializer.DeserializeAsync<ProblemMirrorMetadata>(metadataStream, BridgeConfig.JsonOptions, cancellationToken);
        }
        if (metadata is null || string.IsNullOrWhiteSpace(metadata.BundleId) || string.IsNullOrWhiteSpace(metadata.Filename))
            return false;

        var bundlePath = Path.Combine(BridgeConfig.DiagnosticsDirectory, "pending", metadata.Filename);
        if (!File.Exists(bundlePath)) return false;

        JsonElement bundle;
        await using (var input = File.OpenRead(bundlePath))
        await using (var gzip = new GZipStream(input, CompressionMode.Decompress, leaveOpen: false))
        using (var document = await JsonDocument.ParseAsync(gzip, cancellationToken: cancellationToken))
        {
            bundle = document.RootElement.Clone();
        }

        var remotePath = ExpectedRemotePath(metadata);
        var payload = _sink.SerializePayload(bundle, metadata, remotePath);
        Directory.CreateDirectory(PendingDirectory);
        var finalPath = Path.Combine(PendingDirectory, $"mirror-{SafeFileSegment(metadata.BundleId)}.json");
        var temporaryPath = finalPath + ".part-" + Guid.NewGuid().ToString("N");
        await File.WriteAllBytesAsync(temporaryPath, payload, cancellationToken);
        File.Move(temporaryPath, finalPath, true);
        await EnforceRetentionAsync(cancellationToken);
        return true;
    }

    public async Task<ProblemMirrorFlushResult> FlushPendingAsync(CancellationToken cancellationToken = default)
    {
        if (DateTimeOffset.UtcNow < _nextAttemptAt)
            return new ProblemMirrorFlushResult(0, "PROBLEM_MIRROR_BACKOFF");
        if (!await _flushLock.WaitAsync(0, cancellationToken))
            return new ProblemMirrorFlushResult(0, "PROBLEM_MIRROR_BUSY");

        try
        {
            if (!Directory.Exists(PendingDirectory))
                return new ProblemMirrorFlushResult(0, "PROBLEM_MIRROR_NOTHING_PENDING");
            var files = Directory.EnumerateFiles(PendingDirectory, "mirror-*.json")
                .OrderBy(path => path, StringComparer.Ordinal)
                .Take(MaxFilesPerFlush)
                .ToArray();
            if (files.Length == 0)
                return new ProblemMirrorFlushResult(0, "PROBLEM_MIRROR_NOTHING_PENDING");

            var uploaded = 0;
            foreach (var file in files)
            {
                var payload = await File.ReadAllBytesAsync(file, cancellationToken);
                await _sink.SendPayloadAsync(payload, cancellationToken);
                File.Delete(file);
                uploaded++;
            }

            _failuresInRow = 0;
            _nextAttemptAt = DateTimeOffset.MinValue;
            return new ProblemMirrorFlushResult(uploaded, "PROBLEM_MIRROR_FLUSHED");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            _failuresInRow++;
            var exponent = Math.Min(10, Math.Max(0, _failuresInRow - 1));
            var seconds = Math.Min(MaxBackoff.TotalSeconds, BaseBackoff.TotalSeconds * Math.Pow(2, exponent));
            _nextAttemptAt = DateTimeOffset.UtcNow.AddSeconds(seconds);
            return new ProblemMirrorFlushResult(0, "PROBLEM_MIRROR_FAILED", Bounded(error.Message, 256));
        }
        finally
        {
            _flushLock.Release();
        }
    }

    private string ExpectedRemotePath(ProblemMirrorMetadata metadata)
    {
        var root = FtpsDiagnosticsArchive.NormalizeRemoteRoot(_config.DiagnosticsFtpsRoot);
        var botId = SafeFileSegment(_config.BotId);
        var day = SafeFileSegment(metadata.Day);
        return $"{root}/{botId}/{day}/{metadata.Filename}";
    }

    private static async Task EnforceRetentionAsync(CancellationToken cancellationToken)
    {
        if (!Directory.Exists(PendingDirectory)) return;
        var files = new DirectoryInfo(PendingDirectory).EnumerateFiles("mirror-*.json")
            .OrderBy(file => file.LastWriteTimeUtc)
            .ThenBy(file => file.Name, StringComparer.Ordinal)
            .ToList();
        var bytes = files.Sum(file => file.Length);
        while (files.Count > MaxPendingFiles || bytes > MaxPendingBytes)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var file = files[0];
            files.RemoveAt(0);
            bytes -= file.Length;
            file.Delete();
            await Task.Yield();
        }
    }

    private static string SafeFileSegment(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "unknown";
        var builder = new StringBuilder(Math.Min(160, value.Length));
        foreach (var ch in value)
        {
            if (builder.Length >= 160) break;
            builder.Append(char.IsLetterOrDigit(ch) || ch is '.' or '_' or '-' ? ch : '-');
        }
        var result = builder.ToString().Trim('-');
        return string.IsNullOrWhiteSpace(result) ? "unknown" : result;
    }

    private static string Bounded(string? value, int max)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "UNKNOWN" : value;
        return text.Length <= max ? text : text[..max];
    }
}
