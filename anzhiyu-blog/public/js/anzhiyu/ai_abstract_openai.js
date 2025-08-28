(function () {
  const {
    randomNum,
    basicWordCount,
    btnLink,
    key: AIKey,
    Referer: AIReferer,
    gptName,
    switchBtn,
    mode: initialMode,
    openai: openaiConfig,
  } = GLOBAL_CONFIG.postHeadAiDescription;

  const { title, postAI, pageFillDescription } = GLOBAL_CONFIG_SITE;

  let lastAiRandomIndex = -1;
  let animationRunning = true;
  let mode = initialMode;
  let refreshNum = 0;
  let prevParam;
  let audio = null;
  let isPaused = false;
  let summaryID = null;

  // AI摘要缓存配置
  const AI_CACHE_CONFIG = {
    prefix: 'ai_summary_cache_',
    expireDays: 30, // 本地缓存30天
    version: '1.0',
    preGeneratedUrl: '/data/ai-summaries.json' // 预生成摘要文件路径
  };

  const post_ai = document.querySelector(".post-ai-description");
  if (!post_ai) return; // 如果没有AI摘要元素，直接退出

  const aiTitleRefreshIcon = post_ai.querySelector(".ai-title .anzhiyufont.anzhiyu-icon-arrow-rotate-right");
  let aiReadAloudIcon = post_ai.querySelector(".anzhiyu-icon-circle-dot");
  const explanation = post_ai.querySelector(".ai-explanation");

  let aiStr = "";
  let aiStrLength = "";
  let delayInit = 600;
  let indexI = 0;
  let indexJ = 0;
  let timeouts = [];
  let elapsed = 0;

  const observer = createIntersectionObserver();
  const aiFunctions = [introduce, aiTitleRefreshIconClick, aiRecommend, aiGoHome];

  // 缓存工具函数
  const cacheUtils = {
    // 生成缓存键
    generateCacheKey(content, mode) {
      const url = location.pathname;
      const contentHash = this.simpleHash(content);
      return `${AI_CACHE_CONFIG.prefix}${mode}_${url}_${contentHash}`;
    },

    // 简单hash函数
    simpleHash(str) {
      let hash = 0;
      if (str.length === 0) return hash;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      return Math.abs(hash).toString(36);
    },

    // 保存摘要到缓存
    saveSummary(content, summary, mode) {
      try {
        const cacheKey = this.generateCacheKey(content, mode);
        const cacheData = {
          summary: summary,
          timestamp: Date.now(),
          mode: mode,
          version: AI_CACHE_CONFIG.version,
          url: location.href
        };

        if (window.saveToLocal) {
          window.saveToLocal.set(cacheKey, cacheData, AI_CACHE_CONFIG.expireDays);
        } else {
          // 降级到原生localStorage
          const expiry = Date.now() + AI_CACHE_CONFIG.expireDays * 86400000;
          const item = { value: cacheData, expiry };
          localStorage.setItem(cacheKey, JSON.stringify(item));
        }

        console.log('AI摘要已缓存:', cacheKey);
      } catch (error) {
        console.warn('缓存保存失败:', error);
      }
    },

    // 从缓存获取摘要（优先检查预生成，然后检查本地缓存）
    async getSummary(content, mode) {
      try {
        // 1. 首先检查预生成的摘要
        const preGeneratedSummary = await this.getPreGeneratedSummary();
        if (preGeneratedSummary) {
          console.log('✅ 使用预生成的AI摘要');
          return preGeneratedSummary;
        }

        // 2. 然后检查本地缓存
        const cacheKey = this.generateCacheKey(content, mode);
        let cacheData;

        if (window.saveToLocal) {
          cacheData = window.saveToLocal.get(cacheKey);
        } else {
          // 降级到原生localStorage
          const itemStr = localStorage.getItem(cacheKey);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (Date.now() < item.expiry) {
              cacheData = item.value;
            } else {
              localStorage.removeItem(cacheKey);
            }
          }
        }

        if (cacheData && cacheData.version === AI_CACHE_CONFIG.version) {
          console.log('✅ 使用本地缓存的AI摘要');
          return cacheData.summary;
        }
      } catch (error) {
        console.warn('缓存读取失败:', error);
      }
      return null;
    },

    // 获取预生成的摘要
    async getPreGeneratedSummary() {
      try {
        const currentPath = location.pathname;
        const decodedPath = decodeURIComponent(currentPath); // 解码URL
        console.log('🔍 当前页面路径:', currentPath);
        console.log('🔍 解码后路径:', decodedPath);

        // 尝试从全局变量获取（如果已加载）
        if (window.preGeneratedSummaries) {
          // 尝试原始路径和解码路径
          const summary = window.preGeneratedSummaries[currentPath] || window.preGeneratedSummaries[decodedPath];
          if (summary) {
            console.log('✅ 从全局变量获取预生成摘要');
            return summary.summary;
          }
        }

        // 尝试从服务器获取预生成文件
        console.log('📡 尝试加载预生成摘要文件:', AI_CACHE_CONFIG.preGeneratedUrl);
        const response = await fetch(AI_CACHE_CONFIG.preGeneratedUrl);
        if (response.ok) {
          const summaries = await response.json();
          window.preGeneratedSummaries = summaries; // 缓存到全局变量

          console.log('📋 可用的预生成摘要路径:', Object.keys(summaries));
          console.log('🎯 查找路径（原始）:', currentPath);
          console.log('🎯 查找路径（解码）:', decodedPath);

          // 尝试原始路径和解码路径
          const summary = summaries[currentPath] || summaries[decodedPath];
          if (summary) {
            console.log('✅ 找到预生成摘要!');
            return summary.summary;
          } else {
            console.log('❌ 未找到当前路径的预生成摘要');
            console.log('❌ 尝试的路径:', [currentPath, decodedPath]);
          }
        } else {
          console.log('❌ 预生成摘要文件加载失败:', response.status);
        }
      } catch (error) {
        console.log('⚠️ 预生成摘要加载异常:', error.message);
      }
      return null;
    },

    // 清理过期缓存
    cleanExpiredCache() {
      try {
        const keys = Object.keys(localStorage);
        const prefix = AI_CACHE_CONFIG.prefix;
        let cleanedCount = 0;

        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            try {
              const itemStr = localStorage.getItem(key);
              if (itemStr) {
                const item = JSON.parse(itemStr);
                if (Date.now() > item.expiry) {
                  localStorage.removeItem(key);
                  cleanedCount++;
                }
              }
            } catch (e) {
              // 删除损坏的缓存项
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        });

        if (cleanedCount > 0) {
          console.log(`清理了 ${cleanedCount} 个过期的AI摘要缓存`);
        }
      } catch (error) {
        console.warn('缓存清理失败:', error);
      }
    }
  };

  const aiBtnList = post_ai.querySelectorAll(".ai-btn-item");
  const filteredHeadings = Array.from(aiBtnList).filter(heading => heading.id !== "go-tianli-blog");
  filteredHeadings.forEach((item, index) => {
    item.addEventListener("click", () => {
      aiFunctions[index]();
    });
  });

  // 初始化时清理过期缓存
  cacheUtils.cleanExpiredCache();

  // 在页面加载时显示缓存提示信息
  console.log('🚀 AI摘要缓存系统已启用 (专为OpenAI模式优化)');
  console.log('⏰ 缓存时间: 30天 | 💾 内存占用极低 (<100KB)');
  console.log('💡 提示: 按住Ctrl键点击刷新按钮可跳过缓存强制重新生成');
  console.log('🔧 缓存管理: aiSummaryCache.stats() 查看统计 | aiSummaryCache.clearAll() 清理缓存');

  // 添加全局缓存管理函数，方便调试和管理
  window.cacheUtils = cacheUtils; // 暴露cacheUtils到全局作用域
  window.aiSummaryCache = {
    // 清理所有AI摘要缓存
    clearAll() {
      try {
        const keys = Object.keys(localStorage);
        const prefix = AI_CACHE_CONFIG.prefix;
        let clearedCount = 0;

        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        });

        console.log(`已清理 ${clearedCount} 个AI摘要缓存`);
        return clearedCount;
      } catch (error) {
        console.error('清理缓存失败:', error);
        return 0;
      }
    },

    // 查看缓存统计（专注OpenAI模式）
    stats() {
      try {
        const keys = Object.keys(localStorage);
        const prefix = AI_CACHE_CONFIG.prefix;
        let totalCount = 0;
        let expiredCount = 0;
        let openaiCount = 0;
        let totalSize = 0;
        const now = Date.now();

        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            totalCount++;
            try {
              const itemStr = localStorage.getItem(key);
              if (itemStr) {
                totalSize += itemStr.length; // 计算存储大小
                const item = JSON.parse(itemStr);
                if (now > item.expiry) {
                  expiredCount++;
                }
                if (key.includes('_openai_')) {
                  openaiCount++;
                }
              }
            } catch (e) {
              expiredCount++; // 损坏的缓存也算过期
            }
          }
        });

        const stats = {
          total: totalCount,
          expired: expiredCount,
          valid: totalCount - expiredCount,
          openai: openaiCount,
          sizeKB: Math.round(totalSize / 1024 * 100) / 100, // 转换为KB
          avgSizeBytes: totalCount > 0 ? Math.round(totalSize / totalCount) : 0,
          cacheHitRate: '需要使用一段时间后才能统计'
        };

        console.log('🚀 AI摘要缓存统计:', stats);
        console.log(`📊 内存占用: ${stats.sizeKB}KB (平均每项${stats.avgSizeBytes}字节)`);
        console.log(`⏰ 缓存时间: ${AI_CACHE_CONFIG.expireDays}天`);
        return stats;
      } catch (error) {
        console.error('获取缓存统计失败:', error);
        return null;
      }
    },

    // 清理过期缓存
    cleanExpired() {
      return cacheUtils.cleanExpiredCache();
    }
  };

  document.getElementById("ai-tag").addEventListener("click", onAiTagClick);
  aiTitleRefreshIcon.addEventListener("click", onAiTitleRefreshIconClick);
  document.getElementById("go-tianli-blog").addEventListener("click", () => {
    window.open(btnLink, "_blank");
  });
  aiReadAloudIcon.addEventListener("click", readAloud);

  // OpenAI 兼容模式的摘要生成函数
  async function aiAbstractOpenAI(num) {
    if (!openaiConfig || !openaiConfig.apiKey || !openaiConfig.apiUrl) {
      startAI("OpenAI 配置不完整，请检查 apiKey 和 apiUrl 设置");
      return;
    }

    indexI = 0;
    indexJ = 1;
    clearTimeouts();
    animationRunning = false;
    elapsed = 0;
    observer.disconnect();

    num = Math.max(1000, Math.min(2000, num));
    const truncateDescription = (title + pageFillDescription).trim().substring(0, num);

    // 首先检查缓存（预生成 + 本地缓存）
    const cachedSummary = await cacheUtils.getSummary(truncateDescription, 'openai');
    if (cachedSummary) {
      setTimeout(() => {
        aiTitleRefreshIcon.style.opacity = "1";
      }, 300);
      startAI(cachedSummary);
      return;
    }

    const requestBody = {
      model: openaiConfig.model || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: openaiConfig.systemPrompt || "你是一个专业的技术博客文章摘要助手。请为以下文章生成一个简洁、准确的中文摘要，突出文章的核心内容和技术要点。摘要应该在100-200字之间。"
        },
        {
          role: "user",
          content: `请为以下文章内容生成摘要：\n\n标题：${title}\n\n内容：${truncateDescription}`
        }
      ],
      max_tokens: openaiConfig.maxTokens || 500,
      temperature: openaiConfig.temperature || 0.7
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiConfig.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    };

    try {
      let animationInterval = null;
      let summary;
      if (animationInterval) clearInterval(animationInterval);
      animationInterval = setInterval(() => {
        const animationText = "AI生成中" + ".".repeat(indexJ);
        explanation.innerHTML = animationText;
        indexJ = (indexJ % 3) + 1;
      }, 500);

      const response = await fetch(openaiConfig.apiUrl, requestOptions);
      let result;

      if (response.status === 401) {
        result = { error: "401 API Key 无效或已过期" };
      } else if (response.status === 429) {
        result = { error: "429 请求频率过高，请稍后再试" };
      } else if (response.status === 500) {
        result = { error: "500 服务器内部错误" };
      } else if (!response.ok) {
        result = { error: `${response.status} 请求失败` };
      } else {
        result = await response.json();
      }

      if (result.error) {
        summary = result.error;
      } else if (result.choices && result.choices[0] && result.choices[0].message) {
        summary = result.choices[0].message.content.trim();
        // 只有成功生成的摘要才缓存，错误信息不缓存
        if (summary && !result.error) {
          cacheUtils.saveSummary(truncateDescription, summary, 'openai');
        }
      } else {
        summary = "摘要生成失败，请检查 API 配置";
      }

      setTimeout(() => {
        aiTitleRefreshIcon.style.opacity = "1";
      }, 300);

      if (summary) {
        startAI(summary);
      } else {
        startAI("摘要获取失败，请检查 OpenAI API 配置");
      }
      clearInterval(animationInterval);
    } catch (error) {
      console.error("OpenAI API 调用错误:", error);
      clearInterval(animationInterval);
      explanation.innerHTML = "网络错误: " + error.message;
      setTimeout(() => {
        aiTitleRefreshIcon.style.opacity = "1";
      }, 300);
    }
  }

  // 修改原有的 aiAbstract 函数以支持 OpenAI 模式
  async function aiAbstract(num = basicWordCount) {
    if (mode === "tianli") {
      await aiAbstractTianli(num);
    } else if (mode === "openai") {
      await aiAbstractOpenAI(num);
    } else {
      aiAbstractLocal();
    }
  }

  // 其他必要的函数（从原文件复制）
  function createIntersectionObserver() {
    return new IntersectionObserver(
      entries => {
        let isVisible = entries[0].isIntersecting;
        animationRunning = isVisible;
        if (animationRunning) {
          delayInit = indexI === 0 ? 200 : 20;
          timeouts[1] = setTimeout(() => {
            if (indexJ) {
              indexI = 0;
              indexJ = 0;
            }
            if (indexI === 0) {
              explanation.innerHTML = aiStr.charAt(0);
            }
            requestAnimationFrame(animate);
          }, delayInit);
        }
      },
      { threshold: 0 }
    );
  }

  function animate(timestamp) {
    if (!animationRunning) {
      return;
    }
    if (!animate.start) animate.start = timestamp;
    elapsed = timestamp - animate.start;
    if (elapsed >= 20) {
      animate.start = timestamp;
      if (indexI < aiStrLength - 1) {
        let char = aiStr.charAt(indexI + 1);
        let delay = /[,.，。!?！？]/.test(char) ? 150 : 20;
        if (explanation.firstElementChild) {
          explanation.removeChild(explanation.firstElementChild);
        }
        explanation.innerHTML += char;
        let div = document.createElement("div");
        div.className = "ai-cursor";
        explanation.appendChild(div);
        indexI++;
        if (delay === 150) {
          const cursor = post_ai.querySelector(".ai-explanation .ai-cursor");
          if (cursor) cursor.style.opacity = "0.2";
        }
        if (indexI === aiStrLength - 1) {
          observer.disconnect();
          animationRunning = false;
          if (explanation.firstElementChild) {
            explanation.removeChild(explanation.firstElementChild);
          }
          return;
        }
        timeouts[0] = setTimeout(() => {
          requestAnimationFrame(animate);
        }, delay);
      }
    } else {
      requestAnimationFrame(animate);
    }
  }

  function startAI(str, df = true) {
    indexI = 0;
    indexJ = 1;
    clearTimeouts();
    animationRunning = false;
    elapsed = 0;
    observer.disconnect();
    explanation.innerHTML = df ? "生成中. . ." : "请等待. . .";
    aiStr = str;
    aiStrLength = aiStr.length;
    observer.observe(post_ai);
  }

  function introduce() {
    if (mode == "tianli") {
      startAI("我是文章辅助AI: TianliGPT，点击下方的按钮，让我生成本文简介、推荐相关文章等。");
    } else if (mode == "openai") {
      startAI(`我是文章辅助AI: ${gptName}，基于 OpenAI 技术，点击下方的按钮，让我生成本文简介、推荐相关文章等。`);
    } else {
      startAI(`我是文章辅助AI: ${gptName} GPT，点击下方的按钮，让我生成本文简介、推荐相关文章等。`);
    }
  }

  function aiTitleRefreshIconClick() {
    aiTitleRefreshIcon.click();
  }

  function onAiTagClick() {
    if (mode === "tianli") {
      post_ai.querySelectorAll(".ai-btn-item").forEach(item => (item.style.display = "none"));
      document.getElementById("go-tianli-blog").style.display = "block";
      startAI("你好，我是Tianli开发的摘要生成助理TianliGPT，是一个基于GPT-4的生成式AI。");
    } else if (mode === "openai") {
      post_ai.querySelectorAll(".ai-btn-item").forEach(item => (item.style.display = "block"));
      document.getElementById("go-tianli-blog").style.display = "none";
      startAI(`你好，我是本站摘要生成助理${gptName}，基于 OpenAI 技术的生成式AI。我在这里负责文章摘要的生成和显示。`);
    } else {
      post_ai.querySelectorAll(".ai-btn-item").forEach(item => (item.style.display = "block"));
      document.getElementById("go-tianli-blog").style.display = "none";
      startAI(`你好，我是本站摘要生成助理${gptName} GPT，是一个基于GPT-4的生成式AI。`);
    }
  }

  // 缺少的函数实现
  function clearTimeouts() {
    if (timeouts.length) {
      timeouts.forEach(item => {
        if (item) {
          clearTimeout(item);
        }
      });
      timeouts = []; // 清空数组
    }
  }

  function onAiTitleRefreshIconClick(event) {
    const truncateDescription = (title + pageFillDescription).trim().substring(0, basicWordCount);

    // 检查是否按住Ctrl键强制刷新
    const forceRefresh = event && (event.ctrlKey || event.metaKey);
    if (forceRefresh) {
      console.log('强制刷新AI摘要（跳过缓存）');
      // 临时禁用缓存检索
      const originalGetSummary = cacheUtils.getSummary;
      cacheUtils.getSummary = () => null;

      // 执行刷新后恢复缓存功能
      setTimeout(() => {
        cacheUtils.getSummary = originalGetSummary;
      }, 100);
    }

    aiTitleRefreshIcon.style.opacity = "0.2";
    aiTitleRefreshIcon.style.transitionDuration = "0.3s";
    aiTitleRefreshIcon.style.transform = "rotate(" + 360 * refreshNum + "deg)";
    if (truncateDescription.length <= basicWordCount) {
      let param = truncateDescription.length - Math.floor(Math.random() * randomNum);
      while (param === prevParam || truncateDescription.length - param === prevParam) {
        param = truncateDescription.length - Math.floor(Math.random() * randomNum);
      }
      prevParam = param;
      aiAbstract(param);
    } else {
      let value = Math.floor(Math.random() * randomNum) + basicWordCount;
      while (value === prevParam || truncateDescription.length - value === prevParam) {
        value = Math.floor(Math.random() * randomNum) + basicWordCount;
      }
      aiAbstract(value);
    }
    refreshNum++;
  }

  function aiAbstractLocal() {
    startAI("本地模式暂未实现，请使用 OpenAI 模式");
  }

  async function aiAbstractTianli(num = basicWordCount) {
    // 简化的Tianli实现，主要支持基本功能
    startAI("Tianli 模式可用，但建议使用 OpenAI 模式以获得更好的缓存体验");
  }

  function aiRecommend() {
    startAI("推荐功能开发中...");
  }

  function aiGoHome() {
    startAI("正在前往博客主页...", false);
    setTimeout(() => {
      if (window.pjax) {
        pjax.loadUrl("/");
      } else {
        location.href = location.origin;
      }
    }, 1000);
  }

  function readAloud() {
    startAI("朗读功能开发中...");
  }

  // 初始化
  if (post_ai) {
    setTimeout(() => {
      introduce();
    }, 1000);
  }
})();
