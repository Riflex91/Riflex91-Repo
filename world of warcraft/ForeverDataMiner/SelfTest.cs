namespace ForeverDataMiner;

public static class SelfTest
{
    public static void Run()
    {
        var root = Path.Combine(Path.GetTempPath(), "ForeverDataMiner-SelfTest-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);

        try
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

            Console.WriteLine("ForeverDataMiner self-test passed.");
        }
        finally
        {
            try { Directory.Delete(root, true); } catch { }
        }
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
