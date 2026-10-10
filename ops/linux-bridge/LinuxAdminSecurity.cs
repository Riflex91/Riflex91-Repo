using System.Security.Cryptography;
using System.Text;

namespace AioBotWindowsBridge;

public static class LinuxAdminTokenStore
{
    public const int TokenBytes = 32;

    public static string LoadOrCreate()
    {
        Directory.CreateDirectory(BridgeConfig.StateDirectory);

        for (var attempt = 0; attempt < 2; attempt++)
        {
            if (File.Exists(BridgeConfig.AdminTokenPath))
                return ReadExisting();

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(TokenBytes)).ToLowerInvariant();
            try
            {
                var options = new FileStreamOptions
                {
                    Mode = FileMode.CreateNew,
                    Access = FileAccess.Write,
                    Share = FileShare.None,
                    UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite
                };

                using (var stream = new FileStream(BridgeConfig.AdminTokenPath, options))
                using (var writer = new StreamWriter(stream, new UTF8Encoding(false)))
                {
                    writer.Write(token);
                    writer.Flush();
                    stream.Flush(flushToDisk: true);
                }

                File.SetUnixFileMode(
                    BridgeConfig.AdminTokenPath,
                    UnixFileMode.UserRead | UnixFileMode.UserWrite);
                return token;
            }
            catch (IOException) when (attempt == 0 && File.Exists(BridgeConfig.AdminTokenPath))
            {
                // Another instance won the CreateNew race. Read the owner-only file.
            }
        }

        return ReadExisting();
    }

    public static bool IsValidToken(string? value)
    {
        if (value is null || value.Length != TokenBytes * 2)
            return false;

        foreach (var ch in value)
        {
            if (!char.IsAsciiHexDigit(ch))
                return false;
        }

        return true;
    }

    private static string ReadExisting()
    {
        var info = new FileInfo(BridgeConfig.AdminTokenPath);
        if (info.LinkTarget is not null)
            throw new InvalidOperationException("ADMIN_TOKEN_SYMLINK_REJECTED");

        var token = File.ReadAllText(BridgeConfig.AdminTokenPath).Trim();
        if (!IsValidToken(token))
            throw new InvalidOperationException("ADMIN_TOKEN_INVALID");

        File.SetUnixFileMode(
            BridgeConfig.AdminTokenPath,
            UnixFileMode.UserRead | UnixFileMode.UserWrite);
        return token;
    }
}
