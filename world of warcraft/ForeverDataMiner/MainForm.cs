using System.Diagnostics;

namespace ForeverDataMiner;

public sealed class MainForm : Form
{
    private readonly GuiSettings settings = GuiSettings.Load();

    private readonly TextBox wowRootBox = new();
    private readonly TextBox wtlBox = new();
    private readonly CheckBox useWtlBox = new();
    private readonly CheckBox autoMonitorBox = new();
    private readonly Label buildLabel = new();
    private readonly Label monitorLabel = new();
    private readonly TextBox logBox = new();
    private readonly Button scanButton = new();
    private readonly Button startButton = new();
    private readonly Button stopButton = new();
    private readonly NotifyIcon trayIcon = new();

    private CancellationTokenSource? monitorCts;
    private Task? monitorTask;
    private FileSystemWatcher? exportWatcher;

    public MainForm()
    {
        Text = "ForeverDataMiner";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(760, 540);
        Size = new Size(860, 620);
        Font = new Font("Segoe UI", 9F);

        BuildLayout();
        LoadSettingsIntoUi();
        SetupExportWatcher();
        SetupTray();

        Shown += (_, _) =>
        {
            RefreshBuildStatus();
            if (autoMonitorBox.Checked && IsValidWowRoot(wowRootBox.Text))
                StartMonitoring();
        };

        FormClosing += (_, _) =>
        {
            SaveSettings();
            monitorCts?.Cancel();
            trayIcon.Visible = false;
            exportWatcher?.Dispose();
        };

        Resize += (_, _) =>
        {
            if (WindowState == FormWindowState.Minimized)
            {
                Hide();
                trayIcon.ShowBalloonTip(
                    1500,
                    "ForeverDataMiner",
                    "Monitoring läuft im Infobereich weiter.",
                    ToolTipIcon.Info);
            }
        };
    }

