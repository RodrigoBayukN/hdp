# HDP Installer for Windows
# Usage: irm https://raw.githubusercontent.com/RodrigoBayukN/hdp/master/install.ps1 | iex

$ErrorActionPreference = "Stop"

$arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else {
    Write-Host "Error: Only 64-bit Windows is supported" -ForegroundColor Red
    exit 1
}

$binaryName = "hdp-windows-x64.exe"
$repo = "https://github.com/RodrigoBayukN/hdp"
$downloadUrl = "$repo/releases/latest/download/$binaryName"
$installDir = "$env:LOCALAPPDATA\hdp"
$installPath = "$installDir\hdp.exe"

Write-Host "Installing HDP for Windows..." -ForegroundColor Cyan

# Create install directory
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Download binary
Write-Host "Downloading from $downloadUrl..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $installPath -UseBasicParsing

# Add to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "User")
    Write-Host "Added $installDir to your PATH." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "HDP has been installed successfully!" -ForegroundColor Green
Write-Host "Location: $installPath"
Write-Host ""
Write-Host "Restart your terminal and run 'hdp --help' to get started." -ForegroundColor Cyan
