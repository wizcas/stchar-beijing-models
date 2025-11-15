/**
 * 渲染功能模块
 * 负责 DOM 元素创建和页面内容渲染
 */

import {
  CSS_CLASSES,
  TAG_CLASSES,
  COLLAPSIBLE_CLASSES,
} from "./css-constants.js";
import {
  addEmojiToFieldName,
  detectCharacterType,
  getFieldOrder,
  getFieldOrderSet,
} from "./fields.js";
import {
  SPECIAL_FIELDS,
  EQUIPMENT_KEYWORDS,
  EQUIPMENT_CATEGORIES,
} from "./modules/constants.js";

/**
 * 处理字段名，移除所有 $ 开始的前缀
 * @param {string} fieldName - 原始字段名
 * @returns {string} 清理后的字段名
 */
function cleanFieldName(fieldName) {
  // 匹配所有以$开始的前缀，直到遇到空格，然后获取空格后的内容
  const match = fieldName.match(/^\$[^\s]*\s+(.+)$/);
  return match ? match[1] : fieldName;
}

/**
 * 通用 DOM 元素创建函数
 * @param {string} tag - HTML 标签名称
 * @param {string} [className] - CSS 类名
 * @param {string} [textContent] - 文本内容
 * @param {HTMLElement} [parent] - 父元素
 * @returns {HTMLElement} 创建的 DOM 元素
 */
function createElement(tag, className, textContent, parent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  if (parent) parent.appendChild(element);
  return element;
}

/**
 * 创建 div 元素的快捷函数
 * @param {string} [className] - CSS 类名
 * @param {string} [textContent] - 文本内容
 * @param {HTMLElement} [parent] - 父元素
 * @returns {HTMLElement} 创建的 div 元素
 */
function createDiv(className, textContent, parent) {
  return createElement("div", className, textContent, parent);
}

/**
 * 创建 span 元素的快捷函数
 * @param {string} [className] - CSS 类名
 * @param {string} [textContent] - 文本内容
 * @param {HTMLElement} [parent] - 父元素
 * @returns {HTMLElement} 创建的 span 元素
 */
function createSpan(className, textContent, parent) {
  return createElement("span", className, textContent, parent);
}

/**
 * 创建子部分容器和标题
 * @param {string} title - 标题文本
 * @param {string} cardClass - 卡片 CSS 类名
 * @param {string} titleClass - 标题 CSS 类名
 * @param {boolean} [useEmoji=true] - 是否添加 emoji
 * @returns {{container: HTMLElement, titleElement: HTMLElement, contentContainer: HTMLElement}} 包含容器结构的对象
 */
function createSubsectionContainer(
  title,
  cardClass,
  titleClass,
  useEmoji = true,
) {
  const container = createDiv(cardClass);
  const titleElement = createDiv(
    titleClass,
    useEmoji ? addEmojiToFieldName(title) : title,
    container,
  );
  const contentContainer = createDiv(
    CSS_CLASSES.CONTENT_CONTAINER,
    null,
    container,
  );

  return { container, titleElement, contentContainer };
}

/**
 * 创建标签容器
 * @param {string[]} items - 标签项目数组
 * @param {HTMLElement} parent - 父元素
 * @returns {HTMLElement} 标签容器元素
 */
function createTagContainer(items, parent) {
  const tagContainer = createDiv(TAG_CLASSES.CONTAINER, null, parent);
  items.forEach((item) => {
    createSpan(TAG_CLASSES.BASE, item, tagContainer);
  });
  return tagContainer;
}

/**
 * 创建字段显示元素
 * @param {string} name - 字段名称
 * @param {string|Array} value - 字段值
 * @param {boolean} [isArray=false] - 是否为数组值
 * @returns {HTMLElement} 字段元素
 */
