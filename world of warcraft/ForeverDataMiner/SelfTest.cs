using System.Text;

namespace ForeverDataMiner;

public static class SelfTest
{
    public static void Run()
    {
        var root = Path.Combine(Path.GetTempPath(), "ForeverDataMiner-SelfTest-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);

        try
        {
            TestBuildInfo(root);
            TestCsvDiff();
            TestStateStore(root);
            Console.WriteLine("ForeverDataMiner self-test passed.");
        }
        finally
        {
            try { Directory.Delete(root, true); } catch { }
        }
    }

    private static void TestBuildInfo(string root)
    {
        var buildInfo = string.Join(Environment.NewLine,
            "Branch!STRING:0|Active!DEC:1|Build Key!HEX:16|CDN Key!HEX:16|Product!STRING:0|Version!STRING:0",
            "beta|1|11112222333344445555666677778888|aaaabbbbccccddddeeeeffff00001111|wow_beta|1.60.1.69913",
            "us|1|99990000111122223333444455556666|12341234123412341234123412341234|wow|12.0.7.68256");

        File.WriteAllText(Path.Combine(root, ".build.info"), buildInfo);

        var build = BuildInfoReader.Read(root);
        Assert(build.Version == "1.60.1.69913", "Forever version selection failed.");
        Assert(build.BuildNumber == "69913", "Build number parsing failed.");
        Assert(build.InterfaceVersion == 16001, "Interface version derivation failed.");
        Assert(build.BuildKey == "11112222333344445555666677778888", "Build key parsing failed.");
        Assert(build.Product == "wow_beta", "Product selection failed.");
    }

    private static void TestCsvDiff()
    {
        var before = Encoding.UTF8.GetBytes(
            "ID,Name,QuestID\n" +
            "1,\"Hello, world\",10\n" +
            "2,Old,11\n");

        var after = Encoding.UTF8.GetBytes(
            "ID,Name,QuestID\n" +
            "1,\"Hello, changed world\",10\n" +
            "3,New,12\n");

        var oldRows = CsvDiff.BuildRowIndex(before);
        var diff = CsvDiff.Compare("QuestV2", after, oldRows);

        Assert(diff.AddedCount == 1 && diff.AddedIds.Single() == "3", "CSV added-row diff failed.");
        Assert(diff.ModifiedCount == 1 && diff.ModifiedIds.Single() == "1", "CSV modified-row diff failed.");
        Assert(diff.RemovedCount == 1 && diff.RemovedIds.Single() == "2", "CSV removed-row diff failed.");
    }

    private static void TestStateStore(string root)
    {
        var state = new MinerState
        {
            BuildVersion = "1.60.1.69913",
            WatchState = "test-state",
            TableRows =
            {
                ["QuestV2"] = new Dictionary<string, string> { ["1"] = "abc" }
            }
        };

        StateStore.Save(root, state);
        var loaded = StateStore.Load(root);

        Assert(loaded?.BuildVersion == state.BuildVersion, "State build version round-trip failed.");
        Assert(loaded?.WatchState == state.WatchState, "State watch-state round-trip failed.");
        Assert(loaded?.TableRows["QuestV2"]["1"] == "abc", "State table hash round-trip failed.");
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
