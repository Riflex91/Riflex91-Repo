namespace ForeverDataMiner;

public sealed class SafeFolderPicker : Form
{
    private readonly TreeView tree = new();
    private readonly TextBox pathBox = new();
    private readonly Label status = new();
    private readonly Button okButton = new();

    public string? SelectedPath { get; private set; }

    public SafeFolderPicker(string? initialPath)
    {
        Text = "WoW-Ordner auswählen";
        StartPosition = FormStartPosition.CenterParent;
        MinimumSize = new Size(720, 520);
        Size = new Size(820, 600);
        Font = new Font("Segoe UI", 9F);
        ShowInTaskbar = false;

        BuildLayout();
        PopulateDrives(initialPath);
    }

    private void BuildLayout()
    {
        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(12),
            ColumnCount = 1,
            RowCount = 5,
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Controls.Add(root);

        root.Controls.Add(new Label
        {
            AutoSize = true,
            Text = "Wähle den World-of-Warcraft-Hauptordner aus. Darin muss die Datei .build.info liegen.",
            Margin = new Padding(0, 0, 0, 8),
        });

        pathBox.Dock = DockStyle.Fill;
        pathBox.PlaceholderText = @"z. B. C:\Program Files (x86)\World of Warcraft";
        pathBox.TextChanged += (_, _) => ValidatePath();
        root.Controls.Add(pathBox);

        tree.Dock = DockStyle.Fill;
        tree.HideSelection = false;
        tree.BeforeExpand += (_, e) => ExpandNode(e.Node);
        tree.AfterSelect += (_, e) =>
        {
            if (e.Node.Tag is string path)
                pathBox.Text = path;
        };
        tree.NodeMouseDoubleClick += (_, e) =>
        {
            if (e.Node.Tag is string path && IsWowRoot(path))
                Accept(path);
        };
        root.Controls.Add(tree);

        status.AutoSize = true;
        status.Margin = new Padding(0, 8, 0, 8);
        root.Controls.Add(status);

        var buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            AutoSize = true,
            FlowDirection = FlowDirection.RightToLeft,
        };

        var cancel = new Button
        {
            Text = "Abbrechen",
            AutoSize = true,
            DialogResult = DialogResult.Cancel,
        };

        okButton.Text = "Übernehmen";
        okButton.AutoSize = true;
        okButton.Enabled = false;
        okButton.Click += (_, _) =>
        {
            var path = Normalize(pathBox.Text);
            if (path is not null) Accept(path);
        };

        var auto = new Button
        {
            Text = "Automatisch erkennen",
            AutoSize = true,
        };
        auto.Click += (_, _) =>
        {
            var detected = Program.AutoDetectWowRoot();
            if (detected is null)
            {
                MessageBox.Show(
                    this,
                    "Es wurde kein WoW-Hauptordner automatisch gefunden. Du kannst den Pfad oben direkt eingeben oder im Baum auswählen.",
                    "ForeverDataMiner",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return;
            }

            pathBox.Text = detected;
            SelectTreePath(detected);
        };

        buttons.Controls.Add(cancel);
        buttons.Controls.Add(okButton);
        buttons.Controls.Add(auto);
        root.Controls.Add(buttons);

        AcceptButton = okButton;
        CancelButton = cancel;
    }

    private void PopulateDrives(string? initialPath)
    {
        tree.BeginUpdate();
        try
        {
            tree.Nodes.Clear();

            foreach (var drive in DriveInfo.GetDrives())
            {
                if (!drive.IsReady) continue;

                var rootPath = drive.RootDirectory.FullName;
                var label = string.IsNullOrWhiteSpace(drive.VolumeLabel)
                    ? rootPath
                    : $"{rootPath}  ({drive.VolumeLabel})";

                var node = new TreeNode(label) { Tag = rootPath };
                AddPlaceholder(node);
                tree.Nodes.Add(node);
            }
        }
        finally
        {
            tree.EndUpdate();
        }

        var normalized = Normalize(initialPath);
        if (normalized is not null)
        {
            pathBox.Text = normalized;
            SelectTreePath(normalized);
        }
        else
        {
            ValidatePath();
        }
    }

