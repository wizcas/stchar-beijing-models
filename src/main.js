// 引入CSS
import "./style.css";

// 导入模块
import { CSS_CLASSES } from './css-constants.js';
import { detectCharacterType } from './fields.js';
import { 
  createDiv, 
  createCollapsibleCard, 
  createWomanCardScrollContainer, 
  generateCardTitle, 
  renderObject 
} from './renderer.js';

// Production数据获取函数
async function loadStatusData() {
  const raw = await STscript("/getvar 状态栏");
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// 测试数据函数（从外部文件读取）
async function loadTestData() {
  try {
    // 方案1: 如果在HTTP服务器环境下，使用fetch
    if (
      window.location.protocol === "http:" ||
      window.location.protocol === "https:"
    ) {
      const response = await fetch("char-var.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const charData = await response.json();

      // 检查是否存在状态栏字段
      if (!charData["状态栏"]) {
        throw new Error("状态栏字段不存在");
      }

      // 解析状态栏数据
      let statusBarData = charData["状态栏"];
      if (typeof statusBarData === "string") {
        statusBarData = JSON.parse(statusBarData);
      }

      // 清理字段名前缀并返回处理后的数据
      return cleanFieldPrefixes(statusBarData);
    } else {
      // 方案2: 如果是file://协议，提示用户启动HTTP服务器
      throw new Error("请使用HTTP服务器访问此页面，或使用内嵌数据模式");
    }
  } catch (error) {
    console.error("Failed to load char-var.json:", error);
    console.log("提示：请启动本地HTTP服务器，例如：");
    console.log("Python: python -m http.server 8000");
    console.log("Node.js: npx http-server");

    // 直接抛出错误，不使用内嵌数据
    throw error;
  }
}

// 清理字段名前缀的函数
function cleanFieldPrefixes(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanFieldPrefixes);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // 移除$开头的前缀
    const cleanKey = key.replace(/^\$[^\s]*\s+/, "");
    cleaned[cleanKey] = cleanFieldPrefixes(value);
  }

  return cleaned;
}

// 渲染单个角色卡片
function renderCharacterSection(sectionName, sectionData, container) {
  const characterType = detectCharacterType(sectionName, sectionData);
  const cardTitle = generateCardTitle(sectionName, sectionData);

  // 创建内容容器
  const contentContainer = createDiv(CSS_CLASSES.CHARACTER_CONTENT);

  // 渲染对象内容
  renderObject(sectionData, contentContainer, sectionName, 0);

  // 根据角色类型决定是否使用滚动容器
  let finalContent;
  if (characterType === "woman") {
    finalContent = createWomanCardScrollContainer(contentContainer);
  } else {
    finalContent = contentContainer;
  }

  // 创建可折叠卡片 - 所有卡片默认折叠
  const initiallyCollapsed = true;

  const cardStyles = {
    cardClass: CSS_CLASSES.CHARACTER_CARD,
    titleClass: CSS_CLASSES.SECTION_TITLE,
    useRawTitle: true
  };

  const collapsibleCard = createCollapsibleCard(
    cardTitle,
    finalContent,
    initiallyCollapsed,
    cardStyles
  );

  container.appendChild(collapsibleCard);
}

// 处理嵌套的女人数据结构
function processWomanData(womanSection) {
  const processedData = {};

  for (const [characterName, characterData] of Object.entries(womanSection)) {
    // 每个女性角色作为独立的卡片
    processedData[characterName] = characterData;
  }

  return processedData;
}

// 更新页面标题中的{{user}}占位符
function updatePageTitle(userName) {
  const titleUserElement = document.querySelector('.title-user');
  if (titleUserElement) {
    titleUserElement.textContent = userName || '{{user}}';
  }
}

// 初始化页面
async function init() {
  const container = document.getElementById("status-display");

  if (!container) {
    console.error("找不到状态显示容器");
    return;
  }

  try {
    // 显示加载状态
    container.innerHTML = '<div class="loading">正在加载状态数据...</div>';

    // 尝试加载数据
    let data;
    try {
      data = await loadStatusData();
      console.log("使用生产数据");
    } catch (prodError) {
      console.log("生产数据加载失败，尝试测试数据:", prodError.message);
      try {
        data = await loadTestData();
        console.log("使用测试数据");
      } catch (testError) {
        throw new Error(`无法加载数据: 生产环境错误: ${prodError.message}, 测试环境错误: ${testError.message}`);
      }
    }

    // 清空容器
    container.innerHTML = "";

    // 查找用户名并更新标题
    let userName = null;
    for (const [sectionName, sectionData] of Object.entries(data)) {
      if (typeof sectionData === "object" && sectionData !== null) {
        const characterType = detectCharacterType(sectionName, sectionData);
        if (characterType === "user") {
          userName = sectionName;
          break;
        }
      }
    }
    updatePageTitle(userName);

    // 渲染每个角色部分
    for (const [sectionName, sectionData] of Object.entries(data)) {
      if (typeof sectionData === "object" && sectionData !== null) {
        if (sectionName === "女人") {
          // 特殊处理女人数据结构 - 每个女性角色作为独立卡片
          const womanData = processWomanData(sectionData);
          for (const [characterName, characterData] of Object.entries(womanData)) {
            renderCharacterSection(characterName, characterData, container);
          }
        } else {
          // 其他角色（如用户）直接渲染
          renderCharacterSection(sectionName, sectionData, container);
        }
      }
    }

    console.log("状态栏渲染完成");
  } catch (error) {
    console.error("初始化失败:", error);
    container.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", init);
