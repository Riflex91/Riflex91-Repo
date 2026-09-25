$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$PidFile = Join-Path $RuntimeRoot "pids.json"
$MongoPidFile = Join-Path $RuntimeRoot "mongodb.pid"

if (Test-Path $PidFile) {
  $Pids = Get-Content $PidFile -Raw | ConvertFrom-Json

  foreach ($Property in $Pids.PSObject.Properties) {
    $PidValue = [int]$Property.Value
    if ($PidValue -gt 0) {
      Write-Host "Stopping $($Property.Name) process tree ($PidValue)"
      & taskkill.exe /PID $PidValue /T /F 2>$null | Out-Null
    }
  }

  Remove-Item $PidFile -Force
}

if (Test-Path $MongoPidFile) {
  $MongoPid = [int](Get-Content $MongoPidFile -Raw)
  $MongoProcess = Get-Process -Id $MongoPid -ErrorAction SilentlyContinue
  if ($MongoProcess) {
    Write-Host "Stopping portable MongoDB ($MongoPid)"
    Stop-Process -Id $MongoPid -Force
  }
  Remove-Item $MongoPidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Local AL 2.5D sandbox stopped."