function createField(name, value, isArray = false) {
  const fieldDiv = createDiv(CSS_CLASSES.FIELD_CONTAINER);
  const nameSpan = createSpan(
    "field-label",
    addEmojiToFieldName(name) + ":",
    fieldDiv,
  );

  if (isArray) {
    const valueDiv = createDiv("field-value");
    createTagContainer(value, valueDiv);
    fieldDiv.appendChild(valueDiv);
  } else {
    const valueSpan = createSpan("field-value", null, fieldDiv);

    // 特殊处理想法字段
    if (name === SPECIAL_FIELDS.THOUGHTS) {
      const em = createElement("em", null, value, valueSpan);
    } else {
      valueSpan.textContent = value;
    }
  }

  return fieldDiv;
}

/**
 * 创建子部分
 * @param {string} title - 标题文本
 * @param {Function} renderCallback - 渲染回调函数，接收 contentContainer 参数
 * @returns {HTMLElement} 子部分容器元素
 */
function createSubsection(title, renderCallback) {
  const { container, contentContainer } = createSubsectionContainer(
    title,
    CSS_CLASSES.SUBSECTION_CARD,
    CSS_CLASSES.SECTION_TITLE,
  );
  renderCallback(contentContainer);
  return container;
}

/**
 * 创建瀑布流布局管理器
 * @param {string} [containerClass] - 容器 CSS 类名
 * @returns {{container: HTMLElement, addItem: Function, addItems: Function, relayout: Function, destroy: Function}} 瀑布流管理器对象
 */
function createMasonryGrid(containerClass = CSS_CLASSES.SUBSECTIONS_MASONRY) {
  const container = createDiv(containerClass);
  const minItemWidth = 350;
  const maxColumns = 2;
  const gap = 16;

  function relayout() {
    const containerWidth = container.offsetWidth;
    const calculatedColumns = Math.floor(containerWidth / minItemWidth) || 1;
    const columns = Math.min(calculatedColumns, maxColumns);

    container.style.columnCount = columns.toString();
    container.style.columnGap = `${gap}px`;
    container.style.display = "block";
    container.style.gridTemplateColumns = "";
    container.style.gridTemplateRows = "";

    Array.from(container.children).forEach((child) => {
      child.style.gridRowStart = "";
      child.style.gridColumnStart = "";
      child.style.breakInside = "avoid";
      child.style.marginBottom = `${gap}px`;

      if (!child.classList.contains("masonry-item")) {
        child.classList.add("masonry-item");
      }
    });
  }

  function addItem(item) {
    if (!item.classList.contains("masonry-item")) {
      item.classList.add("masonry-item");
    }
    container.appendChild(item);
    setTimeout(() => {
      relayout();
    }, 10);
  }

  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      relayout();
    }, 150);
  }

  const observer = new MutationObserver(() => {
    relayout();
  });

  function initialize() {
    window.addEventListener("resize", handleResize);
    observer.observe(container, { childList: true, subtree: true });
    setTimeout(() => {
      relayout();
    }, 10);
  }

  initialize();

  return {
    container,
    addItem,
    addItems: (items) => {
      items.forEach((item) => addItem(item));
    },
    addItemSmart: addItem,
    relayout,
    forceLayout: () => {
      setTimeout(() => {
        relayout();
      }, 50);
    },
    destroy: () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    },
  };
}

/**
 * 检查是否需要多列布局
 * @param {Object} subsections - 子部分对象
 * @returns {boolean} 是否需要瀑布流布局
 */
function shouldUseMasonryLayout(subsections) {
  return Object.keys(subsections).length >= 3;
}

/**
 * 检查元素是否有滚动条
 * @param {HTMLElement} [element] - 要检查的元素
 * @returns {boolean} 是否有滚动条
 */
function hasScrollbar(element) {
  return element ? element.scrollHeight > element.clientHeight : false;
}

/**
 * 更新滚动遮罩状态
 * @param {HTMLElement} container - 滚动容器
 * @param {HTMLElement} content - 内容元素
 * @returns {void}
 */
function updateScrollMask(container, content) {
  if (!container || !content) return;

  if (hasScrollbar(content)) {
    container.classList.add("has-overflow");
  } else {
    container.classList.remove("has-overflow");
  }
}

/**
 * 创建女性角色卡片滚动容器
 * @param {HTMLElement} content - 内容元素
 * @returns {HTMLElement} 滚动容器元素
 */
