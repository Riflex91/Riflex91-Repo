using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

public sealed record ProblemSignal(
    long Seq,
    string Type,
    string Severity,
    string Reason,
    string? Component,
    string? Character,
    string Fingerprint);

public sealed record ProblemDiagnosticsMetadata(
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

public sealed class LocalProblemDiagnosticsArchive
{
    private const int MaxPendingFiles = 200;
    private const long MaxPendingBytes = 512L * 1024 * 1024;
    private static readonly TimeSpan DedupeWindow = TimeSpan.FromMinutes(10);
    private static readonly HashSet<string> HardSeverities = new(StringComparer.OrdinalIgnoreCase)
    {
        "ERROR", "CRITICAL", "FATAL", "EMERGENCY", "ALERT"
    };
    private static readonly HashSet<string> WarningSeverities = new(StringComparer.OrdinalIgnoreCase)
    {
        "WARN", "WARNING"
    };
    private static readonly Regex ImportantProblemPattern = new(
        "FAIL(?:ED|URE)?|ERROR|QUARANTIN|SAFE_MODE|RESTART_REQUIRED|CIRCUIT_OPEN|UNAVAILABLE|NOT_LIVE|\\bDEAD\\b|NO_PROGRESS|DRIFT_DETECTED|TIMEOUT|EXHAUSTED|DEGRADED|REJECTED|DISCONNECTED|OUTAGE",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);
    private static readonly Regex SecretKeyPattern = new(
        "authorization|password|passwd|secret|token|cookie|api[_-]?key|application[_-]?key|access[_-]?key|key[_-]?id|session[_-]?key|private[_-]?key|credential",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly BridgeConfig _config;
    private readonly Dictionary<string, DateTimeOffset> _fingerprints = new(StringComparer.Ordinal);

    public LocalProblemDiagnosticsArchive(BridgeConfig config)
    {
        _config = config;
    }

    public static string PendingDirectory => Path.Combine(BridgeConfig.DiagnosticsDirectory, "pending");
    public static string LatestMetadataPath => Path.Combine(BridgeConfig.DiagnosticsDirectory, "latest-problem.json");

    public async Task<bool> CaptureFromReadAsync(DebugReadResult read, CancellationToken cancellationToken = default)
    {
        var signal = FindProblemSignal(read.Events);
        if (signal is null || IsDuplicate(signal.Fingerprint)) return false;

        var bundle = new Dictionary<string, object?>
        {
            ["schemaVersion"] = 1,
            ["type"] = "AIO_V3_PROBLEM_DIAGNOSTICS_BUNDLE",
            ["bundleId"] = BundleId(signal),
            ["botId"] = _config.BotId,
            ["capturedAt"] = DateTimeOffset.UtcNow.ToString("O"),
            ["trigger"] = signal,
            ["cursor"] = new
            {
                requestedAfterSeq = read.RequestedAfterSeq,
                effectiveAfterSeq = read.EffectiveAfterSeq,
                maxSeq = read.MaxSeq,
                lastCapturedSeq = read.LastCapturedSeq,
                cursorWasReset = read.CursorWasReset
            },
            ["targetUrl"] = read.TargetUrl,
            ["snapshot"] = SanitizeJson(read.Snapshot),
            ["events"] = SanitizeJson(read.Events)
        };

        await WriteBundleAsync(bundle, signal, cancellationToken);
        Remember(signal.Fingerprint);
        return true;
    }

    public async Task<bool> CaptureBridgeFailureAsync(Exception error, CancellationToken cancellationToken = default)
    {
        var reason = Bounded(error.Message, 300);
        var signal = new ProblemSignal(
            0,
            "WINDOWS_BRIDGE_FAILURE",
            "ERROR",
            reason,
            "windows-bridge",
            null,
            $"windows-bridge|WINDOWS_BRIDGE_FAILURE|{reason}");
        if (IsDuplicate(signal.Fingerprint)) return false;

        var bundle = new Dictionary<string, object?>
        {
            ["schemaVersion"] = 1,
            ["type"] = "AIO_V3_PROBLEM_DIAGNOSTICS_BUNDLE",
            ["bundleId"] = BundleId(signal),
            ["botId"] = _config.BotId,
            ["capturedAt"] = DateTimeOffset.UtcNow.ToString("O"),
            ["trigger"] = signal,
            ["bridge"] = new { available = false, error = reason },
            ["snapshot"] = null,
            ["events"] = Array.Empty<object>()
        };

        await WriteBundleAsync(bundle, signal, cancellationToken);
        Remember(signal.Fingerprint);
        return true;
    }

    public static ProblemSignal? FindProblemSignal(JsonElement events)
    {
        if (events.ValueKind != JsonValueKind.Array) return null;
        foreach (var row in events.EnumerateArray())
        {
            if (row.ValueKind != JsonValueKind.Object) continue;
            var severity = ReadString(row, "severity").ToUpperInvariant();
            var type = ReadString(row, "event");
            if (string.IsNullOrWhiteSpace(type)) type = ReadString(row, "type");
            var reason = ReadString(row, "reason");
            if (string.IsNullOrWhiteSpace(reason)
                && row.TryGetProperty("data", out var data)
                && data.ValueKind == JsonValueKind.Object)
            {
                reason = ReadString(data, "reason");
            }
            var component = ReadString(row, "component");
            var character = ReadString(row, "character");
            var hard = HardSeverities.Contains(severity);
            var warningProblem = WarningSeverities.Contains(severity)
                && ImportantProblemPattern.IsMatch($"{type} {reason}");
            if (!hard && !warningProblem) continue;

            var seq = row.TryGetProperty("seq", out var seqNode) && seqNode.TryGetInt64(out var value)
                ? Math.Max(0, value)
                : 0;
            type = string.IsNullOrWhiteSpace(type) ? "UNKNOWN_PROBLEM" : Bounded(type, 200);
            reason = string.IsNullOrWhiteSpace(reason) ? type : Bounded(reason, 300);
            component = string.IsNullOrWhiteSpace(component) ? string.Empty : Bounded(component, 160);
            character = string.IsNullOrWhiteSpace(character) ? string.Empty : Bounded(character, 160);
            var fingerprint = $"{component}|{type}|{severity}|{reason}|{character}";
            return new ProblemSignal(
                seq,
                type,
                string.IsNullOrWhiteSpace(severity) ? "UNKNOWN" : Bounded(severity, 40),
                reason,
                string.IsNullOrWhiteSpace(component) ? null : component,
                string.IsNullOrWhiteSpace(character) ? null : character,
                fingerprint);
        }
        return null;
    }

    public static object? SanitizeJson(JsonElement value, int depth = 0)
    {
        if (depth >= 12) return "[max-depth]";
        return value.ValueKind switch
        {
            JsonValueKind.Object => SanitizeObject(value, depth),
            JsonValueKind.Array => value.EnumerateArray().Take(500).Select(item => SanitizeJson(item, depth + 1)).ToArray(),
            JsonValueKind.String => Bounded(value.GetString() ?? string.Empty, 16384),
            JsonValueKind.Number when value.TryGetInt64(out var integer) => integer,
            JsonValueKind.Number when value.TryGetDecimal(out var number) => number,
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null or JsonValueKind.Undefined => null,
            _ => Bounded(value.ToString(), 16384)
        };
    }

    public static string LogicalArchivePath(ProblemDiagnosticsMetadata metadata)
    {
        var botId = SafeSegment(metadata.BotId);
        var day = SafeSegment(metadata.Day);
        return $"diagnostics/v3/{botId}/{day}/{SafeSegment(metadata.Filename)}";
    }

    private async Task WriteBundleAsync(
        Dictionary<string, object?> bundle,
        ProblemSignal signal,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(PendingDirectory);
        var raw = JsonSerializer.SerializeToUtf8Bytes(bundle, BridgeConfig.JsonOptions);
        byte[] compressed;
        await using (var output = new MemoryStream())
        {
            await using (var gzip = new GZipStream(output, CompressionLevel.Optimal, leaveOpen: true))
            {
                await gzip.WriteAsync(raw, cancellationToken);
            }
            compressed = output.ToArray();
        }

        var sha256 = Convert.ToHexString(SHA256.HashData(compressed)).ToLowerInvariant();
        var bundleId = Convert.ToString(bundle["bundleId"])!;
        var filename = $"problem-{bundleId}.json.gz";
        var finalPath = Path.Combine(PendingDirectory, filename);
        var temporaryPath = finalPath + ".part-" + Guid.NewGuid().ToString("N");
        await File.WriteAllBytesAsync(temporaryPath, compressed, cancellationToken);
        File.Move(temporaryPath, finalPath, true);

        var metadata = new ProblemDiagnosticsMetadata(
            1,
            bundleId,
            _config.BotId,
            Convert.ToString(bundle["capturedAt"])!,
            DateTimeOffset.UtcNow.ToString("yyyy-MM-dd"),
            signal.Severity,
            signal.Reason,
            sha256,
            compressed.LongLength,
            filename);
        var metadataJson = JsonSerializer.Serialize(metadata, BridgeConfig.JsonOptions);
        await File.WriteAllTextAsync(finalPath + ".meta.json", metadataJson + Environment.NewLine, cancellationToken);
        await File.WriteAllTextAsync(LatestMetadataPath, metadataJson + Environment.NewLine, cancellationToken);
        await EnforceRetentionAsync(cancellationToken);
    }

    private static async Task EnforceRetentionAsync(CancellationToken cancellationToken)
    {
        if (!Directory.Exists(PendingDirectory)) return;
        var files = new DirectoryInfo(PendingDirectory).EnumerateFiles("problem-*.json.gz")
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
            var metadataPath = file.FullName + ".meta.json";
            file.Delete();
            if (File.Exists(metadataPath)) File.Delete(metadataPath);
            await Task.Yield();
        }
    }

    private bool IsDuplicate(string fingerprint)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var old in _fingerprints.Where(pair => now - pair.Value >= DedupeWindow).Select(pair => pair.Key).ToArray())
            _fingerprints.Remove(old);
        return _fingerprints.TryGetValue(fingerprint, out var capturedAt) && now - capturedAt < DedupeWindow;
    }

    private void Remember(string fingerprint)
    {
        _fingerprints[fingerprint] = DateTimeOffset.UtcNow;
        if (_fingerprints.Count <= 1024) return;
        foreach (var key in _fingerprints.OrderBy(pair => pair.Value).Take(_fingerprints.Count - 1024).Select(pair => pair.Key).ToArray())
            _fingerprints.Remove(key);
    }

    private string BundleId(ProblemSignal signal)
    {
        var now = DateTimeOffset.UtcNow;
        var material = Encoding.UTF8.GetBytes($"{_config.BotId}|{now:O}|{signal.Fingerprint}|{signal.Seq}");
        var digest = Convert.ToHexString(SHA256.HashData(material)).ToLowerInvariant()[..12];
        var timestamp = now.ToString("yyyy-MM-ddTHH-mm-ss-fffZ");
        return $"{timestamp}-{digest}";
    }

    private static Dictionary<string, object?> SanitizeObject(JsonElement value, int depth)
    {
        var result = new Dictionary<string, object?>(StringComparer.Ordinal);
        var count = 0;
        foreach (var property in value.EnumerateObject())
        {
            if (count++ >= 1000)
            {
                result["__truncatedKeys"] = true;
                break;
            }
            result[property.Name] = SecretKeyPattern.IsMatch(property.Name)
                ? "[REDACTED]"
                : SanitizeJson(property.Value, depth + 1);
        }
        return result;
    }

    private static string ReadString(JsonElement value, string property)
    {
        if (value.ValueKind != JsonValueKind.Object || !value.TryGetProperty(property, out var node)) return string.Empty;
        return node.ValueKind == JsonValueKind.String ? node.GetString() ?? string.Empty : node.ToString();
    }

    private static string SafeSegment(string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "unknown" : value.Trim();
        var safe = Regex.Replace(text, "[^a-zA-Z0-9._-]+", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(safe)) safe = "unknown";
        return safe.Length <= 160 ? safe : safe[..160];
    }

    private static string Bounded(string? value, int max)
    {
        var text = value ?? string.Empty;
        return text.Length <= max ? text : text[..max];
    }
}
