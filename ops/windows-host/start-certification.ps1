param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [Parameter(Mandatory=$true)][ValidateSet('canary','1h','24h','72h','7d')][string]$Gate,
  [string]$TaskName = 'AioV3Certification',
  [string]$RestartAck = '',
  [switch]$Reset
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $RepoPath).Path
$root = Join-Path $env:LOCALAPPDATA 'AioBot\host-service'
$certRoot = Join-Path $root 'certification'
$archiveRoot = Join-Path $certRoot 'archive'
$configPath = Join-Path $root 'host.json'
$tokenPath = Join-Path $root 'host-api-token.dpapi'
$alertSecretsPath = Join-Path $root 'alert-secrets.dpapi'
$evidencePath = Join-Path $certRoot "$Gate.jsonl"
$entry = Join-Path $repo 'v3\host\windows-certification.js'
$runner = Join-Path $repo 'ops\windows-host\run-certification.ps1'
$recovery = Join-Path $repo 'ops\windows-host\invoke-recovery-canary.ps1'
$alertCanary = Join-Path $repo 'ops\windows-host\test-alerts.ps1'
New-Item -ItemType Directory -Force -Path $certRoot,$archiveRoot | Out-Null
if (-not (Test-Path $configPath) -or -not (Test-Path $tokenPath)) { throw 'WINDOWS_HOST_INSTALL_REQUIRED' }

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
if ($Reset -and (Test-Path $evidencePath)) {
  $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
  Move-Item $evidencePath (Join-Path $archiveRoot "$Gate-$stamp.jsonl")
}

$previous = @{ '1h'='canary'; '24h'='1h'; '72h'='24h'; '7d'='72h' }
$prerequisiteEvidence = ''
if ($previous.ContainsKey($Gate)) {
  $prior = $previous[$Gate]
  $prerequisiteEvidence = Join-Path $certRoot "$prior.jsonl"
  if (-not (Test-Path $prerequisiteEvidence)) { throw "PREREQUISITE_EVIDENCE_MISSING:$prior" }
}

if ($Gate -eq 'canary') {
  if ($RestartAck -ne 'ALPHA20_5_HOST_RESTART') { throw 'CANARY_REQUIRES_EXPLICIT_RESTART_ACK' }
  if (-not (Test-Path $alertSecretsPath)) { throw 'WINDOWS_ALERT_SECRETS_NOT_FOUND' }
  $canaryOutput = & $alertCanary -RepoPath $repo | Select-Object -Last 1
  if ($LASTEXITCODE -ne 0) { throw 'DUAL_ROUTE_ALERT_CANARY_FAILED' }
  $canary = $canaryOutput | ConvertFrom-Json
  if ($canary.ok -ne $true) { throw 'DUAL_ROUTE_ALERT_CANARY_FAILED' }
  $canaryJson = $canary | ConvertTo-Json -Depth 6 -Compress
  & node $entry mark --evidence $evidencePath --type dual_route_alert_canary --ok true --json $canaryJson
  if ($LASTEXITCODE -ne 0) { throw 'DUAL_ROUTE_ALERT_CANARY_EVIDENCE_FAILED' }
  & $recovery -RepoPath $repo -EvidencePath $evidencePath -RestartAck $RestartAck
}

$initArgs = @($entry,'init','--gate',$Gate,'--evidence',$evidencePath)
if ($prerequisiteEvidence) { $initArgs += @('--prerequisite',$prerequisiteEvidence) }
& node @initArgs
if ($LASTEXITCODE -ne 0) { throw 'CERTIFICATION_INIT_FAILED' }

$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`" -RepoPath `"$repo`" -Gate `"$Gate`" -EvidencePath `"$evidencePath`" -ConfigPath `"$configPath`" -TokenPath `"$tokenPath`""
if ($prerequisiteEvidence) { $arguments += " -PrerequisiteEvidence `"$prerequisiteEvidence`"" }
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Write-Host "Certification $Gate started. Evidence: $evidencePath"
