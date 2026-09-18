param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [Parameter(Mandatory=$true)][ValidateSet('canary','1h','24h','72h','7d')][string]$Gate
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-certification.js'
$evidence = Join-Path $env:LOCALAPPDATA "AioBot\host-service\certification\$Gate.jsonl"
if (-not (Test-Path $evidence)) { throw 'CERTIFICATION_EVIDENCE_NOT_FOUND' }
& node $entry status --gate $Gate --evidence $evidence
exit $LASTEXITCODE
