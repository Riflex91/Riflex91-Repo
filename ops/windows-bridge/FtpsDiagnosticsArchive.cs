using FluentFTP;
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

public sealed record FtpsConnectionTestResult(bool Success, string Message);
public sealed record FtpsFlushResult(int Uploaded, string Reason, string? Error = null);

public sealed class FtpsDiagnosticsArchive
{
    private const int MaxFilesPerFlush = 4;
    private const int MaxPendingFiles = 200;
    private const long MaxPendingBytes = 512L * 1024 * 1024;
    private static readonly TimeSpan DedupeWindow = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan BaseBackoff = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan MaxBackoff = TimeSpan.FromMinutes(30);
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
        "authorization|password|passwd|secret|token|cookie|api[_-]?key|session[_-]?key|private[_-]?key|credential",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly BridgeConfig _config;
    private readonly string? _password;
    private readonly SemaphoreSlim _flushLock = new(1, 1);
    private readonly Dictionary<string, DateTimeOffset> _fingerprints = new(StringComparer.Ordinal);
    private DateTimeOffset _nextUploadAttemptAt = DateTimeOffset.MinValue;
    private int _failuresInRow;

    public FtpsDiagnosticsArchive(BridgeConfig config, string? password)
    {
        _config = config;
        _password = SecureFtpsPasswordStore.IsValidPassword(password) ? password : null;
    }

    public bool IsConfigured =>
        _config.DiagnosticsFtpsEnabled
        && !string.IsNullOrWhiteSpace(_config.DiagnosticsFtpsHost)
        && !string.IsNullOrWhiteSpace(_config.DiagnosticsFtpsUser)
        && SecureFtpsPasswordStore.IsValidPassword(_password);

    public async Task<bool> CaptureFromReadAsync(DebugReadResult read, CancellationToken cancellationToken = default)
    {
        if (!_config.DiagnosticsFtpsEnabled) return false;
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
        if (!_config.DiagnosticsFtpsEnabled) return false;
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

    public async Task<FtpsFlushResult> FlushPendingAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured) return new FtpsFlushResult(0, "DIAGNOSTICS_FTPS_DISABLED");
        if (DateTimeOffset.UtcNow < _nextUploadAttemptAt)
            return new FtpsFlushResult(0, "DIAGNOSTICS_FTPS_BACKOFF");
        if (!await _flushLock.WaitAsync(0, cancellationToken))
            return new FtpsFlushResult(0, "DIAGNOSTICS_FTPS_BUSY");

