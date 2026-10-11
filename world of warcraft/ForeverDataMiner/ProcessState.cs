using System.Diagnostics;

namespace ForeverDataMiner;

public static class ProcessState
{
    public static bool IsWowRunning() =>
        AnyProcess("Wow", "WowClassic", "WowT", "WowClassicT");

    public static bool IsBattleNetRunning() =>
        AnyProcess("Battle.net", "Agent", "Blizzard Update Agent");

    private static bool AnyProcess(params string[] names)
    {
        foreach (var name in names)
        {
            try
            {
                if (Process.GetProcessesByName(name).Length > 0)
                    return true;
            }
            catch
            {
                // Process enumeration failures must not crash data collection.
            }
        }

        return false;
    }
}
