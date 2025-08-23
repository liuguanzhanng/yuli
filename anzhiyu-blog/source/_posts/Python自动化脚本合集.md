---
ai: true
categories:
- 工具
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80
date: 2025-04-18
description: 收集了一些实用的 Python 自动化脚本，帮你提高工作效率
swiper_index: 7
tags:
- Python
- 自动化
- 脚本
title: Python 自动化脚本合集
top_img: https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2088&q=80
updated: 2025-04-18
---

# Python 自动化脚本合集

Python 的强大之处在于能够快速编写自动化脚本，解决日常工作中的重复性任务。

## 文件处理脚本

### 批量重命名文件
```python
import os
import re

def batch_rename(directory, pattern, replacement):
    for filename in os.listdir(directory):
        if re.search(pattern, filename):
            new_name = re.sub(pattern, replacement, filename)
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_name)
            os.rename(old_path, new_path)
            print(f"重命名: {filename} -> {new_name}")
```

### 文件分类整理
```python
import shutil
import os

def organize_files(source_dir):
    extensions = {
        'images': ['.jpg', '.jpeg', '.png', '.gif'],
        'documents': ['.pdf', '.doc', '.docx', '.txt'],
        'videos': ['.mp4', '.avi', '.mkv'],
        'music': ['.mp3', '.wav', '.flac']
    }
    
    for filename in os.listdir(source_dir):
        file_ext = os.path.splitext(filename)[1].lower()
        for folder, exts in extensions.items():
            if file_ext in exts:
                dest_dir = os.path.join(source_dir, folder)
                os.makedirs(dest_dir, exist_ok=True)
                shutil.move(
                    os.path.join(source_dir, filename),
                    os.path.join(dest_dir, filename)
                )
                break
```

## 网络爬虫脚本

### 简单网页内容抓取
```python
import requests
from bs4 import BeautifulSoup

def scrape_website(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # 提取标题
    title = soup.find('title').text
    
    # 提取所有链接
    links = [a.get('href') for a in soup.find_all('a', href=True)]
    
    return title, links
```

## 数据处理脚本

### Excel 数据处理
```python
import pandas as pd

def process_excel(file_path):
    df = pd.read_excel(file_path)
    
    # 数据清洗
    df = df.dropna()  # 删除空值
    df = df.drop_duplicates()  # 删除重复值
    
    # 数据分析
    summary = df.describe()
    
    return df, summary
```

这些脚本可以大大提高日常工作效率，让重复性任务自动化！
