#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import random
import yaml
from pathlib import Path

# 高质量封面图片库，按主题分类
COVER_IMAGES = {
    # 技术开发类
    'tech': [
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
        'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1551033406-611cf9a28f67?ixlib=rb-4.0.3&auto=format&fit=crop&w=2067&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 设计创意类
    'design': [
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80',
        'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 生活日常类
    'life': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 学习阅读类
    'study': [
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=2086&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 网络安全类
    'security': [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 音乐艺术类
    'music': [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 工具软件类
    'tools': [
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2088&q=80',
        'https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=2076&q=80',
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80'
    ]
}

def get_article_theme(front_matter, content):
    """根据文章内容判断主题类型"""
    title = front_matter.get('title', '').lower()
    tags = front_matter.get('tags', [])
    categories = front_matter.get('categories', [])
    description = front_matter.get('description', '').lower()
    
    # 转换为字符串进行匹配
    if isinstance(tags, list):
        tags_str = ' '.join(str(tag).lower() for tag in tags)
    else:
        tags_str = str(tags).lower()
        
    if isinstance(categories, list):
        categories_str = ' '.join(str(cat).lower() for cat in categories)
    else:
        categories_str = str(categories).lower()
    
    all_text = f"{title} {description} {tags_str} {categories_str}"
    
    # 网络安全类
    if any(keyword in all_text for keyword in ['安全', '攻击', 'cdn', '网络']):
        return 'security'
    
    # 设计创意类
    if any(keyword in all_text for keyword in ['设计', 'logo', 'ai', 'ps', '图标']):
        return 'design'
    
    # 音乐类
    if any(keyword in all_text for keyword in ['音乐', 'meting', 'api']):
        return 'music'
    
    # 学习阅读类
    if any(keyword in all_text for keyword in ['读书', '笔记', '学习']):
        return 'study'
    
    # 生活类
    if any(keyword in all_text for keyword in ['生活', '旅行', '摄影', '确幸', '游记']):
        return 'life'
    
    # 工具类
    if any(keyword in all_text for keyword in ['工具', 'vscode', 'git', 'github']):
        return 'tools'
    
    # 默认为技术类
    return 'tech'

def get_random_image(theme):
    """随机选择图片"""
    images = COVER_IMAGES.get(theme, COVER_IMAGES['tech'])
    return random.choice(images)

def process_article(file_path):
    """处理单个文章文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 分离 front-matter 和内容
        front_matter_match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
        if not front_matter_match:
            print(f"⚠️  跳过文件 {file_path.name} - 没有找到有效的 front-matter")
            return False
        
        front_matter_str = front_matter_match.group(1)
        article_content = front_matter_match.group(2)
        
        # 解析 front-matter
        front_matter = yaml.safe_load(front_matter_str)
        
        # 检查是否已有封面
        if front_matter.get('cover'):
            print(f"✅ 文件 {file_path.name} 已有封面，跳过")
            return False
        
        # 判断文章主题并选择合适的封面
        theme = get_article_theme(front_matter, article_content)
        new_cover = get_random_image(theme)
        
        # 添加封面到 front-matter
        front_matter['cover'] = new_cover
        
        # 重新生成文件内容
        new_front_matter = yaml.dump(front_matter, default_flow_style=False, allow_unicode=True)
        new_content = f"---\n{new_front_matter}---\n{article_content}"
        
        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"🎨 已为 {file_path.name} 添加 {theme} 主题封面")
        return True
        
    except Exception as error:
        print(f"❌ 处理文件 {file_path} 时出错: {error}")
        return False

def process_article_force(file_path, force_update=False):
    """处理单个文章文件（可强制更新）"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 分离 front-matter 和内容
        front_matter_match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
        if not front_matter_match:
            print(f"⚠️  跳过文件 {file_path.name} - 没有找到有效的 front-matter")
            return False

        front_matter_str = front_matter_match.group(1)
        article_content = front_matter_match.group(2)

        # 解析 front-matter
        front_matter = yaml.safe_load(front_matter_str)

        # 检查是否已有封面（如果不强制更新）
        if front_matter.get('cover') and not force_update:
            print(f"✅ 文件 {file_path.name} 已有封面，跳过")
            return False

        # 判断文章主题并选择合适的封面
        theme = get_article_theme(front_matter, article_content)
        new_cover = get_random_image(theme)

        # 添加或更新封面到 front-matter
        old_cover = front_matter.get('cover', '无')
        front_matter['cover'] = new_cover

        # 重新生成文件内容
        new_front_matter = yaml.dump(front_matter, default_flow_style=False, allow_unicode=True)
        new_content = f"---\n{new_front_matter}---\n{article_content}"

        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        if force_update:
            print(f"🔄 已更新 {file_path.name} 的 {theme} 主题封面")
        else:
            print(f"🎨 已为 {file_path.name} 添加 {theme} 主题封面")
        return True

    except Exception as error:
        print(f"❌ 处理文件 {file_path} 时出错: {error}")
        return False

def main():
    """主函数"""
    import sys

    posts_dir = Path('source/_posts')

    if not posts_dir.exists():
        print('❌ 找不到 source/_posts 目录')
        return

    # 检查命令行参数
    force_update = '--force' in sys.argv or '-f' in sys.argv

    if force_update:
        print('🔄 强制更新模式：将为所有文章重新配置封面图片...\n')
    else:
        print('🚀 开始为博客文章配置封面图片...\n')

    md_files = [f for f in posts_dir.glob('*.md') if f.name != '".md']

    processed_count = 0
    skipped_count = 0

    for file_path in md_files:
        if force_update:
            processed = process_article_force(file_path, force_update=True)
        else:
            processed = process_article(file_path)

        if processed:
            processed_count += 1
        else:
            skipped_count += 1

    print('\n📊 处理完成统计:')
    print(f'✅ 已处理: {processed_count} 篇文章')
    print(f'⏭️  已跳过: {skipped_count} 篇文章')
    print(f'📝 总计: {len(md_files)} 篇文章')

    if processed_count > 0:
        print('\n🎉 封面配置完成！请重启 Hexo 服务器查看效果。')
        print('💡 提示: 运行 "hexo server" 重新启动服务器')

    if not force_update and skipped_count > 0:
        print('\n💡 如果想要更新现有封面，请使用: python scripts/update_covers.py --force')

if __name__ == '__main__':
    main()
