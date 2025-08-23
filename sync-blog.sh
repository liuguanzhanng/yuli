#!/bin/bash

# 博客同步脚本
# 用于同步本地和服务器端的博客配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
BLOG_DIR="anzhiyu-blog"
BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
REMOTE_NAME="origin"
BRANCH_NAME="main"

echo -e "${BLUE}=== 博客同步脚本 ===${NC}"

# 函数：显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -p, --push     推送到远程仓库"
    echo "  -l, --pull     从远程仓库拉取"
    echo "  -b, --backup   创建备份"
    echo "  -d, --deploy   部署博客"
    echo "  -a, --all      执行完整同步（备份+拉取+部署）"
    echo ""
    echo "示例:"
    echo "  $0 --push     # 推送本地更改到GitHub"
    echo "  $0 --pull     # 从GitHub拉取最新配置"
    echo "  $0 --all      # 执行完整同步流程"
}

# 函数：创建备份
create_backup() {
    echo -e "${YELLOW}创建备份...${NC}"
    if [ -d "$BLOG_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$BLOG_DIR"/_config*.yml "$BACKUP_DIR/" 2>/dev/null || true
        cp -r "$BLOG_DIR"/source "$BACKUP_DIR/" 2>/dev/null || true
        cp -r "$BLOG_DIR"/themes "$BACKUP_DIR/" 2>/dev/null || true
        echo -e "${GREEN}备份已创建: $BACKUP_DIR${NC}"
    else
        echo -e "${RED}错误: 博客目录不存在${NC}"
        exit 1
    fi
}

# 函数：推送到远程仓库
push_to_remote() {
    echo -e "${YELLOW}推送到远程仓库...${NC}"
    
    # 检查是否有更改
    if git diff --quiet && git diff --staged --quiet; then
        echo -e "${YELLOW}没有检测到更改${NC}"
        return 0
    fi
    
    # 添加所有更改
    git add .
    
    # 提交更改
    echo -n "请输入提交信息 (默认: 更新博客配置): "
    read commit_message
    if [ -z "$commit_message" ]; then
        commit_message="更新博客配置 - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git commit -m "$commit_message"
    
    # 推送到远程仓库
    git push "$REMOTE_NAME" "$BRANCH_NAME"
    echo -e "${GREEN}推送完成${NC}"
}

# 函数：从远程仓库拉取
pull_from_remote() {
    echo -e "${YELLOW}从远程仓库拉取...${NC}"
    
    # 检查是否有本地更改
    if ! git diff --quiet || ! git diff --staged --quiet; then
        echo -e "${RED}警告: 检测到本地未提交的更改${NC}"
        echo -e "${YELLOW}请先提交或暂存更改${NC}"
        return 1
    fi
    
    # 拉取最新更改
    git pull "$REMOTE_NAME" "$BRANCH_NAME"
    echo -e "${GREEN}拉取完成${NC}"
}

# 函数：部署博客
deploy_blog() {
    echo -e "${YELLOW}部署博客...${NC}"
    
    if [ -d "$BLOG_DIR" ]; then
        cd "$BLOG_DIR"
        
        # 安装依赖
        echo -e "${BLUE}安装依赖...${NC}"
        npm install
        
        # 清理缓存
        echo -e "${BLUE}清理缓存...${NC}"
        npm run clean
        
        # 生成静态文件
        echo -e "${BLUE}生成静态文件...${NC}"
        npm run build
        
        echo -e "${GREEN}博客部署完成${NC}"
        cd ..
    else
        echo -e "${RED}错误: 博客目录不存在${NC}"
        exit 1
    fi
}

# 函数：完整同步
full_sync() {
    echo -e "${BLUE}执行完整同步...${NC}"
    create_backup
    pull_from_remote
    deploy_blog
    echo -e "${GREEN}完整同步完成${NC}"
}

# 主逻辑
case "$1" in
    -h|--help)
        show_help
        ;;
    -p|--push)
        push_to_remote
        ;;
    -l|--pull)
        pull_from_remote
        ;;
    -b|--backup)
        create_backup
        ;;
    -d|--deploy)
        deploy_blog
        ;;
    -a|--all)
        full_sync
        ;;
    *)
        echo -e "${RED}错误: 未知选项 '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
