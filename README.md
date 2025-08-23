# 郁离的博客

基于 Hexo + AnZhiYu 主题的个人博客

## 项目简介

这是一个使用 Hexo 静态博客生成器和 AnZhiYu 主题构建的个人博客网站。

- **博客标题**: 郁离的博客
- **副标题**: 生活明朗，万物可爱
- **主题**: AnZhiYu
- **生成器**: Hexo 7.3.0

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

## 部署

### 自动化部署脚本

项目包含自动化部署脚本，支持：
- 本地到服务器的文件同步
- 自动备份
- Git版本控制

### 手动部署

```bash
# 生成静态文件
npm run build

# 部署到服务器
npm run deploy
```

## 配置文件说明

- `_config.yml`: Hexo主配置文件
- `_config.anzhiyu.yml`: AnZhiYu主题配置文件
- `package.json`: 项目依赖和脚本配置

## 同步说明

本项目使用GitHub进行版本控制和配置同步：

1. **本地开发**: 在本地进行文章编写和配置修改
2. **提交更改**: 使用Git提交更改到GitHub仓库
3. **服务器同步**: 服务器端从GitHub拉取最新配置

## 许可证

MIT License
