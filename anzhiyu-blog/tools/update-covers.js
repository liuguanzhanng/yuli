#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 高质量封面图片库，按主题分类
const coverImages = {
  // 技术开发类
  tech: [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    'https://images.unsplash.com/photo-1551033406-611cf9a28f67?ixlib=rb-4.0.3&auto=format&fit=crop&w=2067&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  // 设计创意类
  design: [
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80',
    'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  // 生活日常类
  life: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  // 学习阅读类
  study: [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=2086&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  // 网络安全类
  security: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  // 音乐艺术类
  music: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  // 工具软件类
  tools: [
    'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2088&q=80',
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=2076&q=80',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80'
  ]
};

// 根据文章内容判断主题类型
function getArticleTheme(frontMatter, content) {
  const title = frontMatter.title?.toLowerCase() || '';
  const tags = frontMatter.tags || [];
  const categories = frontMatter.categories || [];
  const description = frontMatter.description?.toLowerCase() || '';
  
  // 转换为字符串进行匹配
  const allText = [title, description, ...tags, ...categories].join(' ').toLowerCase();
  
  // 网络安全类
  if (allText.includes('安全') || allText.includes('攻击') || allText.includes('cdn') || allText.includes('网络')) {
    return 'security';
  }
  
  // 设计创意类
  if (allText.includes('设计') || allText.includes('logo') || allText.includes('ai') || allText.includes('ps') || allText.includes('图标')) {
    return 'design';
  }
  
  // 音乐类
  if (allText.includes('音乐') || allText.includes('meting') || allText.includes('api')) {
    return 'music';
  }
  
  // 学习阅读类
  if (allText.includes('读书') || allText.includes('笔记') || allText.includes('学习')) {
    return 'study';
  }
  
  // 生活类
  if (allText.includes('生活') || allText.includes('旅行') || allText.includes('摄影') || allText.includes('确幸') || allText.includes('游记')) {
    return 'life';
  }
  
  // 工具类
  if (allText.includes('工具') || allText.includes('vscode') || allText.includes('git') || allText.includes('github')) {
    return 'tools';
  }
  
  // 默认为技术类
  return 'tech';
}

// 随机选择图片
function getRandomImage(theme) {
  const images = coverImages[theme] || coverImages.tech;
  return images[Math.floor(Math.random() * images.length)];
}

// 处理单个文章文件
function processArticle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 分离 front-matter 和内容
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontMatterMatch) {
      console.log(`⚠️  跳过文件 ${path.basename(filePath)} - 没有找到有效的 front-matter`);
      return false;
    }
    
    const frontMatterStr = frontMatterMatch[1];
    const articleContent = frontMatterMatch[2];
    
    // 解析 front-matter
    const frontMatter = yaml.load(frontMatterStr);
    
    // 检查是否已有封面
    if (frontMatter.cover) {
      console.log(`✅ 文件 ${path.basename(filePath)} 已有封面，跳过`);
      return false;
    }
    
    // 判断文章主题并选择合适的封面
    const theme = getArticleTheme(frontMatter, articleContent);
    const newCover = getRandomImage(theme);
    
    // 添加封面到 front-matter
    frontMatter.cover = newCover;
    
    // 重新生成文件内容
    const newFrontMatter = yaml.dump(frontMatter, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"'
    });
    
    const newContent = `---\n${newFrontMatter}---\n${articleContent}`;
    
    // 写回文件
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log(`🎨 已为 ${path.basename(filePath)} 添加 ${theme} 主题封面`);
    return true;
    
  } catch (error) {
    console.error(`❌ 处理文件 ${filePath} 时出错:`, error.message);
    return false;
  }
}

// 主函数
function main() {
  const postsDir = path.join(process.cwd(), 'source', '_posts');
  
  if (!fs.existsSync(postsDir)) {
    console.error('❌ 找不到 source/_posts 目录');
    process.exit(1);
  }
  
  console.log('🚀 开始为博客文章配置封面图片...\n');
  
  const files = fs.readdirSync(postsDir);
  const mdFiles = files.filter(file => file.endsWith('.md') && file !== '".md');
  
  let processedCount = 0;
  let skippedCount = 0;
  
  mdFiles.forEach(file => {
    const filePath = path.join(postsDir, file);
    const processed = processArticle(filePath);
    
    if (processed) {
      processedCount++;
    } else {
      skippedCount++;
    }
  });
  
  console.log('\n📊 处理完成统计:');
  console.log(`✅ 已处理: ${processedCount} 篇文章`);
  console.log(`⏭️  已跳过: ${skippedCount} 篇文章`);
  console.log(`📝 总计: ${mdFiles.length} 篇文章`);
  
  if (processedCount > 0) {
    console.log('\n🎉 封面配置完成！请重启 Hexo 服务器查看效果。');
    console.log('💡 提示: 运行 "hexo server" 重新启动服务器');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { processArticle, getArticleTheme, getRandomImage };
