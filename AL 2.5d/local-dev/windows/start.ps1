$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$AdventureDir = Join-Path $RuntimeRoot "adventureland"
$PidFile = Join-Path $RuntimeRoot "pids.json"
$MongoRoots = @(
  Get-ChildItem -Path $RuntimeRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^mongodb-\d+\.\d+\.\d+$' } |
    Sort-Object Name -Descending
)
$MongoLocalRoot = Join-Path $env:LOCALAPPDATA "AL25D-TestServer\MongoDB"
$MongoDataDir = Join-Path $MongoLocalRoot "data"
$MongoLogDir = Join-Path $MongoLocalRoot "log"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"
$RuntimeKeysPath = Join-Path $AdventureDir "secretsandconfig\keys.js"
$MongoReplicaSet = "al25d-rs"

if (-not (Test-Path (Join-Path $AdventureDir "main.js"))) {
  throw "Local runtime is missing. Run .\local-dev\windows\setup.ps1 first."
}

function Test-Port([int]$Port, [int]$TimeoutMs = 500) {
  $Client = New-Object System.Net.Sockets.TcpClient
  try {
    $Async = $Client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $Async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
      return $false
    }

    $Client.EndConnect($Async)
    return $true
  } catch {
    return $false
  } finally {
    $Client.Close()
  }
}

function Wait-Port([int]$Port, [string]$Name) {
  for ($i = 0; $i -lt 90; $i++) {
    if (Test-Port $Port 500) {
      return
    }

    Start-Sleep -Milliseconds 500
  }

  throw "$Name did not become reachable on port $Port within 45 seconds."
}

function Test-MongoReplicaSet {
  if (-not (Test-Port 27017)) {
    return $false
  }

  $Probe = @'
const { MongoClient } = require("mongodb");
(async () => {
  const client = new MongoClient("mongodb://127.0.0.1:27017/?directConnection=true", {
    serverSelectionTimeoutMS: 2000
  });
  try {
    await client.connect();
    const hello = await client.db("admin").command({ hello: 1 });
    process.exit(hello.setName === "al25d-rs" ? 0 : 2);
  } finally {
    await client.close().catch(() => {});
  }
})().catch(() => process.exit(3));
'@

  Push-Location $AdventureDir
  try {
    $Probe | node -
    return ($LASTEXITCODE -eq 0)
  } finally {
    Pop-Location
  }
}

function Initialize-MongoReplicaSet {
  $Initializer = @'
const { MongoClient } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017/?directConnection=true";
const setName = "al25d-rs";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const admin = client.db("admin");

  let hello = await admin.command({ hello: 1 });
  if (hello.setName !== setName) {
    try {
      await admin.command({
        replSetInitiate: {
          _id: setName,
          members: [{ _id: 0, host: "127.0.0.1:27017" }]
        }
      });
    } catch (error) {
      if (error.codeName !== "AlreadyInitialized" && error.code !== 23) {
        throw error;
      }
    }
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      hello = await admin.command({ hello: 1 });
      if (hello.setName === setName && hello.isWritablePrimary === true) {
        await client.close();
        return;
      }
    } catch (_) {}
    await sleep(500);
  }

  throw new Error("MongoDB replica set did not become PRIMARY within 30 seconds.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@

  Push-Location $AdventureDir
  try {
    $Initializer | node -
    if ($LASTEXITCODE -ne 0) {
      throw "MongoDB replica-set initialization failed."
    }
  } finally {
    Pop-Location
  }
}

function Get-PortableMongod {
  foreach ($Root in $MongoRoots) {
    $Candidate = Get-ChildItem -Path $Root.FullName -Filter "mongod.exe" -Recurse -File -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($Candidate) {
      return $Candidate
    }
  }

  return $null
}

function Invoke-LocalRearm {
  Write-Host "==> Releasing stale local Adventure Land server/character registrations"

  try {
    $Response = Invoke-WebRequest `
      -UseBasicParsing `
      -Uri "http://127.0.0.1:8090/rearm" `
      -Method Get `
      -TimeoutSec 5

    if ($Response.StatusCode -ne 200 -or $Response.Content.Trim() -ne "done!") {
      throw "Unexpected response: HTTP $($Response.StatusCode) '$($Response.Content)'"
    }
  } catch {
    throw "Local Adventure Land rearm failed: $($_.Exception.Message)"
  }

  Write-Host "==> Local Adventure Land registrations released"
}

function Verify-GameServerApi {
  if (-not (Test-Path $RuntimeKeysPath)) {
    throw "Runtime keys.js is missing: $RuntimeKeysPath"
  }

  $KeysText = Get-Content $RuntimeKeysPath -Raw
  $Match = [regex]::Match($KeysText, 'ACCESS_MASTER\s*:\s*"([0-9a-f]+)"')
  if (-not $Match.Success) {
    throw "Runtime ACCESS_MASTER is not pinned to a static local value."
  }

  $AccessMaster = $Match.Groups[1].Value

  try {
    $Response = Invoke-WebRequest `
      -UseBasicParsing `
      -Uri "http://127.0.0.1:7192/server.api/eval" `
      -Method Post `
      -ContentType "application/x-www-form-urlencoded" `
      -Body @{
        spass = $AccessMaster
        code = "output={ok:true};"
        data = "{}"
      } `
      -TimeoutSec 5

    if ($Response.StatusCode -ne 200 -or $Response.Content -ne '{"ok":true}') {
      throw "Unexpected response: HTTP $($Response.StatusCode) '$($Response.Content)'"
    }
  } catch {
    throw "Local backend/game-server shared-key preflight failed: $($_.Exception.Message)"
  }

  Write-Host "==> Game-server API shared-key preflight passed"
}

