---
ai: true
categories:
- 前端
- 开发
cover: https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80
date: 2023-08-27
description: 嵌套的圆角在遇到内外两层圆角时，可以通过 CSS 变量动态去计算内部的圆角，看起来会更加和谐
tags:
- 前端
- 开发
- css3
title: 那些年用过的CSS奇妙用法之能用CSS就不用JS技巧系列
top_img: https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80
updated: 2023-09-09
---

## 嵌套的圆角

在遇到内外两层圆角时，可以通过 CSS 变量动态去计算内部的圆角，看起来会更加和谐

### 核心代码

```css
.parent {
  --anzhiyu-nested-radius: calc(var(--radius) - var(--padding));
}
.nested {
  border-radius: var(--anzhiyu-nested-radius);
}
```

《css嵌套的圆角》在线运行[1024code](https://1024code.com/)

## 视图转换动画 View Transitions API

我们先从一个简单的例子来认识一下。

```html
<div class="list" id="list">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
  <div class="item">4</div>
  <div class="item">5</div>
</div>
```

这个API可以让我们在页面切换时实现平滑的过渡动画，提升用户体验。
