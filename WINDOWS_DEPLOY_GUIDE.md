# Windows 环境下的 GitHub Actions 部署指南

## 🎯 概述

本指南将帮助您在Windows环境下配置GitHub Actions，实现博客的自动部署到服务器。

## 📋 前置要求

- Windows 10/11 系统
- Git for Windows 已安装
- 服务器root权限
- GitHub仓库管理权限

## 🚀 快速部署步骤

### 步骤1: 服务器环境配置

首先，在您的服务器上运行环境配置脚本：

```bash
# SSH连接到服务器
ssh root@74.48.157.54

# 下载并运行配置脚本
curl -O https://raw.githubusercontent.com/your-username/anz/main/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

或者手动执行以下命令：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要软件
apt install -y nginx git curl wget unzip htop ufw certbot python3-certbot-nginx

# 创建部署用户
useradd -m -s /bin/bash deploy
mkdir -p /home/deploy/.ssh
chown deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# 创建网站目录
mkdir -p /var/www/blog
chown deploy:deploy /var/www/blog
chmod 755 /var/www/blog

# 配置Nginx
cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 80;
    server_name 74.48.157.54 _;
    
    root /var/www/blog;
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/blog.access.log;
    error_log /var/log/nginx/blog.error.log;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 配置防火墙
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
```

### 步骤2: 生成SSH密钥（Windows）

在Windows上使用Git Bash或PowerShell：

```bash
# 打开Git Bash或PowerShell
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# 按提示操作：
# 1. 文件位置：直接回车使用默认位置
# 2. 密码：直接回车（留空）
```

### 步骤3: 配置服务器SSH访问

```bash
# 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 将公钥添加到服务器
ssh root@74.48.157.54
echo "你的公钥内容" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
exit

# 测试SSH连接
ssh deploy@74.48.157.54
```

### 步骤4: 配置GitHub Secrets

1. 打开GitHub仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，依次添加：

#### SSH_HOST
```
74.48.157.54
```

#### SSH_USER
```
deploy
```

#### SSH_PORT
```
22
```

#### TARGET_DIR
```
/var/www/blog
```

#### SSH_PRIVATE_KEY
```bash
# 在Git Bash中获取私钥内容
cat ~/.ssh/id_rsa
# 复制完整输出，包括 -----BEGIN OPENSSH PRIVATE KEY----- 和 -----END OPENSSH PRIVATE KEY-----
```

### 步骤5: 测试自动部署

```bash
# 在项目根目录下
echo "# 部署测试" > test-deploy.md
git add test-deploy.md
git commit -m "test: 测试GitHub Actions自动部署"
git push origin main
```

## 🔧 Windows 特定配置

### PowerShell 脚本版本

创建 `deploy-setup.ps1`：

```powershell
# Windows PowerShell 部署配置脚本

Write-Host "🚀 开始配置GitHub Actions自动部署..." -ForegroundColor Green

# 检查SSH密钥
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "生成SSH密钥..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f $sshKeyPath -N '""'
}

# 显示公钥
Write-Host "SSH公钥内容:" -ForegroundColor Cyan
Get-Content "$sshKeyPath.pub"

Write-Host "`n请将上述公钥添加到服务器的 /home/deploy/.ssh/authorized_keys 文件中" -ForegroundColor Yellow

# 显示私钥（用于GitHub Secrets）
Write-Host "`nSSH私钥内容（用于GitHub Secrets）:" -ForegroundColor Cyan
Get-Content $sshKeyPath

Write-Host "`n配置完成！请在GitHub中添加Secrets后推送代码测试。" -ForegroundColor Green
```

### 批处理脚本版本

创建 `deploy-setup.bat`：

```batch
@echo off
echo 🚀 开始配置GitHub Actions自动部署...

REM 检查SSH密钥
if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo 生成SSH密钥...
    ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f "%USERPROFILE%\.ssh\id_rsa" -N ""
)

echo.
echo SSH公钥内容:
type "%USERPROFILE%\.ssh\id_rsa.pub"

echo.
echo 请将上述公钥添加到服务器的 /home/deploy/.ssh/authorized_keys 文件中

echo.
echo SSH私钥内容（用于GitHub Secrets）:
type "%USERPROFILE%\.ssh\id_rsa"

echo.
echo 配置完成！请在GitHub中添加Secrets后推送代码测试。
pause
```

## 🔍 故障排除

### 常见问题1: SSH连接失败

**Windows下测试SSH连接：**
```bash
# 在Git Bash中
ssh -v deploy@74.48.157.54
```

### 常见问题2: 权限问题

**在服务器上检查权限：**
```bash
ls -la /home/deploy/.ssh/
ls -la /var/www/blog/
```

### 常见问题3: GitHub Actions失败

**检查步骤：**
1. 确认所有Secrets都已正确配置
2. 检查私钥格式（必须包含完整的头尾标记）
3. 确认服务器SSH服务正常运行

## 📊 监控和维护

### 查看部署状态
1. GitHub仓库 → Actions 页面
2. 点击最新的workflow查看详细日志

### 服务器日志
```bash
# SSH连接到服务器
ssh deploy@74.48.157.54

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/blog.access.log

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/blog.error.log
```

### 网站访问
部署成功后，访问：http://74.48.157.54

## 🎉 完成检查清单

- [ ] 服务器环境配置完成
- [ ] SSH密钥生成并配置
- [ ] GitHub Secrets全部添加
- [ ] 测试提交推送成功
- [ ] GitHub Actions运行成功
- [ ] 网站可以正常访问
- [ ] 自动部署流程验证通过

## 💡 最佳实践

1. **定期备份SSH密钥**
2. **监控GitHub Actions运行状态**
3. **定期更新服务器系统**
4. **使用语义化的提交信息**
5. **在本地测试后再推送**

---

**配置完成后，您将拥有：**
- ✅ 完全自动化的部署流程
- ✅ 推送代码即可更新网站
- ✅ 零停机时间部署
- ✅ 详细的部署日志和监控
- ✅ 安全的SSH密钥认证
