# 服务器端自动部署完整设置指南

## 🎯 目标架构

```
本地开发环境 → GitHub仓库 → 服务器自动部署
     ↓              ↓              ↓
  写文章/改配置    Git推送       Webhook触发
  本地预览        版本控制       自动拉取+构建
  测试验证        CI/CD         生产部署
```

## 📋 前置要求

- Ubuntu 20.04+ 或 CentOS 8+ 服务器
- 域名（可选，用于HTTPS）
- GitHub仓库管理权限
- 服务器root或sudo权限

## 🚀 快速部署（推荐方案）

### 方案1: GitHub Actions + SSH部署

这是最推荐的方案，无需在服务器上运行额外的Webhook服务。

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y git nodejs npm nginx

# 创建部署目录
sudo mkdir -p /var/www/html/blog
sudo mkdir -p /opt/scripts
sudo mkdir -p /var/log/blog

# 设置权限
sudo chown -R $USER:$USER /var/www/html/blog
sudo chown -R $USER:$USER /opt/scripts
```

#### 2. 复制部署脚本

```bash
# 将server-deploy.sh上传到服务器
scp server-deploy.sh user@your-server:/opt/scripts/
ssh user@your-server "chmod +x /opt/scripts/server-deploy.sh"
```

#### 3. 配置SSH密钥

```bash
# 在服务器上生成SSH密钥（如果没有）
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 复制私钥内容，添加到GitHub Secrets
cat ~/.ssh/id_rsa
```

#### 4. GitHub配置

在GitHub仓库中设置以下Secrets：

- `SERVER_HOST`: 服务器IP或域名
- `SERVER_USER`: SSH用户名
- `SERVER_SSH_KEY`: SSH私钥内容
- `SERVER_PORT`: SSH端口（默认22）

#### 5. 测试部署

```bash
# 本地推送测试
git add .
git commit -m "测试自动部署"
git push origin master

# 查看GitHub Actions执行情况
# 访问: https://github.com/your-username/yuli/actions
```

### 方案2: Webhook + 服务器监听

如果你想要更实时的部署，可以使用Webhook方案。

#### 1. 安装Webhook处理器

**PHP版本（简单）:**

```bash
# 安装PHP
sudo apt install -y php-fpm php-cli

# 复制Webhook处理器
sudo cp webhook-handler.php /var/www/html/
sudo chown www-data:www-data /var/www/html/webhook-handler.php

# 编辑配置
sudo nano /var/www/html/webhook-handler.php
# 修改: $config['secret'] = 'your_webhook_secret_here';
# 修改: $config['deploy_script'] = '/opt/scripts/server-deploy.sh';
```

**Node.js版本（推荐）:**

```bash
# 安装PM2
sudo npm install -g pm2

# 复制并配置Webhook服务器
cp webhook-server.js /opt/scripts/
cd /opt/scripts
npm init -y
npm install express

# 编辑配置
nano webhook-server.js
# 修改配置变量

# 启动服务
pm2 start webhook-server.js --name webhook
pm2 startup
pm2 save
```

#### 2. 配置Nginx

```bash
# 复制Nginx配置
sudo cp nginx-blog.conf /etc/nginx/sites-available/blog

# 编辑配置
sudo nano /etc/nginx/sites-available/blog
# 修改域名和路径

# 启用站点
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. GitHub Webhook设置

1. 进入GitHub仓库设置
2. 点击 "Webhooks" → "Add webhook"
3. 配置：
   - **Payload URL**: `http://your-domain.com/webhook-handler.php`
   - **Content type**: `application/json`
   - **Secret**: 与脚本中设置的相同
   - **Events**: 选择 "Just the push event"

## 🔧 高级配置

### SSL证书配置

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 监控和日志

```bash
# 设置日志轮转
sudo nano /etc/logrotate.d/blog-deploy

# 内容:
/var/log/blog-deploy.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}

# 实时监控日志
sudo tail -f /var/log/blog-deploy.log
```

### 性能优化

```bash
# 启用Nginx缓存
sudo mkdir -p /var/cache/nginx/blog
sudo chown -R www-data:www-data /var/cache/nginx/blog

# 在Nginx配置中添加:
# proxy_cache_path /var/cache/nginx/blog levels=1:2 keys_zone=blog:10m max_size=1g;
```

## 🔍 故障排除

### 常见问题

1. **部署脚本权限错误**
   ```bash
   sudo chmod +x /opt/scripts/server-deploy.sh
   sudo chown root:root /opt/scripts/server-deploy.sh
   ```

2. **Git权限问题**
   ```bash
   # 配置Git用户
   git config --global user.name "Deploy Bot"
   git config --global user.email "deploy@your-domain.com"
   ```

3. **Node.js版本问题**
   ```bash
   # 使用nvm管理Node.js版本
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

4. **Webhook不触发**
   ```bash
   # 检查防火墙
   sudo ufw allow 80
   sudo ufw allow 443
   
   # 检查Nginx状态
   sudo systemctl status nginx
   
   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

### 调试命令

```bash
# 手动测试部署脚本
sudo /opt/scripts/server-deploy.sh

# 检查Webhook日志
sudo tail -f /var/log/webhook.log

# 测试Webhook端点
curl -X POST http://your-domain.com/webhook-handler.php

# 检查进程状态
pm2 status
pm2 logs webhook
```

## 📊 监控和维护

### 定期维护任务

```bash
# 创建维护脚本
sudo nano /opt/scripts/maintenance.sh

#!/bin/bash
# 清理旧备份
find /var/backups/blog -name "blog-backup-*" -type d -mtime +7 -exec rm -rf {} \;

# 清理日志
find /var/log -name "*.log" -size +100M -exec truncate -s 0 {} \;

# 更新系统
apt update && apt upgrade -y

# 设置定时任务
sudo crontab -e
# 添加: 0 2 * * 0 /opt/scripts/maintenance.sh
```

### 性能监控

```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs

# 监控磁盘使用
df -h
du -sh /var/www/html/blog

# 监控内存使用
free -h

# 监控网络连接
netstat -tulpn | grep :80
```

## 🎉 完成验证

1. **本地推送测试**
   ```bash
   echo "测试自动部署" >> test.txt
   git add test.txt
   git commit -m "测试自动部署功能"
   git push origin master
   ```

2. **检查部署结果**
   ```bash
   # 访问你的博客网站
   curl -I http://your-domain.com
   
   # 检查文件是否更新
   ls -la /var/www/html/blog
   ```

3. **验证自动化流程**
   - GitHub Actions执行成功
   - 服务器日志显示部署完成
   - 网站内容已更新

恭喜！你的博客自动部署系统已经配置完成！🎉
