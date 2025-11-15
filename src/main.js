/**
 * 主应用程序模块
 * 负责页面初始化和数据渲染
 */

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
import {
  loadData,
  getErrorMessage,
  getLoadingMessage,
} from './modules/data-loader.js';
import { CHARACTER_TYPES, DATA_LOADING, ELEMENT_IDS } from './modules/constants.js';

/**
 * @typedef {Object} CharacterData
 * @description 角色数据对象
 */

/**
 * @typedef {Object} StatusBarData
 * @description 状态栏数据，包含各个角色的信息
 */

/**
 * 渲染单个角色卡片
 * @param {string} sectionName - 角色/分类的名称
 * @param {CharacterData} sectionData - 角色的数据对象
 * @param {HTMLElement} container - 目标容器元素
 * @returns {void}
 */
function renderCharacterSection(sectionName, sectionData, container) {
  const characterType = detectCharacterType(sectionName, sectionData);
  const cardTitle = generateCardTitle(sectionName, sectionData);

  // 创建内容容器
  const contentContainer = createDiv(CSS_CLASSES.CHARACTER_CONTENT);

  // 渲染对象内容
  renderObject(sectionData, contentContainer, sectionName, 0);

  // 根据角色类型决定是否使用滚动容器
  let finalContent;
  if (characterType === CHARACTER_TYPES.WOMAN || characterType === CHARACTER_TYPES.USER) {
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

/**
 * 处理嵌套的女性角色数据结构
 * @param {Object} womanSection - 女性角色数据对象
 * @returns {Object} 处理后的女性角色数据
 */
function processWomanData(womanSection) {
  const processedData = {};

  for (const [characterName, characterData] of Object.entries(womanSection)) {
    // 每个女性角色作为独立的卡片
    processedData[characterName] = characterData;
  }

  return processedData;
}

/**
 * 更新页面标题中的用户占位符
 * @param {string|null} userName - 用户名称
 * @returns {void}
 */
function updatePageTitle(userName) {
  const titleUserElement = document.querySelector(ELEMENT_IDS.TITLE_USER);
  if (titleUserElement) {
    titleUserElement.textContent = userName || '{{user}}';
  }
}

/**
 * 设置容器加载状态
 * @param {HTMLElement} container - 容器元素
 * @returns {void}
 */
function setLoadingState(container) {
  container.innerHTML = `<div class="loading">${getLoadingMessage()}</div>`;
}

/**
 * 设置容器错误状态
 * @param {HTMLElement} container - 容器元素
 * @param {Error|string} error - 错误对象或错误消息
 * @returns {void}
 */
function setErrorState(container, error) {
  container.innerHTML = `<div class="error">${getErrorMessage(error)}</div>`;
}

/**
 * 从数据对象中查找用户角色名称
 * @param {StatusBarData} data - 状态栏数据
 * @returns {string|null} 用户名称或 null
 */
function findUserName(data) {
  for (const [sectionName, sectionData] of Object.entries(data)) {
    if (typeof sectionData === "object" && sectionData !== null) {
      const characterType = detectCharacterType(sectionName, sectionData);
      if (characterType === CHARACTER_TYPES.USER) {
        return sectionName;
      }
    }
  }
  return null;
}

/**
 * 渲染所有角色部分
 * @param {StatusBarData} data - 状态栏数据
 * @param {HTMLElement} container - 目标容器元素
 * @returns {void}
 */
function renderAllCharacterSections(data, container) {
  for (const [sectionName, sectionData] of Object.entries(data)) {
    if (typeof sectionData === "object" && sectionData !== null) {
      const womanKey = DATA_LOADING.WOMAN_SECTION_KEY;
      if (sectionName === womanKey) {
        // 特殊处理女性角色数据结构 - 每个女性角色作为独立卡片
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
}

/**
 * 初始化页面 - 加载数据并渲染
 * @async
 * @returns {Promise<void>}
 */
async function init() {
  const container = document.getElementById(ELEMENT_IDS.STATUS_DISPLAY);

  if (!container) {
    console.error("找不到状态显示容器");
    return;
  }

  try {
    // 显示加载状态
    setLoadingState(container);

    // 加载数据
    const data = await loadData();

    // 清空容器
    container.innerHTML = "";

    // 查找用户名并更新标题
    const userName = findUserName(data);
    updatePageTitle(userName);

    // 渲染所有角色部分
    renderAllCharacterSections(data, container);

    console.log("✓ 状态栏渲染完成");
  } catch (error) {
    console.error("✗ 初始化失败:", error);
    setErrorState(container, error);
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", init);
