namespace ForeverDataMiner;

public static class Program
{
    [STAThread]
    public static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length == 0)
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new MainForm());
                return 0;
            }

            if (args[0] is "-h" or "--help" or "help")
            {
                PrintHelp();
                return 0;
            }

            var command = args[0].ToLowerInvariant();
            if (command == "selftest")
            {
                SelfTest.Run();
                return 0;
            }

            var wowRoot = GetArg(args, "--wow") ?? AutoDetectWowRoot()
                ?? throw new ArgumentException("WoW root not found. Pass --wow <path>.");

            var output = GetArg(args, "--out")
                ?? DefaultOutputDirectory();

            var wtlRaw = GetArg(args, "--wtl");
            var wtl = Uri.TryCreate(wtlRaw, UriKind.Absolute, out var uri) ? uri : null;

            var options = new MinerOptions(
                WowRoot: Path.GetFullPath(wowRoot),
                OutputDirectory: Path.GetFullPath(output),
                WowToolsLocal: wtl,
                PollInterval: TimeSpan.FromSeconds(30),
                ManageWowToolsLocal: args.Contains("--manage-wtl", StringComparer.OrdinalIgnoreCase));

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
            if (args.Length == 0)
                MessageBox.Show(ex.Message, "ForeverDataMiner", MessageBoxButtons.OK, MessageBoxIcon.Error);
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

    public static string? AutoDetectWowRoot()
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

    public static string DefaultOutputDirectory() =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ForeverGuide",
            "ForeverDataMiner",
            "exports");

    private static void PrintHelp()
    {
        Console.WriteLine("""
ForeverDataMiner

Double-click without arguments to open the Windows UI.

Commands:
  selftest
  scan  --wow <WoW root> [--wtl http://localhost:5000] [--manage-wtl] [--out <folder>]
  watch --wow <WoW root> [--wtl http://localhost:5000] [--manage-wtl] [--out <folder>]

watch polls the local build identity and emits a new FGDS bundle whenever the
Forever build/build-key/hotfix-cache state changes.
""");
    }
}
