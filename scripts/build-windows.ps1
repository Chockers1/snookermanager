[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
function Run-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "== $Name =="
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed (exit $LASTEXITCODE)." }
}
try {
    if ($env:OS -ne 'Windows_NT') { throw 'Build on Windows with Node.js 24 LTS, npm and PowerShell.' }
    Run-Step 'Install locked dependencies' { npm.cmd ci }
    Run-Step 'Lint' { npm.cmd run lint }
    Run-Step 'Type check' { npm.cmd run typecheck }
    Run-Step 'Offline Steam configuration checks' { node scripts/verify-steam-config.mjs }
    Run-Step 'Unit and desktop tests' { npm.cmd test }
    Run-Step 'Install test browser' { npx.cmd playwright install chromium }
    Run-Step 'Browser regression tests' { npm.cmd run test:e2e }
    Run-Step 'Production build' { npm.cmd run build }
    Run-Step 'Windows package' { npm.cmd run package:windows }
    Run-Step 'Packaged smoke test' { npm.cmd run test:packaged }
    Run-Step 'Release file inventory' { npm.cmd run verify:package }
    Write-Host "Ready for local QA: $repoRoot\dist\windows\Snooker Career Manager.exe"
} finally { Pop-Location }
