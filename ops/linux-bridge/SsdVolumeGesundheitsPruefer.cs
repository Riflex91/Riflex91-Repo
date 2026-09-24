using System.Diagnostics;

namespace AioBotLinuxBridge;

public sealed record SsdVolumeProbe(
    bool Vorhanden,
    string Laufwerk,
    bool Bereit,
    string FestplattenTyp,
    string VolumeId,
    long GesamtBytes,
    long FreiBytes);

public sealed record SsdVolumeGesundheit(
    bool Gesund,
    string Grund,
    double? FreiProzent);

public static class SsdVolumeGesundheitsPruefer
{
    public const int MindestFreieReserveProzent = 15;

    public static SsdVolumeGesundheit Bewerte(SsdVolumeProbe probe)
    {
        if (!probe.Vorhanden)
            return new SsdVolumeGesundheit(false, "SSD_VOLUME_FEHLT", null);
        if (string.IsNullOrWhiteSpace(probe.Laufwerk))
            return new SsdVolumeGesundheit(false, "VOLUME_IDENTITAET_FEHLT", null);
        if (!probe.Bereit)
            return new SsdVolumeGesundheit(false, "VOLUME_NICHT_BEREIT", null);
        if (!string.Equals(probe.FestplattenTyp, "SSD", StringComparison.OrdinalIgnoreCase))
            return new SsdVolumeGesundheit(false, "MEDIENTYP_NICHT_SSD", null);
        if (string.IsNullOrWhiteSpace(probe.VolumeId))
            return new SsdVolumeGesundheit(false, "VOLUME_IDENTITAET_FEHLT", null);
        if (probe.GesamtBytes <= 0 || probe.FreiBytes < 0 || probe.FreiBytes > probe.GesamtBytes)
            return new SsdVolumeGesundheit(false, "SPEICHERWERTE_UNGUELTIG", null);

        var freiProzent = probe.FreiBytes * 100d / probe.GesamtBytes;
        if (freiProzent < MindestFreieReserveProzent)
            return new SsdVolumeGesundheit(false, "KRITISCHE_SPEICHERRESERVE_UNTERSCHRITTEN", freiProzent);

        return new SsdVolumeGesundheit(true, "GESUND", freiProzent);
    }

    public static async Task<SsdVolumeGesundheit> PruefeAsync(
        string pfad,
        CancellationToken cancellationToken = default)
        => Bewerte(await ErfasseAsync(pfad, cancellationToken));

    public static async Task<SsdVolumeProbe> ErfasseAsync(
        string pfad,
        CancellationToken cancellationToken = default)
    {
        var voll = BridgeConfig.NormalisiereLiveWissenspfad(pfad);
        if (!Directory.Exists(voll))
            return new SsdVolumeProbe(false, voll, false, "UNBEKANNT", "", 0, 0);

        DriveInfo drive;
        try
        {
            drive = new DriveInfo(voll);
        }
        catch
        {
            var root = Path.GetPathRoot(voll) ?? "/";
            drive = new DriveInfo(root);
        }

        if (!drive.IsReady)
            return new SsdVolumeProbe(true, voll, false, "UNBEKANNT", "", 0, 0);

        var backing = await ErmittleDatentraegerAsync(voll, cancellationToken);
        return new SsdVolumeProbe(
            true,
            backing.Source,
            true,
            backing.MediaType,
            backing.VolumeId,
            drive.TotalSize,
            drive.AvailableFreeSpace);
    }

    private sealed record DatentraegerInfo(string Source, string MediaType, string VolumeId);

    private static async Task<DatentraegerInfo> ErmittleDatentraegerAsync(
        string pfad,
        CancellationToken cancellationToken)
    {
        var source = (await FuehreAusAsync("findmnt", ["-no", "SOURCE", "--target", pfad], cancellationToken)).Trim();
        if (string.IsNullOrWhiteSpace(source))
            return new DatentraegerInfo(pfad, "UNBEKANNT", pfad);

        var volumeId = source;
        var mediaType = "UNBEKANNT";

        if (source.StartsWith("/dev/", StringComparison.Ordinal))
        {
            try
            {
                var output = (await FuehreAusAsync("lsblk", ["-ndo", "ROTA,UUID", source], cancellationToken)).Trim();
                var parts = output.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (parts.Length >= 1)
                    mediaType = parts[0] == "0" ? "SSD" : parts[0] == "1" ? "HDD" : "UNBEKANNT";
                if (parts.Length >= 2 && !string.IsNullOrWhiteSpace(parts[1]))
                    volumeId = parts[1];
            }
            catch
            {
                // Unknown media type is fail-closed in Bewerte.
            }
        }

        return new DatentraegerInfo(source, mediaType, volumeId);
    }

    private static async Task<string> FuehreAusAsync(
        string datei,
        IReadOnlyList<string> argumente,
        CancellationToken cancellationToken)
    {
        var start = new ProcessStartInfo
        {
            FileName = datei,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };
        foreach (var argument in argumente) start.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = start };
        try
        {
            if (!process.Start()) throw new InvalidOperationException("PROZESS_START_FEHLER");
        }
        catch (Exception error)
        {
            throw new InvalidOperationException($"LINUX_TOOL_FEHLT:{datei}", error);
        }

        var stdout = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderr = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        if (process.ExitCode != 0)
            throw new InvalidOperationException($"{datei.ToUpperInvariant()}_FEHLER:{Begrenze(await stderr)}");
        return await stdout;
    }

    private static string Begrenze(string text) =>
        text.Trim().Length <= 300 ? text.Trim() : text.Trim()[..300];
}
