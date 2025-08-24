# GitHub Secrets 配置指南

## 📋 概述

为了让GitHub Actions能够自动部署您的博客到服务器，需要在GitHub仓库中配置以下Secrets。

## 🔑 必需的Secrets

### 1. SSH_HOST
- **描述**: 服务器的IP地址或域名
- **值**: `74.48.157.54`

### 2. SSH_USER  
- **描述**: SSH登录用户名
- **值**: `deploy`

### 3. SSH_PORT
- **描述**: SSH端口号
- **值**: `22`

### 4. TARGET_DIR
- **描述**: 服务器上的目标部署目录
- **值**: `/var/www/blog`

### 5. SSH_PRIVATE_KEY
- **描述**: SSH私钥内容
- **获取方法**: 见下方详细说明

## 🔧 SSH密钥配置步骤

### 步骤1: 在本地生成SSH密钥对

```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"

# 按提示操作：
# 1. 输入文件名（建议使用默认）
# 2. 输入密码（建议留空，直接回车）
```

### 步骤2: 复制公钥到服务器

```bash
# 方法1: 使用ssh-copy-id（推荐）
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@74.48.157.54

# 方法2: 手动复制
cat ~/.ssh/id_rsa.pub
# 复制输出内容，然后在服务器上执行：
# echo "公钥内容" >> /home/deploy/.ssh/authorized_keys
```

### 步骤3: 获取私钥内容

```bash
# 显示私钥内容
cat ~/.ssh/id_rsa

# 复制完整输出，包括：
# -----BEGIN OPENSSH PRIVATE KEY-----
# [密钥内容]
# -----END OPENSSH PRIVATE KEY-----
```

### 步骤4: 测试SSH连接

```bash
# 测试SSH连接
ssh -i ~/.ssh/id_rsa deploy@74.48.157.54

# 如果能成功登录，说明配置正确
```

## 🌐 GitHub Secrets 配置步骤

### 1. 进入仓库设置
1. 打开您的GitHub仓库
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Secrets and variables**
4. 点击 **Actions**

### 2. 添加Secrets
点击 **New repository secret** 按钮，依次添加以下secrets：

#### SSH_HOST
- Name: `SSH_HOST`
- Secret: `74.48.157.54`

#### SSH_USER
- Name: `SSH_USER`  
- Secret: `deploy`

#### SSH_PORT
- Name: `SSH_PORT`
- Secret: `22`

#### TARGET_DIR
- Name: `TARGET_DIR`
- Secret: `/var/www/blog`

#### SSH_PRIVATE_KEY
- Name: `SSH_PRIVATE_KEY`
- Secret: [粘贴完整的私钥内容]

## ✅ 验证配置

### 1. 检查Secrets列表
配置完成后，您应该在Secrets页面看到5个secrets：
- SSH_HOST
- SSH_USER
- SSH_PORT
- TARGET_DIR
- SSH_PRIVATE_KEY

### 2. 测试部署
1. 对仓库进行任意修改
2. 提交并推送到main分支
3. 查看GitHub Actions运行状态

```bash
# 测试提交
echo "测试自动部署" >> README.md
git add README.md
git commit -m "test: 测试GitHub Actions自动部署"
git push origin main
```

### 3. 监控部署过程
1. 进入GitHub仓库的 **Actions** 页面
2. 查看最新的workflow运行状态
3. 点击workflow查看详细日志

## 🔍 故障排除

### 常见问题1: SSH连接失败
**错误信息**: `Permission denied (publickey)`

**解决方案**:
1. 检查公钥是否正确添加到服务器
2. 检查私钥格式是否正确
3. 确认服务器SSH服务正常运行

```bash
# 在服务器上检查
sudo systemctl status ssh
cat /home/deploy/.ssh/authorized_keys
```

### 常见问题2: 目录权限错误
**错误信息**: `Permission denied` 或 `rsync: failed to set times`

**解决方案**:
```bash
# 在服务器上执行
sudo chown -R deploy:deploy /var/www/blog
sudo chmod -R 755 /var/www/blog
```

### 常见问题3: 防火墙阻止连接
**错误信息**: `Connection timed out`

**解决方案**:
```bash
# 在服务器上检查防火墙
sudo ufw status
sudo ufw allow ssh
sudo ufw allow from [GitHub Actions IP范围]
```

## 📞 获取帮助

如果遇到问题，请检查：
1. GitHub Actions运行日志
2. 服务器SSH日志: `sudo tail -f /var/log/auth.log`
3. Nginx错误日志: `sudo tail -f /var/log/nginx/error.log`

## 🎯 最佳实践

### 安全建议
1. 定期轮换SSH密钥
2. 使用专用的部署用户，不要使用root
3. 限制SSH访问IP范围（如果可能）
4. 定期检查服务器访问日志

### 备份建议
1. 备份SSH私钥到安全位置
2. 记录所有配置信息
3. 定期备份服务器数据

---

**配置完成后，您的博客将实现：**
- ✅ 推送代码自动触发部署
- ✅ 自动构建Hexo静态文件
- ✅ 自动同步到服务器
- ✅ 零停机时间部署
- ✅ 部署状态实时监控
