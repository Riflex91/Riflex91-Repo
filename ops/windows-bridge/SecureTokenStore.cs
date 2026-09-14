using System.Security.Cryptography;
using System.Text;

namespace AioBotWindowsBridge;

public sealed class SecureTokenStore
{
    private readonly string _path;

    public SecureTokenStore(string? path = null)
    {
        _path = path ?? BridgeConfig.TokenPath;
    }

    public async Task<string?> LoadAsync(string environmentVariable, CancellationToken cancellationToken = default)
    {
        if (File.Exists(_path))
        {
            var protectedText = await File.ReadAllTextAsync(_path, cancellationToken);
            var protectedBytes = Convert.FromBase64String(protectedText.Trim());
            var clearBytes = ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser);
            var token = Encoding.UTF8.GetString(clearBytes);
            CryptographicOperations.ZeroMemory(clearBytes);
            return IsValidToken(token) ? token : null;
        }

        var environmentToken = Environment.GetEnvironmentVariable(environmentVariable);
        if (!IsValidToken(environmentToken)) return null;
        await SaveAsync(environmentToken!, cancellationToken);
        return environmentToken;
    }

    public async Task SaveAsync(string token, CancellationToken cancellationToken = default)
    {
        if (!IsValidToken(token)) throw new InvalidOperationException("TELEMETRY_TOKEN_INVALID");
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        var clearBytes = Encoding.UTF8.GetBytes(token);
        try
        {
            var protectedBytes = ProtectedData.Protect(clearBytes, null, DataProtectionScope.CurrentUser);
            await File.WriteAllTextAsync(_path, Convert.ToBase64String(protectedBytes), cancellationToken);
            CryptographicOperations.ZeroMemory(protectedBytes);
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

    public static bool IsValidToken(string? token) => token is { Length: >= 24 and <= 256 };
}
