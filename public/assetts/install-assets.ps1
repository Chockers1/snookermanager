$ErrorActionPreference = "Stop"
$Source = Join-Path $PSScriptRoot "public\assetts"
$Target = "C:\dev\snooker_career\public\assetts"
New-Item -ItemType Directory -Force -Path $Target | Out-Null
Copy-Item -Path (Join-Path $Source "*") -Destination $Target -Recurse -Force
Write-Host "Installed Snooker Career Manager assets to $Target"
