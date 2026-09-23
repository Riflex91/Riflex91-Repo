namespace AioBotWindowsBridge;

public static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        if (WindowsBridgeUpdateBootstrap.IsApplyUpdateMode(args))
            return WindowsBridgeUpdateBootstrap.ApplyAsync(args).GetAwaiter().GetResult();

        var app = new App();
        app.InitializeComponent();
        return app.Run();
    }
}
