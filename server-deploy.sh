#!/bin/bash

# 服务器端自动部署脚本
# 用于从GitHub自动拉取并部署博客

set -e

# 配置变量
REPO_URL="https://github.com/liuguanzhanng/yuli.git"
DEPLOY_DIR="/var/www/blog"  # 修改为你的部署目录
BLOG_DIR="anzhiyu-blog"
NGINX_DIR="/etc/nginx/sites-available"  # 修改为你的nginx配置目录
LOG_FILE="/var/log/blog-deploy.log"
BACKUP_DIR="/var/backups/blog"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# 检查依赖
check_dependencies() {
    log "检查系统依赖..."
    
    # 检查git
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    # 检查node和npm
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装，请先安装npm"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 创建备份
create_backup() {
    log "创建备份..."
    
    if [ -d "$DEPLOY_DIR" ]; then
        BACKUP_NAME="blog-backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        log_success "备份已创建: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_warning "部署目录不存在，跳过备份"
    fi
}

# 克隆或更新仓库
update_repository() {
    log "更新代码仓库..."
    
    if [ -d "$DEPLOY_DIR/.git" ]; then
        log "拉取最新代码..."
        cd "$DEPLOY_DIR"
        git fetch origin
        git reset --hard origin/master
        log_success "代码更新完成"
    else
        log "首次克隆仓库..."
        rm -rf "$DEPLOY_DIR"
        git clone "$REPO_URL" "$DEPLOY_DIR"
        log_success "仓库克隆完成"
    fi
}

# 安装依赖
install_dependencies() {
    log "安装项目依赖..."
    
    cd "$DEPLOY_DIR/$BLOG_DIR"
    
    # 检查package.json是否存在
    if [ ! -f "package.json" ]; then
        log_error "package.json文件不存在"
        exit 1
    fi
    
    # 安装依赖
    npm install --production
    log_success "依赖安装完成"
}

# 构建博客
build_blog() {
    log "构建博客静态文件..."
    
    cd "$DEPLOY_DIR/$BLOG_DIR"
    
    # 清理缓存
    npm run clean
    
    # 生成静态文件
    npm run build
    
    if [ -d "public" ]; then
        log_success "博客构建完成"
    else
        log_error "博客构建失败，public目录不存在"
        exit 1
    fi
}

# 部署到Web服务器
deploy_to_webserver() {
    log "部署到Web服务器..."
    
    # 设置Web服务器目录（根据你的配置修改）
    WEB_ROOT="/var/www/html"  # 修改为你的Web根目录
    
    if [ -d "$WEB_ROOT" ]; then
        # 备份当前Web文件
        if [ -d "$WEB_ROOT/blog" ]; then
            mv "$WEB_ROOT/blog" "$WEB_ROOT/blog.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # 复制新的静态文件
        cp -r "$DEPLOY_DIR/$BLOG_DIR/public" "$WEB_ROOT/blog"
        
        # 设置权限
        chown -R www-data:www-data "$WEB_ROOT/blog"
        chmod -R 755 "$WEB_ROOT/blog"
        
        log_success "部署到Web服务器完成"
    else
        log_warning "Web根目录不存在: $WEB_ROOT"
    fi
}

# 重启服务
restart_services() {
    log "重启相关服务..."
    
    # 重启Nginx（如果需要）
    if command -v nginx &> /dev/null; then
        nginx -t && systemctl reload nginx
        log_success "Nginx配置重载完成"
    fi
    
    # 如果使用PM2管理Node.js应用
    if command -v pm2 &> /dev/null; then
        pm2 restart blog 2>/dev/null || log_warning "PM2应用'blog'未找到"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log "清理旧备份..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # 保留最近7天的备份
        find "$BACKUP_DIR" -name "blog-backup-*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
        log_success "旧备份清理完成"
    fi
}

# 发送通知（可选）
send_notification() {
    local status=$1
    local message=$2
    
    # 这里可以添加通知逻辑，比如发送邮件、Slack消息等
    # 示例：发送到webhook
    # curl -X POST -H 'Content-type: application/json' \
    #      --data "{\"text\":\"博客部署$status: $message\"}" \
    #      YOUR_WEBHOOK_URL
    
    log "通知已发送: $status - $message"
}

# 主函数
main() {
    log "========== 开始自动部署 =========="
    
    # 检查是否以root权限运行
    if [ "$EUID" -ne 0 ]; then
        log_error "请以root权限运行此脚本"
        exit 1
    fi
    
    # 创建必要的目录
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR"
    
    # 执行部署流程
    check_dependencies
    create_backup
    update_repository
    install_dependencies
    build_blog
    deploy_to_webserver
    restart_services
    cleanup_old_backups
    
    log_success "========== 自动部署完成 =========="
    send_notification "成功" "博客已成功部署到服务器"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; send_notification "失败" "部署过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"