    private void BuildLayout()
    {
        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(16),
            ColumnCount = 1,
            RowCount = 9,
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Controls.Add(root);

        var title = new Label
        {
            AutoSize = true,
            Text = "ForeverDataMiner",
            Font = new Font("Segoe UI", 17F, FontStyle.Bold),
            Margin = new Padding(0, 0, 0, 4),
        };
        root.Controls.Add(title);

        var subtitle = new Label
        {
            AutoSize = true,
            Text = "Build-, Hotfix- und DB2-Datensammlung für ForeverGuide",
            ForeColor = SystemColors.GrayText,
            Margin = new Padding(0, 0, 0, 16),
        };
        root.Controls.Add(subtitle);

        root.Controls.Add(CreateWowPathRow());
        root.Controls.Add(CreateProviderRow());

        var options = new FlowLayoutPanel
        {
            AutoSize = true,
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.LeftToRight,
            Margin = new Padding(0, 8, 0, 8),
        };

        useWtlBox.Text = "DB2/Hotfix-Daten über wow.tools.local einlesen";
        useWtlBox.AutoSize = true;
        useWtlBox.CheckedChanged += (_, _) => wtlBox.Enabled = useWtlBox.Checked;

        autoMonitorBox.Text = "Updates automatisch überwachen";
        autoMonitorBox.AutoSize = true;
        autoMonitorBox.Margin = new Padding(24, 3, 0, 3);

        options.Controls.Add(useWtlBox);
        options.Controls.Add(autoMonitorBox);
        root.Controls.Add(options);

        var statusPanel = new TableLayoutPanel
        {
            AutoSize = true,
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            Margin = new Padding(0, 4, 0, 10),
        };
        statusPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        statusPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));

        buildLabel.Text = "Build: noch nicht erkannt";
        buildLabel.AutoSize = true;
        buildLabel.Font = new Font(Font, FontStyle.Bold);

        monitorLabel.Text = "Monitoring: gestoppt";
        monitorLabel.AutoSize = true;
        monitorLabel.Anchor = AnchorStyles.Right;

        statusPanel.Controls.Add(buildLabel, 0, 0);
        statusPanel.Controls.Add(monitorLabel, 1, 0);
        root.Controls.Add(statusPanel);

        var buttons = new FlowLayoutPanel
        {
            AutoSize = true,
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.LeftToRight,
            Margin = new Padding(0, 0, 0, 10),
        };

        scanButton.Text = "Jetzt scannen";
        scanButton.AutoSize = true;
        scanButton.Click += async (_, _) => await ScanNowAsync();

        startButton.Text = "Monitoring starten";
        startButton.AutoSize = true;
        startButton.Click += (_, _) => StartMonitoring();

        stopButton.Text = "Monitoring stoppen";
        stopButton.AutoSize = true;
        stopButton.Enabled = false;
        stopButton.Click += (_, _) => StopMonitoring();

        var openButton = new Button { Text = "Exportordner öffnen", AutoSize = true };
        openButton.Click += (_, _) => OpenExportDirectory();

        buttons.Controls.Add(scanButton);
        buttons.Controls.Add(startButton);
        buttons.Controls.Add(stopButton);
        buttons.Controls.Add(openButton);
        root.Controls.Add(buttons);

        logBox.Multiline = true;
        logBox.ReadOnly = true;
        logBox.ScrollBars = ScrollBars.Vertical;
        logBox.Dock = DockStyle.Fill;
        logBox.Font = new Font("Consolas", 9F);
        logBox.BackColor = SystemColors.Window;
        root.Controls.Add(logBox);

        var footer = new Label
        {
            AutoSize = true,
            Text = "Exports: " + Program.DefaultOutputDirectory(),
            ForeColor = SystemColors.GrayText,
            Margin = new Padding(0, 8, 0, 0),
        };
        root.Controls.Add(footer);
    }

    private Control CreateWowPathRow()
    {
        var panel = new TableLayoutPanel
        {
            AutoSize = true,
            Dock = DockStyle.Fill,
            ColumnCount = 3,
            Margin = new Padding(0, 0, 0, 8),
        };
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));

        var label = new Label
        {
            Text = "WoW-Ordner:",
            AutoSize = true,
            Anchor = AnchorStyles.Left,
            Margin = new Padding(0, 6, 8, 0),
        };

        wowRootBox.Dock = DockStyle.Fill;
        wowRootBox.TextChanged += (_, _) => RefreshBuildStatus();

        var browse = new Button { Text = "Auswählen…", AutoSize = true };
        browse.Click += (_, _) =>
        {
            using var dialog = new FolderBrowserDialog
            {
                Description = "World-of-Warcraft-Hauptordner auswählen (.build.info muss darin liegen)",
                ShowNewFolderButton = false,
                InitialDirectory = Directory.Exists(wowRootBox.Text) ? wowRootBox.Text : null,
            };
            if (dialog.ShowDialog(this) == DialogResult.OK)
                wowRootBox.Text = dialog.SelectedPath;
        };

        panel.Controls.Add(label, 0, 0);
        panel.Controls.Add(wowRootBox, 1, 0);
        panel.Controls.Add(browse, 2, 0);
        return panel;
    }

    private Control CreateProviderRow()
    {
        var panel = new TableLayoutPanel
        {
            AutoSize = true,
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            Margin = new Padding(0, 0, 0, 4),
        };
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

        var label = new Label
        {
            Text = "DB2-Provider:",
            AutoSize = true,
            Anchor = AnchorStyles.Left,
            Margin = new Padding(0, 6, 8, 0),
        };

        wtlBox.Dock = DockStyle.Fill;

        panel.Controls.Add(label, 0, 0);
        panel.Controls.Add(wtlBox, 1, 0);
        return panel;
    }

    private void LoadSettingsIntoUi()
    {
        wowRootBox.Text = settings.WowRoot ?? Program.AutoDetectWowRoot() ?? string.Empty;
        wtlBox.Text = settings.WowToolsLocal;
        useWtlBox.Checked = settings.UseWowToolsLocal;
        autoMonitorBox.Checked = settings.AutoMonitor;
        wtlBox.Enabled = useWtlBox.Checked;
    }

    private void SaveSettings()
    {
        settings.WowRoot = wowRootBox.Text.Trim();
        settings.WowToolsLocal = wtlBox.Text.Trim();
        settings.UseWowToolsLocal = useWtlBox.Checked;
        settings.AutoMonitor = autoMonitorBox.Checked;
        settings.Save();
    }

    private MinerService CreateService()
    {
        var wowRoot = wowRootBox.Text.Trim();
        if (!IsValidWowRoot(wowRoot))
            throw new InvalidOperationException("Bitte einen gültigen World-of-Warcraft-Hauptordner auswählen.");

        Uri? provider = null;
        if (useWtlBox.Checked)
        {
            if (!Uri.TryCreate(wtlBox.Text.Trim(), UriKind.Absolute, out provider))
                throw new InvalidOperationException("Die wow.tools.local-Adresse ist ungültig.");
        }

        Directory.CreateDirectory(Program.DefaultOutputDirectory());

        return new MinerService(new MinerOptions(
            Path.GetFullPath(wowRoot),
            Program.DefaultOutputDirectory(),
            provider,
            TimeSpan.FromSeconds(30)));
    }

    private async Task ScanNowAsync()
    {
        try
        {
            SaveSettings();
            scanButton.Enabled = false;
            AppendLog("Scan gestartet …");

            var service = CreateService();
            var path = await Task.Run(() => service.ScanAsync());

            AppendLog("Scan abgeschlossen: " + Path.GetFileName(path));
            RefreshBuildStatus();
        }
        catch (Exception ex)
        {
            AppendLog("FEHLER: " + ex.Message);
            MessageBox.Show(this, ex.Message, "ForeverDataMiner", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            scanButton.Enabled = true;
        }
    }

    private void StartMonitoring()
    {
        if (monitorTask is { IsCompleted: false }) return;

        try
        {
            SaveSettings();
            var service = CreateService();

            monitorCts?.Dispose();
            monitorCts = new CancellationTokenSource();
            var token = monitorCts.Token;

            monitorLabel.Text = "Monitoring: aktiv";
            startButton.Enabled = false;
            stopButton.Enabled = true;
            AppendLog("Automatische Build-/Hotfix-Überwachung gestartet.");

            monitorTask = Task.Run(async () =>
            {
                try
                {
                    await service.WatchAsync(token);
                }
                catch (OperationCanceledException)
                {
                    // Normal stop.
                }
                catch (Exception ex)
                {
                    BeginInvoke(new Action(() =>
                    {
                        AppendLog("MONITOR-FEHLER: " + ex.Message);
                        monitorLabel.Text = "Monitoring: Fehler";
                        startButton.Enabled = true;
                        stopButton.Enabled = false;
                    }));
                }
            }, token);
        }
        catch (Exception ex)
        {
            AppendLog("FEHLER: " + ex.Message);
            MessageBox.Show(this, ex.Message, "ForeverDataMiner", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void StopMonitoring()
    {
        monitorCts?.Cancel();
        monitorLabel.Text = "Monitoring: gestoppt";
        startButton.Enabled = true;
        stopButton.Enabled = false;
        AppendLog("Monitoring gestoppt.");
    }

    private void RefreshBuildStatus()
    {
        try
        {
            if (!IsValidWowRoot(wowRootBox.Text))
            {
                buildLabel.Text = "Build: WoW-Ordner fehlt";
                return;
            }

            var build = BuildInfoReader.Read(wowRootBox.Text.Trim());
            buildLabel.Text = $"Build: {build.Version} · Interface {build.InterfaceVersion?.ToString() ?? "?"}";
        }
        catch (Exception ex)
        {
            buildLabel.Text = "Build: nicht lesbar";
            AppendLog("Build-Erkennung: " + ex.Message);
        }
    }

    private void SetupExportWatcher()
    {
        var path = Program.DefaultOutputDirectory();
        Directory.CreateDirectory(path);

        exportWatcher = new FileSystemWatcher(path, "*.fgds.zip")
        {
            NotifyFilter = NotifyFilters.FileName | NotifyFilters.CreationTime,
            EnableRaisingEvents = true,
        };

        exportWatcher.Created += (_, e) =>
        {
            if (IsDisposed) return;
            BeginInvoke(new Action(() =>
            {
                AppendLog("Neuer Datensatz: " + e.Name);
                trayIcon.ShowBalloonTip(
                    2500,
                    "ForeverDataMiner",
                    "Forever-Änderung erfasst: " + e.Name,
                    ToolTipIcon.Info);
            }));
        };
    }

    private void SetupTray()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("Öffnen", null, (_, _) => RestoreFromTray());
        menu.Items.Add("Jetzt scannen", null, async (_, _) => await ScanNowAsync());
        menu.Items.Add("Monitoring starten", null, (_, _) => StartMonitoring());
        menu.Items.Add("Monitoring stoppen", null, (_, _) => StopMonitoring());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Beenden", null, (_, _) => Close());

        trayIcon.Icon = SystemIcons.Application;
        trayIcon.Text = "ForeverDataMiner";
        trayIcon.ContextMenuStrip = menu;
        trayIcon.Visible = true;
        trayIcon.DoubleClick += (_, _) => RestoreFromTray();
    }

    private void RestoreFromTray()
    {
        Show();
        WindowState = FormWindowState.Normal;
        Activate();
    }

    private static bool IsValidWowRoot(string? path) =>
        !string.IsNullOrWhiteSpace(path) &&
        File.Exists(Path.Combine(path.Trim(), ".build.info"));

    private void OpenExportDirectory()
    {
        var path = Program.DefaultOutputDirectory();
        Directory.CreateDirectory(path);
        Process.Start(new ProcessStartInfo { FileName = path, UseShellExecute = true });
    }

    private void AppendLog(string message)
    {
        var line = $"[{DateTime.Now:HH:mm:ss}] {message}{Environment.NewLine}";
        logBox.AppendText(line);
    }
}
