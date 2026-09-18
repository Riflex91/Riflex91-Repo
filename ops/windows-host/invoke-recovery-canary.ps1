param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [Parameter(Mandatory=$true)][string]$EvidencePath,
  [Parameter(Mandatory=$true)][string]$RestartAck,
  [string]$HostTaskName = 'AioV3ProductionHost'
)
$ErrorActionPreference = 'Stop'
if ($RestartAck -ne 'ALPHA20_5_HOST_RESTART') { throw 'HOST_RESTART_ACK_REQUIRED' }
$repo = (Resolve-Path $RepoPath).Path
$root = Join-Path $env:LOCALAPPDATA 'AioBot\host-service'
$configPath = Join-Path $root 'host.json'
$tokenPath = Join-Path $root 'host-api-token.dpapi'
$entry = Join-Path $repo 'v3\host\windows-certification.js'
if (-not (Test-Path $configPath)) { throw 'WINDOWS_HOST_CONFIG_NOT_FOUND' }
if (-not (Test-Path $tokenPath)) { throw 'WINDOWS_HOST_TOKEN_NOT_FOUND' }

function Read-DpapiSecret([string]$Path) {
  $protected = [Convert]::FromBase64String((Get-Content -Raw $Path).Trim())
  try {
    $clear = [System.Security.Cryptography.ProtectedData]::Unprotect($protected,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    try { return [Text.Encoding]::UTF8.GetString($clear) }
    finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($clear) }
  }
  finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($protected) }
}

$config = Get-Content -Raw $configPath | ConvertFrom-Json
if ($null -eq $config.PSObject.Properties['browserRestartEnabled']) {
  $config | Add-Member -NotePropertyName browserRestartEnabled -NotePropertyValue $true
} else {
  $config.browserRestartEnabled = $true
}
$config | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $configPath
$apiPort = if ($config.apiPort) { [int]$config.apiPort } else { 8791 }
$uri = "http://127.0.0.1:$apiPort/v1/status"
$token = Read-DpapiSecret $tokenPath
$headers = @{ Authorization = "Bearer $token" }

$task = Get-ScheduledTask -TaskName $HostTaskName -ErrorAction SilentlyContinue
if (-not $task) { throw 'WINDOWS_HOST_TASK_NOT_FOUND' }
Stop-ScheduledTask -TaskName $HostTaskName -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName $HostTaskName

function Read-Status {
  return Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec 10
}
function Wait-Healthy([int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $status = Read-Status
      $watchdog = $status.controller.watchdog
      $recon = $status.controller.reconciliation
      if ($status.ok -eq $true -and $status.launcher.running -eq $true -and $status.runtimeHost.browserSession.connected -eq $true -and $watchdog.state -eq 'HEALTHY' -and @('IDLE','OBSERVED_CLEAN') -contains $recon.state) { return $status }
    } catch { }
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  throw 'RECOVERY_CANARY_HEALTH_TIMEOUT'
}

try {
  $before = Wait-Healthy 600
  $previousRunId = [string]$before.controller.watchdog.lastRunId
  $restartBefore = [int]$before.controller.watchdog.stats.restartSuccesses
  $cleanBefore = [int]$before.controller.reconciliation.stats.clean
  $freshBefore = [int]$before.controller.reconciliation.stats.freshRuns
  $browserPid = [int]$before.launcher.pid
  if ($browserPid -le 0) { throw 'RECOVERY_CANARY_BROWSER_PID_INVALID' }

  Stop-Process -Id $browserPid -Force
  $deadline = (Get-Date).AddMinutes(10)
  $after = $null
  do {
    Start-Sleep -Seconds 2
    try {
      $candidate = Read-Status
      $watchdog = $candidate.controller.watchdog
      $recon = $candidate.controller.reconciliation
      if (
        $candidate.ok -eq $true -and
        $candidate.launcher.running -eq $true -and
        $candidate.runtimeHost.browserSession.connected -eq $true -and
        $watchdog.state -eq 'HEALTHY' -and
        [int]$watchdog.stats.restartSuccesses -gt $restartBefore -and
        [int]$recon.stats.clean -gt $cleanBefore -and
        [int]$recon.stats.freshRuns -gt $freshBefore -and
        $recon.state -eq 'OBSERVED_CLEAN' -and
        [string]$watchdog.lastRunId -ne $previousRunId
      ) { $after = $candidate; break }
    } catch { }
  } while ((Get-Date) -lt $deadline)
  if ($null -eq $after) { throw 'RECOVERY_CANARY_RECONCILIATION_TIMEOUT' }

  $evidence = [ordered]@{
    previousRunId = $previousRunId
    currentRunId = [string]$after.controller.watchdog.lastRunId
    restartSuccessesBefore = $restartBefore
    restartSuccessesAfter = [int]$after.controller.watchdog.stats.restartSuccesses
    reconciliationCleanBefore = $cleanBefore
    reconciliationCleanAfter = [int]$after.controller.reconciliation.stats.clean
    reconciliationFreshRunsBefore = $freshBefore
    reconciliationFreshRunsAfter = [int]$after.controller.reconciliation.stats.freshRuns
    reconciliationState = [string]$after.controller.reconciliation.state
  }
  $json = $evidence | ConvertTo-Json -Compress
  & node $entry mark --evidence $EvidencePath --type controlled_recovery_canary --ok true --json $json
  if ($LASTEXITCODE -ne 0) { throw 'RECOVERY_CANARY_EVIDENCE_WRITE_FAILED' }
  Write-Host 'Controlled browser failure -> bounded restart -> fresh-run reconciliation verified.'
}
finally {
  $headers = $null
  $token = $null
}
