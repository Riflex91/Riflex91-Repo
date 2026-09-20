namespace ForeverDataMiner;

public static class BuildInfoReader
{
    public static BuildIdentity Read(string wowRoot)
    {
        var buildInfoPath = Path.Combine(wowRoot, ".build.info");
        if (!File.Exists(buildInfoPath))
            throw new FileNotFoundException("Could not find .build.info in the selected World of Warcraft root.", buildInfoPath);

        var lines = File.ReadAllLines(buildInfoPath);
        if (lines.Length < 2)
            throw new InvalidDataException(".build.info does not contain a header and data row.");

        var headers = lines[0].Split('|')
            .Select(x => x.Split('!')[0].Trim())
            .ToArray();

        var rows = lines.Skip(1)
            .Select(line => line.Split('|'))
            .Where(parts => parts.Length >= headers.Length)
            .Select(parts => headers.Select((h, i) => new { h, v = parts[i].Trim() })
                .ToDictionary(x => x.h, x => x.v, StringComparer.OrdinalIgnoreCase))
            .ToList();

        var row = rows.FirstOrDefault(r =>
            Get(r, "Product").Contains("wow", StringComparison.OrdinalIgnoreCase) &&
            (Get(r, "Version").StartsWith("1.60.", StringComparison.OrdinalIgnoreCase) ||
             Get(r, "Product").Contains("beta", StringComparison.OrdinalIgnoreCase)))
            ?? rows.FirstOrDefault(r => Get(r, "Product").Contains("wow", StringComparison.OrdinalIgnoreCase))
            ?? rows.First();

        var version = Get(row, "Version");
        var buildNumber = version.Split('.', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "unknown";

        return new BuildIdentity(
            Version: version,
            BuildNumber: buildNumber,
            InterfaceVersion: DeriveInterfaceVersion(version),
            BuildKey: NullIfEmpty(Get(row, "Build Key")),
            CdnKey: NullIfEmpty(Get(row, "CDN Key")),
            Product: NullIfEmpty(Get(row, "Product")));
    }

    private static int? DeriveInterfaceVersion(string version)
    {
        var parts = version.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 3) return null;

        if (!int.TryParse(parts[0], out var major) ||
            !int.TryParse(parts[1], out var minor) ||
            !int.TryParse(parts[2], out var patch))
            return null;

        return major * 10000 + minor * 100 + patch;
    }

    private static string Get(IReadOnlyDictionary<string, string> row, string key) =>
        row.TryGetValue(key, out var value) ? value : string.Empty;

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
