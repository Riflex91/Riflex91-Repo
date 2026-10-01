using System.Text.Json;

namespace ForeverDataMiner;

public sealed class GuiSettings
{
    public string? WowRoot { get; set; }
    public string WowToolsLocal { get; set; } = "http://localhost:5000";
    public bool UseWowToolsLocal { get; set; } = true;
    public bool AutoMonitor { get; set; } = true;
    public bool ManageWowToolsLocal { get; set; } = false;

    private static string SettingsPath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ForeverGuide",
        "ForeverDataMiner",
        "settings.json");

    public static GuiSettings Load()
    {
        try
        {
            if (File.Exists(SettingsPath))
                return JsonSerializer.Deserialize<GuiSettings>(File.ReadAllText(SettingsPath)) ?? new GuiSettings();
        }
        catch
        {
            // Invalid settings should never prevent the collector from starting.
        }

        return new GuiSettings();
    }

    public void Save()
    {
        var directory = Path.GetDirectoryName(SettingsPath)!;
        Directory.CreateDirectory(directory);
        File.WriteAllText(SettingsPath, JsonSerializer.Serialize(this, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