function Start-DevWindow(
  [string]$Title,
  [string]$WorkingDirectory,
  [string]$Command
) {
  $EscapedDirectory = $WorkingDirectory.Replace("'", "''")
  $EscapedTitle = $Title.Replace("'", "''")
  $ShellCommand = '$Host.UI.RawUI.WindowTitle=''{0}''; Set-Location ''{1}''; {2}' -f $EscapedTitle, $EscapedDirectory, $Command
  return Start-Process powershell.exe -PassThru -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $ShellCommand
  )
}

if (-not (Test-Port 27017)) {
  $Mongod = Get-PortableMongod
  if (-not $Mongod) {
    $Candidates = Get-ChildItem -Path $RuntimeRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "mongodb-*" } |
      Select-Object -ExpandProperty Name
    $CandidateText = ($Candidates -join ", ")
    if (-not $CandidateText) {
      $CandidateText = "<none>"
    }

    throw "Portable MongoDB binary was not found. Found mongodb-* directories: $CandidateText. Run .\local-dev\windows\setup.ps1 if needed."
  }

  if (Test-Path $MongoPidFile) {
    $PreviousPidRaw = Get-Content $MongoPidFile -Raw -ErrorAction SilentlyContinue
    $PreviousPid = 0
    if ([int]::TryParse(($PreviousPidRaw -as [string]), [ref]$PreviousPid)) {
      $PreviousProcess = Get-Process -Id $PreviousPid -ErrorAction SilentlyContinue
      if ($PreviousProcess) {
        Stop-Process -Id $PreviousPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
      }
    }
    Remove-Item $MongoPidFile -Force -ErrorAction SilentlyContinue
  }

  New-Item -ItemType Directory -Force -Path $MongoDataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $MongoLogDir | Out-Null
  $MongoLogPath = Join-Path $MongoLogDir "mongod.log"

  Write-Host "==> Starting portable MongoDB"
  Write-Host "==> MongoDB binary: $($Mongod.FullName)"
  Write-Host "==> MongoDB data path: $MongoDataDir"

  $MongoArguments = "--dbpath `"$MongoDataDir`" --bind_ip 127.0.0.1 --port 27017 --replSet $MongoReplicaSet --logpath `"$MongoLogPath`" --logappend"
  $MongoProcess = Start-Process -FilePath $Mongod.FullName -PassThru -WindowStyle Hidden -ArgumentList $MongoArguments
  Set-Content -Path $MongoPidFile -Value $MongoProcess.Id -Encoding ASCII

  for ($i = 0; $i -lt 90; $i++) {
    if (Test-Port 27017 500) {
      break
    }

    $MongoProcess.Refresh()
    if ($MongoProcess.HasExited) {
      if (Test-Path $MongoLogPath) {
        Write-Host ""
        Write-Host "----- MongoDB log tail -----"
        Get-Content -Path $MongoLogPath -Tail 40 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
        Write-Host "----- end MongoDB log -----"
      }
      throw "Portable MongoDB exited during startup with code $($MongoProcess.ExitCode)."
    }

    Start-Sleep -Milliseconds 500
  }
}

Wait-Port 27017 "MongoDB"

if (-not (Test-MongoReplicaSet)) {
  Write-Host "==> Initializing/checking local MongoDB replica set"
  try {
    Initialize-MongoReplicaSet
  } catch {
    throw "MongoDB on port 27017 is not transaction-ready. Run .\local-dev\windows\setup.ps1 -SkipInstall -SkipSeed to repair the local replica set. $($_.Exception.Message)"
  }
}

if (-not (Test-MongoReplicaSet)) {
  throw "MongoDB replica set '$MongoReplicaSet' is not active."
}

Write-Host "==> MongoDB replica set '$MongoReplicaSet' is transaction-ready"

$Started = @{}

if (-not (Test-Port 8090)) {
  Write-Host "==> Starting local Adventure Land web backend"
  $Process = Start-DevWindow "AL 2.5D - Legacy Backend" $AdventureDir "node main.js"
  $Started.backend = $Process.Id
  Wait-Port 8090 "Adventure Land backend"
} else {
  Write-Host "==> Backend already running on 8090"
}

if (-not (Test-Port 7192)) {
  Invoke-LocalRearm
  Write-Host "==> Starting local Adventure Land game server"
  $NodeDir = Join-Path $AdventureDir "node"
  $Process = Start-DevWindow "AL 2.5D - Legacy Game Server" $NodeDir "node server.js local"
  $Started.gameServer = $Process.Id
  Wait-Port 7192 "Adventure Land game server"
} else {
  Write-Host "==> Game server already running on 7192"
}

Verify-GameServerApi

if (-not (Test-Port 5173)) {
  Write-Host "==> Starting AL 2.5D renderer"
  $Process = Start-DevWindow "AL 2.5D - Renderer" $ProjectRoot "npm run dev -- --host 127.0.0.1 --port 5173"
  $Started.renderer = $Process.Id
  Wait-Port 5173 "AL 2.5D renderer"
} else {
  Write-Host "==> Renderer already running on 5173"
}

$Started | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8

$Url = "http://127.0.0.1:5173/?localAdmin=1&legacy=/legacy/"
Write-Host ""
Write-Host "Opening local AL 2.5D admin sandbox:"
Write-Host $Url
Write-Host ""
Write-Host "Account: local-admin@al25d.invalid"
Write-Host "Characters: create them manually; supported online composition is 3 normal + 1 Merchant."
Write-Host "This session uses only the local MongoDB/server."
Start-Process $Url
