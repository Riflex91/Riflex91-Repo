param(
  [switch]$SkipInstall,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"

$AdventureCommit = "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4"
$CommonCommit = "fa74fabf5d3782503712621e037bfb934ecb8439"
$ConfigCommit = "6b3493be30abe367cfaf879a2d5ad370742e0866"
$AppServerCommit = "a2beb24b1a8b341ac6781c78aba7f4ae52e54147"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$AdventureDir = Join-Path $RuntimeRoot "adventureland"
$CommonDir = Join-Path $RuntimeRoot "common"
$ConfigDir = Join-Path $RuntimeRoot "secretsandconfig"
$RdbmsPath = Join-Path $RuntimeRoot "db.rdbms"
$MongoVersion = "8.0.17"
$MongoArchive = Join-Path $RuntimeRoot "mongodb-windows-x86_64-$MongoVersion.zip"
$MongoRoot = Join-Path $RuntimeRoot "mongodb-$MongoVersion"
$MongoDataDir = Join-Path $RuntimeRoot "mongodb-data"
$MongoLogDir = Join-Path $RuntimeRoot "mongodb-log"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found."
  }
}

function Checkout-PinnedRepo(
  [string]$Url,
  [string]$Destination,
  [string]$Commit
) {
  if (-not (Test-Path (Join-Path $Destination ".git"))) {
    git clone $Url $Destination
    if ($LASTEXITCODE -ne 0) {
      throw "Git clone failed for $Url."
    }
  }

  # Some removable/exFAT-style Windows volumes do not expose ownership metadata.
  # Scope Git's trust exception to this exact repository and this command only;
  # do not weaken the user's global safe.directory configuration.
  $SafeDirectory = ($Destination -replace "\\", "/")

  & git -c "safe.directory=$SafeDirectory" -C $Destination fetch --all --tags --prune
  if ($LASTEXITCODE -ne 0) {
    throw "Git fetch failed for $Destination."
  }

  & git -c "safe.directory=$SafeDirectory" -C $Destination checkout --detach $Commit
  if ($LASTEXITCODE -ne 0) {
    throw "Git checkout failed for $Destination."
  }

  $ActualOutput = & git -c "safe.directory=$SafeDirectory" -C $Destination rev-parse HEAD
  if ($LASTEXITCODE -ne 0 -or -not $ActualOutput) {
    throw "Unable to read Git HEAD for $Destination."
  }

  $Actual = ($ActualOutput | Select-Object -First 1).Trim()
  if ($Actual -ne $Commit) {
    throw "Pin verification failed for $Destination. Expected $Commit, got $Actual."
  }
}

function Sync-DirectoryCopy([string]$Path, [string]$Source) {
  if (Test-Path $Path) {
    $Item = Get-Item $Path -Force

    if (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      & cmd.exe /c rmdir "$Path" | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "Unable to remove existing link at $Path."
      }
    } else {
      Remove-Item $Path -Recurse -Force
    }
  }

  New-Item -ItemType Directory -Force -Path $Path | Out-Null

  foreach ($Entry in Get-ChildItem -LiteralPath $Source -Force) {
    if ($Entry.Name -eq ".git") {
      continue
    }

    Copy-Item -LiteralPath $Entry.FullName -Destination $Path -Recurse -Force
  }
}

function Test-Mongo {
  try {
    return (Test-NetConnection -ComputerName "127.0.0.1" -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded
  } catch {
    return $false
  }
}

function Resolve-PythonExe {
  $PyLauncher = Get-Command "py" -ErrorAction SilentlyContinue
  if ($PyLauncher) {
    $Resolved = & $PyLauncher.Source -3.12 -c "import sys; print(sys.executable)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $Resolved) {
      return ($Resolved | Select-Object -First 1).Trim()
    }

    $Resolved = & $PyLauncher.Source -3 -c "import sys; print(sys.executable)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $Resolved) {
      return ($Resolved | Select-Object -First 1).Trim()
    }
  }

  $Python = Get-Command "python" -ErrorAction SilentlyContinue
  if ($Python -and $Python.Source -notlike "*WindowsApps*") {
    return $Python.Source
  }

  $Winget = Get-Command "winget" -ErrorAction SilentlyContinue
  if ($Winget) {
    Write-Host "==> Python was not found; installing Python 3.12 for the current user"
    & $Winget.Source install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
      throw "Python 3.12 installation via winget failed."
    }

    $Candidates = @(
      (Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"),
      (Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\python.exe")
    )

    foreach ($Candidate in $Candidates) {
      if (Test-Path $Candidate) {
        return $Candidate
      }
    }
  }

  throw "Python 3 is required for the one-time development datastore import and could not be found or installed."
}

function Get-PortableMongoExe {
  $Existing = Get-ChildItem -Path $MongoRoot -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($Existing) {
    return $Existing.FullName
  }

  Write-Host "==> Downloading portable MongoDB $MongoVersion"
  if (-not (Test-Path $MongoArchive)) {
    $MongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-$MongoVersion.zip"
    Invoke-WebRequest -Uri $MongoUrl -OutFile $MongoArchive
  }

  if (Test-Path $MongoRoot) {
    Remove-Item $MongoRoot -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $MongoRoot | Out-Null
  Expand-Archive -LiteralPath $MongoArchive -DestinationPath $MongoRoot -Force

  $Mongod = Get-ChildItem -Path $MongoRoot -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $Mongod) {
    throw "Portable MongoDB archive was extracted but mongod.exe was not found."
  }

  return $Mongod.FullName
}

