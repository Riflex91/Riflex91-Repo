using System.Text.Json;

namespace AioBotLinuxBridge;

public sealed record BackblazeCredentials(string KeyId, string ApplicationKey)
{
    public bool IsValid => SecureBackblazeCredentialStore.IsValidKeyId(KeyId)
        && SecureBackblazeCredentialStore.IsValidApplicationKey(ApplicationKey);
}

public sealed class SecureBackblazeCredentialStore
{
    private readonly string _key;

    public SecureBackblazeCredentialStore(string? key = null) => _key = string.IsNullOrWhiteSpace(key) ? "backblaze-credentials" : key;

    public async Task<BackblazeCredentials?> LoadAsync(
        string keyIdEnvironmentVariable,
        string applicationKeyEnvironmentVariable,
        CancellationToken cancellationToken = default)
    {
        var stored = await LinuxSecretStore.LookupAsync(_key, cancellationToken);
        if (!string.IsNullOrWhiteSpace(stored))
        {
            try
            {
                var credentials = JsonSerializer.Deserialize<BackblazeCredentials>(stored, BridgeConfig.JsonOptions);
                if (credentials is { IsValid: true }) return credentials;
            }
            catch (JsonException)
            {
            }
        }

        var keyId = Environment.GetEnvironmentVariable(keyIdEnvironmentVariable);
        var applicationKey = Environment.GetEnvironmentVariable(applicationKeyEnvironmentVariable);
        if (!IsValidKeyId(keyId) || !IsValidApplicationKey(applicationKey)) return null;

        var imported = new BackblazeCredentials(keyId!.Trim(), applicationKey!.Trim());
        if (LinuxSecretStore.IsAvailable())
        {
            try { await SaveAsync(imported, cancellationToken); }
            catch { }
        }
        return imported;
    }

    public Task SaveAsync(BackblazeCredentials credentials, CancellationToken cancellationToken = default)
    {
        if (credentials is not { IsValid: true })
            throw new InvalidOperationException("BACKBLAZE_CREDENTIALS_INVALID");

        var json = JsonSerializer.Serialize(
            new BackblazeCredentials(credentials.KeyId.Trim(), credentials.ApplicationKey.Trim()),
            BridgeConfig.JsonOptions);
        return LinuxSecretStore.StoreAsync(_key, json, cancellationToken);
    }

    public Task DeleteAsync() => LinuxSecretStore.ClearAsync(_key);

    public static bool IsValidKeyId(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length <= 256 && !value.Any(char.IsWhiteSpace);

    public static bool IsValidApplicationKey(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length <= 1024 && !value.Any(char.IsWhiteSpace);
}
