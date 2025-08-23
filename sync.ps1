# Blog Sync PowerShell Script
# For syncing local and server blog configurations

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Configuration variables
$BlogDir = "anzhiyu-blog"
$BackupDir = "backup\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$RemoteName = "origin"
$BranchName = "master"

Write-Host "================================" -ForegroundColor Blue
Write-Host "     Blog Sync Script v1.0" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

function Show-Help {
    Write-Host "Usage: .\sync.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  push     - Push local changes to GitHub" -ForegroundColor White
    Write-Host "  pull     - Pull latest config from GitHub" -ForegroundColor White
    Write-Host "  deploy   - Deploy blog (generate static files)" -ForegroundColor White
    Write-Host "  backup   - Create configuration backup" -ForegroundColor White
    Write-Host "  all      - Full sync (backup + pull + deploy)" -ForegroundColor White
    Write-Host "  help     - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\sync.ps1 push" -ForegroundColor Gray
    Write-Host "  .\sync.ps1 pull" -ForegroundColor Gray
    Write-Host "  .\sync.ps1 all" -ForegroundColor Gray
}

function Push-ToRemote {
    Write-Host "[PUSH] Pushing to GitHub..." -ForegroundColor Yellow
    
    git add .
    
    $commitMsg = Read-Host "Enter commit message (press Enter for default)"
    if ([string]::IsNullOrEmpty($commitMsg)) {
        $commitMsg = "Update blog config - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    git commit -m $commitMsg
    git push $RemoteName $BranchName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Push completed!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Push failed, check network and permissions" -ForegroundColor Red
    }
}

function Pull-FromRemote {
    Write-Host "[PULL] Pulling latest config from GitHub..." -ForegroundColor Yellow
    
    git pull $RemoteName $BranchName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Pull completed!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Pull failed, check network connection" -ForegroundColor Red
    }
}

function Deploy-Blog {
    Write-Host "[DEPLOY] Deploying blog..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BlogDir)) {
        Write-Host "[ERROR] Blog directory does not exist" -ForegroundColor Red
        return
    }
    
    Push-Location $BlogDir
    
    try {
        Write-Host "[DEPLOY] Installing dependencies..." -ForegroundColor Blue
        npm install
        
        Write-Host "[DEPLOY] Cleaning cache..." -ForegroundColor Blue
        npm run clean
        
        Write-Host "[DEPLOY] Generating static files..." -ForegroundColor Blue
        npm run build
        
        Write-Host "[SUCCESS] Blog deployment completed!" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

function Create-Backup {
    Write-Host "[BACKUP] Creating backup..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BlogDir)) {
        Write-Host "[ERROR] Blog directory does not exist" -ForegroundColor Red
        return
    }
    
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup config files
    if (Test-Path "$BlogDir\_config.yml") {
        Copy-Item "$BlogDir\_config.yml" $BackupDir
    }
    if (Test-Path "$BlogDir\_config.anzhiyu.yml") {
        Copy-Item "$BlogDir\_config.anzhiyu.yml" $BackupDir
    }
    
    # Backup source files
    if (Test-Path "$BlogDir\source") {
        Copy-Item "$BlogDir\source" "$BackupDir\source" -Recurse
    }
    
    Write-Host "[SUCCESS] Backup created: $BackupDir" -ForegroundColor Green
}

function Full-Sync {
    Write-Host "[FULL SYNC] Starting full sync process..." -ForegroundColor Blue
    Create-Backup
    Pull-FromRemote
    Deploy-Blog
    Write-Host "[SUCCESS] Full sync completed!" -ForegroundColor Green
}

# Main logic
switch ($Command.ToLower()) {
    "push" { Push-ToRemote }
    "pull" { Pull-FromRemote }
    "deploy" { Deploy-Blog }
    "backup" { Create-Backup }
    "all" { Full-Sync }
    "help" { Show-Help }
    default {
        Write-Host "[ERROR] Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}

Write-Host ""
Read-Host "Press Enter to continue"
