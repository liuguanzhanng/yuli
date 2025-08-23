#!/bin/bash

# 服务器端博客自动同步脚本
# 用于从GitHub自动拉取更新并部署博客

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
REPO_URL="https://github.com/liuguanzhanng/yuli.git"
PROJECT_DIR="/var/www/yuli-blog"
BLOG_DIR="$PROJECT_DIR/anzhiyu-blog"
WEB_ROOT="/var/www/html/blog"
BACKUP_DIR="/var/backups/blog"
LOG_FILE="/var/log/blog-sync.log"
LOCK_FILE="/tmp/blog-sync.lock"

# 日志函数
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

# 检查锁文件，防止重复执行
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        log "${YELLOW}[WARNING] Another sync process is running. Exiting.${NC}"
        exit 1
    fi
    echo $$ > "$LOCK_FILE"
}

# 清理锁文件
cleanup() {
    rm -f "$LOCK_FILE"
}

# 设置退出时清理
trap cleanup EXIT

# 创建备份
create_backup() {
    log "${BLUE}[BACKUP] Creating backup...${NC}"
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # 备份当前网站文件
    if [ -d "$WEB_ROOT" ]; then
        cp -r "$WEB_ROOT" "$backup_path/web_root"
    fi
    
    # 备份配置文件
    if [ -f "$BLOG_DIR/_config.yml" ]; then
        cp "$BLOG_DIR/_config.yml" "$backup_path/"
    fi
    if [ -f "$BLOG_DIR/_config.anzhiyu.yml" ]; then
        cp "$BLOG_DIR/_config.anzhiyu.yml" "$backup_path/"
    fi
    
    # 保留最近7天的备份
    find "$BACKUP_DIR" -name "backup_*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    
    log "${GREEN}[BACKUP] Backup created: $backup_path${NC}"
}

# 拉取最新代码
pull_updates() {
    log "${BLUE}[PULL] Pulling latest updates from GitHub...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 检查是否有本地更改
    if ! git diff --quiet || ! git diff --staged --quiet; then
        log "${YELLOW}[WARNING] Local changes detected, stashing...${NC}"
        git stash
    fi
    
    # 拉取最新更改
    git fetch origin
    git reset --hard origin/master
    
    log "${GREEN}[PULL] Updates pulled successfully${NC}"
}

# 安装依赖
install_dependencies() {
    log "${BLUE}[DEPS] Installing dependencies...${NC}"
    
    cd "$BLOG_DIR"
    
    # 检查package.json是否有更改
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log "${GREEN}[DEPS] Dependencies installed${NC}"
}

# 生成静态文件
generate_site() {
    log "${BLUE}[BUILD] Generating static files...${NC}"
    
    cd "$BLOG_DIR"
    
    # 清理缓存
    npm run clean
    
    # 生成静态文件
    npm run build
    
    log "${GREEN}[BUILD] Static files generated${NC}"
}

# 部署到Web服务器
deploy_site() {
    log "${BLUE}[DEPLOY] Deploying to web server...${NC}"
    
    # 创建Web根目录
    mkdir -p "$WEB_ROOT"
    
    # 同步文件到Web根目录
    rsync -av --delete "$BLOG_DIR/public/" "$WEB_ROOT/"
    
    # 设置正确的权限
    chown -R www-data:www-data "$WEB_ROOT"
    chmod -R 755 "$WEB_ROOT"
    
    log "${GREEN}[DEPLOY] Deployment completed${NC}"
}

# 重启相关服务
restart_services() {
    log "${BLUE}[SERVICE] Restarting services...${NC}"
    
    # 重新加载Nginx配置
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        log "${GREEN}[SERVICE] Nginx reloaded${NC}"
    fi
    
    # 如果使用PM2管理Node.js应用
    if command -v pm2 >/dev/null 2>&1; then
        pm2 reload all 2>/dev/null || true
        log "${GREEN}[SERVICE] PM2 applications reloaded${NC}"
    fi
}

# 发送通知（可选）
send_notification() {
    local status=$1
    local message=$2
    
    # 可以集成钉钉、企业微信、邮件等通知方式
    # 这里提供一个简单的日志记录
    log "${GREEN}[NOTIFICATION] $status: $message${NC}"
    
    # 示例：发送到钉钉机器人
    # if [ -n "$DINGTALK_WEBHOOK" ]; then
    #     curl -X POST "$DINGTALK_WEBHOOK" \
    #         -H 'Content-Type: application/json' \
    #         -d "{\"msgtype\": \"text\", \"text\": {\"content\": \"博客同步$status: $message\"}}"
    # fi
}

# 主函数
main() {
    log "${BLUE}=== Starting blog auto-sync ===${NC}"
    
    check_lock
    
    # 检查项目目录是否存在
    if [ ! -d "$PROJECT_DIR" ]; then
        log "${BLUE}[INIT] Cloning repository...${NC}"
        mkdir -p "$(dirname "$PROJECT_DIR")"
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
    
    # 创建必要的目录
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    try {
        create_backup
        pull_updates
        install_dependencies
        generate_site
        deploy_site
        restart_services
        
        send_notification "成功" "博客已成功更新并部署"
        log "${GREEN}=== Blog auto-sync completed successfully ===${NC}"
        
    } catch {
        local error_msg="同步过程中发生错误: $1"
        log "${RED}[ERROR] $error_msg${NC}"
        send_notification "失败" "$error_msg"
        exit 1
    }
}

# 错误处理
try() {
    "$@"
}

catch() {
    case $? in
        0) ;;  # 成功，什么都不做
        *) "$@" ;;  # 执行错误处理
    esac
}

# 显示帮助信息
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --force    Force sync even if lock file exists"
    echo "  -n, --no-backup Skip backup creation"
    echo ""
    echo "Environment variables:"
    echo "  DINGTALK_WEBHOOK   钉钉机器人Webhook URL"
    echo "  SLACK_WEBHOOK      Slack Webhook URL"
}

# 处理命令行参数
FORCE_SYNC=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE_SYNC=true
            shift
            ;;
        -n|--no-backup)
            SKIP_BACKUP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# 如果强制同步，删除锁文件
if [ "$FORCE_SYNC" = true ]; then
    rm -f "$LOCK_FILE"
fi

# 运行主函数
main
