param(
  [Parameter(Mandatory=$true)][string]$RepoPath,
  [Parameter(Mandatory=$true)][string]$ConfigPath,
  [Parameter(Mandatory=$true)][string]$TokenPath,
  [Parameter(Mandatory=$true)][string]$AlertSecretsPath
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-host-service.js'
if (-not (Test-Path $entry)) { throw 'WINDOWS_HOST_ENTRYPOINT_NOT_FOUND' }
if (-not (Test-Path $ConfigPath)) { throw 'WINDOWS_HOST_CONFIG_NOT_FOUND' }
if (-not (Test-Path $TokenPath)) { throw 'WINDOWS_HOST_TOKEN_NOT_FOUND' }

function Read-DpapiSecret([string]$Path) {
  $protected = [Convert]::FromBase64String((Get-Content -Raw $Path).Trim())
  try {
    $clear = [System.Security.Cryptography.ProtectedData]::Unprotect(
      $protected,
      $null,
      [System.Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    try { return [Text.Encoding]::UTF8.GetString($clear) }
    finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($clear) }
  }
  finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($protected) }
}

$env:AIO_V3_HOST_API_TOKEN = Read-DpapiSecret $TokenPath
$config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$alertingEnabled = $config.criticalAlertingEnabled -eq $true
if ($alertingEnabled) {
  if (-not (Test-Path $AlertSecretsPath)) { throw 'WINDOWS_ALERT_SECRETS_NOT_FOUND' }
  $env:AIO_V3_ALERT_SECRETS_JSON = Read-DpapiSecret $AlertSecretsPath
}
try {
  & node $entry --config $ConfigPath
  exit $LASTEXITCODE
}
finally {
  Remove-Item Env:AIO_V3_HOST_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:AIO_V3_ALERT_SECRETS_JSON -ErrorAction SilentlyContinue
}