function createWomanCardScrollContainer(content) {
  const scrollContainer = createDiv(CSS_CLASSES.WOMAN_CARD_SCROLL_CONTAINER);
  const contentDiv = createDiv(CSS_CLASSES.WOMAN_CARD_CONTENT);

  contentDiv.appendChild(content);
  scrollContainer.appendChild(contentDiv);

  // 初始化滚动遮罩检测
  setTimeout(() => {
    updateScrollMask(scrollContainer, contentDiv);
  }, 100);

  // 监听内容变化
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      updateScrollMask(scrollContainer, contentDiv);
    }, 50);
  });
  observer.observe(contentDiv, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  // 监听窗口大小变化
  const handleResize = () => {
    setTimeout(() => {
      updateScrollMask(scrollContainer, contentDiv);
    }, 100);
  };
  window.addEventListener("resize", handleResize);

  // 清理函数
  scrollContainer._cleanup = () => {
    observer.disconnect();
    window.removeEventListener("resize", handleResize);
  };

  return scrollContainer;
}

/**
 * 生成卡片标题
 * 根据角色类型和数据生成合适的标题
 * @param {string} sectionName - 分类名称
 * @param {Object} sectionData - 分类数据
 * @returns {string} 生成的标题
 */
function generateCardTitle(sectionName, sectionData) {
  // 使用角色类型检测
  const characterType = detectCharacterType(sectionName, sectionData);

  if (characterType === "woman" && sectionData) {
    // 查找昵称和全名
    const nickname =
      sectionData[SPECIAL_FIELDS.NICKNAME] || sectionData["nickname"];
    const fullName =
      sectionData[SPECIAL_FIELDS.REAL_NAME] ||
      sectionData[SPECIAL_FIELDS.FULL_NAME] ||
      sectionData[SPECIAL_FIELDS.SURNAME] ||
      sectionData[SPECIAL_FIELDS.NAME];

    if (nickname && fullName) {
      return `${nickname} (${fullName})`;
    } else if (nickname) {
      return nickname;
    } else if (fullName) {
      return fullName;
    }
  }

  return sectionName;
}

/**
 * 处理特殊字段合并和格式化
 * @param {Object} obj - 原始数据对象
 * @returns {Object} 处理后的数据对象
 */
function processSpecialFields(obj) {
  const processed = { ...obj };

  // 处理昵称和真名合并
  if (
    processed[SPECIAL_FIELDS.NICKNAME] &&
    processed[SPECIAL_FIELDS.REAL_NAME]
  ) {
    const nickname = processed[SPECIAL_FIELDS.NICKNAME];
    const realName = processed[SPECIAL_FIELDS.REAL_NAME];
    processed[SPECIAL_FIELDS.NAME] = `${nickname} (${realName})`;
    delete processed[SPECIAL_FIELDS.NICKNAME];
    delete processed[SPECIAL_FIELDS.REAL_NAME];
  }

  // 处理三围合并
  if (
    processed[SPECIAL_FIELDS.BUST] &&
    processed[SPECIAL_FIELDS.WAIST] &&
    processed[SPECIAL_FIELDS.HIP]
  ) {
    const bust = processed[SPECIAL_FIELDS.BUST];
    const waist = processed[SPECIAL_FIELDS.WAIST];
    const hip = processed[SPECIAL_FIELDS.HIP];
    processed[SPECIAL_FIELDS.MEASUREMENTS] = `${bust}-${waist}-${hip} cm`;
    delete processed[SPECIAL_FIELDS.BUST];
    delete processed[SPECIAL_FIELDS.WAIST];
    delete processed[SPECIAL_FIELDS.HIP];
  }

  // 处理身高单位
  if (processed[SPECIAL_FIELDS.HEIGHT]) {
    processed[SPECIAL_FIELDS.HEIGHT] = processed[SPECIAL_FIELDS.HEIGHT] + " cm";
  }

  // 处理体重单位
  if (processed[SPECIAL_FIELDS.WEIGHT]) {
    processed[SPECIAL_FIELDS.WEIGHT] = processed[SPECIAL_FIELDS.WEIGHT] + " kg";
  }

  return processed;
}

