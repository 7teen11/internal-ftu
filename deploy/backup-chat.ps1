<#
.SYNOPSIS
    Zero-downtime SQLite WAL Hot Backup & Uploads Sync for FTU Internal Chat.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy\backup-chat.ps1 -BackupRoot "D:\Backups\ftu-chat" -RegisterDailyTask
#>
param(
    [string]$BackupRoot = "D:\Backups\ftu-chat",
    [int]$RetentionDays = 14,
    [switch]$RegisterDailyTask
)

$ErrorActionPreference = "Stop"
$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$DbPath  = Join-Path $AppRoot "data\chat.db"
$UploadsDir = Join-Path $AppRoot "data\uploads"

if ($RegisterDailyTask) {
    $ScriptPath = $MyInvocation.MyCommand.Path
    $TaskName   = "FTUChatDailyBackup"
    $Action     = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -BackupRoot `"$BackupRoot`" -RetentionDays $RetentionDays"
    $Trigger    = New-ScheduledTaskTrigger -Daily -At 3:00AM
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -User "SYSTEM" -RunLevel Highest -Force | Out-Null
    Write-Host "Scheduled Task '$TaskName' registered to run daily at 03:00 AM under SYSTEM." -ForegroundColor Green
}

if (-not (Test-Path $DbPath)) {
    Write-Warning "Database file not found at $DbPath. Skipping backup."
    exit 0
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$DestDir   = Join-Path $BackupRoot $Timestamp
New-Item -ItemType Directory -Force -Path $DestDir | Out-Null

$SrcDbNormalized = $DbPath -replace '\\', '/'
$DstDbNormalized = (Join-Path $DestDir "chat.db") -replace '\\', '/'

Write-Host "Running hot SQLite WAL snapshot into $DestDir\chat.db ..." -ForegroundColor Cyan
$JsCode = @"
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('$SrcDbNormalized');
db.exec("VACUUM INTO '$DstDbNormalized'");
db.close();
"@
$JsCode | node --input-type=module

if (Test-Path $UploadsDir) {
    Write-Host "Syncing uploaded attachments ..." -ForegroundColor Cyan
    $DestUploads = Join-Path $DestDir "uploads"
    New-Item -ItemType Directory -Force -Path $DestUploads | Out-Null
    & robocopy $UploadsDir $DestUploads /E /R:2 /W:2 /NFL /NDL /NJH /NJS | Out-Null
}

Write-Host "Pruning backups older than $RetentionDays days ..." -ForegroundColor Cyan
Get-ChildItem -Path $BackupRoot -Directory |
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) } |
    Remove-Item -Recurse -Force

Write-Host "Backup completed successfully at: $DestDir" -ForegroundColor Green

