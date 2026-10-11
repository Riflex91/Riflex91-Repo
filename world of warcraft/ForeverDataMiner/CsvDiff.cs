using System.Security.Cryptography;
using System.Text;

namespace ForeverDataMiner;

public sealed record Db2Diff(
    string Table,
    int AddedCount,
    int ModifiedCount,
    int RemovedCount,
    IReadOnlyList<string> AddedIds,
    IReadOnlyList<string> ModifiedIds,
    IReadOnlyList<string> RemovedIds,
    Dictionary<string, string> CurrentRows);

public static class CsvDiff
{
    public static Db2Diff Compare(
        string table,
        byte[] csv,
        IReadOnlyDictionary<string, string>? previousRows)
    {
        var currentRows = BuildRowIndex(csv);
        previousRows ??= new Dictionary<string, string>();

        var added = currentRows.Keys
            .Where(k => !previousRows.ContainsKey(k))
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToArray();

        var removed = previousRows.Keys
            .Where(k => !currentRows.ContainsKey(k))
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToArray();

        var modified = currentRows.Keys
            .Where(k => previousRows.TryGetValue(k, out var oldHash) &&
                        !string.Equals(oldHash, currentRows[k], StringComparison.Ordinal))
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToArray();

        return new Db2Diff(
            table,
            added.Length,
            modified.Length,
            removed.Length,
            added,
            modified,
            removed,
            currentRows);
    }

    public static Dictionary<string, string> BuildRowIndex(byte[] csv)
    {
        var rows = new Dictionary<string, string>(StringComparer.Ordinal);
        using var reader = new StringReader(Encoding.UTF8.GetString(csv));

        var headerLine = reader.ReadLine();
        if (string.IsNullOrWhiteSpace(headerLine)) return rows;

        var header = ParseLine(headerLine);
        var keyColumns = SelectKeyColumns(header);

        string? line;
        var duplicateCounters = new Dictionary<string, int>(StringComparer.Ordinal);

        while ((line = reader.ReadLine()) is not null)
        {
            if (line.Length == 0) continue;

            var fields = ParseLine(line);
            var keyParts = keyColumns
                .Select(i => i < fields.Count ? fields[i] : string.Empty)
                .ToArray();

            var key = string.Join("|", keyParts);
            if (string.IsNullOrWhiteSpace(key))
                key = "row:" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(line)))
                    .ToLowerInvariant();

            if (rows.ContainsKey(key))
            {
                var next = duplicateCounters.TryGetValue(key, out var count) ? count + 1 : 2;
                duplicateCounters[key] = next;
                key = $"{key}#{next}";
            }

            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(line)))
                .ToLowerInvariant();

            rows[key] = hash;
        }

        return rows;
    }

    private static int[] SelectKeyColumns(IReadOnlyList<string> header)
    {
        var exactId = Enumerable.Range(0, header.Count)
            .FirstOrDefault(i => string.Equals(header[i], "ID", StringComparison.OrdinalIgnoreCase), -1);

        if (exactId >= 0) return [exactId];

        var idColumns = Enumerable.Range(0, header.Count)
            .Where(i => header[i].EndsWith("ID", StringComparison.OrdinalIgnoreCase))
            .Take(4)
            .ToArray();

        return idColumns.Length > 0 ? idColumns : [0];
    }

    private static List<string> ParseLine(string line)
    {
        var result = new List<string>();
        var value = new StringBuilder();
        var quoted = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                if (quoted && i + 1 < line.Length && line[i + 1] == '"')
                {
                    value.Append('"');
                    i++;
                }
                else
                {
                    quoted = !quoted;
                }
            }
            else if (c == ',' && !quoted)
            {
                result.Add(value.ToString());
                value.Clear();
            }
            else
            {
                value.Append(c);
            }
        }

        result.Add(value.ToString());
        return result;
    }
}
