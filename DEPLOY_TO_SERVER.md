# 🚀 GitHub Actions 自动部署到服务器指南

## 📋 概述

本指南将帮助你配置GitHub Actions，实现博客修改后自动同步到服务器 `/var/www/anzhiyu-blog`。

## 🔧 配置步骤

### 步骤1: 服务器准备

首先确保服务器环境已配置：

```bash
# SSH连接到服务器
ssh root@your-server-ip

# 创建部署用户
sudo useradd -m -s /bin/bash deploy

# 创建目标目录
sudo mkdir -p /var/www/anzhiyu-blog/web
sudo chown -R deploy:deploy /var/www/anzhiyu-blog
sudo chmod -R 755 /var/www/anzhiyu-blog

# 配置SSH目录
sudo mkdir -p /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
```

### 步骤2: 生成SSH密钥对

在你的Windows电脑上：

```bash
# 打开Git Bash，生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@anzhiyu-blog"

# 按提示操作：
# 1. 文件名：直接回车使用默认
# 2. 密码：直接回车留空
```

### 步骤3: 配置服务器公钥

```bash
# 在Git Bash中查看公钥
cat ~/.ssh/id_rsa.pub

# 复制输出内容，然后在服务器上执行：
ssh root@your-server-ip
echo "你的公钥内容" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 步骤4: 配置GitHub Secrets

在GitHub仓库中设置以下Secrets：

1. 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**，依次添加：

#### SSH_HOST
```
你的服务器IP地址
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
/var/www/anzhiyu-blog
```

#### SSH_PRIVATE_KEY
```bash
# 在Git Bash中获取私钥内容
cat ~/.ssh/id_rsa

# 复制完整输出，包括：
# -----BEGIN OPENSSH PRIVATE KEY-----
# [密钥内容]
# -----END OPENSSH PRIVATE KEY-----
```

### 步骤5: 配置Nginx（如果需要）

在服务器上配置Nginx指向新目录：

```bash
# 编辑Nginx配置
sudo nano /etc/nginx/sites-available/anzhiyu-blog

# 配置内容：
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/anzhiyu-blog/web;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/anzhiyu-blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🧪 测试部署

### 1. 测试SSH连接

```bash
# 在Git Bash中测试连接
ssh -i ~/.ssh/id_rsa deploy@your-server-ip

# 如果能成功登录，说明配置正确
```

### 2. 触发自动部署

```bash
# 提交刚才的修改
git add .
git commit -m "feat: 添加文章主色调配置，解决首次加载颜色问题"
git push origin master
```

### 3. 监控部署过程

1. 进入GitHub仓库的 **Actions** 页面
2. 查看最新的workflow运行状态
3. 点击workflow查看详细日志

## 📊 部署流程说明

当你推送代码到master分支时，GitHub Actions会：

1. **检出代码** - 下载最新代码
2. **检测包管理器** - 自动识别npm/yarn/pnpm
3. **安装依赖** - 安装Node.js依赖
4. **构建博客** - 运行hexo clean && hexo generate
5. **验证构建** - 检查public目录是否生成
6. **部署到服务器** - 通过SSH和rsync同步文件

## 🎯 部署结果

部署成功后：
- ✅ 博客文件同步到 `/var/www/anzhiyu-blog/web/`
- ✅ 源代码备份到 `/var/www/anzhiyu-blog/`
- ✅ 主色调修改立即生效
- ✅ 无需手动操作服务器

## 🔍 故障排除

### 问题1: SSH连接失败
```bash
# 检查SSH服务状态
sudo systemctl status ssh

# 检查防火墙
sudo ufw status
sudo ufw allow ssh
```

### 问题2: 权限错误
```bash
# 修复目录权限
sudo chown -R deploy:deploy /var/www/anzhiyu-blog
sudo chmod -R 755 /var/www/anzhiyu-blog
```

### 问题3: Nginx配置错误
```bash
# 测试Nginx配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

---

**配置完成后，每次推送代码都会自动部署到服务器！** 🎉
