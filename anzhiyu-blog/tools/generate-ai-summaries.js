/**
 * AI摘要预生成脚本
 * 用于在本地生成所有文章的AI摘要，并保存为静态JSON文件
 * 这样用户访问时可以直接使用预生成的摘要，无需等待API调用
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 配置信息
const CONFIG = {
  // 从配置文件读取OpenAI设置
  configFile: path.join(__dirname, '../_config.anzhiyu.yml'),
  // 文章源文件目录
  postsDir: path.join(__dirname, '../source/_posts'),
  // 输出文件路径
  outputFile: path.join(__dirname, '../public/data/ai-summaries.json'),
  // 确保输出目录存在
  outputDir: path.join(__dirname, '../public/data')
};

class AISummaryGenerator {
  constructor() {
    this.openaiConfig = null;
    this.summaries = {};
    this.loadConfig();
  }

  // 加载配置文件
  loadConfig() {
    try {
      const configContent = fs.readFileSync(CONFIG.configFile, 'utf8');
      const config = yaml.load(configContent);
      this.openaiConfig = config.post_head_ai_description?.openai;
      
      if (!this.openaiConfig?.apiKey || !this.openaiConfig?.apiUrl) {
        throw new Error('OpenAI配置不完整');
      }
      
      console.log('✅ 配置加载成功');
    } catch (error) {
      console.error('❌ 配置加载失败:', error.message);
      process.exit(1);
    }
  }

  // 获取所有文章文件
  getAllPosts() {
    try {
      const files = fs.readdirSync(CONFIG.postsDir);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      console.error('❌ 读取文章目录失败:', error.message);
      return [];
    }
  }

  // 解析文章内容
  parsePost(filename) {
    try {
      const filePath = path.join(CONFIG.postsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 解析Front Matter - 支持不同换行符和没有正文内容的文章
      const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (!frontMatterMatch) {
        console.warn(`⚠️  文章格式不正确 ${filename}: 缺少Front Matter`);
        return null;
      }

      const frontMatter = yaml.load(frontMatterMatch[1]);
      const postContent = frontMatterMatch[2] || ''; // 允许空内容

      // 只处理启用AI的文章
      if (!frontMatter.ai) {
        return null;
      }

      return {
        title: frontMatter.title,
        content: postContent || '', // 确保内容不为空
        description: frontMatter.description || '', // 添加description字段
        url: this.generateUrl(frontMatter),
        filename: filename
      };
    } catch (error) {
      console.warn(`⚠️  解析文章失败 ${filename}:`, error.message);
      return null;
    }
  }

  // 生成文章URL
  generateUrl(frontMatter) {
    const date = new Date(frontMatter.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // 使用URL编码处理中文标题
    const title = encodeURIComponent(frontMatter.title);
    return `/${year}/${month}/${day}/${title}/`;
  }

  // 调用OpenAI API生成摘要
  async generateSummary(title, content, description = '') {
    // 如果正文内容很少，使用description补充
    const fullContent = content.trim() || description || title;
    const truncateContent = (title + ' ' + fullContent).trim().substring(0, 1500);
    
    const requestBody = {
      model: this.openaiConfig.model || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: this.openaiConfig.systemPrompt || "你是一个专业的技术博客文章摘要助手。请为以下文章生成一个简洁、准确的中文摘要，突出文章的核心内容和技术要点。摘要应该在100-200字之间。"
        },
        {
          role: "user",
          content: `请为以下文章内容生成摘要：\n\n标题：${title}\n\n内容：${truncateContent}`
        }
      ],
      max_tokens: this.openaiConfig.maxTokens || 500,
      temperature: this.openaiConfig.temperature || 0.7
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.openaiConfig.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    };

    try {
      const response = await fetch(this.openaiConfig.apiUrl, requestOptions);
      const result = await response.json();

      if (result.choices && result.choices[0] && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        throw new Error('API响应格式错误');
      }
    } catch (error) {
      console.error(`❌ API调用失败:`, error.message);
      return null;
    }
  }

  // 生成所有摘要
  async generateAllSummaries() {
    console.log('🚀 开始生成AI摘要...');
    
    const posts = this.getAllPosts();
    const aiPosts = posts.map(filename => this.parsePost(filename)).filter(Boolean);
    
    console.log(`📝 找到 ${aiPosts.length} 篇启用AI的文章`);

    for (let i = 0; i < aiPosts.length; i++) {
      const post = aiPosts[i];
      console.log(`\n📄 处理文章 ${i + 1}/${aiPosts.length}: ${post.title}`);
      
      const summary = await this.generateSummary(post.title, post.content, post.description);
      if (summary) {
        this.summaries[post.url] = {
          summary: summary,
          timestamp: Date.now(),
          mode: "openai",
          title: post.title
        };
        console.log(`✅ 摘要生成成功 (${summary.length}字)`);
      } else {
        console.log(`❌ 摘要生成失败`);
      }

      // 添加延迟避免API限制
      if (i < aiPosts.length - 1) {
        console.log('⏳ 等待1秒...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.saveSummaries();
  }

  // 保存摘要到文件
  saveSummaries() {
    try {
      // 确保输出目录存在
      if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
      }

      const jsonContent = JSON.stringify(this.summaries, null, 2);
      fs.writeFileSync(CONFIG.outputFile, jsonContent, 'utf8');
      
      console.log(`\n🎉 摘要文件已保存: ${CONFIG.outputFile}`);
      console.log(`📊 总计生成 ${Object.keys(this.summaries).length} 个摘要`);
    } catch (error) {
      console.error('❌ 保存文件失败:', error.message);
    }
  }
}

// 主函数
async function main() {
  console.log('🎯 AI摘要预生成工具');
  console.log('📝 这个工具会为所有启用AI的文章预生成摘要');
  console.log('🚀 用户访问时可以直接显示预生成的摘要，无需等待\n');

  const generator = new AISummaryGenerator();
  await generator.generateAllSummaries();
  
  console.log('\n✨ 完成！现在可以部署到服务器了');
  console.log('💡 提示: 记得将 public/data/ai-summaries.json 一起部署');
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = AISummaryGenerator;
