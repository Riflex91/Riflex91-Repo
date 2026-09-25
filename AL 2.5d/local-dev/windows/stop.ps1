$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$PidFile = Join-Path $RuntimeRoot "pids.json"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"

if (Test-Path $PidFile) {
  $Pids = Get-Content $PidFile -Raw | ConvertFrom-Json

  foreach ($Property in $Pids.PSObject.Properties) {
    $PidValue = [int]$Property.Value
    if ($PidValue -le 0) {
      continue
    }

    $Existing = Get-Process -Id $PidValue -ErrorAction SilentlyContinue
    if (-not $Existing) {
      Write-Host "Skipping stale $($Property.Name) PID ($PidValue)"
      continue
    }

    Write-Host "Stopping $($Property.Name) process tree ($PidValue)"
    $Taskkill = Start-Process -FilePath "taskkill.exe" -PassThru -Wait -WindowStyle Hidden -ArgumentList @(
      "/PID", "$PidValue", "/T", "/F"
    )
    if ($Taskkill.ExitCode -ne 0) {
      Write-Host "Process tree $PidValue already exited while stopping."
    }
  }

  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

if (Test-Path $MongoPidFile) {
  $MongoPid = [int](Get-Content $MongoPidFile -Raw)
  $MongoProcess = Get-Process -Id $MongoPid -ErrorAction SilentlyContinue
  if ($MongoProcess) {
    Write-Host "Stopping portable MongoDB ($MongoPid)"
    Stop-Process -Id $MongoPid -Force
  } else {
    Write-Host "Skipping stale MongoDB PID ($MongoPid)"
  }
  Remove-Item $MongoPidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Local AL 2.5D sandbox stopped."
