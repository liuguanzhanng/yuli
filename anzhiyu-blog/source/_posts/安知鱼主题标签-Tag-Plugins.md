---
ai: true
categories:
- 技巧
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80
date: 2023-06-01
description: AnZhiYu主题中大部分标签移植于店长的hexo-butterfly-tag-plugins-plus，转载请注明来自安知鱼
swiper_index: 1
tags:
- Hexo
- Tag Plugins
title: 安知鱼主题标签 Tag Plugins
top_group_index: 1
top_img: https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80
updated: 2023-09-02
---

# Hexo Tag Plugins

AnZhiYu主题中大部分标签移植于店长的hexo-butterfly-tag-plugins-plus，转载请注明来自安知鱼

## 段落文本 p标签

### 语法

```
{% p 样式参数(参数以空格划分), 文本内容 %}
```

### 配置参数

- 字体: logo, code
- 颜色: red,yellow,green,cyan,blue,gray
- 大小: small, h4, h3, h2, h1, large, huge, ultra
- 对齐方向: left, center, right

### 样式预览

{% p red, 彩色文字 %}在一段话中方便插入各种颜色的标签，包括：{% p red, 红色 %}、{% p yellow, 黄色 %}、{% p green, 绿色 %}、{% p cyan, 青色 %}、{% p blue, 蓝色 %}、{% p gray, 灰色 %}。

{% p h1 center logo, 超大号文字 %}

文档「开始」页面中的标题部分就是超大号文字。

{% p center logo large, Volantis %}
{% p center small, A Wonderful Theme for Hexo %}