        try
        {
            var pendingDir = Path.Combine(BridgeConfig.DiagnosticsDirectory, "pending");
            if (!Directory.Exists(pendingDir))
                return new FtpsFlushResult(0, "DIAGNOSTICS_FTPS_NOTHING_PENDING");

            var files = Directory.EnumerateFiles(pendingDir, "problem-*.json.gz")
                .OrderBy(path => path, StringComparer.Ordinal)
                .Take(MaxFilesPerFlush)
                .ToArray();
            if (files.Length == 0)
                return new FtpsFlushResult(0, "DIAGNOSTICS_FTPS_NOTHING_PENDING");

            using var client = CreateClient();
            await client.Connect(cancellationToken);
            var uploaded = 0;
            foreach (var file in files)
            {
                await UploadOneAsync(client, file, cancellationToken);
                uploaded++;
            }
            await client.Disconnect(cancellationToken);

            _failuresInRow = 0;
            _nextUploadAttemptAt = DateTimeOffset.MinValue;
            return new FtpsFlushResult(uploaded, "DIAGNOSTICS_FTPS_FLUSHED");
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
            _nextUploadAttemptAt = DateTimeOffset.UtcNow.AddSeconds(seconds);
            return new FtpsFlushResult(0, "DIAGNOSTICS_FTPS_FAILED", SafeError(error));
        }
        finally
        {
            _flushLock.Release();
        }
    }

    public static async Task<FtpsConnectionTestResult> TestConnectionAsync(
        BridgeConfig config,
        string? password,
        CancellationToken cancellationToken = default)
    {
        try
        {
            config.Validate();
            if (!config.DiagnosticsFtpsEnabled)
                return new FtpsConnectionTestResult(false, "FTPS ist deaktiviert.");
            if (!SecureFtpsPasswordStore.IsValidPassword(password))
                return new FtpsConnectionTestResult(false, "FTPS-Passwort fehlt.");

            var archive = new FtpsDiagnosticsArchive(config, password);
            using var client = archive.CreateClient();
            await client.Connect(cancellationToken);
            await client.CreateDirectory(NormalizeRemoteRoot(config.DiagnosticsFtpsRoot), true, cancellationToken);
            await client.Disconnect(cancellationToken);
            return new FtpsConnectionTestResult(true, "FTPS-Verbindung erfolgreich. TLS und Anmeldung funktionieren.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception error)
        {
            var message = error.Message;
            if (SecureFtpsPasswordStore.IsValidPassword(password))
                message = message.Replace(password!, "[REDACTED]", StringComparison.Ordinal);
            return new FtpsConnectionTestResult(false, Bounded(message, 256));
        }
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

    public static string NormalizeRemoteRoot(string? value)
    {
        var raw = string.IsNullOrWhiteSpace(value) ? "/diagnostics/v3" : value.Trim().Replace('\\', '/');
        var parts = raw.Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Where(part => part is not "." and not "..")
            .Select(part => part.Trim())
            .Where(part => part.Length > 0)
            .ToArray();
        return "/" + string.Join('/', parts);
    }

    private AsyncFtpClient CreateClient()
    {
        var client = new AsyncFtpClient(
            _config.DiagnosticsFtpsHost,
            _config.DiagnosticsFtpsUser,
            _password!,
            _config.DiagnosticsFtpsPort);
        client.Config.EncryptionMode = FtpEncryptionMode.Explicit;
        client.Config.ValidateAnyCertificate = !_config.DiagnosticsFtpsRejectUnauthorized;
        return client;
    }

    private async Task UploadOneAsync(AsyncFtpClient client, string localPath, CancellationToken cancellationToken)
    {
        var compressed = await File.ReadAllBytesAsync(localPath, cancellationToken);
        var metadataPath = localPath + ".meta.json";
        BundleMetadata? metadata = null;
        if (File.Exists(metadataPath))
        {
            await using var metadataStream = File.OpenRead(metadataPath);
            metadata = await JsonSerializer.DeserializeAsync<BundleMetadata>(metadataStream, BridgeConfig.JsonOptions, cancellationToken);
        }

        var name = Path.GetFileName(localPath);
        var day = metadata?.Day ?? DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");
        var remoteDir = $"{NormalizeRemoteRoot(_config.DiagnosticsFtpsRoot)}/{SafeSegment(_config.BotId)}/{SafeSegment(day)}";
        var remoteFinal = $"{remoteDir}/{name}";
        var remotePart = remoteFinal + ".part";
        await client.CreateDirectory(remoteDir, true, cancellationToken);
        var status = await client.UploadBytes(compressed, remotePart, FtpRemoteExists.Overwrite, true, null, cancellationToken);
        if (status == FtpStatus.Failed) throw new InvalidOperationException("DIAGNOSTICS_FTPS_UPLOAD_FAILED");

        var remoteSize = await client.GetFileSize(remotePart, -1, cancellationToken);
        if (remoteSize != compressed.LongLength)
            throw new InvalidOperationException($"DIAGNOSTICS_FTPS_SIZE_MISMATCH:{compressed.LongLength}:{remoteSize}");
        await client.MoveFile(remotePart, remoteFinal, FtpRemoteExists.Overwrite, cancellationToken);

        var sha256 = metadata?.Sha256 ?? Convert.ToHexString(SHA256.HashData(compressed)).ToLowerInvariant();
        var shaText = Encoding.UTF8.GetBytes($"{sha256}  {name}\n");
        await client.UploadBytes(shaText, remoteFinal + ".sha256", FtpRemoteExists.Overwrite, true, null, cancellationToken);

        var latest = new
        {
            schemaVersion = 1,
            type = "AIO_V3_LATEST_PROBLEM_INDEX",
            botId = _config.BotId,
            capturedAt = metadata?.CapturedAt,
            bundleId = metadata?.BundleId,
            severity = metadata?.Severity,
            reason = metadata?.Reason,
            sha256,
            bytes = compressed.LongLength,
            remotePath = remoteFinal
        };
        var latestBytes = JsonSerializer.SerializeToUtf8Bytes(latest, BridgeConfig.JsonOptions);
        var latestPart = $"{NormalizeRemoteRoot(_config.DiagnosticsFtpsRoot)}/{SafeSegment(_config.BotId)}/latest-problem.json.part";
        var latestFinal = $"{NormalizeRemoteRoot(_config.DiagnosticsFtpsRoot)}/{SafeSegment(_config.BotId)}/latest-problem.json";
        await client.UploadBytes(latestBytes, latestPart, FtpRemoteExists.Overwrite, true, null, cancellationToken);
        await client.MoveFile(latestPart, latestFinal, FtpRemoteExists.Overwrite, cancellationToken);

        File.Delete(localPath);
        if (File.Exists(metadataPath)) File.Delete(metadataPath);
    }

    private async Task WriteBundleAsync(
        Dictionary<string, object?> bundle,
        ProblemSignal signal,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.Combine(BridgeConfig.DiagnosticsDirectory, "pending"));
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
        var finalPath = Path.Combine(BridgeConfig.DiagnosticsDirectory, "pending", filename);
        var temporaryPath = finalPath + ".part-" + Guid.NewGuid().ToString("N");
        await File.WriteAllBytesAsync(temporaryPath, compressed, cancellationToken);
        File.Move(temporaryPath, finalPath, true);

        var metadata = new BundleMetadata(
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
        await File.WriteAllTextAsync(
            Path.Combine(BridgeConfig.DiagnosticsDirectory, "latest-problem.json"),
            metadataJson + Environment.NewLine,
            cancellationToken);
        await EnforceRetentionAsync(cancellationToken);
    }

    private async Task EnforceRetentionAsync(CancellationToken cancellationToken)
    {
        var pendingDir = Path.Combine(BridgeConfig.DiagnosticsDirectory, "pending");
        if (!Directory.Exists(pendingDir)) return;
        var files = new DirectoryInfo(pendingDir).EnumerateFiles("problem-*.json.gz")
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

    private string SafeError(Exception error)
    {
        var message = error.Message;
        if (SecureFtpsPasswordStore.IsValidPassword(_password))
            message = message.Replace(_password!, "[REDACTED]", StringComparison.Ordinal);
        return Bounded(message, 256);
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
        var text = string.IsNullOrWhiteSpace(value) ? "adventure-land-v3" : value.Trim();
        var safe = Regex.Replace(text, "[^a-zA-Z0-9._-]+", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(safe)) safe = "adventure-land-v3";
        return safe.Length <= 128 ? safe : safe[..128];
    }

    private static string Bounded(string? value, int max)
    {
        var text = value ?? string.Empty;
        return text.Length <= max ? text : text[..max];
    }

    private sealed record BundleMetadata(
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
}