/**
 * 检查是否为器材对象格式
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为器材对象
 */
function isEquipmentObject(obj) {
  // 检查对象的所有值是否都是数组（新格式：{categoryname: [items...]})
  const values = Object.values(obj);
  const keys = Object.keys(obj);

  // 所有值都是数组
  const allValuesAreArrays =
    values.length > 0 && values.every((value) => Array.isArray(value));

  // 包含器材相关的关键字
  const hasEquipmentKeywords = keys.some((key) =>
    EQUIPMENT_KEYWORDS.some((keyword) => key.includes(keyword)),
  );

  return allValuesAreArrays && (hasEquipmentKeywords || keys.length >= 3);
}

/**
 * 更新父级可折叠容器的高度
 * @param {HTMLElement} element - 起始元素
 * @returns {void}
 */
function updateParentCollapsibleHeight(element) {
  let current = element;
  while (current && current.parentElement) {
    current = current.parentElement;
    if (
      current.classList &&
      current.classList.contains("collapsible-content") &&
      current.style.maxHeight &&
      current.style.maxHeight !== "0px"
    ) {
      current.style.maxHeight = current.scrollHeight + "px";
    }
  }
}

/**
 * 创建可折叠卡片
 * @param {string} title - 卡片标题
 * @param {HTMLElement} content - 卡片内容元素
 * @param {boolean} [initiallyCollapsed=true] - 是否初始折叠
 * @param {Object} [customStyles={}] - 自定义样式配置
 * @param {string} [customStyles.cardClass] - 卡片类名
 * @param {string} [customStyles.titleClass] - 标题类名
 * @param {boolean} [customStyles.useRawTitle] - 是否使用原始标题（不添加 emoji）
 * @returns {HTMLElement} 可折叠卡片元素
 */
function createCollapsibleCard(
  title,
  content,
  initiallyCollapsed = true,
  customStyles = {},
) {
  // 创建卡片容器 - 使用 grid 让内容自动调整高度
  const cardDiv = document.createElement("div");
  cardDiv.className =
    customStyles.cardClass ||
    "bg-[var(--color-surface-accent)] border border-[var(--color-border-accent)] rounded-[var(--radius-element)] shadow-[var(--shadow-element)]";
  cardDiv.style.display = "grid";
  cardDiv.style.gridTemplateRows = "auto 1fr";
  cardDiv.style.overflow = "hidden";

  // 创建可点击的标题容器（包含padding，整个区域可点击）
  const titleContainer = document.createElement("div");
  titleContainer.className = CSS_CLASSES.COLLAPSIBLE_TITLE;

  // 创建标题文本
  const titleDiv = document.createElement("div");
  titleDiv.className = customStyles.titleClass || CSS_CLASSES.SECTION_TITLE;
  titleDiv.textContent = customStyles.useRawTitle
    ? title
    : addEmojiToFieldName(title);

  // 创建折叠图标
  const collapseIcon = document.createElement("div");
  collapseIcon.className = CSS_CLASSES.COLLAPSE_ICON;
  collapseIcon.textContent = "✕";

  titleContainer.appendChild(titleDiv);
  titleContainer.appendChild(collapseIcon);
  cardDiv.appendChild(titleContainer);

  // 创建内容容器 - 使用 grid 自动内容高度
  const contentContainer = document.createElement("div");
  contentContainer.className = COLLAPSIBLE_CLASSES.CONTENT;
  contentContainer.style.display = "grid";
  contentContainer.style.gridTemplateRows = initiallyCollapsed ? "0fr" : "1fr";
  contentContainer.style.overflow = "hidden";

  // 包装内容以支持 grid 0fr/1fr 收缩
  const contentWrapper = document.createElement("div");
  contentWrapper.style.minHeight = "0";
  contentWrapper.style.overflow = "hidden";
  contentWrapper.appendChild(content);
  contentContainer.appendChild(contentWrapper);
  cardDiv.appendChild(contentContainer);

  // 折叠状态管理
  let isCollapsed = initiallyCollapsed;
  let resizeObserver = null;

  function updateVisibility() {
    if (isCollapsed) {
      contentContainer.style.gridTemplateRows = "0fr";
      collapseIcon.style.transform = "rotate(45deg)";
    } else {
      contentContainer.style.gridTemplateRows = "1fr";
      collapseIcon.style.transform = "rotate(0deg)";
    }
  }

  // 使用 ResizeObserver 监听内容变化
  function setupResizeObserver() {
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        // 当内容大小变化时，grid 自动重新计算，无需手动干预
      });
      resizeObserver.observe(contentWrapper);
    }
  }

  // 点击事件处理
  titleContainer.addEventListener("click", () => {
    isCollapsed = !isCollapsed;
    updateVisibility();

    // 检查是否有女性角色卡片滚动容器，更新其遮罩状态
    const scrollContainer = contentContainer.querySelector(
      ".woman-card-scroll-container",
    );
    const scrollContent = scrollContainer?.querySelector(".woman-card-content");
    if (scrollContainer && scrollContent) {
      setTimeout(() => {
        updateScrollMask(scrollContainer, scrollContent);
      }, 50);
    }
  });

  // 窗口大小变化时 grid 自动调整
  const handleResize = () => {
    // ResizeObserver 会自动处理，无需手动计算
  };
  window.addEventListener("resize", handleResize);

  // 清理函数
  cardDiv._cleanup = () => {
    window.removeEventListener("resize", handleResize);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  };

  // 初始化状态
  setupResizeObserver();
  setTimeout(() => {
    updateVisibility();
  }, 0);

  return cardDiv;
}