function Start-PortableMongo {
  if (Test-Mongo) {
    return
  }

  $MongodExe = Get-PortableMongoExe
  New-Item -ItemType Directory -Force -Path $MongoDataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $MongoLogDir | Out-Null

  $MongoLogPath = Join-Path $MongoLogDir "mongod.log"
  Write-Host "==> Starting portable MongoDB on 127.0.0.1:27017"

  $MongoProcess = Start-Process -FilePath $MongodExe -PassThru -WindowStyle Hidden -ArgumentList @(
    "--dbpath", $MongoDataDir,
    "--bind_ip", "127.0.0.1",
    "--port", "27017",
    "--logpath", $MongoLogPath,
    "--logappend"
  )

  Set-Content -Path $MongoPidFile -Value $MongoProcess.Id -Encoding ASCII

  for ($i = 0; $i -lt 45 -and -not (Test-Mongo); $i++) {
    Start-Sleep -Seconds 1
  }

  if (-not (Test-Mongo)) {
    throw "Portable MongoDB did not become reachable on port 27017. See $MongoLogPath"
  }
}

Require-Command "git"
Require-Command "node"
Require-Command "npm"

New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null

Write-Host "==> Fetching pinned Adventure Land runtime"
Checkout-PinnedRepo "https://github.com/kaansoral/adventureland_mongodb.git" $AdventureDir $AdventureCommit
Checkout-PinnedRepo "https://github.com/kaansoral/common_engine.git" $CommonDir $CommonCommit
Checkout-PinnedRepo "https://github.com/kaansoral/adventureland_secretsandconfig.git" $ConfigDir $ConfigCommit

Write-Host "==> Copying pinned common/config trees into the runtime"
Sync-DirectoryCopy (Join-Path $AdventureDir "common") $CommonDir
Sync-DirectoryCopy (Join-Path $AdventureDir "secretsandconfig") $ConfigDir

$OptionsPath = Join-Path $ConfigDir "options.js"
$Options = Get-Content $OptionsPath -Raw
foreach ($Required in @(
  "Dev: true",
  "Local: true",
  "unsecure_admin: true",
  "ip_limit: 3",
  "character_limit: 3"
)) {
  if (-not $Options.Contains($Required)) {
    throw "Local safety requirement missing from options.js: $Required"
  }
}

if (-not $SkipInstall) {
  Write-Host "==> Installing backend dependencies"
  npm --prefix $AdventureDir install --ignore-scripts
  npm --prefix (Join-Path $AdventureDir "node") install --ignore-scripts

  Write-Host "==> Installing AL 2.5D dependencies"
  npm --prefix $ProjectRoot install
}

if (-not (Test-Mongo)) {
  Start-PortableMongo
}

if (-not $SkipSeed) {
  if (-not (Test-Path $RdbmsPath)) {
    Write-Host "==> Downloading the upstream development datastore"
    $SeedUrl = "https://raw.githubusercontent.com/kaansoral/adventureland-appserver/$AppServerCommit/storage/db.rdbms"
    Invoke-WebRequest -Uri $SeedUrl -OutFile $RdbmsPath
  }

  Write-Host "==> Importing map/game development data"
  $PythonExe = Resolve-PythonExe
  & $PythonExe -m pip install --quiet pymongo
  if ($LASTEXITCODE -ne 0) {
    throw "pymongo installation failed."
  }

  $env:MONGO_URI = "mongodb://127.0.0.1:27017/"
  $env:MONGO_DB = "adventureland"
  $env:RDBMS_PATH = $RdbmsPath
  Push-Location (Join-Path $AdventureDir "agentic")
  try {
    & $PythonExe _migrate_rdbms.py
    if ($LASTEXITCODE -ne 0) {
      throw "Development datastore import failed."
    }
  } finally {
    Pop-Location
  }

  Write-Host "==> Removing imported player/account data from the local database"
  $Scrub = @'
const { MongoClient } = require("mongodb");
(async () => {
  const client = new MongoClient("mongodb://127.0.0.1:27017/");
  await client.connect();
  const db = client.db("adventureland");
  const playerCollections = [
    "user", "character", "guild", "pet", "message", "mail",
    "event", "backup", "infoelement", "upload", "ip", "mark", "server"
  ];
  for (const name of playerCollections) {
    await db.collection(name).deleteMany({});
  }
  await client.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@
  Push-Location $AdventureDir
  try {
    $Scrub | node -
  } finally {
    Pop-Location
  }

  Write-Host "==> Rebuilding local pathfinding data"
  Push-Location $AdventureDir
  try {
    node node/precompute_bfs.js
  } finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host "Local AL 2.5D sandbox is ready."
Write-Host "Run: .\local-dev\windows\start.ps1"
Write-Host "Characters are created manually in the original client UI."
Write-Host "No real Adventure Land account is used."