    private void ExpandNode(TreeNode node)
    {
        if (node.Tag is not string path) return;
        if (node.Nodes.Count != 1 || node.Nodes[0].Tag is not null) return;

        node.Nodes.Clear();

        try
        {
            foreach (var directory in Directory.EnumerateDirectories(path)
                         .OrderBy(x => Path.GetFileName(x), StringComparer.CurrentCultureIgnoreCase))
            {
                var child = new TreeNode(Path.GetFileName(directory))
                {
                    Tag = directory,
                };

                if (HasAccessibleSubdirectories(directory))
                    AddPlaceholder(child);

                node.Nodes.Add(child);
            }
        }
        catch (Exception ex) when (
            ex is UnauthorizedAccessException or IOException or DirectoryNotFoundException)
        {
            node.Nodes.Add(new TreeNode("(Ordner kann nicht gelesen werden)") { ForeColor = Color.Gray });
        }
    }

    private static bool HasAccessibleSubdirectories(string path)
    {
        try
        {
            using var enumerator = Directory.EnumerateDirectories(path).GetEnumerator();
            return enumerator.MoveNext();
        }
        catch
        {
            return false;
        }
    }

    private static void AddPlaceholder(TreeNode node) =>
        node.Nodes.Add(new TreeNode("…"));

    private void ValidatePath()
    {
        var path = Normalize(pathBox.Text);
        if (path is null)
        {
            status.Text = "Bitte einen vorhandenen Ordner auswählen oder eingeben.";
            status.ForeColor = SystemColors.GrayText;
            okButton.Enabled = false;
            return;
        }

        if (IsWowRoot(path))
        {
            status.Text = "✓ Gültiger WoW-Hauptordner (.build.info gefunden)";
            status.ForeColor = Color.DarkGreen;
            okButton.Enabled = true;
        }
        else
        {
            status.Text = "Dieser Ordner enthält keine .build.info-Datei.";
            status.ForeColor = Color.DarkRed;
            okButton.Enabled = false;
        }
    }

    private static string? Normalize(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;

        try
        {
            var full = Path.GetFullPath(path.Trim().Trim('"'));
            return Directory.Exists(full) ? full.TrimEnd(Path.DirectorySeparatorChar) : null;
        }
        catch
        {
            return null;
        }
    }

    private static bool IsWowRoot(string path) =>
        File.Exists(Path.Combine(path, ".build.info"));

    private void Accept(string path)
    {
        SelectedPath = path;
        DialogResult = DialogResult.OK;
        Close();
    }

    private void SelectTreePath(string path)
    {
        var root = Path.GetPathRoot(path);
        if (string.IsNullOrWhiteSpace(root)) return;

        var rootNode = tree.Nodes.Cast<TreeNode>()
            .FirstOrDefault(n => n.Tag is string p &&
                                 string.Equals(
                                     Path.GetFullPath(p),
                                     Path.GetFullPath(root),
                                     StringComparison.OrdinalIgnoreCase));
        if (rootNode is null) return;

        var current = rootNode;
        var relative = Path.GetRelativePath(root, path);
        if (relative == ".")
        {
            tree.SelectedNode = current;
            return;
        }

        foreach (var part in relative.Split(
                     Path.DirectorySeparatorChar,
                     StringSplitOptions.RemoveEmptyEntries))
        {
            current.Expand();
            var next = current.Nodes.Cast<TreeNode>()
                .FirstOrDefault(n => n.Tag is string &&
                                     string.Equals(n.Text, part, StringComparison.OrdinalIgnoreCase));

            if (next is null) break;
            current = next;
        }

        tree.SelectedNode = current;
        current.EnsureVisible();
    }
}
