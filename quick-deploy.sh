#!/bin/bash

# 快速部署脚本 - 一键配置GitHub Actions自动部署
# 使用方法: ./quick-deploy.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 配置变量
SERVER_IP="74.48.157.54"
SSH_USER="deploy"
SSH_PORT="22"
TARGET_DIR="/var/www/blog"

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示欢迎信息
show_welcome() {
    echo ""
    echo -e "${GREEN}🚀 GitHub Actions 自动部署配置工具${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    echo "此脚本将帮助您："
    echo "✅ 生成SSH密钥对"
    echo "✅ 配置服务器SSH访问"
    echo "✅ 提供GitHub Secrets配置信息"
    echo "✅ 测试部署连接"
    echo ""
}

# 检查依赖
check_dependencies() {
    log_step "检查依赖工具..."
    
    local missing_tools=()
    
    if ! command -v ssh &> /dev/null; then
        missing_tools+=("ssh")
    fi
    
    if ! command -v ssh-keygen &> /dev/null; then
        missing_tools+=("ssh-keygen")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        log_info "请安装缺少的工具后重新运行脚本"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 生成SSH密钥
generate_ssh_key() {
    log_step "生成SSH密钥对..."
    
    local key_file="$HOME/.ssh/id_rsa_blog_deploy"
    
    if [ -f "$key_file" ]; then
        log_warning "SSH密钥已存在: $key_file"
        read -p "是否重新生成？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "使用现有SSH密钥"
            return 0
        fi
    fi
    
    ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f "$key_file" -N ""
    
    if [ $? -eq 0 ]; then
        log_success "SSH密钥生成完成"
        echo "  私钥: $key_file"
        echo "  公钥: $key_file.pub"
    else
        log_error "SSH密钥生成失败"
        exit 1
    fi
}

# 配置服务器SSH访问
configure_server_ssh() {
    log_step "配置服务器SSH访问..."
    
    local key_file="$HOME/.ssh/id_rsa_blog_deploy"
    local pub_key_content=$(cat "$key_file.pub")
    
    log_info "正在连接服务器配置SSH访问..."
    
    # 创建临时脚本
    local temp_script=$(mktemp)
    cat > "$temp_script" << EOF
#!/bin/bash
# 创建deploy用户（如果不存在）
if ! id deploy &>/dev/null; then
    sudo useradd -m -s /bin/bash deploy
    echo "用户deploy创建完成"
fi

# 创建SSH目录
sudo mkdir -p /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

# 添加公钥
echo "$pub_key_content" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 创建网站目录
sudo mkdir -p $TARGET_DIR
sudo chown deploy:deploy $TARGET_DIR
sudo chmod 755 $TARGET_DIR

echo "SSH配置完成"
EOF
    
    # 上传并执行脚本
    scp "$temp_script" "root@$SERVER_IP:/tmp/setup_deploy.sh"
    ssh "root@$SERVER_IP" "chmod +x /tmp/setup_deploy.sh && /tmp/setup_deploy.sh"
    
    # 清理临时文件
    rm "$temp_script"
    ssh "root@$SERVER_IP" "rm /tmp/setup_deploy.sh"
    
    log_success "服务器SSH配置完成"
}

# 测试SSH连接
test_ssh_connection() {
    log_step "测试SSH连接..."
    
    local key_file="$HOME/.ssh/id_rsa_blog_deploy"
    
    if ssh -i "$key_file" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "echo 'SSH连接测试成功'" 2>/dev/null; then
        log_success "SSH连接测试通过"
        return 0
    else
        log_error "SSH连接测试失败"
        return 1
    fi
}

# 显示GitHub Secrets配置信息
show_github_secrets() {
    log_step "GitHub Secrets 配置信息"
    
    local key_file="$HOME/.ssh/id_rsa_blog_deploy"
    
    echo ""
    echo -e "${GREEN}📋 请在GitHub仓库中配置以下Secrets:${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    echo -e "${YELLOW}SSH_HOST:${NC}"
    echo "$SERVER_IP"
    echo ""
    
    echo -e "${YELLOW}SSH_USER:${NC}"
    echo "$SSH_USER"
    echo ""
    
    echo -e "${YELLOW}SSH_PORT:${NC}"
    echo "$SSH_PORT"
    echo ""
    
    echo -e "${YELLOW}TARGET_DIR:${NC}"
    echo "$TARGET_DIR"
    echo ""
    
    echo -e "${YELLOW}SSH_PRIVATE_KEY:${NC}"
    echo "$(cat $key_file)"
    echo ""
    
    echo -e "${BLUE}================================================${NC}"
    echo ""
    echo -e "${GREEN}🔧 配置步骤:${NC}"
    echo "1. 打开GitHub仓库 → Settings → Secrets and variables → Actions"
    echo "2. 点击 'New repository secret'"
    echo "3. 依次添加上述5个secrets"
    echo "4. 推送代码测试自动部署"
    echo ""
}

# 创建测试提交
create_test_commit() {
    log_step "创建测试提交..."
    
    if [ ! -d ".git" ]; then
        log_warning "当前目录不是Git仓库"
        return 1
    fi
    
    # 创建测试文件
    local test_file="deployment-test-$(date +%Y%m%d-%H%M%S).md"
    cat > "$test_file" << EOF
# 部署测试

这是一个自动部署测试文件。

- 创建时间: $(date)
- 部署方式: GitHub Actions
- 目标服务器: $SERVER_IP

## 测试内容

如果您能看到这个文件，说明自动部署配置成功！

EOF
    
    git add "$test_file"
    git commit -m "test: 添加自动部署测试文件"
    
    log_success "测试提交创建完成"
    log_info "运行 'git push origin main' 来触发自动部署"
}

# 显示完成信息
show_completion() {
    echo ""
    echo -e "${GREEN}🎉 配置完成！${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    echo -e "${GREEN}✅ 已完成的配置:${NC}"
    echo "  • SSH密钥对生成"
    echo "  • 服务器SSH访问配置"
    echo "  • 部署用户和目录创建"
    echo "  • SSH连接测试"
    echo ""
    echo -e "${YELLOW}📝 下一步操作:${NC}"
    echo "  1. 复制上面的GitHub Secrets配置信息"
    echo "  2. 在GitHub仓库中添加这些Secrets"
    echo "  3. 推送代码测试自动部署"
    echo ""
    echo -e "${BLUE}🌐 部署完成后访问地址:${NC}"
    echo "  http://$SERVER_IP"
    echo ""
    echo -e "${PURPLE}💡 提示:${NC}"
    echo "  • 查看部署状态: GitHub仓库 → Actions"
    echo "  • 服务器日志: ssh $SSH_USER@$SERVER_IP 'tail -f /var/log/nginx/access.log'"
    echo "  • 如有问题，请查看 GITHUB_SECRETS_SETUP.md 文档"
    echo ""
}

# 主函数
main() {
    show_welcome
    
    # 确认继续
    read -p "是否继续配置？(Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log_info "配置已取消"
        exit 0
    fi
    
    check_dependencies
    generate_ssh_key
    
    log_info "即将配置服务器，需要root权限..."
    configure_server_ssh
    
    if test_ssh_connection; then
        show_github_secrets
        
        # 询问是否创建测试提交
        read -p "是否创建测试提交？(Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            create_test_commit
        fi
        
        show_completion
    else
        log_error "配置失败，请检查服务器连接和权限"
        exit 1
    fi
}

# 运行主函数
main "$@"
