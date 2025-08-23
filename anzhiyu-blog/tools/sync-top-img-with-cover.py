#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import random
import yaml
from pathlib import Path

# 顶部图与封面图的适配方案
# 根据封面图的主题，选择相应的顶部图
TOP_IMG_MAPPING = {
    # 技术开发类 - 深色科技风
    'tech': [
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
        'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    
    # 设计创意类 - 创意渐变风
    'design': [
        'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    ],
    
    # 生活日常类 - 自然温馨风
    'life': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ],
    
    # 学习阅读类 - 知识书香风
    'study': [
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=2086&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
    ],
    
    # 网络安全类 - 深色科技风
    'security': [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #434343 0%, #000000 100%)'
    ],
    
    # 音乐艺术类 - 艺术渐变风
    'music': [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ],
    
    # 工具软件类 - 现代简洁风
    'tools': [
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2088&q=80',
        'https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=2076&q=80',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
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

def get_matching_top_img(theme):
    """根据主题获取匹配的顶部图"""
    top_imgs = TOP_IMG_MAPPING.get(theme, TOP_IMG_MAPPING['tech'])
    return random.choice(top_imgs)

def process_article(file_path, force_update=False):
    """处理单个文章文件，同步顶部图与封面图"""
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
        
        # 检查是否有封面图
        if not front_matter.get('cover'):
            print(f"⚠️  跳过文件 {file_path.name} - 没有封面图")
            return False
        
        # 检查是否已有顶部图（如果不强制更新）
        if front_matter.get('top_img') and not force_update:
            print(f"✅ 文件 {file_path.name} 已有顶部图，跳过")
            return False
        
        # 判断文章主题
        theme = get_article_theme(front_matter, article_content)
        
        # 获取匹配的顶部图
        new_top_img = get_matching_top_img(theme)
        
        # 添加或更新顶部图到 front-matter
        front_matter['top_img'] = new_top_img
        
        # 重新生成文件内容
        new_front_matter = yaml.dump(front_matter, default_flow_style=False, allow_unicode=True)
        new_content = f"---\n{new_front_matter}---\n{article_content}"
        
        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        if force_update:
            print(f"🔄 已更新 {file_path.name} 的 {theme} 主题顶部图")
        else:
            print(f"🎨 已为 {file_path.name} 添加 {theme} 主题顶部图")
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
        print('🔄 强制更新模式：将为所有文章重新配置顶部图以适配封面图...\n')
    else:
        print('🚀 开始为博客文章配置适配封面图的顶部图...\n')
    
    md_files = [f for f in posts_dir.glob('*.md') if f.name != '".md']
    
    processed_count = 0
    skipped_count = 0
    
    for file_path in md_files:
        processed = process_article(file_path, force_update=force_update)
        
        if processed:
            processed_count += 1
        else:
            skipped_count += 1
    
    print('\n📊 处理完成统计:')
    print(f'✅ 已处理: {processed_count} 篇文章')
    print(f'⏭️  已跳过: {skipped_count} 篇文章')
    print(f'📝 总计: {len(md_files)} 篇文章')
    
    if processed_count > 0:
        print('\n🎉 顶部图适配完成！请重启 Hexo 服务器查看效果。')
        print('💡 提示: 运行 "hexo server" 重新启动服务器')
    
    if not force_update and skipped_count > 0:
        print('\n💡 如果想要更新现有顶部图，请使用: python tools/sync-top-img-with-cover.py --force')

if __name__ == '__main__':
    main()
