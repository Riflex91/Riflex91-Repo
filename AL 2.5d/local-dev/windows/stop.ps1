$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$RuntimeRoot = Join-Path $ProjectRoot ".local-dev\runtime"
$PidFile = Join-Path $RuntimeRoot "pids.json"

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

$Docker = Get-Command "docker" -ErrorAction SilentlyContinue
if ($Docker) {
  $Running = docker ps --filter "name=^/al25d-mongo$" --format "{{.Names}}"
  if ($Running -eq "al25d-mongo") {
    Write-Host "Stopping al25d-mongo"
    docker stop al25d-mongo | Out-Null
  }
}

Write-Host "Local AL 2.5D sandbox stopped."
