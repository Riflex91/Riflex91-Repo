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
$ports = 3000, 2222
foreach ($port in $ports) {
    $listeners = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($listeners) {
        Write-Warning "Port $port is already in use."
        $listeners | Format-Table -AutoSize
    } else {
        Write-Host "Port $port: free"
    }
}

Write-Host "`n=== Container registry reachability ==="
docker pull hello-world:latest | Out-Host
docker run --rm hello-world:latest | Out-Host

Write-Host "`n=== Forgejo image check ==="
docker pull codeberg.org/forgejo/forgejo:15.0.8 | Out-Host

Write-Host "`n=== Result ==="
Write-Host 'Preflight completed. If Docker reports Linux/amd64 (or compatible Linux architecture), WSL2 is healthy, and ports 3000/2222 are free, the Forgejo test can start.'
