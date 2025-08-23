@echo off
chcp 65001 >nul
echo ================================
echo     博客同步脚本 v1.0
echo ================================
echo.

if "%1"=="" goto :show_help
if "%1"=="help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="push" goto :push
if "%1"=="pull" goto :pull
if "%1"=="deploy" goto :deploy
if "%1"=="backup" goto :backup
if "%1"=="all" goto :full_sync

:show_help
echo 用法: sync-blog.bat [命令]
echo.
echo 可用命令:
echo   push     - 推送本地更改到GitHub
echo   pull     - 从GitHub拉取最新配置
echo   deploy   - 部署博客（生成静态文件）
echo   backup   - 创建配置备份
echo   all      - 执行完整同步（备份+拉取+部署）
echo   help     - 显示此帮助信息
echo.
echo 示例:
echo   sync-blog.bat push
echo   sync-blog.bat pull
echo   sync-blog.bat all
goto :end

:push
echo [推送] 正在推送到GitHub...
git add .
set /p commit_msg="请输入提交信息 (直接回车使用默认信息): "
if "%commit_msg%"=="" set commit_msg=更新博客配置 - %date% %time%
git commit -m "%commit_msg%"
git push -u origin main
if %errorlevel%==0 (
    echo [成功] 推送完成！
) else (
    echo [错误] 推送失败，请检查网络连接和权限
)
goto :end

:pull
echo [拉取] 正在从GitHub拉取最新配置...
git pull origin main
if %errorlevel%==0 (
    echo [成功] 拉取完成！
) else (
    echo [错误] 拉取失败，请检查网络连接
)
goto :end

:deploy
echo [部署] 正在部署博客...
if not exist "anzhiyu-blog" (
    echo [错误] 博客目录不存在
    goto :end
)
cd anzhiyu-blog
echo [部署] 安装依赖...
call npm install
echo [部署] 清理缓存...
call npm run clean
echo [部署] 生成静态文件...
call npm run build
cd ..
echo [成功] 博客部署完成！
goto :end

:backup
echo [备份] 正在创建备份...
set backup_dir=backup\%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set backup_dir=%backup_dir: =0%
mkdir "%backup_dir%" 2>nul
if exist "anzhiyu-blog\_config.yml" copy "anzhiyu-blog\_config.yml" "%backup_dir%\" >nul
if exist "anzhiyu-blog\_config.anzhiyu.yml" copy "anzhiyu-blog\_config.anzhiyu.yml" "%backup_dir%\" >nul
if exist "anzhiyu-blog\source" xcopy "anzhiyu-blog\source" "%backup_dir%\source\" /E /I /Q >nul
echo [成功] 备份已创建: %backup_dir%
goto :end

:full_sync
echo [完整同步] 开始执行完整同步流程...
call :backup
call :pull
call :deploy
echo [成功] 完整同步完成！
goto :end

:end
echo.
pause
