$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$AdventureDir = Join-Path $RuntimeRoot "adventureland"
$PidFile = Join-Path $RuntimeRoot "pids.json"
$MongoRoot = Get-ChildItem -Path $RuntimeRoot -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^mongodb-\d+\.\d+\.\d+
$MongoLocalRoot = Join-Path $env:LOCALAPPDATA "AL25D-TestServer\MongoDB"
$MongoDataDir = Join-Path $MongoLocalRoot "data"
$MongoLogDir = Join-Path $MongoLocalRoot "log"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"
$RuntimeKeysPath = Join-Path $AdventureDir "secretsandconfig\keys.js"

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
  if (-not $MongoRoot) {
    $Candidates = Get-ChildItem -Path $RuntimeRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "mongodb-*" } |
      Select-Object -ExpandProperty Name
    $CandidateText = ($Candidates -join ", ")
    if (-not $CandidateText) {
      $CandidateText = "<none>"
    }

    throw "Portable MongoDB version directory is missing. Found mongodb-* directories: $CandidateText. Run .\local-dev\windows\setup.ps1 if needed."
  }

  $Mongod = Get-ChildItem -Path $MongoRoot.FullName -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $Mongod) {
    throw "Portable MongoDB was found but mongod.exe is missing."
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
  Write-Host "==> MongoDB data path: $MongoDataDir"
  $MongoArguments = "--dbpath `"$MongoDataDir`" --bind_ip 127.0.0.1 --port 27017 --logpath `"$MongoLogPath`" --logappend"
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
 } |
  Sort-Object Name -Descending |
  Select-Object -First 1
$MongoLocalRoot = Join-Path $env:LOCALAPPDATA "AL25D-TestServer\MongoDB"
$MongoDataDir = Join-Path $MongoLocalRoot "data"
$MongoLogDir = Join-Path $MongoLocalRoot "log"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"
$RuntimeKeysPath = Join-Path $AdventureDir "secretsandconfig\keys.js"

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
  if (-not $MongoRoot) {
    throw "Portable MongoDB is missing. Run .\local-dev\windows\setup.ps1 first."
  }

  $Mongod = Get-ChildItem -Path $MongoRoot.FullName -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $Mongod) {
    throw "Portable MongoDB was found but mongod.exe is missing."
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
  Write-Host "==> MongoDB data path: $MongoDataDir"
  $MongoArguments = "--dbpath `"$MongoDataDir`" --bind_ip 127.0.0.1 --port 27017 --logpath `"$MongoLogPath`" --logappend"
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
