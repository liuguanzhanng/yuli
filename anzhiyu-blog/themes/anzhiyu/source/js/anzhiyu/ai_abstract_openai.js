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

  const post_ai = document.querySelector(".post-ai-description");
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

  const aiBtnList = post_ai.querySelectorAll(".ai-btn-item");
  const filteredHeadings = Array.from(aiBtnList).filter(heading => heading.id !== "go-tianli-blog");
  filteredHeadings.forEach((item, index) => {
    item.addEventListener("click", () => {
      aiFunctions[index]();
    });
  });

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

    console.info("文章内容长度:", truncateDescription.length);
    
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
      explanation.innerHTML = "网络错误: " + error.message;
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
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animationRunning) {
          animationRunning = true;
          animate();
        }
      });
    });
  }

  function animate() {
    if (indexI < aiStrLength) {
      explanation.innerHTML = aiStr.substring(0, indexI + 1) + (indexI + 1 < aiStrLength ? "_" : "");
      indexI++;
      const delay = Math.random() * 100 + 50;
      timeouts[0] = setTimeout(() => {
        requestAnimationFrame(animate);
      }, delay);
    } else {
      // 动画完成，移除光标
      explanation.innerHTML = aiStr;
      animationRunning = false;
    }
  }

  function startAI(str, df = true) {
    indexI = 0;
    indexJ = 1;
    clearTimeouts();
    animationRunning = true;
    elapsed = 0;
    observer.disconnect();
    explanation.innerHTML = df ? "生成中. . ." : "请等待. . .";
    aiStr = str;
    aiStrLength = aiStr.length;

    // 直接开始动画，不依赖 IntersectionObserver
    setTimeout(() => {
      animate();
    }, 500);
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
    }
  }

  function onAiTitleRefreshIconClick() {
    aiAbstract();
  }

  function aiAbstractLocal() {
    startAI("本地模式暂未实现，请使用 OpenAI 模式");
  }

  async function aiAbstractTianli(num) {
    startAI("Tianli 模式暂未配置，请使用 OpenAI 模式");
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
    console.log("AI 摘要模块初始化中...");
    console.log("配置信息:", { mode, gptName, openaiConfig });
    setTimeout(() => {
      introduce();
    }, 1000);
  } else {
    console.error("未找到 .post-ai-description 元素");
  }
})();
