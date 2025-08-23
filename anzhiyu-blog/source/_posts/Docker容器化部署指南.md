---
ai: true
categories:
- 工具
cover: https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=2076&q=80
date: 2025-04-16
description: Docker 容器化部署完整指南，从入门到实战
tags:
- Docker
- 部署
- 容器化
title: Docker 容器化部署指南
top_group_index: 13
top_img: https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2088&q=80
updated: 2025-04-16
---

# Docker 容器化部署指南

Docker 是现代应用部署的标准工具，让我们一起学习如何使用它。

## Docker 基础概念

### 镜像 (Image)
应用程序的只读模板，包含运行应用所需的所有内容。

### 容器 (Container)
镜像的运行实例，是应用程序的实际运行环境。

### Dockerfile
用于构建镜像的文本文件，包含一系列指令。

## 常用命令

### 镜像操作
```bash
# 拉取镜像
docker pull nginx:latest

# 查看镜像
docker images

# 删除镜像
docker rmi image_id
```

### 容器操作
```bash
# 运行容器
docker run -d -p 80:80 nginx

# 查看容器
docker ps

# 停止容器
docker stop container_id

# 删除容器
docker rm container_id
```

## 实战案例：部署 Node.js 应用

### 1. 创建 Dockerfile
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 构建镜像
```bash
docker build -t my-node-app .
```

### 3. 运行容器
```bash
docker run -d -p 3000:3000 my-node-app
```

## Docker Compose

对于多容器应用，使用 Docker Compose：

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: password
```

Docker 让部署变得简单可靠！
