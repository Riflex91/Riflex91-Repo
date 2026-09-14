using System.Text.Json;

namespace AioBotControlCenter.Services;

public sealed record ControlCenterConfig
{
    public string GitHubRepository { get; init; } = "Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public";
    public string GitHubToken { get; init; } = string.Empty;
    public string PiHostUrl { get; init; } = "http://127.0.0.1:8787";
    public string PiHostToken { get; init; } = string.Empty;
    public string PiControlUrl { get; init; } = "http://127.0.0.1:8790";
    public string PiControlToken { get; init; } = string.Empty;
    public string TelemetryReadUrl { get; init; } = string.Empty;
    public string TelemetryReadToken { get; init; } = string.Empty;

    public static string ConfigPath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "AioBotControlCenter",
        "settings.json");

    public static async Task<ControlCenterConfig> LoadAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(ConfigPath))
            return new ControlCenterConfig();

        await using var stream = File.OpenRead(ConfigPath);
        return await JsonSerializer.DeserializeAsync<ControlCenterConfig>(stream, cancellationToken: cancellationToken)
            ?? new ControlCenterConfig();
    }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(ConfigPath)!);
        await using var stream = File.Create(ConfigPath);
        await JsonSerializer.SerializeAsync(stream, this, new JsonSerializerOptions { WriteIndented = true }, cancellationToken);
    }
}
