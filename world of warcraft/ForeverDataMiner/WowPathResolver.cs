namespace ForeverDataMiner;

public static class WowPathResolver
{
    public static string? ResolveRoot(string? selectedPath)
    {
        var normalized = NormalizeExistingDirectory(selectedPath);
        if (normalized is null) return null;

        if (File.Exists(Path.Combine(normalized, ".build.info")))
            return normalized;

        var parent = Directory.GetParent(normalized)?.FullName;
        if (!string.IsNullOrWhiteSpace(parent) &&
            File.Exists(Path.Combine(parent, ".build.info")))
            return Path.GetFullPath(parent);

        return null;
    }

    public static bool IsValidSelection(string? selectedPath) =>
        ResolveRoot(selectedPath) is not null;

    public static bool IsForeverProductPath(string? selectedPath)
    {
        var normalized = NormalizeExistingDirectory(selectedPath);
        if (normalized is null) return false;

        return string.Equals(
            Path.GetFileName(normalized),
            "_classic_beta_",
            StringComparison.OrdinalIgnoreCase);
    }

    public static string? PreferredForeverPath(string wowRoot)
    {
        var root = ResolveRoot(wowRoot) ?? NormalizeExistingDirectory(wowRoot);
        if (root is null) return null;

        var forever = Path.Combine(root, "_classic_beta_");
        return Directory.Exists(forever) ? forever : root;
    }

    public static string? NormalizeExistingDirectory(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;

        try
        {
            var full = Path.GetFullPath(path.Trim().Trim('"'));
            if (!Directory.Exists(full)) return null;

            var root = Path.GetPathRoot(full);
            if (string.Equals(full, root, StringComparison.OrdinalIgnoreCase))
                return full;

            return full.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }
        catch
        {
            return null;
        }
    }
}
