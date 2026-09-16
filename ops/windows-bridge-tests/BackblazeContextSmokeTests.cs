using AioBotWindowsBridge;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.Json;

internal static class BackblazeContextSmokeTests
{
    [ModuleInitializer]
    internal static void Run()
    {
        Assert(CdpBackblazeConfigurator.BotContextNotFoundError == "BACKBLAZE_BOT_CONTEXT_NOT_FOUND", "BACKBLAZE_BOT_CONTEXT_ERROR");
        Assert(CdpBackblazeConfigurator.SelfTestNotVerifiedError == "BACKBLAZE_SELF_TEST_NOT_VERIFIED", "BACKBLAZE_SELF_TEST_ERROR");

        using var valid = JsonDocument.Parse("""
        {
          "ok": true,
          "verified": true,
          "provider": "backblaze-b2",
          "bucket": "al-aio-bot",
          "key": "v4/_health/test.json",
          "bytes": 123,
          "versionId": "4_z-test-version"
        }
        """);

        var result = CdpBackblazeConfigurator.ParseSelfTestResult(
            valid.RootElement,
            "https://adventure.land/character/test/in/EU/I/");

        Assert(result.Ok, "BACKBLAZE_SELF_TEST_OK");
        Assert(result.Verified, "BACKBLAZE_SELF_TEST_VERIFIED");
        Assert(result.Provider == "backblaze-b2", "BACKBLAZE_SELF_TEST_PROVIDER");
        Assert(result.Bucket == "al-aio-bot", "BACKBLAZE_SELF_TEST_BUCKET");
        Assert(result.Key == "v4/_health/test.json", "BACKBLAZE_SELF_TEST_KEY");
        Assert(result.Bytes == 123, "BACKBLAZE_SELF_TEST_BYTES");
        Assert(result.VersionId == "4_z-test-version", "BACKBLAZE_SELF_TEST_VERSION_ID");

        using var invalid = JsonDocument.Parse("""
        {
          "ok": true,
          "verified": false,
          "provider": "backblaze-b2",
          "bucket": "al-aio-bot",
          "key": "v4/_health/test.json",
          "bytes": 123
        }
        """);

        try
        {
            _ = CdpBackblazeConfigurator.ParseSelfTestResult(invalid.RootElement, null);
            throw new InvalidOperationException("BACKBLAZE_SELF_TEST_MUST_REJECT_UNVERIFIED");
        }
        catch (InvalidOperationException error) when (error.Message == CdpBackblazeConfigurator.SelfTestNotVerifiedError)
        {
        }

        var exportedNames = typeof(BackblazeSelfTestResult)
            .GetProperties(BindingFlags.Instance | BindingFlags.Public)
            .Select(property => property.Name)
            .ToArray();
        Assert(!exportedNames.Contains("KeyId", StringComparer.OrdinalIgnoreCase), "BACKBLAZE_SELF_TEST_MUST_NOT_EXPORT_KEY_ID");
        Assert(!exportedNames.Contains("ApplicationKey", StringComparer.OrdinalIgnoreCase), "BACKBLAZE_SELF_TEST_MUST_NOT_EXPORT_APPLICATION_KEY");
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
