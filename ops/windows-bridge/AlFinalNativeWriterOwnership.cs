using System.Text;
using System.Text.Json;

namespace AioBotWindowsBridge;

/// <summary>
/// Exclusive account + telemetry writer protocol shared with ALFinal's Node host.
/// Creating the lease file is atomic; the owner marker survives clean restarts.
/// Crash/stale/unknown states are never reclaimed automatically.
/// </summary>
public sealed class AlFinalNativeWriterOwnership : IDisposable
{
    public const string OwnerFilename = "writer-owner.json";
    public const string LeaseFilename = "writer-lease.json";
    private readonly string _root;
    private FileStream? _leaseStream;
    private string? _token;

    public AlFinalNativeWriterOwnership(string? stateRoot = null)
    {
        _root = Path.GetFullPath(stateRoot ?? AlFinalNativeAccountSnapshot.DefaultRoot);
    }

    private string OwnerPath => Path.Combine(_root, OwnerFilename);
    private string LeasePath => Path.Combine(_root, LeaseFilename);

    private static string ReadOwner(string filename)
    {
        var info = new FileInfo(filename);
        if (!info.Exists || info.Length > 4096
            || info.Attributes.HasFlag(FileAttributes.ReparsePoint))
            throw new InvalidDataException("ALBOT_WRITER_OWNER_UNVERIFIED");
        using var document = JsonDocument.Parse(File.ReadAllBytes(filename));
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object
            || !root.TryGetProperty("schemaVersion", out var version)
            || version.GetInt32() != 1
            || !root.TryGetProperty("owner", out var owner)
            || owner.ValueKind != JsonValueKind.String)
            throw new InvalidDataException("ALBOT_WRITER_OWNER_INVALID");
        var value = owner.GetString();
        if (value is not ("node" or "bridge"))
            throw new InvalidDataException("ALBOT_WRITER_OWNER_INVALID");
        return value;
    }

    /// <summary>
    /// Only an externally verified, explicitly migrated "bridge" marker can
    /// allow acquisition. There is no implicit Node-to-Bridge takeover.
    /// </summary>
    public void Acquire()
    {
        if (_leaseStream is not null)
            throw new InvalidOperationException("ALBOT_WRITER_ALREADY_ACQUIRED");
        if (ReadOwner(OwnerPath) != "bridge")
            throw new InvalidOperationException("ALBOT_WRITER_STILL_OWNED_BY_NODE");
        var stream = new FileStream(LeasePath, FileMode.CreateNew, FileAccess.ReadWrite,
            FileShare.None, 4096, FileOptions.WriteThrough);
        var token = Guid.NewGuid().ToString("N");
        try
        {
            var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
            {
                schemaVersion = 1, owner = "bridge", token, processId = Environment.ProcessId
            }) + "\n");
            stream.Write(bytes);
            stream.Flush(flushToDisk: true);
            _leaseStream = stream;
            _token = token;
            if (!IsOwned()) throw new InvalidOperationException("ALBOT_WRITER_OWNERSHIP_UNVERIFIED");
        }
        catch
        {
            stream.Dispose();
            _leaseStream = null;
            _token = null;
            // Do not silently remove a potentially uncertain/stale lease.
            throw;
        }
    }

    public bool IsOwned()
    {
        if (_leaseStream is null || _token is null) return false;
        try
        {
            if (ReadOwner(OwnerPath) != "bridge") return false;
            _leaseStream.Position = 0;
            using var document = JsonDocument.Parse(_leaseStream);
            var value = document.RootElement;
            var confirmed = value.GetProperty("schemaVersion").GetInt32() == 1
                && value.GetProperty("owner").GetString() == "bridge"
                && value.GetProperty("token").GetString() == _token;
            _leaseStream.Position = _leaseStream.Length;
            return confirmed;
        }
        catch { return false; }
    }

    public void Dispose()
    {
        var owned = IsOwned();
        _leaseStream?.Dispose();
        _leaseStream = null;
        _token = null;
        // Only cleanly released, verified leases are removed.
        // Any loss of ownership leaves an explicit manual-recovery barrier.
        if (owned) File.Delete(LeasePath);
    }
}
