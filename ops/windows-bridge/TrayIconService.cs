using System.ComponentModel;
using System.Drawing;
using System.Windows;
using System.Windows.Forms;

namespace AioBotWindowsBridge;

public sealed class TrayIconService : IDisposable
{
    public const string ToolTipText = "AIO Bot Windows Bridge";

    private readonly MainWindow _window;
    private readonly Action _requestExit;
    private readonly NotifyIcon _notifyIcon;
    private readonly ContextMenuStrip _menu;
    private readonly Icon _icon;
    private bool _allowClose;
    private bool _disposed;

    public TrayIconService(MainWindow window, Action requestExit)
    {
        _window = window ?? throw new ArgumentNullException(nameof(window));
        _requestExit = requestExit ?? throw new ArgumentNullException(nameof(requestExit));

        _menu = new ContextMenuStrip();
        var openItem = new ToolStripMenuItem("Öffnen");
        openItem.Click += (_, _) => ShowWindow();
        var exitItem = new ToolStripMenuItem("Beenden");
        exitItem.Click += (_, _) => _requestExit();

        openItem.Font = new Font(openItem.Font, FontStyle.Bold);
        _menu.Items.Add(openItem);
        _menu.Items.Add(new ToolStripSeparator());
        _menu.Items.Add(exitItem);

        _icon = LoadIcon();
        _notifyIcon = new NotifyIcon
        {
            Icon = _icon,
            Text = ToolTipText,
            ContextMenuStrip = _menu,
            Visible = true
        };
        _notifyIcon.DoubleClick += (_, _) => ShowWindow();

        _window.Closing += OnWindowClosing;
    }

    public void ShowWindow()
    {
        if (_disposed) return;

        _window.Dispatcher.Invoke(() =>
        {
            if (!_window.IsVisible)
                _window.Show();

            if (_window.WindowState == WindowState.Minimized)
                _window.WindowState = WindowState.Normal;

            _window.ShowInTaskbar = true;
            _window.Activate();
            _window.Topmost = true;
            _window.Topmost = false;
            _window.Focus();
        });
    }

    public void PrepareForShutdown()
    {
        if (_disposed) return;

        _allowClose = true;
        _notifyIcon.Visible = false;
    }

    private void OnWindowClosing(object? sender, CancelEventArgs e)
    {
        if (_allowClose || _disposed) return;

        e.Cancel = true;
        _window.ShowInTaskbar = false;
        _window.Hide();
    }

    private static Icon LoadIcon()
    {
        try
        {
            var executable = Environment.ProcessPath;
            if (!string.IsNullOrWhiteSpace(executable))
            {
                var extracted = Icon.ExtractAssociatedIcon(executable);
                if (extracted is not null) return extracted;
            }
        }
        catch
        {
        }

        return (Icon)SystemIcons.Application.Clone();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _allowClose = true;
        _window.Closing -= OnWindowClosing;
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
        _menu.Dispose();
        _icon.Dispose();
    }
}
