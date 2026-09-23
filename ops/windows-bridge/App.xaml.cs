using System.Windows;

namespace AioBotWindowsBridge;

public partial class App : Application
{
    private TrayIconService? _trayIcon;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        var window = new MainWindow();
        MainWindow = window;

        _trayIcon = new TrayIconService(window, ShutdownFromTray);
    }

    internal void ShutdownForUpdate()
    {
        ShutdownApplication();
    }

    private void ShutdownFromTray()
    {
        ShutdownApplication();
    }

    private void ShutdownApplication()
    {
        _trayIcon?.PrepareForShutdown();
        Shutdown();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _trayIcon?.Dispose();
        _trayIcon = null;
        base.OnExit(e);
    }
}