/**
 * 渲染器材对象（具有分类的对象）
 * @param {string} title - 器材类别标题
 * @param {Object} obj - 器材对象，格式 {categoryname: [items...]}
 * @param {HTMLElement} container - 目标容器元素
 * @returns {void}
 */
function renderEquipmentObject(title, obj, container) {
  const equipmentGrid = document.createElement("div");
  equipmentGrid.className = CSS_CLASSES.EQUIPMENT_GRID;

  // 分离"其他"类别和前4类
  const entries = Object.entries(obj);
  const otherEntries = entries.filter(
    ([categoryName]) => categoryName === EQUIPMENT_CATEGORIES.OTHER,
  );
  const regularEntries = entries.filter(
    ([categoryName]) => categoryName !== EQUIPMENT_CATEGORIES.OTHER,
  );

  // 渲染前4类（或所有非"其他"类别）
  regularEntries.forEach(([categoryName, items]) => {
    const itemDiv = createDiv(CSS_CLASSES.EQUIPMENT_ITEM, null, equipmentGrid);
    createDiv(
      CSS_CLASSES.CATEGORY_TITLE,
      addEmojiToFieldName(categoryName),
      itemDiv,
    );
    createTagContainer(items, itemDiv);
  });

  // 渲染"其他"类别（如果存在），占据全宽
  otherEntries.forEach(([categoryName, items]) => {
    const itemDiv = createDiv(
      CSS_CLASSES.EQUIPMENT_ITEM_FULL,
      null,
      equipmentGrid,
    );
    createDiv(
      CSS_CLASSES.CATEGORY_TITLE,
      addEmojiToFieldName(categoryName),
      itemDiv,
    );
    createTagContainer(items, itemDiv);
  });

  const collapsibleCard = createCollapsibleCard(title, equipmentGrid, true);
  container.appendChild(collapsibleCard);
}

/**
 * 性爱部分可见性配置
 * 可以根据需要修改这些条件
 */
const INTIMACY_VISIBILITY_CONFIG = {
  // 好感度阈值
  favorabilityThreshold: 30,
  moralityThreshold: 40,
  // 动情程度阈值
  arousalThreshold: 20,
  // 占位符文本
  placeholderText: "🙈 {{user}}尚未了解相关信息",
};

/**
 * 检查性爱部分是否应该可见
 * @param {Object} characterData - 角色完整数据对象
 * @returns {boolean} 是否应该显示性爱部分
 */
