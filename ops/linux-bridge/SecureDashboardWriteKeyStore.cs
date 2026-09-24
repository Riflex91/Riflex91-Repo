namespace AioBotLinuxBridge;

public sealed class SecureDashboardWriteKeyStore
{
    private readonly string _key;

    public SecureDashboardWriteKeyStore(string? key = null) => _key = string.IsNullOrWhiteSpace(key) ? "web-dashboard-write-key" : key;

    public async Task<string?> LoadAsync(string environmentVariable, CancellationToken cancellationToken = default)
    {
        var stored = await LinuxSecretStore.LookupAsync(_key, cancellationToken);
        if (IsValidWriteKey(stored)) return stored;

        var environmentKey = Environment.GetEnvironmentVariable(environmentVariable);
        if (!IsValidWriteKey(environmentKey)) return null;

        if (LinuxSecretStore.IsAvailable())
        {
            try { await SaveAsync(environmentKey!, cancellationToken); }
            catch { }
        }
        return environmentKey;
    }

    public Task SaveAsync(string writeKey, CancellationToken cancellationToken = default)
    {
        if (!IsValidWriteKey(writeKey)) throw new InvalidOperationException("WEB_DASHBOARD_WRITE_KEY_INVALID");
        return LinuxSecretStore.StoreAsync(_key, writeKey.Trim(), cancellationToken);
    }

    public Task DeleteAsync() => LinuxSecretStore.ClearAsync(_key);

    public static bool IsValidWriteKey(string? writeKey) =>
        !string.IsNullOrWhiteSpace(writeKey) && writeKey.Length <= 500;
}
