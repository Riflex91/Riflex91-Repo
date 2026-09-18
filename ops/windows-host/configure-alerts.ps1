param(
  [string]$TaskName = 'AioV3ProductionHost'
)
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:LOCALAPPDATA 'AioBot\host-service'
$configPath = Join-Path $root 'host.json'
$secretPath = Join-Path $root 'alert-secrets.dpapi'
if (-not (Test-Path $configPath)) { throw 'WINDOWS_HOST_CONFIG_NOT_FOUND' }

function Read-HiddenText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$primaryUrl = Read-HiddenText 'Primary CRITICAL webhook HTTPS URL'
$fallbackUrl = Read-HiddenText 'Fallback CRITICAL webhook HTTPS URL'
$primaryAuth = Read-HiddenText 'Primary Authorization header value (Enter for none)'
$fallbackAuth = Read-HiddenText 'Fallback Authorization header value (Enter for none)'

try { $primaryUri = [Uri]$primaryUrl; $fallbackUri = [Uri]$fallbackUrl }
catch { throw 'WINDOWS_ALERT_URL_INVALID' }
if ($primaryUri.Scheme -ne 'https' -or $fallbackUri.Scheme -ne 'https') { throw 'WINDOWS_ALERT_HTTPS_REQUIRED' }
if ($primaryUri.Host.ToLowerInvariant() -eq $fallbackUri.Host.ToLowerInvariant()) { throw 'WINDOWS_ALERT_ROUTES_NOT_INDEPENDENT' }

$primaryHeaders = [ordered]@{}
$fallbackHeaders = [ordered]@{}
if (-not [string]::IsNullOrWhiteSpace($primaryAuth)) { $primaryHeaders.Authorization = $primaryAuth }
if (-not [string]::IsNullOrWhiteSpace($fallbackAuth)) { $fallbackHeaders.Authorization = $fallbackAuth }
$bundle = [ordered]@{
  schemaVersion = 1
  primary = [ordered]@{ url = $primaryUrl; headers = $primaryHeaders }
  fallback = [ordered]@{ url = $fallbackUrl; headers = $fallbackHeaders }
}
$json = $bundle | ConvertTo-Json -Depth 6 -Compress
$clear = [Text.Encoding]::UTF8.GetBytes($json)
try {
  $protected = [System.Security.Cryptography.ProtectedData]::Protect(
    $clear,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  try { [IO.File]::WriteAllText($secretPath,[Convert]::ToBase64String($protected)) }
  finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($protected) }
}
finally {
  [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($clear)
  $json = $null
  $primaryUrl = $null
  $fallbackUrl = $null
  $primaryAuth = $null
  $fallbackAuth = $null
}

$config = Get-Content -Raw $configPath | ConvertFrom-Json
$config.criticalAlertingEnabled = $true
$config.alertSecretsEnvironmentVariable = 'AIO_V3_ALERT_SECRETS_JSON'
$config | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $configPath

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Start-ScheduledTask -TaskName $TaskName
}
Write-Host 'CRITICAL alert secrets saved with DPAPI CurrentUser. Run test-alerts.ps1 to canary both routes independently.'
