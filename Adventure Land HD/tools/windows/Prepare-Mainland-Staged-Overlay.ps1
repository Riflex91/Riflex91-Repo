[CmdletBinding()]
param(
    [string]$UpstreamPath = "",
    [string]$Workspace = "",
    [switch]$CheckOnly,
    [switch]$KeepWorkspace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$alhdRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$repoRoot = (Resolve-Path (Join-Path $alhdRoot "..")).Path

if (-not $UpstreamPath) {
    $candidate = Join-Path (Split-Path -Parent $repoRoot) "adventureland"
    if (-not (Test-Path -LiteralPath $candidate)) {
        throw "Adventure Land checkout not found. Pass -UpstreamPath explicitly."
    }
    $UpstreamPath = $candidate
}
$UpstreamPath = (Resolve-Path -LiteralPath $UpstreamPath).Path

$lockPath = Join-Path $alhdRoot "UPSTREAM.lock.json"
$lock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
$pin = [string]$lock.commit
if (-not $pin) {
    throw "UPSTREAM.lock.json does not contain a commit pin."
}

$git = (Get-Command git -ErrorAction Stop).Source
$node = (Get-Command node -ErrorAction Stop).Source

if (-not $Workspace) {
    $Workspace = Join-Path ([IO.Path]::GetTempPath()) ("alhd-mainland-staged-" + [Guid]::NewGuid().ToString("N"))
}
$Workspace = [IO.Path]::GetFullPath($Workspace)
$cleanWorktree = Join-Path $Workspace "clean-upstream"
$stageWorkspace = Join-Path $Workspace "stage"
$rollbackRoot = Join-Path $Workspace "rollback"

$previousGitConfig = @{
    GIT_CONFIG_COUNT = $env:GIT_CONFIG_COUNT
    GIT_CONFIG_KEY_0 = $env:GIT_CONFIG_KEY_0
    GIT_CONFIG_VALUE_0 = $env:GIT_CONFIG_VALUE_0
    GIT_CONFIG_KEY_1 = $env:GIT_CONFIG_KEY_1
    GIT_CONFIG_VALUE_1 = $env:GIT_CONFIG_VALUE_1
}

function Set-EphemeralSafeDirectories {
    $env:GIT_CONFIG_COUNT = "2"
    $env:GIT_CONFIG_KEY_0 = "safe.directory"
    $env:GIT_CONFIG_VALUE_0 = $UpstreamPath
    $env:GIT_CONFIG_KEY_1 = "safe.directory"
    $env:GIT_CONFIG_VALUE_1 = $cleanWorktree
}

function Restore-GitEnvironment {
    foreach ($name in $previousGitConfig.Keys) {
        $value = $previousGitConfig[$name]
        if ($null -eq $value) {
            Remove-Item ("Env:" + $name) -ErrorAction SilentlyContinue
        } else {
            Set-Item ("Env:" + $name) $value
        }
    }
}

function Invoke-Git {
    param([string[]]$Arguments)
    & $git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git failed with exit code ${LASTEXITCODE}: git $($Arguments -join ' ')"
    }
}

function Invoke-NodeTool {
    param(
        [Parameter(Mandatory=$true)][string]$Tool,
        [string[]]$Arguments
    )
    $toolPath = Join-Path (Join-Path $alhdRoot "tools") $Tool
    & $node $toolPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Node tool failed with exit code ${LASTEXITCODE}: $Tool"
    }
}

function Get-RelativePathSafe {
    param(
        [Parameter(Mandatory=$true)][string]$BasePath,
        [Parameter(Mandatory=$true)][string]$FullPath
    )
    $base = [IO.Path]::GetFullPath($BasePath)
    if (-not $base.EndsWith([IO.Path]::DirectorySeparatorChar.ToString())) {
        $base += [IO.Path]::DirectorySeparatorChar
    }
    $baseUri = New-Object System.Uri($base)
    $fullUri = New-Object System.Uri([IO.Path]::GetFullPath($FullPath))
    $relative = [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($fullUri).ToString())
    return $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)
}

