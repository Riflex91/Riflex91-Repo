param(
  [Parameter(Mandatory=$true)][string]$RepoPath,
  [Parameter(Mandatory=$true)][string]$Gate,
  [Parameter(Mandatory=$true)][string]$EvidencePath,
  [Parameter(Mandatory=$true)][string]$ConfigPath,
  [Parameter(Mandatory=$true)][string]$TokenPath,
  [string]$PrerequisiteEvidence = ''
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-certification.js'
if (-not (Test-Path $entry)) { throw 'CERTIFICATION_ENTRYPOINT_NOT_FOUND' }
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

$config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$apiPort = if ($config.apiPort) { [int]$config.apiPort } else { 8791 }
$endpoint = "http://127.0.0.1:$apiPort"
$env:AIO_V3_HOST_API_TOKEN = Read-DpapiSecret $TokenPath
try {
  $args = @($entry,'collect','--gate',$Gate,'--evidence',$EvidencePath,'--endpoint',$endpoint)
  if (-not [string]::IsNullOrWhiteSpace($PrerequisiteEvidence)) { $args += @('--prerequisite',$PrerequisiteEvidence) }
  & node @args
  exit $LASTEXITCODE
}
finally {
  Remove-Item Env:AIO_V3_HOST_API_TOKEN -ErrorAction SilentlyContinue
}
