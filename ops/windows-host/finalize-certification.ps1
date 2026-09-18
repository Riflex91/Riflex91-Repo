param(
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [Parameter(Mandatory=$true)][ValidateSet('canary','1h','24h','72h','7d')][string]$Gate,
  [string]$TaskName = 'AioV3Certification'
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $RepoPath).Path
$entry = Join-Path $repo 'v3\host\windows-certification.js'
$evidence = Join-Path $env:LOCALAPPDATA "AioBot\host-service\certification\$Gate.jsonl"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) { Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue }
& node $entry finalize --gate $Gate --evidence $evidence
$code = $LASTEXITCODE
if ($task) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false }
exit $code
