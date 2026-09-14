using System.Security.Cryptography;
using System.Text;

namespace AioBotWindowsBridge;

public sealed class SecureDashboardWriteKeyStore
{
    private readonly string _path;

    public SecureDashboardWriteKeyStore(string? path = null)
    {
        _path = path ?? BridgeConfig.WebDashboardWriteKeyPath;
    }

    public async Task<string?> LoadAsync(string environmentVariable, CancellationToken cancellationToken = default)
    {
        if (File.Exists(_path))
        {
            try
            {
                var protectedText = await File.ReadAllTextAsync(_path, cancellationToken);
                var protectedBytes = Convert.FromBase64String(protectedText.Trim());
                try
                {
                    var clearBytes = ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser);
                    try
                    {
                        var writeKey = Encoding.UTF8.GetString(clearBytes);
                        return IsValidWriteKey(writeKey) ? writeKey : null;
                    }
                    finally
                    {
                        CryptographicOperations.ZeroMemory(clearBytes);
                    }
                }
                finally
                {
                    CryptographicOperations.ZeroMemory(protectedBytes);
                }
            }
            catch (CryptographicException)
            {
                return null;
            }
            catch (FormatException)
            {
                return null;
            }
        }

        var environmentKey = Environment.GetEnvironmentVariable(environmentVariable);
        if (!IsValidWriteKey(environmentKey)) return null;
        await SaveAsync(environmentKey!, cancellationToken);
        return environmentKey;
    }

    public async Task SaveAsync(string writeKey, CancellationToken cancellationToken = default)
    {
        if (!IsValidWriteKey(writeKey)) throw new InvalidOperationException("WEB_DASHBOARD_WRITE_KEY_INVALID");
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        var clearBytes = Encoding.UTF8.GetBytes(writeKey);
        try
        {
            var protectedBytes = ProtectedData.Protect(clearBytes, null, DataProtectionScope.CurrentUser);
            try
            {
                await File.WriteAllTextAsync(_path, Convert.ToBase64String(protectedBytes), cancellationToken);
            }
            finally
            {
                CryptographicOperations.ZeroMemory(protectedBytes);
            }
        }
        finally
        {
            CryptographicOperations.ZeroMemory(clearBytes);
        }
    }

    public Task DeleteAsync()
    {
        if (File.Exists(_path)) File.Delete(_path);
        return Task.CompletedTask;
    }

    public static bool IsValidWriteKey(string? writeKey) =>
        !string.IsNullOrWhiteSpace(writeKey) && writeKey.Length <= 500;
}
