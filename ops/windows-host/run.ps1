param(
  [Parameter(Mandatory=$true)][string]$RepoPath,
  [Parameter(Mandatory=$true)][string]$ConfigPath,
  [Parameter(Mandatory=$true)][string]$TokenPath
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-host-service.js'
if (-not (Test-Path $entry)) { throw 'WINDOWS_HOST_ENTRYPOINT_NOT_FOUND' }
if (-not (Test-Path $ConfigPath)) { throw 'WINDOWS_HOST_CONFIG_NOT_FOUND' }
if (-not (Test-Path $TokenPath)) { throw 'WINDOWS_HOST_TOKEN_NOT_FOUND' }
$protected = [Convert]::FromBase64String((Get-Content -Raw $TokenPath).Trim())
$bytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
  $protected,
  $null,
  [System.Security.Cryptography.DataProtectionScope]::CurrentUser
)
$env:AIO_V3_HOST_API_TOKEN = [Text.Encoding]::UTF8.GetString($bytes)
try {
  & node $entry --config $ConfigPath
  exit $LASTEXITCODE
}
finally {
  Remove-Item Env:AIO_V3_HOST_API_TOKEN -ErrorAction SilentlyContinue
}
