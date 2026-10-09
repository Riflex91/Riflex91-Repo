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
