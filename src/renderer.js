// 渲染功能模块
import { CSS_CLASSES, TAG_CLASSES, COLLAPSIBLE_CLASSES } from './css-constants.js';
import { 
  addEmojiToFieldName, 
  detectCharacterType, 
  getFieldOrder, 
  getFieldOrderSet 
} from './fields.js';

// 处理字段名，移除所有$开始的前缀
function cleanFieldName(fieldName) {
  // 匹配所有以$开始的前缀，直到遇到空格，然后获取空格后的内容
  const match = fieldName.match(/^\$[^\s]*\s+(.+)$/);
  return match ? match[1] : fieldName;
}

// 通用DOM元素创建函数
function createElement(tag, className, textContent, parent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  if (parent) parent.appendChild(element);
  return element;
}

// 创建div元素的快捷函数
function createDiv(className, textContent, parent) {
  return createElement("div", className, textContent, parent);
}

// 创建span元素的快捷函数
function createSpan(className, textContent, parent) {
  return createElement("span", className, textContent, parent);
}

// 创建子部分容器和标题
function createSubsectionContainer(title, cardClass, titleClass, useEmoji = true) {
  const container = createDiv(cardClass);
  const titleElement = createDiv(titleClass, useEmoji ? addEmojiToFieldName(title) : title, container);
  const contentContainer = createDiv(CSS_CLASSES.CONTENT_CONTAINER, null, container);
  
  return { container, titleElement, contentContainer };
}

// 创建标签容器
function createTagContainer(items, parent) {
  const tagContainer = createDiv(TAG_CLASSES.CONTAINER, null, parent);
  items.forEach((item) => {
    createSpan(TAG_CLASSES.BASE, item, tagContainer);
  });
  return tagContainer;
}

// 创建字段显示
function createField(name, value, isArray = false) {
  const fieldDiv = createDiv(CSS_CLASSES.FIELD_CONTAINER);
  const nameSpan = createSpan("field-label", addEmojiToFieldName(name) + ":", fieldDiv);

  if (isArray) {
    const valueDiv = createDiv("field-value");
    createTagContainer(value, valueDiv);
    fieldDiv.appendChild(valueDiv);
  } else {
    const valueSpan = createSpan("field-value", null, fieldDiv);
    
    // 特殊处理想法字段
    if (name === "想法") {
      const em = createElement("em", null, value, valueSpan);
    } else {
      valueSpan.textContent = value;
    }
  }

  return fieldDiv;
}

// 创建子部分
function createSubsection(title, renderCallback) {
  const { container, contentContainer } = createSubsectionContainer(
    title, 
    CSS_CLASSES.SUBSECTION_CARD, 
    CSS_CLASSES.SECTION_TITLE
  );
  renderCallback(contentContainer);
  return container;
}

// 创建瀑布流布局管理器
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

// 检查是否需要多列布局
function shouldUseMasonryLayout(subsections) {
  return Object.keys(subsections).length >= 3;
}

// 检查是否有滚动条
function hasScrollbar(element) {
  return element ? element.scrollHeight > element.clientHeight : false;
}

// 更新滚动遮罩状态
function updateScrollMask(container, content) {
  if (!container || !content) return;
  
  if (hasScrollbar(content)) {
    container.classList.add("has-overflow");
  } else {
    container.classList.remove("has-overflow");
  }
}

// 创建女性角色卡片滚动容器
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
  observer.observe(contentDiv, { childList: true, subtree: true, attributes: true });

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

