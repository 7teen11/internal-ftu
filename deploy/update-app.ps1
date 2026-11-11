#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Safe Production Update Script for FTU Internal Chat (Backup -> Git Pull -> Build -> Restart Service).
#>
param(
    [string]$ServiceName = "FTUInternalChat",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "=== [1/4] Taking Pre-Update Hot Backup ===" -ForegroundColor Cyan
& "$PSScriptRoot\backup-chat.ps1"

Push-Location $AppRoot
try {
    Write-Host "=== [2/4] Pulling Latest Code from origin/$Branch ===" -ForegroundColor Cyan
    git pull origin $Branch

    Write-Host "=== [3/4] Installing Dependencies & Rebuilding Frontend ===" -ForegroundColor Cyan
    npm run install:all
    npm run build

    Write-Host "=== [4/4] Restarting Windows Service ($ServiceName) ===" -ForegroundColor Cyan
    if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
        Restart-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
        Get-Service -Name $ServiceName
    } else {
        Write-Warning "Service '$ServiceName' not registered yet. Run .\deploy\install-service.ps1 first."
    }
} finally {
    Pop-Location
}

Write-Host "Update completed successfully!" -ForegroundColor Green

