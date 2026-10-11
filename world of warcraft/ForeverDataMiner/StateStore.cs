using System.Text.Json;

namespace ForeverDataMiner;

public sealed class MinerState
{
    public string SchemaVersion { get; set; } = "fgds-state-1";
    public string? WatchState { get; set; }
    public string? BuildVersion { get; set; }
    public Dictionary<string, Dictionary<string, string>> TableRows { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);
}

public static class StateStore
{
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static MinerState? Load(string outputDirectory)
    {
        var path = GetPath(outputDirectory);
        if (!File.Exists(path)) return null;

        try
        {
            return JsonSerializer.Deserialize<MinerState>(File.ReadAllText(path), Options);
        }
        catch
        {
            return null;
        }
    }

    public static void Save(string outputDirectory, MinerState state)
    {
        Directory.CreateDirectory(outputDirectory);
        var path = GetPath(outputDirectory);
        var temp = path + ".tmp";
        File.WriteAllText(temp, JsonSerializer.Serialize(state, Options));
        File.Move(temp, path, true);
    }

    private static string GetPath(string outputDirectory) =>
        Path.Combine(outputDirectory, "miner-state.json");
}
