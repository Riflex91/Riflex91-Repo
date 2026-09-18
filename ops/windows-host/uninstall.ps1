param(
  [string]$TaskName = 'AioV3ProductionHost',
  [switch]$DeleteState
)
$ErrorActionPreference = 'Stop'
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
if ($DeleteState) {
  $root = Join-Path $env:LOCALAPPDATA 'AioBot\host-service'
  if (Test-Path $root) { Remove-Item -Recurse -Force $root }
}
Write-Host "Removed $TaskName"
