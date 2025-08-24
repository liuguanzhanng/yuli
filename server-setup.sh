#!/bin/bash

# 服务器端博客部署环境设置脚本
# 用于配置服务器环境，支持GitHub Actions自动部署

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    apt update && apt upgrade -y
    log_success "系统更新完成"
}

# 安装必要软件
install_dependencies() {
    log_info "安装必要软件..."
    apt install -y \
        nginx \
        git \
        curl \
        wget \
        unzip \
        htop \
        ufw \
        certbot \
        python3-certbot-nginx
    log_success "依赖软件安装完成"
}

# 创建部署用户
create_deploy_user() {
    local username="deploy"
    
    if id "$username" &>/dev/null; then
        log_warning "用户 $username 已存在"
    else
        log_info "创建部署用户 $username..."
        useradd -m -s /bin/bash $username
        log_success "用户 $username 创建完成"
    fi
    
    # 创建SSH目录
    mkdir -p /home/$username/.ssh
    chown $username:$username /home/$username/.ssh
    chmod 700 /home/$username/.ssh
    
    log_info "请将您的SSH公钥添加到 /home/$username/.ssh/authorized_keys"
    log_info "然后运行: chown $username:$username /home/$username/.ssh/authorized_keys"
    log_info "然后运行: chmod 600 /home/$username/.ssh/authorized_keys"
}

# 创建网站目录
create_web_directory() {
    local web_dir="/var/www/blog"
    
    log_info "创建网站目录 $web_dir..."
    mkdir -p $web_dir
    chown deploy:deploy $web_dir
    chmod 755 $web_dir
    
    # 创建测试页面
    cat > $web_dir/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>博客部署成功</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #4CAF50; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 博客部署环境配置成功！</h1>
        <p>您的博客将通过GitHub Actions自动部署到这里</p>
        <p>服务器时间: <span id="time"></span></p>
    </div>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF
    
    chown deploy:deploy $web_dir/index.html
    log_success "网站目录创建完成"
}

# 配置Nginx
configure_nginx() {
    local server_ip=$(curl -s ifconfig.me)
    local config_file="/etc/nginx/sites-available/blog"
    
    log_info "配置Nginx..."
    
    # 创建Nginx配置
    cat > $config_file << EOF
server {
    listen 80;
    server_name $server_ip _;
    
    root /var/www/blog;
    index index.html index.htm;
    
    # 静态文件处理
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 日志
    access_log /var/log/nginx/blog.access.log;
    error_log /var/log/nginx/blog.error.log;
}
EOF
    
    # 启用站点
    ln -sf $config_file /etc/nginx/sites-enabled/blog
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    systemctl reload nginx
    systemctl enable nginx
    
    log_success "Nginx配置完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    ufw --force enable
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 80
    ufw allow 443
    
    log_success "防火墙配置完成"
}

# 创建部署后钩子脚本
create_post_deploy_hook() {
    local hook_script="/home/deploy/post-deploy.sh"
    
    log_info "创建部署后钩子脚本..."
    
    cat > $hook_script << 'EOF'
#!/bin/bash

# 部署后执行的钩子脚本
# 可以在这里添加自定义的部署后操作

echo "🚀 开始执行部署后操作..."

# 设置正确的文件权限
find /var/www/blog -type f -exec chmod 644 {} \;
find /var/www/blog -type d -exec chmod 755 {} \;

# 重载Nginx配置
sudo systemctl reload nginx

# 清理旧的日志文件（保留最近7天）
find /var/log/nginx -name "*.log" -mtime +7 -delete 2>/dev/null || true

echo "✅ 部署后操作完成！"
EOF
    
    chmod +x $hook_script
    chown deploy:deploy $hook_script
    
    # 允许deploy用户重载nginx
    echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" >> /etc/sudoers.d/deploy
    
    log_success "部署后钩子脚本创建完成"
}

# 显示配置信息
show_configuration() {
    local server_ip=$(curl -s ifconfig.me)
    
    echo ""
    log_success "🎉 服务器配置完成！"
    echo ""
    echo "📋 配置信息："
    echo "   服务器IP: $server_ip"
    echo "   网站目录: /var/www/blog"
    echo "   部署用户: deploy"
    echo "   SSH配置: /home/deploy/.ssh/"
    echo ""
    echo "🔧 GitHub Secrets 配置："
    echo "   SSH_HOST: $server_ip"
    echo "   SSH_USER: deploy"
    echo "   SSH_PORT: 22"
    echo "   TARGET_DIR: /var/www/blog"
    echo "   SSH_PRIVATE_KEY: [您的SSH私钥内容]"
    echo ""
    echo "🌐 访问地址："
    echo "   HTTP: http://$server_ip"
    echo ""
    echo "📝 下一步操作："
    echo "   1. 将SSH公钥添加到 /home/deploy/.ssh/authorized_keys"
    echo "   2. 在GitHub仓库中配置Secrets"
    echo "   3. 推送代码触发自动部署"
    echo ""
}

# 主函数
main() {
    log_info "开始配置博客部署环境..."
    
    check_root
    update_system
    install_dependencies
    create_deploy_user
    create_web_directory
    configure_nginx
    configure_firewall
    create_post_deploy_hook
    show_configuration
    
    log_success "所有配置完成！"
}

# 运行主函数
main "$@"