// 生成卡片标题
function generateCardTitle(sectionName, sectionData) {
  // 使用角色类型检测
  const characterType = detectCharacterType(sectionName, sectionData);

  if (characterType === "woman" && sectionData) {
    // 查找昵称和全名
    const nickname = sectionData["昵称"] || sectionData["nickname"];
    const fullName =
      sectionData["真名"] ||
      sectionData["全名"] ||
      sectionData["姓名"] ||
      sectionData["名字"];

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

// 处理特殊字段合并和格式化
function processSpecialFields(obj) {
  const processed = { ...obj };

  // 处理昵称和真名合并
  if (processed["昵称"] && processed["真名"]) {
    const nickname = processed["昵称"];
    const realName = processed["真名"];
    processed["名字"] = `${nickname} (${realName})`;
    delete processed["昵称"];
    delete processed["真名"];
  }

  // 处理三围合并
  if (processed["胸围"] && processed["腰围"] && processed["臀围"]) {
    const bust = processed["胸围"];
    const waist = processed["腰围"];
    const hip = processed["臀围"];
    processed["三围"] = `${bust}-${waist}-${hip} cm`;
    delete processed["胸围"];
    delete processed["腰围"];
    delete processed["臀围"];
  }

  // 处理身高单位
  if (processed["身高"]) {
    processed["身高"] = processed["身高"] + " cm";
  }

  // 处理体重单位
  if (processed["体重"]) {
    processed["体重"] = processed["体重"] + " kg";
  }

  return processed;
}

// 检查是否为器材对象格式
function isEquipmentObject(obj) {
  // 检查对象的所有值是否都是数组（新格式：{categoryname: [items...]})
  const values = Object.values(obj);
  const keys = Object.keys(obj);

  // 所有值都是数组
  const allValuesAreArrays = values.length > 0 && values.every((value) => Array.isArray(value));

  // 包含器材相关的关键字
  const hasEquipmentKeywords = keys.some((key) =>
    key.includes("机身") ||
    key.includes("镜头") ||
    key.includes("灯光") ||
    key.includes("配件") ||
    key.includes("其他") ||
    key.includes("设备")
  );

  return allValuesAreArrays && (hasEquipmentKeywords || keys.length >= 3);
}

// 更新父级可折叠容器的高度
function updateParentCollapsibleHeight(element) {
  let current = element;
  while (current && current.parentElement) {
    current = current.parentElement;
    if (current.classList && current.classList.contains("collapsible-content") &&
        current.style.maxHeight && current.style.maxHeight !== "0px") {
      current.style.maxHeight = current.scrollHeight + "px";
    }
  }
}

// 创建可折叠卡片
function createCollapsibleCard(
  title,
  content,
  initiallyCollapsed = true,
  customStyles = {}
) {
  // 创建卡片容器
  const cardDiv = document.createElement("div");
  cardDiv.className =
    customStyles.cardClass ||
    "bg-[var(--color-surface-accent)] border border-[var(--color-border-accent)] rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)]";

  // 创建可点击的标题容器（包含padding，整个区域可点击）
  const titleContainer = document.createElement("div");
  titleContainer.className = CSS_CLASSES.COLLAPSIBLE_TITLE;

  // 创建标题文本
  const titleDiv = document.createElement("div");
  titleDiv.className = customStyles.titleClass || CSS_CLASSES.SECTION_TITLE;
  titleDiv.textContent = customStyles.useRawTitle ? title : addEmojiToFieldName(title);

  // 创建折叠图标
  const collapseIcon = document.createElement("div");
  collapseIcon.className = CSS_CLASSES.COLLAPSE_ICON;
  collapseIcon.textContent = "✕";

  titleContainer.appendChild(titleDiv);
  titleContainer.appendChild(collapseIcon);
  cardDiv.appendChild(titleContainer);

  // 创建内容容器
  const contentContainer = document.createElement("div");
  contentContainer.className = COLLAPSIBLE_CLASSES.CONTENT;
  contentContainer.appendChild(content);
  cardDiv.appendChild(contentContainer);

  // 折叠状态管理
  let isCollapsed = initiallyCollapsed;

  function updateContentHeight() {
    if (!isCollapsed) {
      contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";

      // 检查是否有女性角色卡片滚动容器，更新其遮罩状态
      const scrollContainer = contentContainer.querySelector(".woman-card-scroll-container");
      const scrollContent = scrollContainer?.querySelector(".woman-card-content");
      if (scrollContainer && scrollContent) {
        updateScrollMask(scrollContainer, scrollContent);
      }
    }
  }

  // 点击事件处理
  titleContainer.addEventListener("click", () => {
    isCollapsed = !isCollapsed;

    if (isCollapsed) {
      contentContainer.style.maxHeight = "0px";
      collapseIcon.style.transform = "rotate(45deg)";
    } else {
      updateContentHeight();
      collapseIcon.style.transform = "rotate(0deg)";
    }

    // 延迟更新父级高度，确保动画完成
    setTimeout(() => {
      updateParentCollapsibleHeight(contentContainer);
    }, 25);

    // 再次延迟更新，确保所有动画和布局完成
    setTimeout(() => {
      updateParentCollapsibleHeight(contentContainer);
      updateContentHeight();
    }, 100);
  });

  // 窗口大小变化时更新高度
  const handleResize = () => {
    setTimeout(() => {
      updateContentHeight();
      updateParentCollapsibleHeight(contentContainer);
    }, 100);
  };
  window.addEventListener("resize", handleResize);

  // 清理函数
  cardDiv._cleanup = () => {
    window.removeEventListener("resize", handleResize);
  };

  // 初始化状态
  setTimeout(() => {
    if (isCollapsed) {
      contentContainer.style.maxHeight = "0px";
      collapseIcon.style.transform = "rotate(45deg)";
    } else {
      updateContentHeight();
      collapseIcon.style.transform = "rotate(0deg)";
    }
  }, 0);

  return cardDiv;
}

// 渲染器材对象
function renderEquipmentObject(title, obj, container) {
  const equipmentGrid = document.createElement("div");
  equipmentGrid.className = CSS_CLASSES.EQUIPMENT_GRID;

  // 分离"其他"类别和前4类
  const entries = Object.entries(obj);
  const otherEntries = entries.filter(([categoryName]) => categoryName === "其他");
  const regularEntries = entries.filter(([categoryName]) => categoryName !== "其他");

  // 渲染前4类（或所有非"其他"类别）
  regularEntries.forEach(([categoryName, items]) => {
    const itemDiv = createDiv(CSS_CLASSES.EQUIPMENT_ITEM, null, equipmentGrid);
    createDiv(CSS_CLASSES.CATEGORY_TITLE, addEmojiToFieldName(categoryName), itemDiv);
    createTagContainer(items, itemDiv);
  });

  // 渲染"其他"类别（如果存在），占据全宽
  otherEntries.forEach(([categoryName, items]) => {
    const itemDiv = createDiv(CSS_CLASSES.EQUIPMENT_ITEM_FULL, null, equipmentGrid);
    createDiv(CSS_CLASSES.CATEGORY_TITLE, addEmojiToFieldName(categoryName), itemDiv);
    createTagContainer(items, itemDiv);
  });

  const collapsibleCard = createCollapsibleCard(title, equipmentGrid, true);
  container.appendChild(collapsibleCard);
}

// 渲染字段（根据类型）
function renderFieldByKey(key, value, container, level) {
  const cleanKey = cleanFieldName(key);

  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      renderArray(cleanKey, value, container);
    } else if (isEquipmentObject(value)) {
      // 特殊处理器材对象格式 {categoryname: [items...], categoryname2: [items...], ...}
      renderEquipmentObject(cleanKey, value, container);
    } else {
      renderSubsection(cleanKey, value, container, level);
    }
  } else {
    renderField(cleanKey, value, container);
  }
}

