using System.Security.Cryptography;
using System.Text;

namespace AioBotWindowsBridge;

public sealed class SecureFtpsPasswordStore
{
    private readonly string _path;

    public SecureFtpsPasswordStore(string? path = null)
    {
        _path = path ?? BridgeConfig.DiagnosticsFtpsPasswordPath;
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
                        var password = Encoding.UTF8.GetString(clearBytes);
                        return IsValidPassword(password) ? password : null;
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

        var environmentPassword = Environment.GetEnvironmentVariable(environmentVariable);
        if (!IsValidPassword(environmentPassword)) return null;
        await SaveAsync(environmentPassword!, cancellationToken);
        return environmentPassword;
    }

    public async Task SaveAsync(string password, CancellationToken cancellationToken = default)
    {
        if (!IsValidPassword(password)) throw new InvalidOperationException("DIAGNOSTICS_FTPS_PASSWORD_INVALID");
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        var clearBytes = Encoding.UTF8.GetBytes(password);
        try
        {
            var protectedBytes = ProtectedData.Protect(clearBytes, null, DataProtectionScope.CurrentUser);
            try
            {
                var temporaryPath = _path + ".tmp";
                await File.WriteAllTextAsync(temporaryPath, Convert.ToBase64String(protectedBytes), cancellationToken);
                File.Move(temporaryPath, _path, true);
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

    public static bool IsValidPassword(string? password) =>
        !string.IsNullOrWhiteSpace(password) && password.Length <= 1024;
}
