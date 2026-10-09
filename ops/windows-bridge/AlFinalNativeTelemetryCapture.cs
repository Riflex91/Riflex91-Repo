using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace AioBotWindowsBridge;

/// <summary>
/// Compatible raw NDJSON and daily JSON files for ALFinal telemetry. Its write
/// API is intentionally disabled by default until the Node writer is retired.
/// No deletion/pruning is performed by this implementation.
/// </summary>
public sealed class AlFinalNativeTelemetryCapture
{
    public const string DefaultRoot = @"D:\ALBot\telemetry";
    public const int MaximumBatchBytes = 512 * 1024;
    private readonly string _root;
    private readonly object _gate = new();
    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public AlFinalNativeTelemetryCapture(string? root = null)
    {
        _root = Path.GetFullPath(root ?? DefaultRoot);
    }

    private static string SafeName(string? source)
    {
        var result = Regex.Replace(source?.Trim() ?? "", "[^a-zA-Z0-9._-]+", "_");
        return result.Length == 0 ? "unknown" : result[..Math.Min(result.Length, 100)];
    }

    private static string? OptionalText(JsonElement row, string key)
    {
        if (row.ValueKind != JsonValueKind.Object
            || !row.TryGetProperty(key, out var value)
            || value.ValueKind != JsonValueKind.String)
            return null;
        return value.GetString();
    }

    private static double? OptionalNumber(JsonElement row, string key)
    {
        if (row.ValueKind != JsonValueKind.Object
            || !row.TryGetProperty(key, out var value) || value.ValueKind != JsonValueKind.Number
            || !value.TryGetDouble(out var number) || !double.IsFinite(number))
            return null;
        return number;
    }

    private static JsonElement Child(JsonElement row, string key)
    {
        if (row.ValueKind == JsonValueKind.Object
            && row.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.Object)
            return value;
        return default;
    }

    public int Ingest(JsonElement payload, Action? confirmWriterOwnership = null)
    {
        if (payload.ValueKind != JsonValueKind.Object
            || !payload.TryGetProperty("records", out var list)
            || list.ValueKind != JsonValueKind.Array
            || Encoding.UTF8.GetByteCount(payload.GetRawText()) > MaximumBatchBytes)
            throw new InvalidDataException("TELEMETRY_BATCH_INVALID");

        // Never report success while silently discarding a batch suffix.
        if (list.GetArrayLength() > 100)
            throw new InvalidDataException("TELEMETRY_TOO_MANY_RECORDS");
        // Validate every entry before the first filesystem mutation.
        var rows = new List<(JsonElement Row, string Day, string Hour, string Character, DateTimeOffset At)>();
        foreach (var row in list.EnumerateArray())
        {
            if (row.ValueKind != JsonValueKind.Object
                || Encoding.UTF8.GetByteCount(row.GetRawText()) > 128 * 1024)
                throw new InvalidDataException("TELEMETRY_RECORD_INVALID");
            var time = OptionalNumber(row, "atMs");
            if (!time.HasValue || time.Value < 946684800000 || time.Value > 4102444800000)
                throw new InvalidDataException("TELEMETRY_TIMESTAMP_INVALID");
            var at = DateTimeOffset.FromUnixTimeMilliseconds((long)time.Value);
            var character = Child(row, "character");
            rows.Add((row, at.UtcDateTime.ToString("yyyy-MM-dd"),
                at.UtcDateTime.ToString("HH"), SafeName(OptionalText(character, "name")), at));
        }

        lock (_gate)
        {
            confirmWriterOwnership?.Invoke();
            foreach (var item in rows)
            {
                // A prevalidated batch is not a transaction: revalidate for
                // each record and leave an explicit failure on revoked ownership.
                confirmWriterOwnership?.Invoke();
                var rawDir = Path.Combine(_root, "raw", item.Day, item.Hour);
                Directory.CreateDirectory(rawDir);
                var rawPath = Path.Combine(rawDir, item.Character + ".ndjson");
                // Equivalent Node host NDJSON format; writes are durable.
                using (var file = new FileStream(rawPath, FileMode.Append,
                    FileAccess.Write, FileShare.Read, 4096, FileOptions.WriteThrough))
                {
                    var bytes = Encoding.UTF8.GetBytes(item.Row.GetRawText() + "\n");
                    file.Write(bytes);
                    file.Flush(flushToDisk: true);
                }
                UpdateDaily(item.Row, item.Day, item.Character, item.At, confirmWriterOwnership);
            }
        }
        return rows.Count;
    }

