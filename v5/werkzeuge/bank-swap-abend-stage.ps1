param(
  [Parameter(Mandatory=$true)]
  [ValidateRange(1,7)]
  [int]$Stage,

  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[0-9a-fA-F]{40}$')]
  [string]$SourceSha,

  [string]$Cdp = "http://127.0.0.1:9222/"
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $RepoRoot

$ActualSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw "git rev-parse HEAD fehlgeschlagen" }
if ($ActualSha.ToLowerInvariant() -ne $SourceSha.ToLowerInvariant()) {
  throw "BANK-SWAP Source-SHA Drift: HEAD=$ActualSha erwartet=$SourceSha"
}

Set-Location (Join-Path $RepoRoot "v5")

switch ($Stage) {
  1 {
    Write-Host "[1/7] Read-only Preflight"
    & npm run ingame:bank-swap:preflight -- --cdp $Cdp --source-sha $SourceSha
  }
  2 {
    Write-Host "[2/7] Kandidaten-Stabilitaet (read-only)"
    & npm run ingame:bank-swap:stability -- --cdp $Cdp --source-sha $SourceSha
  }
  3 {
    Write-Host "[3/7] CODE-Bridge-Probe (0 Gameplay-Writes)"
    & npm run ingame:bank-swap:bridge -- --cdp $Cdp --source-sha $SourceSha
  }
  4 {
    Write-Host "[4/7] Admission-Shadow (0 Gameplay-Writes)"
    & npm run ingame:bank-swap:shadow -- --cdp $Cdp --source-sha $SourceSha --confirm "V5 BANK SWAP SHADOW OHNE WRITE AUSFUEHREN"
  }
  5 {
    Write-Host "[5/7] Write-Preflight (0 Gameplay-Writes)"
    & npm run ingame:bank-swap:write-preflight -- --cdp $Cdp --source-sha $SourceSha
  }
  6 {
    Write-Host "[6/7] Echter Funktionstest 1 - maximal ein bank_swap"
    & npm run ingame:bank-swap:live -- --cdp $Cdp --source-sha $SourceSha --test-number 1 --confirm "V5 BANK SWAP LIVE TEST 1 EINMAL AUSFUEHREN"
  }
  7 {
    Write-Host "[7/7] Echter Funktionstest 2 - nur nach sauberem Test 1, neuer Reverse-Intent"
    & npm run ingame:bank-swap:live -- --cdp $Cdp --source-sha $SourceSha --test-number 2 --confirm "V5 BANK SWAP LIVE TEST 2 EINMAL AUSFUEHREN"
  }
}

if ($LASTEXITCODE -ne 0) {
  throw "BANK-SWAP Stage $Stage fehlgeschlagen/blockiert (Exitcode $LASTEXITCODE). NICHT erneut ausfuehren; zuerst Evidence analysieren."
}

Write-Host "BANK-SWAP Stage $Stage beendet. Vor der naechsten Stage Ausgabe/Evidence pruefen."