// 渲染普通字段
function renderField(name, value, container) {
  const fieldDiv = createField(name, value, Array.isArray(value));
  container.appendChild(fieldDiv);
}

// 渲染数组
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
        const itemDiv = createDiv(CSS_CLASSES.ARRAY_ITEM, null, contentContainer);

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

// 渲染子部分
function renderSubsection(title, obj, container, level) {
  const subsectionDiv = createSubsection(title, (contentContainer) => {
    renderObject(obj, contentContainer, title, level + 1);
  });
  container.appendChild(subsectionDiv);
}

// 渲染角色卡片（特殊布局）
function renderCharacterCard(obj, container, sectionName, order, orderSet) {
  // 分离直接字段和子部分
  const directFields = {};
  const subsections = {};

  const fieldsToProcess = order || Object.keys(obj);

  for (const fieldKey of fieldsToProcess) {
    if (obj.hasOwnProperty(fieldKey)) {
      const value = obj[fieldKey];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        subsections[fieldKey] = value;
      } else {
        directFields[fieldKey] = value;
      }
    }
  }

  // 渲染直接字段
  for (const [key, value] of Object.entries(directFields)) {
    renderFieldByKey(key, value, container, 0);
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
        const subsectionCard = createSubsection(cleanKey, (contentContainer) => {
          renderObject(value, contentContainer, cleanKey, 1);
        });
        addItemFunction(subsectionCard);
      }
    }

    container.appendChild(subsectionsContainer);

    // 强制重新布局（如果是瀑布流）
    if (useMasonry && subsectionsContainer._masonryGrid) {
      subsectionsContainer._masonryGrid.forceLayout();
    }
  }
}

// 主要的渲染对象函数
function renderObject(obj, container, sectionName, level = 0) {
  // 处理特殊字段合并
  const processedObj = processSpecialFields(obj);

  // 获取该部分的字段顺序和Set
  const order = getFieldOrder(sectionName, obj);
  const orderSet = getFieldOrderSet(sectionName, obj);

  // 如果是顶级角色卡片，需要特殊处理子部分的布局
  const characterType = detectCharacterType(sectionName, obj);
  const isCharacterCard =
    level === 0 && (characterType === "user" || characterType === "woman");

  if (isCharacterCard) {
    renderCharacterCard(processedObj, container, sectionName, order, orderSet);
  } else {
    // 普通渲染逻辑
    if (order && orderSet) {
      // 按预定义顺序渲染字段
      for (const fieldKey of order) {
        if (processedObj.hasOwnProperty(fieldKey)) {
          renderFieldByKey(fieldKey, processedObj[fieldKey], container, level);
        }
      }

      // 渲染未在顺序中定义的字段（使用Set进行O(1)查找）
      for (const [key, value] of Object.entries(processedObj)) {
        if (!orderSet.has(key)) {
          renderFieldByKey(key, value, container, level);
        }
      }
    } else {
      // 如果没有预定义顺序，按原始顺序渲染
      for (const [key, value] of Object.entries(processedObj)) {
        renderFieldByKey(key, value, container, level);
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
  renderFieldByKey,
  renderField,
  renderArray,
  renderSubsection,
  renderCharacterCard,
  renderObject,
};
