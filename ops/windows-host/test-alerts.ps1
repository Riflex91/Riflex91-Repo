param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:LOCALAPPDATA 'AioBot\host-service'
$secretPath = Join-Path $root 'alert-secrets.dpapi'
$entry = Join-Path (Resolve-Path $RepoPath).Path 'v3\host\windows-alert-canary.js'
if (-not (Test-Path $secretPath)) { throw 'WINDOWS_ALERT_SECRETS_NOT_FOUND' }
if (-not (Test-Path $entry)) { throw 'WINDOWS_ALERT_CANARY_NOT_FOUND' }
$protected = [Convert]::FromBase64String((Get-Content -Raw $secretPath).Trim())
try {
  $clear = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $protected,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  try { $env:AIO_V3_ALERT_SECRETS_JSON = [Text.Encoding]::UTF8.GetString($clear) }
  finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($clear) }
}
finally { [System.Security.Cryptography.CryptographicOperations]::ZeroMemory($protected) }
try {
  & node $entry
  if ($LASTEXITCODE -ne 0) { throw 'WINDOWS_ALERT_CANARY_FAILED' }
}
finally {
  Remove-Item Env:AIO_V3_ALERT_SECRETS_JSON -ErrorAction SilentlyContinue
}