$rollback = New-Object System.Collections.Generic.List[object]
$worktreeAdded = $false

try {
    New-Item -ItemType Directory -Force -Path $Workspace | Out-Null
    Set-EphemeralSafeDirectories

    $targetHead = (& $git -C $UpstreamPath rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read Adventure Land HEAD."
    }
    if ($targetHead -ne $pin) {
        throw "Adventure Land checkout must remain at pinned commit $pin. Current HEAD: $targetHead"
    }

    & $git -C $UpstreamPath cat-file -e ($pin + "^{commit}")
    if ($LASTEXITCODE -ne 0) {
        throw "Pinned Adventure Land commit $pin is not available in the local repository."
    }

    if (Test-Path -LiteralPath $cleanWorktree) {
        Remove-Item -LiteralPath $cleanWorktree -Recurse -Force
    }
    Invoke-Git -Arguments @("-C",$UpstreamPath,"worktree","add","--detach",$cleanWorktree,$pin)
    $worktreeAdded = $true

    $orchestratorArgs = @("--upstream",$cleanWorktree,"--workspace",$stageWorkspace)
    if ($CheckOnly) {
        $orchestratorArgs += "--check-only"
    }
    Invoke-NodeTool -Tool "prepare-mainland-staged-overlay.mjs" -Arguments $orchestratorArgs

    if ($CheckOnly) {
        Write-Host "Adventure Land HD Mainland staging validated. The real checkout was not modified."
        return
    }

    $cleanIndex = Join-Path $cleanWorktree "htmls\index.html"
    $targetIndex = Join-Path $UpstreamPath "htmls\index.html"
    $cleanIndexText = [IO.File]::ReadAllText($cleanIndex)
    $targetIndexText = [IO.File]::ReadAllText($targetIndex)

    $manifestMatch = [regex]::Match($cleanIndexText,'<script src="/js/adventure-land-hd-manifest\.js\?alhdv=[a-f0-9]{12}"></script>')
    if (-not $manifestMatch.Success) {
        throw "Generated ALHD manifest script tag not found in clean worktree."
    }
    $bootstrapTag = '<script src="/js/adventure-land-hd-bootstrap.js"></script>'
    if (-not $cleanIndexText.Contains($bootstrapTag)) {
        throw "Generated ALHD bootstrap script tag not found in clean worktree."
    }

    $anchor = '<script src="/data.js?v={{domain.v}}&amp;cache=1"></script>'
    $withoutAlhd = [regex]::Replace(
        $targetIndexText,
        '(?m)^[ \t]*<script src="/js/adventure-land-hd-manifest\.js\?alhdv=[a-f0-9]{12}"></script>\r?\n?',
        ''
    )
    $withoutAlhd = [regex]::Replace(
        $withoutAlhd,
        '(?m)^[ \t]*<script src="/js/adventure-land-hd-bootstrap\.js"></script>\r?\n?',
        ''
    )
    $anchorCount = ([regex]::Matches($withoutAlhd,[regex]::Escape($anchor))).Count
    if ($anchorCount -ne 1) {
        throw "Expected exactly one data.js anchor in the real checkout; found $anchorCount."
    }

    $newlineMatch = [regex]::Match($withoutAlhd,"\r\n|\n")
    $newline = if ($newlineMatch.Success) { $newlineMatch.Value } else { [Environment]::NewLine }
    $injection = $anchor + $newline + "        " + $manifestMatch.Value + $newline + "        " + $bootstrapTag
    $patchedIndex = $withoutAlhd.Replace($anchor,$injection)

    $managedFiles = New-Object System.Collections.Generic.List[object]
    $managedFiles.Add([pscustomobject]@{
        Source = (Join-Path $cleanWorktree "js\adventure-land-hd-manifest.js")
        Target = (Join-Path $UpstreamPath "js\adventure-land-hd-manifest.js")
    })
    $managedFiles.Add([pscustomobject]@{
        Source = (Join-Path $cleanWorktree "js\adventure-land-hd-bootstrap.js")
        Target = (Join-Path $UpstreamPath "js\adventure-land-hd-bootstrap.js")
    })

    $cleanAssetRoot = Join-Path $cleanWorktree "images\alhd"
    $targetAssetRoot = Join-Path $UpstreamPath "images\alhd"
    $assetFiles = @(Get-ChildItem -LiteralPath $cleanAssetRoot -File -Recurse)
    if ($assetFiles.Count -ne 48) {
        throw "Expected exactly 48 staged Mainland HD files; found $($assetFiles.Count)."
    }
    foreach ($file in $assetFiles) {
        $relative = Get-RelativePathSafe -BasePath $cleanAssetRoot -FullPath $file.FullName
        $managedFiles.Add([pscustomobject]@{
            Source = $file.FullName
            Target = (Join-Path $targetAssetRoot $relative)
        })
    }

    New-Item -ItemType Directory -Force -Path $rollbackRoot | Out-Null
    $allTargets = @($managedFiles | ForEach-Object { $_.Target }) + @($targetIndex)
    foreach ($target in $allTargets) {
        $relative = Get-RelativePathSafe -BasePath $UpstreamPath -FullPath $target
        $backup = Join-Path $rollbackRoot $relative
        $existed = Test-Path -LiteralPath $target
        if ($existed) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
            Copy-Item -LiteralPath $target -Destination $backup -Force
        }
        $rollback.Add([pscustomobject]@{
            Target = $target
            Backup = $backup
            Existed = $existed
        })
    }

    try {
        foreach ($item in $managedFiles) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $item.Target) | Out-Null
            Copy-Item -LiteralPath $item.Source -Destination $item.Target -Force
        }
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [IO.File]::WriteAllText($targetIndex,$patchedIndex,$utf8NoBom)

        $verifyArgs = @(
            "--upstream",$UpstreamPath,
            "--manifest",(Join-Path $stageWorkspace "hd-assets-mainland-staged.json"),
            "--hd-root",(Join-Path $stageWorkspace "hd-assets")
        )
        Invoke-NodeTool -Tool "verify-runtime-overlay.mjs" -Arguments $verifyArgs
    }
    catch {
        $rollbackArray = @($rollback)
        [array]::Reverse($rollbackArray)
        foreach ($item in $rollbackArray) {
            if ($item.Existed) {
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $item.Target) | Out-Null
                Copy-Item -LiteralPath $item.Backup -Destination $item.Target -Force
            } elseif (Test-Path -LiteralPath $item.Target) {
                Remove-Item -LiteralPath $item.Target -Force
            }
        }
        throw
    }

    $stagedManifest = Get-Content -LiteralPath (Join-Path $stageWorkspace "hd-assets-mainland-staged.json") -Raw | ConvertFrom-Json
    $activeCount = @($stagedManifest.replacements | Where-Object { $_.state -eq "active" }).Count
    Write-Host "Adventure Land HD Mainland staged overlay installed and verified."
    Write-Host "Managed HD replacements: $activeCount"
    Write-Host "Existing local changes outside the managed ALHD files were not reset or cleaned."
}
finally {
    if ($worktreeAdded) {
        try {
            Invoke-Git -Arguments @("-C",$UpstreamPath,"worktree","remove","--force",$cleanWorktree)
        }
        catch {
            Write-Warning $_
        }
    }
    Restore-GitEnvironment
    if (-not $KeepWorkspace -and (Test-Path -LiteralPath $Workspace)) {
        Remove-Item -LiteralPath $Workspace -Recurse -Force
    } elseif ($KeepWorkspace) {
        Write-Host "Staging workspace kept at: $Workspace"
    }
}
