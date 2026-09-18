param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$TaskName = 'AioV3ProductionHost',
  [string]$PreferredBrowser = 'brave'
)
$ErrorActionPreference = 'Stop'
foreach ($cmd in @('node','powershell.exe')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "REQUIRED_COMMAND_MISSING:$cmd" }
}
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-host-service.js'
$runner = Join-Path $repo 'ops\windows-host\run.ps1'
if (-not (Test-Path $entry) -or -not (Test-Path $runner)) { throw 'WINDOWS_HOST_FILES_NOT_FOUND' }

$root = Join-Path $env:LOCALAPPDATA 'AioBot\host-service'
$profile = Join-Path $env:LOCALAPPDATA 'AioBot\browser-profile'
$configPath = Join-Path $root 'host.json'
$tokenPath = Join-Path $root 'host-api-token.dpapi'
$alertSecretsPath = Join-Path $root 'alert-secrets.dpapi'
$alertPath = Join-Path $root 'alerts.json'
$statePath = Join-Path $root 'service-state.json'
New-Item -ItemType Directory -Force -Path $root,$profile | Out-Null

function Find-Browser([string]$preferred) {
  $programFilesX86 = [Environment]::GetFolderPath('ProgramFilesX86')
  $programFiles = [Environment]::GetFolderPath('ProgramFiles')
  $candidates = @{
    brave = @(
      (Join-Path $programFiles 'BraveSoftware\Brave-Browser\Application\brave.exe'),
      (Join-Path $programFilesX86 'BraveSoftware\Brave-Browser\Application\brave.exe')
    )
    edge = @(
      (Join-Path $programFilesX86 'Microsoft\Edge\Application\msedge.exe'),
      (Join-Path $programFiles 'Microsoft\Edge\Application\msedge.exe')
    )
    chrome = @(
      (Join-Path $programFiles 'Google\Chrome\Application\chrome.exe'),
      (Join-Path $programFilesX86 'Google\Chrome\Application\chrome.exe')
    )
  }
  $order = @($preferred,'brave','edge','chrome') | Select-Object -Unique
  foreach ($name in $order) {
    foreach ($candidate in @($candidates[$name])) {
      if ($candidate -and (Test-Path $candidate)) { return $candidate }
    }
  }
  throw 'SUPPORTED_BROWSER_NOT_FOUND'
}
$browser = Find-Browser $PreferredBrowser

if (-not (Test-Path $tokenPath)) {
  $plainBytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($plainBytes)
  $token = [Convert]::ToHexString($plainBytes).ToLowerInvariant()
  $protected = [System.Security.Cryptography.ProtectedData]::Protect(
    [Text.Encoding]::UTF8.GetBytes($token),
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  [IO.File]::WriteAllText($tokenPath,[Convert]::ToBase64String($protected))
}

$config = [ordered]@{
  schemaVersion = 1
  browserCommand = $browser
  browserArgs = @(
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    "--user-data-dir=$profile",
    'https://adventure.land/'
  )
  cdpEndpoint = 'http://127.0.0.1:9222'
  allowedOrigin = 'https://adventure.land'
  serviceStatePath = $statePath
  alertStatePath = $alertPath
  apiPort = 8791
  apiTokenEnvironmentVariable = 'AIO_V3_HOST_API_TOKEN'
  criticalAlertingEnabled = $false
  alertSecretsEnvironmentVariable = 'AIO_V3_ALERT_SECRETS_JSON'
  tickIntervalMs = 5000
  browserSessionStartupWaitMs = 300000
  browserSessionStartupPollMs = 2000
  stableAfterMs = 120000
  startWindowMs = 600000
  maxStartsPerWindow = 4
  startCircuitCooldownMs = 900000
  browserRestartEnabled = $false
}
$config | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $configPath

$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`" -RepoPath `"$repo`" -ConfigPath `"$configPath`" -TokenPath `"$tokenPath`" -AlertSecretsPath `"$alertSecretsPath`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Write-Host "Installed $TaskName for $userId"
Write-Host "Config: $configPath"
Write-Host "State:  $statePath"