    private void UpdateDaily(JsonElement source, string day, string name,
        DateTimeOffset at, Action? confirmWriterOwnership)
    {
        confirmWriterOwnership?.Invoke();
        var directory = Path.Combine(_root, "daily", day);
        Directory.CreateDirectory(directory);
        var file = Path.Combine(directory, name + ".json");
        DailySummary summary;
        if (File.Exists(file))
        {
            var raw = File.ReadAllBytes(file);
            if (raw.Length > MaximumBatchBytes)
                throw new InvalidDataException("TELEMETRY_DAILY_OVERSIZE");
            summary = JsonSerializer.Deserialize<DailySummary>(raw, JsonOptions)
                ?? throw new InvalidDataException("TELEMETRY_DAILY_CORRUPT");
            if (summary.Day != day || summary.Character != name)
                throw new InvalidDataException("TELEMETRY_DAILY_IDENTITY_MISMATCH");
        }
        else
        {
            summary = new DailySummary
            {
                Day = day, Character = name,
                FirstAt = at.UtcDateTime.ToString("O")
            };
        }
        summary.Samples++;
        summary.LastAt = at.UtcDateTime.ToString("O");

        var ch = Child(source, "character");
        var gold = OptionalNumber(ch, "gold");
        if (gold.HasValue)
        {
            summary.Gold.First ??= gold;
            summary.Gold.Last = gold;
            summary.Gold.Min = summary.Gold.Min.HasValue
                ? Math.Min(summary.Gold.Min.Value, gold.Value) : gold;
            summary.Gold.Max = summary.Gold.Max.HasValue
                ? Math.Max(summary.Gold.Max.Value, gold.Value) : gold;
        }
        var hp = OptionalNumber(ch, "hp");
        var maxHp = OptionalNumber(ch, "maxHp");
        if (hp.HasValue && maxHp > 0)
        {
            var ratio = hp.Value / maxHp.Value;
            summary.Hp.MinRatio = summary.Hp.MinRatio.HasValue
                ? Math.Min(summary.Hp.MinRatio.Value, ratio) : ratio;
        }
        Count(summary.Maps, SafeNameOrEmpty(OptionalText(ch, "map")));
        Count(summary.Tasks, SafeNameOrEmpty(OptionalText(Child(source, "fullAutonomy"), "taskType")));
        Count(summary.Encounters, SafeNameOrEmpty(OptionalText(Child(source, "encounter"), "selected")));
        Count(summary.HealthStates, SafeNameOrEmpty(OptionalText(Child(source, "health"), "state")));
        var tmp = file + ".tmp-" + Guid.NewGuid().ToString("N");
        try
        {
            using (var stream = new FileStream(tmp, FileMode.CreateNew,
                FileAccess.Write, FileShare.None, 4096, FileOptions.WriteThrough))
            {
                var bytes = JsonSerializer.SerializeToUtf8Bytes(summary, JsonOptions);
                stream.Write(bytes);
                stream.Flush(flushToDisk: true);
            }
            confirmWriterOwnership?.Invoke();
            File.Move(tmp, file, overwrite: true);
        }
        finally { if (File.Exists(tmp)) File.Delete(tmp); }
    }

    private static string? SafeNameOrEmpty(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : SafeName(value);

    private static void Count(Dictionary<string, int> dict, string? key)
    {
        if (key is null) return;
        dict.TryGetValue(key, out var n);
        dict[key] = n + 1;
    }

    private sealed class DailySummary
    {
        public int SchemaVersion { get; set; } = 1;
        public string Day { get; set; } = "";
        public string Character { get; set; } = "";
        public string FirstAt { get; set; } = "";
        public string LastAt { get; set; } = "";
        public int Samples { get; set; }
        public GoldSummary Gold { get; set; } = new();
        public HpSummary Hp { get; set; } = new();
        public Dictionary<string, int> Maps { get; set; } = new();
        public Dictionary<string, int> Tasks { get; set; } = new();
        public Dictionary<string, int> Encounters { get; set; } = new();
        public Dictionary<string, int> HealthStates { get; set; } = new();
    }
    private sealed class GoldSummary
    {
        public double? First { get; set; }
        public double? Last { get; set; }
        public double? Min { get; set; }
        public double? Max { get; set; }
    }
    private sealed class HpSummary
    {
        public double? MinRatio { get; set; }
    }
}
