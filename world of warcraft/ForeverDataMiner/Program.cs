namespace ForeverDataMiner;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length == 0 || args[0] is "-h" or "--help" or "help")
            {
                PrintHelp();
                return 0;
            }

            var command = args[0].ToLowerInvariant();
            var wowRoot = GetArg(args, "--wow") ?? AutoDetectWowRoot()
                ?? throw new ArgumentException("WoW root not found. Pass --wow <path>.");

            var output = GetArg(args, "--out")
                ?? Path.Combine(AppContext.BaseDirectory, "exports");

            var wtlRaw = GetArg(args, "--wtl");
            var wtl = Uri.TryCreate(wtlRaw, UriKind.Absolute, out var uri) ? uri : null;

            var options = new MinerOptions(
                WowRoot: Path.GetFullPath(wowRoot),
                OutputDirectory: Path.GetFullPath(output),
                WowToolsLocal: wtl,
                PollInterval: TimeSpan.FromSeconds(30));

            var service = new MinerService(options);

            if (command == "scan")
            {
                var path = await service.ScanAsync();
                Console.WriteLine(path);
                return 0;
            }

            if (command == "watch")
            {
                using var cts = new CancellationTokenSource();
                Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };
                await service.WatchAsync(cts.Token);
                return 0;
            }

            throw new ArgumentException($"Unknown command: {command}");
        }
        catch (OperationCanceledException)
        {
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"ForeverDataMiner: {ex.Message}");
            return 1;
        }
    }

    private static string? GetArg(string[] args, string name)
    {
        for (var i = 0; i < args.Length - 1; i++)
            if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase))
                return args[i + 1];
        return null;
    }

    private static string? AutoDetectWowRoot()
    {
        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "World of Warcraft"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "World of Warcraft"),
            @"C:\World of Warcraft",
            @"D:\World of Warcraft",
            @"E:\World of Warcraft"
        };

        return candidates.FirstOrDefault(path => File.Exists(Path.Combine(path, ".build.info")));
    }

    private static void PrintHelp()
    {
        Console.WriteLine("""
ForeverDataMiner

Commands:
  scan  --wow <WoW root> [--wtl http://localhost:5000] [--out <folder>]
  watch --wow <WoW root> [--wtl http://localhost:5000] [--out <folder>]

watch polls the local build identity and emits a new FGDS bundle whenever the
Forever build/build-key changes.
""");
    }
}
