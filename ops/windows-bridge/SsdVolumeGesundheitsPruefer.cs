using System.Diagnostics;

namespace AioBotWindowsBridge;

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
    public const string ErwartetesLaufwerk = "D:";

    public static SsdVolumeGesundheit Bewerte(SsdVolumeProbe probe)
    {
        if (!probe.Vorhanden)
            return new SsdVolumeGesundheit(false, "SSD_VOLUME_FEHLT", null);

        if (!string.Equals(
                probe.Laufwerk.TrimEnd('\\', '/'),
                ErwartetesLaufwerk,
                StringComparison.OrdinalIgnoreCase))
            return new SsdVolumeGesundheit(false, "FALSCHES_VOLUME", null);

        if (!probe.Bereit)
            return new SsdVolumeGesundheit(false, "VOLUME_NICHT_BEREIT", null);

        if (!string.Equals(probe.FestplattenTyp, "SSD", StringComparison.OrdinalIgnoreCase))
            return new SsdVolumeGesundheit(false, "MEDIENTYP_NICHT_SSD", null);

        if (string.IsNullOrWhiteSpace(probe.VolumeId))
            return new SsdVolumeGesundheit(false, "VOLUME_IDENTITAET_FEHLT", null);

        if (probe.GesamtBytes <= 0
            || probe.FreiBytes < 0
            || probe.FreiBytes > probe.GesamtBytes)
            return new SsdVolumeGesundheit(false, "SPEICHERWERTE_UNGUELTIG", null);

        var freiProzent = probe.FreiBytes * 100d / probe.GesamtBytes;
        if (freiProzent < MindestFreieReserveProzent)
            return new SsdVolumeGesundheit(
                false,
                "KRITISCHE_SPEICHERRESERVE_UNTERSCHRITTEN",
                freiProzent);

        return new SsdVolumeGesundheit(true, "GESUND", freiProzent);
    }

    public static async Task<SsdVolumeGesundheit> PruefeDAsync(
        CancellationToken cancellationToken = default)
    {
        var probe = await ErfasseDAsync(cancellationToken);
        return Bewerte(probe);
    }

    public static async Task<SsdVolumeProbe> ErfasseDAsync(
        CancellationToken cancellationToken = default)
    {
        const string wurzel = @"D:\";
        if (!Directory.Exists(wurzel))
            return new SsdVolumeProbe(false, ErwartetesLaufwerk, false, "UNBEKANNT", "", 0, 0);

        var laufwerk = new DriveInfo(wurzel);
        if (!laufwerk.IsReady)
            return new SsdVolumeProbe(true, ErwartetesLaufwerk, false, "UNBEKANNT", "", 0, 0);

        var datentraeger = await ErmittleDatentraegerAsync(cancellationToken);
        return new SsdVolumeProbe(
            true,
            ErwartetesLaufwerk,
            true,
            datentraeger.Medientyp,
            datentraeger.VolumeId,
            laufwerk.TotalSize,
            laufwerk.AvailableFreeSpace);
    }

    private sealed record DatentraegerInfo(string Medientyp, string VolumeId);

    private static async Task<DatentraegerInfo> ErmittleDatentraegerAsync(
        CancellationToken cancellationToken)
    {
        const string befehl = """
$partition = Get-Partition -DriveLetter D -ErrorAction Stop
$disk = $partition | Get-Disk
$physical = Get-PhysicalDisk | Where-Object { [string]$_.DeviceId -eq [string]$disk.Number } | Select-Object -First 1
$volume = Get-Volume -DriveLetter D -ErrorAction Stop
$media = if ($null -eq $physical) { 'UNBEKANNT' } else { [string]$physical.MediaType }
$volumeId = [string]$volume.UniqueId
Write-Output $media
Write-Output $volumeId
""";

        var start = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };
        start.ArgumentList.Add("-NoProfile");
        start.ArgumentList.Add("-NonInteractive");
        start.ArgumentList.Add("-Command");
        start.ArgumentList.Add(befehl);

        using var prozess = Process.Start(start)
            ?? throw new InvalidOperationException("SSD_MEDIENTYP_PROZESS_FEHLT");

        var ausgabeTask = prozess.StandardOutput.ReadToEndAsync(cancellationToken);
        var fehlerTask = prozess.StandardError.ReadToEndAsync(cancellationToken);
        await prozess.WaitForExitAsync(cancellationToken);

        var ausgabe = (await ausgabeTask).Trim();
        var fehler = (await fehlerTask).Trim();
        if (prozess.ExitCode != 0)
            throw new InvalidOperationException("SSD_DATENTRAEGER_PRUEFUNG_FEHLGESCHLAGEN:" + Begrenze(fehler));

        var zeilen = ausgabe
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var medientypRoh = zeilen.Length >= 1 ? zeilen[0] : "UNBEKANNT";
        var volumeId = zeilen.Length >= 2 ? zeilen[1] : "";
        var medientyp = string.Equals(medientypRoh, "SSD", StringComparison.OrdinalIgnoreCase)
            ? "SSD"
            : string.IsNullOrWhiteSpace(medientypRoh) ? "UNBEKANNT" : medientypRoh.ToUpperInvariant();

        return new DatentraegerInfo(medientyp, volumeId);
    }

    private static string Begrenze(string text) =>
        text.Length <= 300 ? text : text[..300];
}
