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

function Ensure-Junction([string]$Path, [string]$Target) {
  if (Test-Path $Path) {
    $Item = Get-Item $Path -Force
    if ($Item.LinkType -eq "Junction" -and $Item.Target -contains $Target) {
      return
    }
    Remove-Item $Path -Recurse -Force
  }

  New-Item -ItemType Junction -Path $Path -Target $Target | Out-Null
}

function Test-Mongo {
  try {
    return (Test-NetConnection -ComputerName "127.0.0.1" -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded
  } catch {
    return $false
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

Ensure-Junction (Join-Path $AdventureDir "common") $CommonDir
Ensure-Junction (Join-Path $AdventureDir "secretsandconfig") $ConfigDir

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

$Docker = Get-Command "docker" -ErrorAction SilentlyContinue

if (-not (Test-Mongo)) {
  if (-not $Docker) {
    throw "MongoDB is not listening on 127.0.0.1:27017 and Docker is unavailable. Install MongoDB locally or Docker Desktop."
  }

  Write-Host "==> Starting isolated MongoDB container"
  $Existing = docker ps -a --filter "name=^/al25d-mongo$" --format "{{.Names}}"
  if ($Existing -eq "al25d-mongo") {
    docker start al25d-mongo | Out-Null
  } else {
    docker run -d --name al25d-mongo -p 27017:27017 -v al25d-mongo-data:/data/db mongo:7.0 | Out-Null
  }

  for ($i = 0; $i -lt 30 -and -not (Test-Mongo); $i++) {
    Start-Sleep -Seconds 1
  }

  if (-not (Test-Mongo)) {
    throw "MongoDB did not become reachable on port 27017."
  }
}

if (-not $SkipSeed) {
  if (-not (Test-Path $RdbmsPath)) {
    Write-Host "==> Downloading the upstream development datastore"
    $SeedUrl = "https://raw.githubusercontent.com/kaansoral/adventureland-appserver/$AppServerCommit/storage/db.rdbms"
    Invoke-WebRequest -Uri $SeedUrl -OutFile $RdbmsPath
  }

  Write-Host "==> Importing map/game development data"
  if ($Docker) {
    $GameMount = ($AdventureDir -replace "\\", "/")
    $SeedMount = ($RdbmsPath -replace "\\", "/")
    $DockerArgs = @(
      "run", "--rm",
      "--add-host=host.docker.internal:host-gateway",
      "-e", "MONGO_URI=mongodb://host.docker.internal:27017/",
      "-e", "MONGO_DB=adventureland",
      "-e", "RDBMS_PATH=/seed/db.rdbms",
      "-v", "$($GameMount):/workspace",
      "-v", "$($SeedMount):/seed/db.rdbms:ro",
      "-w", "/workspace/agentic",
      "python:3.12-slim",
      "sh", "-lc", "pip install --quiet pymongo && python _migrate_rdbms.py"
    )
    & docker @DockerArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Development datastore import failed."
    }
  } else {
    Require-Command "python"
    python -m pip install --quiet pymongo
    $env:MONGO_URI = "mongodb://127.0.0.1:27017/"
    $env:MONGO_DB = "adventureland"
    $env:RDBMS_PATH = $RdbmsPath
    Push-Location (Join-Path $AdventureDir "agentic")
    try {
      python _migrate_rdbms.py
    } finally {
      Pop-Location
    }
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