function shouldShowIntimacySection(characterData) {
  // 获取关系数据
  const relationData = characterData?.关系;
  if (!relationData) return false;

  // 获取性爱数据中的动情程度
  const intimacyData = characterData?.性爱;
  const arousal = intimacyData?.动情程度 || 0;

  // 获取好感度
  const favorability = relationData?.好感度 || 0;
  // 获取堕落度
  const morality = relationData?.堕落度 || 0;

  // 检查是否满足可见性条件
  return (
    favorability >= INTIMACY_VISIBILITY_CONFIG.favorabilityThreshold ||
    arousal >= INTIMACY_VISIBILITY_CONFIG.arousalThreshold ||
    morality >= INTIMACY_VISIBILITY_CONFIG.moralityThreshold
  );
}

/**
 * 创建性爱部分占位符元素
 * @returns {HTMLElement} 占位符元素
 */
function createIntimacyPlaceholder() {
  const placeholder = createDiv("text-center py-8 text-text-muted");
  placeholder.textContent = INTIMACY_VISIBILITY_CONFIG.placeholderText;
  return placeholder;
}

/**
 * 检查字段是否应该被隐藏
 * @param {string} key - 字段键名
 * @param {string} sectionName - 当前所在的部分名称
 * @returns {boolean} 是否应该隐藏该字段
 */
function shouldHideField(key, sectionName) {
  const cleanKey = cleanFieldName(key);

  // 隐藏性爱部分的动情程度字段
  if (sectionName === "性爱" && cleanKey === "动情程度") {
    return true;
  }

  // 隐藏描述字段，因为它们被用来替换对应的数值字段显示
  if (cleanKey === "堕落度描述" || cleanKey === "好感度描述") {
    return true;
  }

  return false;
}

/**
 * 根据键值渲染字段
 * @param {string} key - 字段键名
 * @param {any} value - 字段值
 * @param {HTMLElement} container - 目标容器元素
 * @param {number} level - 嵌套层级
 * @param {string} sectionName - 当前所在的部分名称
 * @param {Object} parentObj - 父对象，用于查找描述字段
 * @param {Object} rootCharacterData - 根角色数据，用于条件可见性检查
 * @returns {void}
 */
function renderFieldByKey(
  key,
  value,
  container,
  level,
  sectionName = "",
  parentObj = null,
  rootCharacterData = null,
) {
  const cleanKey = cleanFieldName(key);

  // 检查是否应该隐藏该字段
  if (shouldHideField(key, sectionName)) {
    return;
  }

  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      renderArray(cleanKey, value, container);
    } else if (isEquipmentObject(value)) {
      // 特殊处理器材对象格式 {categoryname: [items...], categoryname2: [items...], ...}
      renderEquipmentObject(cleanKey, value, container);
    } else {
      renderSubsection(cleanKey, value, container, level, rootCharacterData);
    }
  } else {
    renderField(cleanKey, value, container, parentObj);
  }
}

/**
 * 格式化数字为带逗号分隔的字符串
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
function formatNumberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 渲染普通字段
 * @param {string} name - 字段名称
 * @param {any} value - 字段值
 * @param {HTMLElement} container - 目标容器元素
 * @param {Object} parentObj - 父对象，用于查找描述字段
 * @returns {void}
 */
function renderField(name, value, container, parentObj = null) {
  // 检查是否需要使用描述字段替换数值显示
  let displayValue = value;
  if (parentObj && (name === "堕落度" || name === "好感度")) {
    const descriptionFieldName = name + "描述";
    if (parentObj[descriptionFieldName]) {
      displayValue = parentObj[descriptionFieldName];
    }
  }

  // 特殊格式化资金字段
  if (name === "资金" && typeof value === "number") {
    displayValue = "￥" + formatNumberWithCommas(value);
  }

  const fieldDiv = createField(name, displayValue, Array.isArray(displayValue));
  container.appendChild(fieldDiv);
}

/**
 * 渲染数组字段
 * @param {string} title - 数组标题
 * @param {Array} arr - 数组数据
 * @param {HTMLElement} container - 目标容器元素
 * @returns {void}
 */
