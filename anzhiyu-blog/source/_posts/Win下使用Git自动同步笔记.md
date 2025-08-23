---
ai: true
categories:
- 工具
cover: https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80
date: 2025-04-18
description: 折腾了很久要记录系统，发现还是大道至简，回归日记 Typora + MarkDown
swiper_index: 6
tags:
- Git
- 工具
- 自动化
title: Win 下使用 Git 自动同步笔记
top_group_index: 7
top_img: https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=2086&q=80
updated: 2025-04-18
---

# Win 下使用 Git 自动同步笔记

折腾了很久要记录系统，发现还是大道至简，回归日记 Typora + MarkDown。

## 为什么选择 Git + Markdown

在尝试了各种笔记软件后，我发现最简单的方案往往是最好的：

- **Typora**: 优雅的 Markdown 编辑器
- **Git**: 强大的版本控制
- **GitHub/Gitee**: 云端同步

## 自动同步脚本

创建一个批处理文件来自动同步：

```batch
@echo off
cd /d "D:\Notes"
git add .
git commit -m "Auto sync: %date% %time%"
git push origin main
echo 同步完成！
pause
```

## 定时任务设置

使用 Windows 任务计划程序设置定时同步：

1. 打开任务计划程序
2. 创建基本任务
3. 设置触发器（每天/每小时）
4. 设置操作为运行批处理文件

这样就能实现笔记的自动同步了！
