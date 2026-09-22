using System.Windows;

namespace AioBotWindowsBridge;

public partial class App : Application
{
    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        if (WindowsBridgeUpdateBootstrap.IsApplyUpdateMode(e.Args))
        {
            ShutdownMode = ShutdownMode.OnExplicitShutdown;
            var exitCode = await WindowsBridgeUpdateBootstrap.ApplyAsync(e.Args);
            Shutdown(exitCode);
            return;
        }

        ShutdownMode = ShutdownMode.OnMainWindowClose;
        var window = new MainWindow();
        MainWindow = window;
        window.Show();
    }
}
