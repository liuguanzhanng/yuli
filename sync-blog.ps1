# 博客同步PowerShell脚本
# 用于同步本地和服务器端的博客配置

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# 配置变量
$BlogDir = "anzhiyu-blog"
$BackupDir = "backup\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$RemoteName = "origin"
$BranchName = "master"

Write-Host "================================" -ForegroundColor Blue
Write-Host "     博客同步脚本 v1.0" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

function Show-Help {
    Write-Host "用法: .\sync-blog.ps1 [命令]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "可用命令:" -ForegroundColor Green
    Write-Host "  push     - 推送本地更改到GitHub" -ForegroundColor White
    Write-Host "  pull     - 从GitHub拉取最新配置" -ForegroundColor White
    Write-Host "  deploy   - 部署博客（生成静态文件）" -ForegroundColor White
    Write-Host "  backup   - 创建配置备份" -ForegroundColor White
    Write-Host "  all      - 执行完整同步（备份+拉取+部署）" -ForegroundColor White
    Write-Host "  help     - 显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\sync-blog.ps1 push" -ForegroundColor Gray
    Write-Host "  .\sync-blog.ps1 pull" -ForegroundColor Gray
    Write-Host "  .\sync-blog.ps1 all" -ForegroundColor Gray
}

function Push-ToRemote {
    Write-Host "[推送] 正在推送到GitHub..." -ForegroundColor Yellow
    
    git add .
    
    $commitMsg = Read-Host "请输入提交信息 (直接回车使用默认信息)"
    if ([string]::IsNullOrEmpty($commitMsg)) {
        $commitMsg = "更新博客配置 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    git commit -m $commitMsg
    git push $RemoteName $BranchName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[成功] 推送完成！" -ForegroundColor Green
    } else {
        Write-Host "[错误] 推送失败，请检查网络连接和权限" -ForegroundColor Red
    }
}

function Pull-FromRemote {
    Write-Host "[拉取] 正在从GitHub拉取最新配置..." -ForegroundColor Yellow
    
    git pull $RemoteName $BranchName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[成功] 拉取完成！" -ForegroundColor Green
    } else {
        Write-Host "[错误] 拉取失败，请检查网络连接" -ForegroundColor Red
    }
}

function Deploy-Blog {
    Write-Host "[部署] 正在部署博客..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BlogDir)) {
        Write-Host "[错误] 博客目录不存在" -ForegroundColor Red
        return
    }
    
    Push-Location $BlogDir
    
    try {
        Write-Host "[部署] 安装依赖..." -ForegroundColor Blue
        npm install
        
        Write-Host "[部署] 清理缓存..." -ForegroundColor Blue
        npm run clean
        
        Write-Host "[部署] 生成静态文件..." -ForegroundColor Blue
        npm run build
        
        Write-Host "[成功] 博客部署完成！" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

function Create-Backup {
    Write-Host "[备份] 正在创建备份..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BlogDir)) {
        Write-Host "[错误] 博客目录不存在" -ForegroundColor Red
        return
    }
    
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # 备份配置文件
    if (Test-Path "$BlogDir\_config.yml") {
        Copy-Item "$BlogDir\_config.yml" $BackupDir
    }
    if (Test-Path "$BlogDir\_config.anzhiyu.yml") {
        Copy-Item "$BlogDir\_config.anzhiyu.yml" $BackupDir
    }
    
    # 备份源文件
    if (Test-Path "$BlogDir\source") {
        Copy-Item "$BlogDir\source" "$BackupDir\source" -Recurse
    }
    
    Write-Host "[成功] 备份已创建: $BackupDir" -ForegroundColor Green
}

function Full-Sync {
    Write-Host "[完整同步] 开始执行完整同步流程..." -ForegroundColor Blue
    Create-Backup
    Pull-FromRemote
    Deploy-Blog
    Write-Host "[成功] 完整同步完成！" -ForegroundColor Green
}

# 主逻辑
switch ($Command.ToLower()) {
    "push" { Push-ToRemote }
    "pull" { Pull-FromRemote }
    "deploy" { Deploy-Blog }
    "backup" { Create-Backup }
    "all" { Full-Sync }
    "help" { Show-Help }
    default {
        Write-Host "[错误] 未知命令: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}

Write-Host ""
Read-Host "按回车键继续"
