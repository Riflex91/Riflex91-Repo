$ErrorActionPreference = 'Stop'

Write-Host '=== Windows / CPU ==='
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsArchitecture, CsSystemType

Write-Host "`n=== WSL ==="
wsl --status
wsl -l -v

Write-Host "`n=== Docker ==="
docker version
docker compose version
docker info --format 'Server={{.ServerVersion}} OSType={{.OSType}} Architecture={{.Architecture}} CPUs={{.NCPU}} Memory={{.MemTotal}}'

Write-Host "`n=== Required ports ==="
$ports = 3000, 2222, 8788
foreach ($port in $ports) {
    $listeners = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($listeners) {
        Write-Warning "Port $port is already in use."
        $listeners | Format-Table -AutoSize
    } else {
        Write-Host "Port $port: free"
    }
}

Write-Host "`n=== Network reachability ==="
Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com' -Method Head -TimeoutSec 15 | Out-Null
Invoke-WebRequest -UseBasicParsing -Uri 'https://codeberg.org' -Method Head -TimeoutSec 15 | Out-Null
Write-Host 'GitHub + Codeberg reachable'

Write-Host "`n=== Container engine smoke test ==="
docker pull hello-world:latest | Out-Host
docker run --rm hello-world:latest | Out-Host

Write-Host "`n=== Forgejo image check ==="
docker pull codeberg.org/forgejo/forgejo:15.0.8 | Out-Host

Write-Host "`n=== Node 22 image check ==="
docker pull node:22-bookworm | Out-Host
docker run --rm node:22-bookworm node --version | Out-Host

Write-Host "`n=== Result ==="
Write-Host 'Preflight completed. Forgejo, runner and bridge have NOT been started by this script.'
