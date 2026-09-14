param(
    [ValidateSet('Edge','Chrome')]
    [string]$Browser = 'Edge',
    [string]$BridgeExe = "$PSScriptRoot\AioBotWindowsBridge.exe",
    [string]$ProfileDirectory = "$env:LOCALAPPDATA\AioBot\BrowserProfile",
    [int]$DebugPort = 9222
)

$ErrorActionPreference = 'Stop'

function Get-BrowserPath([string]$Name) {
    $candidates = if ($Name -eq 'Chrome') {
        @(
            "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
        )
    } else {
        @(
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        )
    }
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) { return $candidate }
    }
    throw "$Name executable not found."
}

if (-not (Test-Path $BridgeExe)) {
    throw "Bridge executable not found: $BridgeExe"
}

$debugUrl = "http://127.0.0.1:$DebugPort/json/version"
$debugReady = $false
try {
    Invoke-RestMethod -Uri $debugUrl -TimeoutSec 2 | Out-Null
    $debugReady = $true
} catch {}

if (-not $debugReady) {
    $browserPath = Get-BrowserPath $Browser
    New-Item -ItemType Directory -Force -Path $ProfileDirectory | Out-Null
    Start-Process -FilePath $browserPath -ArgumentList @(
        "--remote-debugging-port=$DebugPort",
        "--user-data-dir=`"$ProfileDirectory`"",
        'https://adventure.land'
    ) | Out-Null

    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        try {
            Invoke-RestMethod -Uri $debugUrl -TimeoutSec 2 | Out-Null
            $debugReady = $true
            break
        } catch {}
    }
}

if (-not $debugReady) {
    throw "Browser DevTools endpoint did not become ready on port $DebugPort."
}

Start-Process -FilePath $BridgeExe -WorkingDirectory (Split-Path -Parent $BridgeExe)
Write-Host "AIO Windows browser and telemetry bridge started."
