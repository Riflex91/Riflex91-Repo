namespace AioBotLinuxBridge;

public sealed class SecureTokenStore
{
    private readonly string _key;

    public SecureTokenStore(string? key = null) => _key = string.IsNullOrWhiteSpace(key) ? "telemetry-token" : key;

    public async Task<string?> LoadAsync(string environmentVariable, CancellationToken cancellationToken = default)
    {
        var stored = await LinuxSecretStore.LookupAsync(_key, cancellationToken);
        if (IsValidToken(stored)) return stored;

        var environmentToken = Environment.GetEnvironmentVariable(environmentVariable);
        if (!IsValidToken(environmentToken)) return null;

        if (LinuxSecretStore.IsAvailable())
        {
            try { await SaveAsync(environmentToken!, cancellationToken); }
            catch { }
        }
        return environmentToken;
    }

    public Task SaveAsync(string token, CancellationToken cancellationToken = default)
    {
        if (!IsValidToken(token)) throw new InvalidOperationException("TELEMETRY_TOKEN_INVALID");
        return LinuxSecretStore.StoreAsync(_key, token.Trim(), cancellationToken);
    }

    public Task DeleteAsync() => LinuxSecretStore.ClearAsync(_key);

    public static bool IsValidToken(string? token) => token is { Length: >= 24 and <= 256 };
}
