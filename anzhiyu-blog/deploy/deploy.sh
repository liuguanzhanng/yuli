#!/bin/bash

# Xing Blog 部署脚本
# 使用方法: ./deploy.sh [your-server-ip] [your-username]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP=${1:-"your-server-ip"}
USERNAME=${2:-"root"}
REMOTE_PATH="/var/www/xing-blog"
LOCAL_PUBLIC_PATH="../public"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/xing-blog"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/xing-blog"

echo -e "${BLUE}🚀 开始部署 Xing Blog...${NC}"

# 检查参数
if [ "$SERVER_IP" = "your-server-ip" ]; then
    echo -e "${RED}❌ 请提供服务器IP地址${NC}"
    echo -e "${YELLOW}使用方法: ./deploy.sh [服务器IP] [用户名]${NC}"
    exit 1
fi

# 检查本地public目录
if [ ! -d "$LOCAL_PUBLIC_PATH" ]; then
    echo -e "${RED}❌ 找不到public目录，请先运行 hexo generate${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 部署配置:${NC}"
echo -e "  服务器: ${SERVER_IP}"
echo -e "  用户名: ${USERNAME}"
echo -e "  远程路径: ${REMOTE_PATH}"

# 确认部署
read -p "确认部署? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  部署已取消${NC}"
    exit 0
fi

echo -e "${BLUE}📦 1. 创建部署包...${NC}"
cd ..
tar -czf xing-blog-$(date +%Y%m%d-%H%M%S).tar.gz public/
PACKAGE_NAME=$(ls xing-blog-*.tar.gz | tail -1)
echo -e "${GREEN}✅ 部署包创建完成: ${PACKAGE_NAME}${NC}"

echo -e "${BLUE}📤 2. 上传文件到服务器...${NC}"
scp "$PACKAGE_NAME" "${USERNAME}@${SERVER_IP}:/tmp/"
scp deploy/nginx.conf "${USERNAME}@${SERVER_IP}:/tmp/"

echo -e "${BLUE}🔧 3. 在服务器上部署...${NC}"
ssh "${USERNAME}@${SERVER_IP}" << EOF
    set -e
    
    echo "创建网站目录..."
    sudo mkdir -p ${REMOTE_PATH}
    
    echo "备份旧版本..."
    if [ -d "${REMOTE_PATH}/backup" ]; then
        sudo rm -rf ${REMOTE_PATH}/backup
    fi
    if [ -d "${REMOTE_PATH}" ] && [ "\$(ls -A ${REMOTE_PATH})" ]; then
        sudo mkdir -p ${REMOTE_PATH}/backup
        sudo cp -r ${REMOTE_PATH}/* ${REMOTE_PATH}/backup/ 2>/dev/null || true
    fi
    
    echo "解压新版本..."
    cd /tmp
    tar -xzf ${PACKAGE_NAME}
    sudo rm -rf ${REMOTE_PATH}/*
    sudo cp -r public/* ${REMOTE_PATH}/
    sudo chown -R www-data:www-data ${REMOTE_PATH}
    sudo chmod -R 755 ${REMOTE_PATH}
    
    echo "配置Nginx..."
    sudo cp nginx.conf ${NGINX_CONFIG_PATH}
    sudo ln -sf ${NGINX_CONFIG_PATH} ${NGINX_ENABLED_PATH}
    
    echo "测试Nginx配置..."
    sudo nginx -t
    
    echo "重启Nginx..."
    sudo systemctl reload nginx
    
    echo "清理临时文件..."
    rm -f ${PACKAGE_NAME} nginx.conf
    
    echo "部署完成！"
EOF

echo -e "${BLUE}🧹 4. 清理本地临时文件...${NC}"
rm -f "$PACKAGE_NAME"

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${YELLOW}📝 后续步骤:${NC}"
echo -e "  1. 确保防火墙开放80端口: sudo ufw allow 80"
echo -e "  2. 如需HTTPS，请配置SSL证书"
echo -e "  3. 修改nginx.conf中的域名配置"
echo -e "  4. 访问: http://${SERVER_IP}"
