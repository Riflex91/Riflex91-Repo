using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

public sealed record BackblazeCredentials(string KeyId, string ApplicationKey)
{
    public bool IsValid => SecureBackblazeCredentialStore.IsValidKeyId(KeyId)
        && SecureBackblazeCredentialStore.IsValidApplicationKey(ApplicationKey);
}

public sealed class SecureBackblazeCredentialStore
{
    private readonly string _path;

    public SecureBackblazeCredentialStore(string? path = null)
    {
        _path = path ?? BridgeConfig.BackblazeCredentialsPath;
    }

    public async Task<BackblazeCredentials?> LoadAsync(
        string keyIdEnvironmentVariable,
        string applicationKeyEnvironmentVariable,
        CancellationToken cancellationToken = default)
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
                        var credentials = JsonSerializer.Deserialize<BackblazeCredentials>(clearBytes, BridgeConfig.JsonOptions);
                        return credentials is { IsValid: true } ? credentials : null;
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
            catch (JsonException)
            {
                return null;
            }
        }

        var keyId = Environment.GetEnvironmentVariable(keyIdEnvironmentVariable);
        var applicationKey = Environment.GetEnvironmentVariable(applicationKeyEnvironmentVariable);
        if (!IsValidKeyId(keyId) || !IsValidApplicationKey(applicationKey)) return null;

        var imported = new BackblazeCredentials(keyId!.Trim(), applicationKey!.Trim());
        await SaveAsync(imported, cancellationToken);
        return imported;
    }

    public async Task SaveAsync(BackblazeCredentials credentials, CancellationToken cancellationToken = default)
    {
        if (credentials is not { IsValid: true })
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_INVALID");

        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        var clearBytes = JsonSerializer.SerializeToUtf8Bytes(
            new BackblazeCredentials(credentials.KeyId.Trim(), credentials.ApplicationKey.Trim()),
            BridgeConfig.JsonOptions);
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

    public static bool IsValidKeyId(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Length <= 256
        && !value.Any(char.IsWhiteSpace);

    public static bool IsValidApplicationKey(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Length <= 1024
        && !value.Any(char.IsWhiteSpace);
}
