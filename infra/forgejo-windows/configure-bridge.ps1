param(
    [string]$ForgejoOwner = 'Riflex91',
    [string]$ForgejoRepo = 'Adventure-Land---The-Code-MMORPG---Bot--public'
)

$ErrorActionPreference = 'Stop'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvPath = Join-Path $Here '.env.bridge'

Write-Host 'This creates a LOCAL secret file. It is ignored by Git.'
Write-Host 'Use a dedicated, repository-scoped Forgejo token. Do not use the administrator password.'

$secureToken = Read-Host 'Forgejo access token' -AsSecureString
$tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
    $forgejoToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
}

if ([string]::IsNullOrWhiteSpace($forgejoToken)) {
    throw 'Forgejo token must not be empty.'
}

function New-RandomHex([int]$Bytes) {
    $buffer = New-Object byte[] $Bytes
    [Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
    return [Convert]::ToHexString($buffer).ToLowerInvariant()
}

$bridgeKey = New-RandomHex 32
$mergeKey = New-RandomHex 32

@"
FORGEJO_TOKEN=$forgejoToken
BRIDGE_KEY=$bridgeKey
MERGE_KEY=$mergeKey
FORGEJO_OWNER=$ForgejoOwner
FORGEJO_REPO=$ForgejoRepo
ALLOW_MERGE=false
REQUIRE_GREEN_STATUS=true
"@ | Set-Content -Path $EnvPath -Encoding utf8NoBOM

Write-Host ''
Write-Host "Created: $EnvPath"
Write-Host 'ALLOW_MERGE is deliberately false.'
Write-Host 'Keep BRIDGE_KEY and MERGE_KEY private. Do not paste them into chat.'
Write-Host ''
Write-Host 'Next:'
Write-Host '  docker compose --profile bridge up -d --build bridge'
