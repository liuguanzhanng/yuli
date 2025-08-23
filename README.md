# 郁离的博客

基于 Hexo + AnZhiYu 主题的个人博客

## 项目简介

这是一个使用 Hexo 静态博客生成器和 AnZhiYu 主题构建的个人博客网站。

- **博客标题**: 郁离的博客
- **副标题**: 生活明朗，万物可爱
- **主题**: AnZhiYu
- **生成器**: Hexo 7.3.0
- **仓库地址**: https://github.com/liuguanzhanng/yuli

## 功能特性

- 📝 文章发布与管理
- 🏷️ 标签和分类系统
- 🔍 全站搜索功能
- 💬 留言板功能
- 📺 追番列表
- 🎵 音乐播放器支持

## 本地开发

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn
- Git

### 克隆项目

```bash
git clone https://github.com/liuguanzhanng/yuli.git
cd yuli
```

### 安装依赖

```bash
cd anzhiyu-blog
npm install
```

### 本地预览

```bash
# 启动本地服务器
npm run server

# 清理缓存
npm run clean

# 生成静态文件
npm run build
```

### 新建文章

```bash
cd anzhiyu-blog
hexo new post "文章标题"
```

## GitHub同步工作流

### 🔄 使用同步脚本（推荐）

项目提供了便捷的同步脚本 `sync-blog.bat`：

```bash
# 推送本地更改到GitHub
sync-blog.bat push

# 从GitHub拉取最新配置
sync-blog.bat pull

# 部署博客（生成静态文件）
sync-blog.bat deploy

# 创建配置备份
sync-blog.bat backup

# 执行完整同步（备份+拉取+部署）
sync-blog.bat all
```

### 📝 手动同步流程

#### 1. 本地开发和修改

```bash
# 进入博客目录
cd anzhiyu-blog

# 新建文章
hexo new post "新文章标题"

# 编辑配置文件
# 修改 _config.yml 或 _config.anzhiyu.yml

# 本地预览
npm run server
```

#### 2. 提交更改到GitHub

```bash
# 返回项目根目录
cd ..

# 查看更改状态
git status

# 添加所有更改
git add .

# 提交更改
git commit -m "更新博客内容和配置"

# 推送到GitHub
git push origin master
```

#### 3. 服务器端同步

在服务器上执行：

```bash
# 拉取最新更改
git pull origin master

# 进入博客目录
cd anzhiyu-blog

# 安装新依赖（如果有）
npm install

# 清理缓存
npm run clean

# 生成静态文件
npm run build

# 重启服务（如果需要）
# 例如：pm2 restart blog
```

## 🗂️ 项目结构

```
yuli/
├── anzhiyu-blog/           # Hexo博客主目录
│   ├── _config.yml         # Hexo主配置文件
│   ├── _config.anzhiyu.yml # AnZhiYu主题配置
│   ├── source/             # 源文件目录
│   │   ├── _posts/         # 文章目录
│   │   └── _data/          # 数据文件
│   ├── themes/             # 主题目录
│   │   └── anzhiyu/        # AnZhiYu主题
│   ├── public/             # 生成的静态文件（被忽略）
│   └── package.json        # 依赖配置
├── backup/                 # 备份目录（自动创建）
├── sync-blog.bat          # Windows同步脚本
├── .gitignore             # Git忽略文件
└── README.md              # 项目说明
```

## ⚙️ 配置文件说明

### 主要配置文件

- **`anzhiyu-blog/_config.yml`**: Hexo核心配置
  - 网站基本信息
  - URL配置
  - 目录结构
  - 插件配置

- **`anzhiyu-blog/_config.anzhiyu.yml`**: AnZhiYu主题配置
  - 主题外观设置
  - 功能开关
  - 第三方服务集成

### 重要配置项

```yaml
# _config.yml 中的重要配置
title: 郁离的博客
subtitle: '生活明朗，万物可爱'
description: '一个分享前端知识与代码设计生活的博客'
url: http://example.com  # 修改为你的域名
theme: anzhiyu

# 部署配置
deploy:
  type: ''  # 根据需要配置部署方式
```

## 🚀 部署方案

### 1. 静态文件部署

```bash
# 生成静态文件
cd anzhiyu-blog
npm run build

# 将 public/ 目录内容部署到服务器
# 可以使用 rsync, scp, 或其他工具
```

### 2. 自动化部署

可以配置GitHub Actions或其他CI/CD工具实现自动部署：

1. 当推送到GitHub时自动触发
2. 在服务器上拉取最新代码
3. 自动生成静态文件
4. 部署到Web服务器

## 🔧 常见问题

### Q: 如何添加新文章？

```bash
cd anzhiyu-blog
hexo new post "文章标题"
# 编辑生成的 .md 文件
# 提交并推送到GitHub
```

### Q: 如何修改主题配置？

1. 编辑 `anzhiyu-blog/_config.anzhiyu.yml`
2. 本地测试：`npm run server`
3. 提交更改：`git add . && git commit -m "更新主题配置"`
4. 推送：`git push origin master`

### Q: 如何在多台设备间同步？

1. 在新设备上克隆仓库：`git clone https://github.com/liuguanzhanng/yuli.git`
2. 安装依赖：`cd yuli/anzhiyu-blog && npm install`
3. 开始使用同步脚本进行日常操作

### Q: 如何备份重要数据？

使用同步脚本的备份功能：
```bash
sync-blog.bat backup
```

或手动备份重要目录：
- `anzhiyu-blog/source/_posts/` (文章)
- `anzhiyu-blog/_config*.yml` (配置文件)
- `anzhiyu-blog/source/_data/` (数据文件)

## 📞 技术支持

如果遇到问题，可以：

1. 查看 [Hexo官方文档](https://hexo.io/docs/)
2. 查看 [AnZhiYu主题文档](https://github.com/anzhiyu-c/hexo-theme-anzhiyu)
3. 在GitHub仓库中提交Issue

## 许可证

MIT License
