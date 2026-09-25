$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$AdventureDir = Join-Path $RuntimeRoot "adventureland"
$PidFile = Join-Path $RuntimeRoot "pids.json"
$MongoRoot = Get-ChildItem -Path $RuntimeRoot -Directory -Filter "mongodb-*" -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1
$MongoDataDir = Join-Path $RuntimeRoot "mongodb-data"
$MongoLogDir = Join-Path $RuntimeRoot "mongodb-log"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"

if (-not (Test-Path (Join-Path $AdventureDir "main.js"))) {
  throw "Local runtime is missing. Run .\local-dev\windows\setup.ps1 first."
}

function Test-Port([int]$Port) {
  try {
    return (Test-NetConnection -ComputerName "127.0.0.1" -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
  } catch {
    return $false
  }
}

function Wait-Port([int]$Port, [string]$Name) {
  for ($i = 0; $i -lt 45; $i++) {
    if (Test-Port $Port) {
      return
    }
    Start-Sleep -Seconds 1
  }

  throw "$Name did not become reachable on port $Port."
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
  if (-not $MongoRoot) {
    throw "Portable MongoDB is missing. Run .\local-dev\windows\setup.ps1 first."
  }

  $Mongod = Get-ChildItem -Path $MongoRoot.FullName -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $Mongod) {
    throw "Portable MongoDB was found but mongod.exe is missing."
  }

  New-Item -ItemType Directory -Force -Path $MongoDataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $MongoLogDir | Out-Null
  $MongoLogPath = Join-Path $MongoLogDir "mongod.log"

  Write-Host "==> Starting portable MongoDB"
  $MongoProcess = Start-Process -FilePath $Mongod.FullName -PassThru -WindowStyle Hidden -ArgumentList @(
    "--dbpath", $MongoDataDir,
    "--bind_ip", "127.0.0.1",
    "--port", "27017",
    "--logpath", $MongoLogPath,
    "--logappend"
  )
  Set-Content -Path $MongoPidFile -Value $MongoProcess.Id -Encoding ASCII
}
Wait-Port 27017 "MongoDB"

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
  Write-Host "==> Starting local Adventure Land game server"
  $NodeDir = Join-Path $AdventureDir "node"
  $Process = Start-DevWindow "AL 2.5D - Legacy Game Server" $NodeDir "node server.js local"
  $Started.gameServer = $Process.Id
  Wait-Port 7192 "Adventure Land game server"
} else {
  Write-Host "==> Game server already running on 7192"
}

if (-not (Test-Port 5173)) {
  Write-Host "==> Starting AL 2.5D renderer"
  $Process = Start-DevWindow "AL 2.5D - Renderer" $ProjectRoot "npm run dev -- --host localhost --port 5173"
  $Started.renderer = $Process.Id
  Wait-Port 5173 "AL 2.5D renderer"
} else {
  Write-Host "==> Renderer already running on 5173"
}

$Started | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8

$Url = "http://localhost:5173/?localAdmin=1&legacy=/legacy/"
Write-Host ""
Write-Host "Opening local AL 2.5D admin sandbox:"
Write-Host $Url
Write-Host ""
Write-Host "Account: local-admin@al25d.invalid"
Write-Host "Characters: create them manually; supported online composition is 3 normal + 1 Merchant."
Write-Host "This session uses only the local MongoDB/server."
Start-Process $Url
