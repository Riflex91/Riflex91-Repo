using System.Text.Json.Serialization;

namespace ForeverDataMiner;

public sealed record BuildIdentity(
    string Version,
    string BuildNumber,
    int? InterfaceVersion,
    string? BuildKey,
    string? CdnKey,
    string? Product);

public sealed record FgdsRecord(
    string Kind,
    object? Id,
    DateTimeOffset ObservedAt,
    string? Evidence,
    Dictionary<string, object?> Data);

public sealed class FgdsBundle
{
    [JsonPropertyName("schemaVersion")]
    public string SchemaVersion { get; init; } = "fgds-1.0";

    [JsonPropertyName("source")]
    public string Source { get; init; } = "miner";

    [JsonPropertyName("createdUtc")]
    public DateTimeOffset CreatedUtc { get; init; } = DateTimeOffset.UtcNow;

    [JsonPropertyName("build")]
    public required BuildIdentity Build { get; init; }

    [JsonPropertyName("records")]
    public List<FgdsRecord> Records { get; init; } = [];
}

public sealed record MinerOptions(
    string WowRoot,
    string OutputDirectory,
    Uri? WowToolsLocal,
    TimeSpan PollInterval,
    bool ManageWowToolsLocal = false);
