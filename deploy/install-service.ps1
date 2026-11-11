#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Automated Production Deployment & Windows Service Setup for FTU Internal Chat on Windows 11 Pro.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy\install-service.ps1 -Port 3000
#>
param(
    [int]$Port = 3000,
    [string]$ServiceName = "FTUInternalChat",
    [switch]$ResetTestDatabase
)

$ErrorActionPreference = "Stop"
$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$DataDir = Join-Path $AppRoot "data"
$LogDir  = Join-Path $AppRoot "logs"

Write-Host "=== [1/6] Optimizing Windows 11 Pro Power & Defender Settings ===" -ForegroundColor Cyan
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change disk-timeout-ac 0

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

try {
    Add-MpPreference -ExclusionPath $DataDir
    Write-Host "Added Windows Defender real-time exclusion for: $DataDir" -ForegroundColor Green
} catch {
    Write-Warning "Could not add Defender exclusion automatically: $_"
}

Write-Host "=== [2/6] Configuring Windows Defender Firewall (Port $Port - LocalSubnet) ===" -ForegroundColor Cyan
$RuleName = "FTU Internal Chat (TCP $Port)"
$ExistingRule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if ($ExistingRule) {
    Remove-NetFirewallRule -DisplayName $RuleName
}
New-NetFirewallRule -DisplayName $RuleName `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $Port `
    -RemoteAddress LocalSubnet `
    -Action Allow `
    -Profile Private,Domain | Out-Null
Write-Host "Firewall rule '$RuleName' active for internal LAN." -ForegroundColor Green

Write-Host "=== [3/6] Verifying Node.js Runtime ===" -ForegroundColor Cyan
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
    throw "Node.js is not installed or not in PATH. Install Node.js v24 LTS first (winget install OpenJS.NodeJS.LTS)."
}
$NodeExe = $NodeCmd.Source
$NodeVer = & $NodeExe -v
Write-Host "Detected Node.js: $NodeVer at $NodeExe" -ForegroundColor Green

if ($ResetTestDatabase) {
    Write-Host "=== Cleaning existing SQLite database files for fresh production seed ===" -ForegroundColor Yellow
    Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $DataDir "chat.db*")
}

Write-Host "=== [4/6] Installing Dependencies & Building Frontend Bundle ===" -ForegroundColor Cyan
Push-Location $AppRoot
try {
    npm run install:all
    npm run build
} finally {
    Pop-Location
}

Write-Host "=== [5/6] Registering Windows Service via NSSM ($ServiceName) ===" -ForegroundColor Cyan
$NssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $NssmCmd) {
    throw "NSSM is not installed or not in PATH. Install NSSM first (winget install NSSM.NSSM)."
}

$ExistingSvc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($ExistingSvc) {
    Write-Host "Stopping existing service $ServiceName..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    & nssm remove $ServiceName confirm
}

& nssm install $ServiceName $NodeExe "$AppRoot\backend\src\server.js"
& nssm set $ServiceName AppDirectory $AppRoot
& nssm set $ServiceName AppEnvironmentExtra "PORT=$Port" "HOST=0.0.0.0" "NODE_ENV=production"
& nssm set $ServiceName DisplayName "FTU Internal Chat Server"
& nssm set $ServiceName Description "Internal Employee Real-Time Chat Monolith (Express + Socket.io + SQLite WAL)"
& nssm set $ServiceName Start SERVICE_AUTO_START

& nssm set $ServiceName AppStdout "$LogDir\service-out.log"
& nssm set $ServiceName AppStderr "$LogDir\service-err.log"
& nssm set $ServiceName AppRotateFiles 1
& nssm set $ServiceName AppRotateOnline 1
& nssm set $ServiceName AppRotateBytes 10485760

& nssm set $ServiceName AppThrottle 5000
& nssm set $ServiceName AppExit Default Restart
& nssm set $ServiceName AppRestartDelay 5000

Write-Host "=== [6/6] Starting Service & Verifying Health ===" -ForegroundColor Cyan
Start-Service -Name $ServiceName
Start-Sleep -Seconds 2
$Svc = Get-Service -Name $ServiceName
Write-Host "Service Status: $($Svc.Status)" -ForegroundColor Green

$HealthUrl = "http://localhost:$Port/api/health"
try {
    $Resp = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 5
    Write-Host "Health Check Passed: $($Resp | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Warning "Health check failed on $HealthUrl. Check logs at $LogDir\service-err.log"
}