function renderArray(title, arr, container) {
  // 检查是否为简单字符串数组
  const isSimpleArray = arr.every((item) => typeof item === "string");

  if (isSimpleArray) {
    // 渲染为标签样式的字段
    const fieldDiv = createField(title, arr, true);
    container.appendChild(fieldDiv);
  } else {
    // 复杂数组，保持原有渲染方式
    const subsectionDiv = createSubsection(title, (contentContainer) => {
      arr.forEach((item) => {
        const itemDiv = createDiv(
          CSS_CLASSES.ARRAY_ITEM,
          null,
          contentContainer,
        );

        if (typeof item === "object" && item.category && item.items) {
          createDiv(CSS_CLASSES.CATEGORY_TITLE, item.category, itemDiv);
          createTagContainer(item.items, itemDiv);
        } else {
          itemDiv.textContent = item;
        }
      });
    });
    container.appendChild(subsectionDiv);
  }
}

/**
 * 渲染子部分
 * @param {string} title - 子部分标题
 * @param {Object} obj - 子部分数据对象
 * @param {HTMLElement} container - 目标容器元素
 * @param {number} level - 嵌套层级
 * @param {Object} rootCharacterData - 根角色数据，用于条件可见性检查
 * @returns {void}
 */
function renderSubsection(
  title,
  obj,
  container,
  level,
  rootCharacterData = null,
) {
  // 特殊处理性爱部分的条件可见性
  if (title === "性爱" && rootCharacterData) {
    const shouldShow = shouldShowIntimacySection(rootCharacterData);

    const subsectionDiv = createSubsection(title, (contentContainer) => {
      if (shouldShow) {
        renderObject(obj, contentContainer, title, level + 1);
      } else {
        const placeholder = createIntimacyPlaceholder();
        contentContainer.appendChild(placeholder);
      }
    });
    container.appendChild(subsectionDiv);
  } else {
    // 普通子部分渲染
    const subsectionDiv = createSubsection(title, (contentContainer) => {
      renderObject(obj, contentContainer, title, level + 1);
    });
    container.appendChild(subsectionDiv);
  }
}

/**
 * 渲染角色卡片（特殊布局）
 * 分离直接字段和子部分，根据需要使用网格或瀑布流布局
 * @param {Object} obj - 角色数据对象
 * @param {HTMLElement} container - 目标容器元素
 * @param {string} sectionName - 分类名称
 * @param {string[]} order - 字段顺序数组
 * @param {Set} orderSet - 字段顺序 Set（用于快速查找）
 * @returns {void}
 */
function renderCharacterCard(obj, container, sectionName, order, orderSet) {
  // 分离直接字段和子部分
  const directFields = {};
  const subsections = {};

  const fieldsToProcess = order || Object.keys(obj);

  for (const fieldKey of fieldsToProcess) {
    if (obj.hasOwnProperty(fieldKey)) {
      const value = obj[fieldKey];
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        subsections[fieldKey] = value;
      } else {
        directFields[fieldKey] = value;
      }
    }
  }

  // 渲染直接字段
  for (const [key, value] of Object.entries(directFields)) {
    renderFieldByKey(key, value, container, 0, sectionName, obj);
  }

  // 如果有子部分，创建子部分网格
  if (Object.keys(subsections).length > 0) {
    const useMasonry = shouldUseMasonryLayout(subsections);
    let subsectionsContainer, addItemFunction;

    if (useMasonry) {
      const masonryGrid = createMasonryGrid();
      subsectionsContainer = masonryGrid.container;
      addItemFunction = masonryGrid.addItemSmart;
      subsectionsContainer._masonryGrid = masonryGrid;
    } else {
      subsectionsContainer = createDiv(CSS_CLASSES.SUBSECTIONS_GRID);
      addItemFunction = (item) => subsectionsContainer.appendChild(item);
    }

    // 渲染子部分
    for (const [key, value] of Object.entries(subsections)) {
      const cleanKey = cleanFieldName(key);

      if (isEquipmentObject(value)) {
        const equipmentContainer = createDiv();
        renderEquipmentObject(cleanKey, value, equipmentContainer);
        const equipmentCard = equipmentContainer.firstChild;
        if (equipmentCard) {
          addItemFunction(equipmentCard);
        }
      } else {
        // 特殊处理性爱部分的条件可见性
        if (cleanKey === "性爱") {
          const shouldShow = shouldShowIntimacySection(obj);

          const subsectionCard = createSubsection(
            cleanKey,
            (contentContainer) => {
              if (shouldShow) {
                renderObject(value, contentContainer, cleanKey, 1);
              } else {
                const placeholder = createIntimacyPlaceholder();
                contentContainer.appendChild(placeholder);
              }
            },
          );
          addItemFunction(subsectionCard);
        } else {
          // 普通子部分渲染
          const subsectionCard = createSubsection(
            cleanKey,
            (contentContainer) => {
              renderObject(value, contentContainer, cleanKey, 1);
            },
          );
          addItemFunction(subsectionCard);
        }
      }
    }

    container.appendChild(subsectionsContainer);

    // 强制重新布局（如果是瀑布流）
    if (useMasonry && subsectionsContainer._masonryGrid) {
      subsectionsContainer._masonryGrid.forceLayout();
    }
  }
}

