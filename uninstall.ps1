# HDP Uninstaller for Windows
$ErrorActionPreference = "Stop"

$installDir = "$env:LOCALAPPDATA\hdp\bin"

Write-Host "Uninstalling HDP from Windows..." -ForegroundColor Cyan

# Remove the directory
if (Test-Path $installDir) {
    Remove-Item -Recurse -Force $installDir
    Write-Host "Removed HDP files from $installDir"
} else {
    Write-Host "HDP files not found at $installDir"
}

# Remove from PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -match [regex]::Escape(";$installDir") -or $currentPath -match [regex]::Escape("$installDir;")) {
    $newPath = $currentPath -replace [regex]::Escape(";$installDir"), ""
    $newPath = $newPath -replace [regex]::Escape("$installDir;"), ""
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Removed $installDir from your user PATH." -ForegroundColor Yellow
}

Write-Host "Uninstall complete!" -ForegroundColor Green
