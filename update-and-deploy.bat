@echo off
echo 🚀 开始更新和部署博客...

cd anzhiyu-blog

echo 📝 预生成AI摘要...
node tools/generate-ai-summaries.js
if %errorlevel% neq 0 (
    echo ❌ AI摘要生成失败
    pause
    exit /b 1
)

echo 🔨 构建静态网站...
call hexo clean
call hexo generate
if %errorlevel% neq 0 (
    echo ❌ 网站构建失败
    pause
    exit /b 1
)

cd ..

echo 📤 提交并推送到GitHub...
git add .
git commit -m "feat: 自动更新网站内容和AI摘要 - %date% %time%"
git push origin master

if %errorlevel% neq 0 (
    echo ❌ 推送失败
    pause
    exit /b 1
)

echo ✅ 更新完成！GitHub Actions将自动部署到VPS
echo 🌐 请稍等几分钟后访问网站查看更新
pause
