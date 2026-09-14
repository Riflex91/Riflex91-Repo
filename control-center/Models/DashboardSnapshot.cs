namespace AioBotControlCenter.Models;

public sealed record DashboardSnapshot(
    DateTimeOffset RefreshedAt,
    string GitHubCommit,
    string GitHubState,
    string PiState,
    string BotHealth,
    string TelemetryState,
    string? CharacterName,
    string? Map,
    int RestartCount,
    string? LastIncident)
{
    public static DashboardSnapshot Empty() => new(
        DateTimeOffset.Now,
        "not configured",
        "OFFLINE",
        "OFFLINE",
        "UNKNOWN",
        "OFFLINE",
        null,
        null,
        0,
        null);
}
