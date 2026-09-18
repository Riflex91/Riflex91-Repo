param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [Parameter(Mandatory=$true)][ValidateSet('24h','72h','7d')][string]$Gate,
  [Parameter(Mandatory=$true)][string]$EvidenceSource,
  [Parameter(Mandatory=$true)][switch]$IReviewedRuntimeActions,
  [Parameter(Mandatory=$true)][switch]$NoUnexpectedRawGameplayActions,
  [string]$Note = ''
)
$ErrorActionPreference = 'Stop'
if (-not $IReviewedRuntimeActions) { throw 'RUNTIME_ACTION_AUDIT_EXPLICIT_REVIEW_REQUIRED' }
if (-not $NoUnexpectedRawGameplayActions) { throw 'RUNTIME_ACTION_AUDIT_CLEAN_ATTESTATION_REQUIRED' }
$source = (Resolve-Path $EvidenceSource).Path
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-certification.js'
$evidence = Join-Path $env:LOCALAPPDATA "AioBot\host-service\certification\$Gate.jsonl"
if (-not (Test-Path $evidence)) { throw 'CERTIFICATION_EVIDENCE_NOT_FOUND' }
$hash = (Get-FileHash -Algorithm SHA256 -Path $source).Hash.ToLowerInvariant()
$data = [ordered]@{
  sourceName = [IO.Path]::GetFileName($source)
  sha256 = $hash
  reviewedAt = (Get-Date).ToUniversalTime().ToString('o')
  reviewed = $true
  result = 'CLEAN'
  unexpectedRawGameplayActions = 0
  note = $Note
}
$json = $data | ConvertTo-Json -Compress
& node $entry mark --evidence $evidence --type runtime_action_audit_clean --ok true --json $json
if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_ACTION_AUDIT_EVIDENCE_WRITE_FAILED' }
Write-Host "Runtime action audit recorded for $Gate with source SHA-256 $hash"
