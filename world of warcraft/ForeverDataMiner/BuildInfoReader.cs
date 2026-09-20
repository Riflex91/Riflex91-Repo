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
            InterfaceVersion: TryReadInterfaceVersion(wowRoot),
            BuildKey: NullIfEmpty(Get(row, "Build Key")),
            CdnKey: NullIfEmpty(Get(row, "CDN Key")),
            Product: NullIfEmpty(Get(row, "Product")));
    }

    private static int? TryReadInterfaceVersion(string wowRoot)
    {
        foreach (var candidate in new[] { "_beta_", "_classic_", "_retail_" })
        {
            var tocPath = Directory.Exists(Path.Combine(wowRoot, candidate, "Interface"))
                ? Directory.EnumerateFiles(Path.Combine(wowRoot, candidate, "Interface"), "*.toc", SearchOption.AllDirectories).FirstOrDefault()
                : null;

            if (tocPath is null) continue;

            foreach (var line in File.ReadLines(tocPath).Take(80))
            {
                if (!line.StartsWith("## Interface:", StringComparison.OrdinalIgnoreCase)) continue;
                var raw = line.Split(':', 2)[1].Trim().Split(',')[0].Trim();
                if (int.TryParse(raw, out var value)) return value;
            }
        }

        return null;
    }

    private static string Get(IReadOnlyDictionary<string, string> row, string key) =>
        row.TryGetValue(key, out var value) ? value : string.Empty;

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
