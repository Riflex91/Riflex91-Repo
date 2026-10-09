using System.Text.Json;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

/// <summary>
/// Non-mutating reader for ALFinal's existing Node-host account snapshots.
/// Same file layout: D:\ALBot\state\account-profiles/*.json and
/// D:\ALBot\state\account-wealth.json. No dual writes during migration.
/// </summary>
public sealed class AlFinalNativeAccountSnapshot
{
    public const string DefaultRoot = @"D:\ALBot\state";
    private const int MaximumFileBytes = 1024 * 1024;
    private readonly string _root;
    public AlFinalNativeAccountSnapshot(string? root = null)
    {
        _root = Path.GetFullPath(root ?? DefaultRoot);
    }

    private static JsonElement? ReadFile(string filename)
    {
        var info = new FileInfo(filename);
        if (!info.Exists) return null;
        if (info.Length > MaximumFileBytes || info.Attributes.HasFlag(FileAttributes.ReparsePoint))
            throw new InvalidDataException("ACCOUNT_SSD_FILE_UNSAFE");
        using var document = JsonDocument.Parse(File.ReadAllBytes(filename),
            new JsonDocumentOptions { MaxDepth = 32 });
        if (document.RootElement.ValueKind != JsonValueKind.Object)
            throw new InvalidDataException("ACCOUNT_SSD_INVALID_JSON");
        return document.RootElement.Clone();
    }

    // Test-only migration primitive. Production API does NOT enable account
    // writes until the legacy Node account writer is fully stopped.
    public (int ProfilesWritten, bool WealthWritten) WriteAccount(JsonElement payload)
    {
        if (payload.ValueKind != JsonValueKind.Object)
            throw new InvalidDataException("ACCOUNT_WRITE_PAYLOAD_INVALID");
        if (System.Text.Encoding.UTF8.GetByteCount(payload.GetRawText()) > 512 * 1024)
            throw new InvalidDataException("ACCOUNT_WRITE_PAYLOAD_OVERSIZE");
        var rows = new List<(string Name, byte[] Content, long Stamp)>();
        if (payload.TryGetProperty("profiles", out var entries)
            && entries.ValueKind != JsonValueKind.Null)
        {
            if (entries.ValueKind != JsonValueKind.Array || entries.GetArrayLength() > 64)
                throw new InvalidDataException("ACCOUNT_WRITE_PROFILES_INVALID");
            var unique = new HashSet<string>(StringComparer.Ordinal);
            foreach (var profile in entries.EnumerateArray())
            {
                if (profile.ValueKind != JsonValueKind.Object
                    || !profile.TryGetProperty("name", out var nameValue)
                    || nameValue.ValueKind != JsonValueKind.String)
                    throw new InvalidDataException("ACCOUNT_WRITE_PROFILE_INVALID");
                var name = nameValue.GetString()!;
                if (!Regex.IsMatch(name, @"^[a-zA-Z0-9._-]{1,100}$")
                    || !unique.Add(name))
                    throw new InvalidDataException("ACCOUNT_WRITE_NAME_INVALID");
                var bytes = JsonSerializer.SerializeToUtf8Bytes(profile);
                if (bytes.Length > MaximumFileBytes)
                    throw new InvalidDataException("ACCOUNT_WRITE_PROFILE_TOO_LARGE");
                rows.Add((name, bytes, ObservedAt(profile)));
            }
        }
        byte[]? wealth = null;
        if (payload.TryGetProperty("wealth", out var balance)
            && balance.ValueKind != JsonValueKind.Null)
        {
            if (balance.ValueKind != JsonValueKind.Object)
                throw new InvalidDataException("ACCOUNT_WRITE_WEALTH_INVALID");
            wealth = JsonSerializer.SerializeToUtf8Bytes(balance);
            if (wealth.Length > MaximumFileBytes)
                throw new InvalidDataException("ACCOUNT_WRITE_WEALTH_TOO_LARGE");
        }

        // All schema and monotonicity checks complete before first mutation.
        // An ACK means each individually written file was flushed to disk;
        // this batch is NOT a multi-file transaction.
        lock (_writeGate)
        {
            var dir = Path.Combine(_root, "account-profiles");
            foreach (var row in rows)
            {
                var file = Path.Combine(dir, row.Name + ".json");
                var previous = ReadFile(file);
                if (previous.HasValue && row.Stamp < ObservedAt(previous.Value))
                    throw new InvalidOperationException("ACCOUNT_STALE_PROFILE_REJECTED");
            }
            if (wealth is not null)
            {
                var existing = ReadFile(Path.Combine(_root, "account-wealth.json"));
                if (existing.HasValue && ObservedAt(balance) < ObservedAt(existing.Value))
                    throw new InvalidOperationException("ACCOUNT_STALE_WEALTH_REJECTED");
            }
            foreach (var row in rows)
                WriteAtomic(Path.Combine(dir, row.Name + ".json"), row.Content);
            if (wealth is not null)
                WriteAtomic(Path.Combine(_root, "account-wealth.json"), wealth);
        }
        return (rows.Count, wealth is not null);
    }

    private readonly object _writeGate = new();

    private static long ObservedAt(JsonElement row)
    {
        foreach (var key in new[] { "observedAtMs", "cachedAtMs" })
        {
            if (row.ValueKind == JsonValueKind.Object
                && row.TryGetProperty(key, out var value)
                && value.ValueKind == JsonValueKind.Number
                && value.TryGetInt64(out var stamp)
                && stamp >= 0)
                return stamp;
        }
        return 0;
    }

    private static void WriteAtomic(string filename, byte[] bytes)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(filename)!);
        var tmp = filename + ".tmp-" + Guid.NewGuid().ToString("N");
        try
        {
            using (var stream = new FileStream(tmp, FileMode.CreateNew,
                FileAccess.Write, FileShare.None, 64 * 1024, FileOptions.WriteThrough))
            {
                stream.Write(bytes);
                stream.Flush(flushToDisk: true);
            }
            File.Move(tmp, filename, overwrite: true);
        }
        finally { if (File.Exists(tmp)) File.Delete(tmp); }
    }

    public object ReadAccount()
    {
        var profiles = new List<JsonElement>();
        var dir = Path.Combine(_root, "account-profiles");
        if (Directory.Exists(dir))
        {
            foreach (var filename in Directory.GetFiles(dir, "*.json", SearchOption.TopDirectoryOnly)
                         .OrderBy(s => s, StringComparer.Ordinal).Take(65))
            {
                if (profiles.Count >= 64) throw new InvalidDataException("ACCOUNT_SSD_TOO_MANY_PROFILES");
                if (!Regex.IsMatch(Path.GetFileName(filename), @"^[a-zA-Z0-9._-]{1,100}\.json$"))
                    throw new InvalidDataException("ACCOUNT_SSD_FILENAME_INVALID");
                var row = ReadFile(filename);
                if (!row.HasValue || !row.Value.TryGetProperty("name", out var name)
                    || name.ValueKind != JsonValueKind.String
                    || string.IsNullOrWhiteSpace(name.GetString()))
                    throw new InvalidDataException("ACCOUNT_SSD_PROFILE_INVALID");
                profiles.Add(row.Value);
            }
        }
        var wealth = ReadFile(Path.Combine(_root, "account-wealth.json"));
        // Identical top-level field names to the existing Node /v1/state/account.
        return new
        {
            schemaVersion = 1, root = _root, profiles,
            wealth
        };
    }
}
