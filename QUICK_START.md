# 博客GitHub同步快速开始指南

## 🚀 快速开始

### 1. 克隆项目到本地

```bash
git clone https://github.com/liuguanzhanng/yuli.git
cd yuli
```

### 2. 安装依赖

```bash
cd anzhiyu-blog
npm install
cd ..
```

### 3. 使用同步脚本

#### Windows PowerShell (推荐)

```powershell
# 查看帮助
.\sync.ps1 help

# 推送更改到GitHub
.\sync.ps1 push

# 从GitHub拉取最新配置
.\sync.ps1 pull

# 部署博客（生成静态文件）
.\sync.ps1 deploy

# 创建备份
.\sync.ps1 backup

# 完整同步（备份+拉取+部署）
.\sync.ps1 all
```

#### Windows 批处理

```cmd
# 查看帮助
.\sync-blog.bat help

# 推送更改
.\sync-blog.bat push

# 拉取更改
.\sync-blog.bat pull
```

## 📝 日常使用流程

### 写新文章

1. **创建新文章**
   ```bash
   cd anzhiyu-blog
   hexo new post "文章标题"
   ```

2. **编辑文章**
   - 在 `anzhiyu-blog/source/_posts/` 目录下编辑生成的 `.md` 文件

3. **本地预览**
   ```bash
   npm run server
   # 访问 http://localhost:4000
   ```

4. **推送到GitHub**
   ```powershell
   cd ..
   .\sync.ps1 push
   ```

### 修改配置

1. **编辑配置文件**
   - 主配置：`anzhiyu-blog/_config.yml`
   - 主题配置：`anzhiyu-blog/_config.anzhiyu.yml`

2. **本地测试**
   ```bash
   cd anzhiyu-blog
   npm run server
   ```

3. **推送更改**
   ```powershell
   cd ..
   .\sync.ps1 push
   ```

### 服务器端同步

在服务器上执行：

```bash
# 拉取最新更改
git pull origin master

# 部署博客
cd anzhiyu-blog
npm install
npm run clean
npm run build

# 重启服务（如果需要）
# pm2 restart blog
```

## 🔧 常用命令

### Git 操作

```bash
# 查看状态
git status

# 查看更改
git diff

# 查看提交历史
git log --oneline

# 撤销未提交的更改
git checkout -- .
```

### Hexo 操作

```bash
cd anzhiyu-blog

# 新建文章
hexo new post "标题"

# 新建页面
hexo new page "页面名"

# 清理缓存
npm run clean

# 生成静态文件
npm run build

# 启动本地服务器
npm run server

# 部署（如果配置了）
npm run deploy
```

## 📁 重要目录说明

```
yuli/
├── anzhiyu-blog/
│   ├── source/_posts/      # 文章目录
│   ├── source/_data/       # 数据文件
│   ├── _config.yml         # Hexo配置
│   ├── _config.anzhiyu.yml # 主题配置
│   └── themes/anzhiyu/     # 主题文件
├── backup/                 # 自动备份目录
├── sync.ps1               # PowerShell同步脚本
├── sync-blog.bat          # 批处理同步脚本
└── README.md              # 详细说明文档
```

## ⚠️ 注意事项

1. **推送前先拉取**：在推送更改前，建议先执行 `.\sync.ps1 pull` 获取最新更改

2. **备份重要数据**：定期使用 `.\sync.ps1 backup` 创建备份

3. **测试后再推送**：修改配置后，先本地测试无误再推送

4. **避免直接编辑GitHub**：尽量在本地修改后推送，避免在GitHub网页上直接编辑

5. **处理冲突**：如果出现合并冲突，需要手动解决后再提交

## 🆘 故障排除

### 推送失败

```bash
# 检查远程仓库状态
git remote -v

# 强制推送（谨慎使用）
git push -f origin master
```

### 拉取失败

```bash
# 重置本地更改
git reset --hard HEAD

# 重新拉取
git pull origin master
```

### 依赖安装失败

```bash
cd anzhiyu-blog

# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules
npm install
```

## 📞 获取帮助

- 查看详细文档：[README.md](README.md)
- Hexo官方文档：https://hexo.io/docs/
- AnZhiYu主题文档：https://github.com/anzhiyu-c/hexo-theme-anzhiyu
