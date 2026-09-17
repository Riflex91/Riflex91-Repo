param(
    [string]$BridgeUrl = 'http://127.0.0.1:8788',
    [string]$ForgejoUrl = 'http://127.0.0.1:3000'
)

$ErrorActionPreference = 'Stop'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvPath = Join-Path $Here '.env.bridge'

Write-Host '=== Forgejo version ==='
$version = Invoke-RestMethod -Uri "$ForgejoUrl/api/v1/version" -Method Get -TimeoutSec 15
$version | ConvertTo-Json -Depth 6

Write-Host "`n=== Bridge health ==="
$health = Invoke-RestMethod -Uri "$BridgeUrl/health" -Method Get -TimeoutSec 15
$health | ConvertTo-Json -Depth 6

if (-not (Test-Path $EnvPath)) {
    Write-Warning '.env.bridge not found; authenticated bridge tests skipped.'
    exit 0
}

$line = Get-Content $EnvPath | Where-Object { $_ -like 'BRIDGE_KEY=*' } | Select-Object -First 1
if (-not $line) {
    throw 'BRIDGE_KEY not found in .env.bridge'
}
$key = $line.Substring('BRIDGE_KEY='.Length)
$headers = @{ Authorization = "Bearer $key" }

Write-Host "`n=== Bridge repository ==="
$repo = Invoke-RestMethod -Uri "$BridgeUrl/v1/repository" -Method Get -Headers $headers -TimeoutSec 15
Write-Host ("Repository: {0}/{1}" -f $repo.owner.login, $repo.name)

Write-Host "`n=== Open pull requests ==="
$pulls = Invoke-RestMethod -Uri "$BridgeUrl/v1/pulls?state=open&limit=10" -Method Get -Headers $headers -TimeoutSec 15
$pulls | Select-Object number, title, state, draft | Format-Table -AutoSize

Write-Host "`nLocal Forgejo + bridge checks completed."