/**
 * 主要的渲染对象函数
 * 根据嵌套层级和角色类型智能渲染数据
 * @param {Object} obj - 要渲染的数据对象
 * @param {HTMLElement} container - 目标容器元素
 * @param {string} sectionName - 分类名称
 * @param {number} [level=0] - 嵌套层级
 * @param {Object} [rootCharacterData=null] - 根角色数据，用于条件可见性检查
 * @returns {void}
 */
function renderObject(
  obj,
  container,
  sectionName,
  level = 0,
  rootCharacterData = null,
) {
  // 处理特殊字段合并
  const processedObj = processSpecialFields(obj);

  // 获取该部分的字段顺序和 Set
  const order = getFieldOrder(sectionName, obj);
  const orderSet = getFieldOrderSet(sectionName, obj);

  // 如果是顶级角色卡片，需要特殊处理子部分的布局
  const characterType = detectCharacterType(sectionName, obj);
  const isCharacterCard =
    level === 0 && (characterType === "user" || characterType === "woman");

  // 如果是顶级角色卡片，将当前对象作为rootCharacterData
  const currentRootData = isCharacterCard ? processedObj : rootCharacterData;

  if (isCharacterCard) {
    renderCharacterCard(processedObj, container, sectionName, order, orderSet);
  } else {
    // 普通渲染逻辑
    if (order && orderSet) {
      // 按预定义顺序渲染字段
      for (const fieldKey of order) {
        if (processedObj.hasOwnProperty(fieldKey)) {
          renderFieldByKey(
            fieldKey,
            processedObj[fieldKey],
            container,
            level,
            sectionName,
            processedObj,
            currentRootData,
          );
        }
      }

      // 渲染未在顺序中定义的字段（使用 Set 进行 O(1) 查找）
      for (const [key, value] of Object.entries(processedObj)) {
        if (!orderSet.has(key)) {
          renderFieldByKey(
            key,
            value,
            container,
            level,
            sectionName,
            processedObj,
            currentRootData,
          );
        }
      }
    } else {
      // 如果没有预定义顺序，按原始顺序渲染
      for (const [key, value] of Object.entries(processedObj)) {
        renderFieldByKey(
          key,
          value,
          container,
          level,
          sectionName,
          processedObj,
          currentRootData,
        );
      }
    }
  }
}

// 导出渲染相关功能
export {
  cleanFieldName,
  createElement,
  createDiv,
  createSpan,
  createSubsectionContainer,
  createTagContainer,
  createField,
  createSubsection,
  createMasonryGrid,
  shouldUseMasonryLayout,
  hasScrollbar,
  updateScrollMask,
  createWomanCardScrollContainer,
  generateCardTitle,
  processSpecialFields,
  isEquipmentObject,
  updateParentCollapsibleHeight,
  createCollapsibleCard,
  renderEquipmentObject,
  shouldHideField,
  shouldShowIntimacySection,
  createIntimacyPlaceholder,
  formatNumberWithCommas,
  renderFieldByKey,
  renderField,
  renderArray,
  renderSubsection,
  renderCharacterCard,
  renderObject,
  INTIMACY_VISIBILITY_CONFIG,
};
