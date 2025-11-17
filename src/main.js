/**
 * Alpine.js 主应用程序模块
 * 负责页面初始化和数据管理
 */

// 引入CSS
import "./style.css";

// 导入模块
import { detectCharacterType, addEmojiToFieldName } from "./fields.js";
import {
  loadData,
  getErrorMessage,
  getLoadingMessage,
} from "./modules/data-loader.js";
import { CHARACTER_TYPES, DATA_LOADING } from "./modules/constants.js";
import {
  shouldShowIntimacySection,
  INTIMACY_VISIBILITY_CONFIG,
  formatNumberWithCommas,
} from "./renderer.js";

// 导入工具模块
import {
  formatCurrency,
  cleanFieldName,
  getFieldDisplayValue,
  processSpecialFields,
} from "./utils/formatters.js";
import {
  shouldHideField,
  shouldShowIntimacy,
  getIntimacyPlaceholder,
} from "./utils/visibility.js";
import {
  getCardTitle,
  getDirectFields,
  getSubsections,
  isEquipmentObject,
} from "./utils/card-helpers.js";

/**
 * 主状态应用
 */
function statusApp() {
  return {
    // 状态数据
    loading: true,
    error: false,
    errorMessage: "",
    userName: null,
    userData: null,
    womanData: {},
    worldData: null,
    taskList: [],
    taskListCollapsed: true,
    pendingDeleteTaskId: null, // 待确认删除的任务 ID
    worldDateTime: "",
    worldWeatherColor: "text-accent-silver",
    worldWeatherEmoji: "⛅️",
    worldWeatherText: "",

    // 初始化函数
    async init() {
      try {
        this.loading = true;
        this.error = false;

        // 加载数据
        const data = await loadData();

        // 处理数据
        this.processData(data);

        this.loading = false;
        console.log("✓ Alpine.js 状态栏渲染完成");
      } catch (err) {
        console.error("✗ 初始化失败:", err);
        this.error = true;
        this.errorMessage = getErrorMessage(err);
        this.loading = false;
      }
    },

    // 处理数据
    processData(data) {
      // 处理世界数据
      if (data["世界"]) {
        this.worldData = data["世界"];
        this.formatWorldInfo();
      }

      // 查找用户数据
      for (const [sectionName, sectionData] of Object.entries(data)) {
        if (typeof sectionData === "object" && sectionData !== null) {
          const characterType = detectCharacterType(sectionName, sectionData);

          if (characterType === CHARACTER_TYPES.USER) {
            this.userName = sectionName;
            this.userData = this.processCharacterData(sectionData);
            this.processTaskList(this.userData);
          }
        }
      }

      // 处理女性角色数据
      const womanKey = DATA_LOADING.WOMAN_SECTION_KEY;
      if (data[womanKey]) {
        const processedWomanData = {};
        for (const [characterName, characterData] of Object.entries(
          data[womanKey],
        )) {
          processedWomanData[characterName] =
            this.processCharacterData(characterData);
        }
        this.womanData = processedWomanData;
      }
    },

    // 处理角色数据，应用特殊字段处理
    processCharacterData(characterData) {
      const processed = { ...characterData };

      // 递归处理所有子对象
      for (const [key, value] of Object.entries(processed)) {
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          processed[key] = processSpecialFields(value);
        }
      }

      // 处理根级别的特殊字段
      return processSpecialFields(processed);
    },

    // 处理任务列表（支持数组和对象两种格式）
    processTaskList(userData) {
      // 查找拍摄任务数据
      for (const [key, value] of Object.entries(userData)) {
        if (key.includes("拍摄任务")) {
          if (Array.isArray(value)) {
            // 测试环境：数组格式
            this.taskList = value.map((task, index) => ({
              ...task,
              _taskId: index.toString(),
            }));
          } else if (typeof value === "object" && value !== null) {
            // 生产环境：对象格式（用字符串作为键）
            // 将对象转换为数组，保留原始 key 作为 _taskId
            this.taskList = Object.entries(value).map(
              ([taskKey, taskValue]) => ({
                ...taskValue,
                _taskId: taskKey,
              }),
            );
          }
          break;
        }
      }
    },

    // 格式化数字
    formatNumber(num) {
      if (typeof num === "number") {
        return formatNumberWithCommas(num);
      }
      return num;
    },

    // 添加emoji到字段名
    addEmoji(fieldName) {
      return addEmojiToFieldName(fieldName);
    },

    // 格式化资金
    formatCurrency(num) {
      return formatCurrency(num);
    },

    // 清理字段名（移除类型前缀）
    cleanFieldName(fieldName) {
      return cleanFieldName(fieldName);
    },

    // 检查字段是否应该隐藏
    shouldHideField(fieldName, sectionName) {
      return shouldHideField(fieldName, sectionName);
    },

    // 获取字段显示值
    getFieldDisplayValue(fieldName, value, parentData) {
      return getFieldDisplayValue(fieldName, value, parentData);
    },

    // 检查性爱部分是否可见
    shouldShowIntimacy(characterData) {
      return shouldShowIntimacy(characterData);
    },

    // 获取性爱部分占位符文本
    getIntimacyPlaceholder() {
      return getIntimacyPlaceholder();
    },

    // 根据天气关键词判断天气类型
    analyzeWeather(weatherText) {
      const text = weatherText.toLowerCase();

      // 定义天气关键词和对应的颜色、emoji
      const weatherPatterns = [
        {
          keywords: ["晴", "晴朗", "晴天", "阳光", "万里"],
          color: "text-amber-300",
          emoji: "☀️",
        },
        {
          keywords: ["雨", "下雨", "雨天", "淋雨"],
          color: "text-blue-400",
          emoji: "🌧️",
        },
        {
          keywords: ["雪", "下雪", "飘雪", "雪花"],
          color: "text-cyan-200",
          emoji: "❄️",
        },
        {
          keywords: ["云", "阴", "阴沉", "乌云", "多云"],
          color: "text-gray-300",
          emoji: "☁️",
        },
        {
          keywords: ["暴雨", "大雨", "暴风", "雷电", "闪电"],
          color: "text-blue-600",
          emoji: "⛈️",
        },
        {
          keywords: ["雾", "雾霾", "朦胧"],
          color: "text-gray-400",
          emoji: "🌫️",
        },
        {
          keywords: ["热", "炎热", "酷热", "烈日"],
          color: "text-red-400",
          emoji: "🔥",
        },
        {
          keywords: ["冷", "寒冷", "冰冷", "刺骨"],
          color: "text-blue-300",
          emoji: "❄️",
        },
        {
          keywords: ["温暖", "舒适", "宜人"],
          color: "text-green-300",
          emoji: "🌤️",
        },
        {
          keywords: ["风", "有风", "微风", "大风"],
          color: "text-purple-300",
          emoji: "💨",
        },
      ];

      // 匹配关键词，返回第一个匹配的结果
      for (const pattern of weatherPatterns) {
        if (pattern.keywords.some((keyword) => text.includes(keyword))) {
          return pattern;
        }
      }

      // 默认值
      return {
        color: "text-accent-silver",
        emoji: "⛅️",
      };
    },

    // 格式化世界信息显示
    formatWorldInfo() {
      if (!this.worldData) return;

      const { 时间, 地点, 天气 } = this.worldData;
      if (!时间 || !地点 || !天气) return;

      // 解析ISO8601时间格式
      const dateObj = new Date(时间);

      // 检查是否为有效日期
      if (isNaN(dateObj.getTime())) return;

      // 格式化日期和时间
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const date = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");

      // 获取星期
      const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
      const weekDay = weekDays[dateObj.getDay()];

      // 检查时区（是否不在中国）
      // 中国时区是+0800，如果时间戳中不同则显示时区
      const timezoneStr = 时间.includes("+")
        ? 时间.match(/([+-]\d{2}):?(\d{2})$/)?.[0]
        : null;
      const isChinaTimezone =
        !timezoneStr || timezoneStr === "+08:00" || timezoneStr === "+0800";
      const timezoneDisplay =
        !isChinaTimezone && timezoneStr ? ` (${timezoneStr})` : "";

      // 分别生成日期时间和位置信息，天气单独一行
      this.worldDateTime = `📅 ${year}-${month}-${date} 星期${weekDay} ${hours}:${minutes}${timezoneDisplay} 📍 ${地点}`;

      // 根据天气内容分析并应用颜色和emoji
      const weatherAnalysis = this.analyzeWeather(天气);
      this.worldWeatherColor = weatherAnalysis.color;
      this.worldWeatherEmoji = weatherAnalysis.emoji;
      this.worldWeatherText = 天气;
    },

    // 删除拍摄任务 - 二次确认机制
    async deleteTask(taskId) {
      try {
        if (!taskId) {
          console.error("❌ 任务ID无效");
          return;
        }

        // 检查是否是第一次点击（需要确认）
        if (this.pendingDeleteTaskId !== taskId) {
          console.log(`⚠️ 待删除任务: ${taskId}，请再次点击确认`);
          this.pendingDeleteTaskId = taskId;
          // 2秒后自动取消确认状态
          setTimeout(() => {
            if (this.pendingDeleteTaskId === taskId) {
              this.pendingDeleteTaskId = null;
              console.log(`ℹ️ 删除确认已取消: ${taskId}`);
            }
          }, 3000);
          return;
        }

        // 第二次点击，执行删除
        console.log(`🗑️ 删除任务: ${taskId}`);

        // 调用 STScript 执行删除操作
        if (typeof STscript !== "undefined") {
          // 1. 获取当前的拍摄任务对象
          const tasksJsonStr = await STscript(
            `/xbgetvar 状态栏.{{user}}.拍摄任务`,
          );
          console.log({ tasksJsonStr });
          const tasksData =
            typeof tasksJsonStr === "string"
              ? JSON.parse(tasksJsonStr)
              : tasksJsonStr;

          if (!tasksData || typeof tasksData !== "object") {
            console.error("❌ 无法获取拍摄任务数据");
            this.pendingDeleteTaskId = null;
            return;
          }

          // 2. 从拍摄任务对象中删除对应的key
          delete tasksData[taskId];
          console.log(`✓ 从对象中删除任务key: ${taskId}`);

          // 3. 将修改后的拍摄任务对象重新设置回酒馆
          const updatedTasksJson = JSON.stringify(tasksData);
          console.log({ tasksData, updatedTasksJson });
          await STscript(
            `/xbsetvar key="$free 状态栏.{{user}}.拍摄任务" ${updatedTasksJson}`,
          );
          console.log("✓ 任务删除成功，已更新到酒馆");

          // 从本地任务列表中移除
          this.taskList = this.taskList.filter(
            (task) => task._taskId !== taskId,
          );
          // 清除待删除状态
          this.pendingDeleteTaskId = null;
        } else {
          console.error("❌ STScript API 不可用");
        }
      } catch (error) {
        console.error("❌ 删除任务失败:", error);
        this.pendingDeleteTaskId = null;
      }
    },

    // 获取任务状态的显示信息（文字、颜色、emoji）
    getTaskStatusDisplay(status) {
      const statusMap = {
        未开始: {
          emoji: "⏳",
          text: "未开始",
          bgClass: "bg-gray-700/40",
          textClass: "text-gray-300",
          borderClass: "border-gray-600/50",
        },
        进行中: {
          emoji: "⚙️",
          text: "进行中",
          bgClass: "bg-blue-700/40",
          textClass: "text-blue-300",
          borderClass: "border-blue-600/50",
        },
        已完成: {
          emoji: "✅",
          text: "已完成",
          bgClass: "bg-green-700/40",
          textClass: "text-green-300",
          borderClass: "border-green-600/50",
        },
        已取消: {
          emoji: "❌",
          text: "已取消",
          bgClass: "bg-orange-700/40",
          textClass: "text-orange-300",
          borderClass: "border-orange-600/50",
        },
      };

      return statusMap[status] || statusMap["未开始"];
    },
  };
}

/**
 * 角色卡片组件
 */
function characterCard(characterData, characterName, characterType) {
  return {
    data: characterData,
    name: characterName,
    type: characterType,
    collapsed: true,
    equipmentCollapsed: true,

    // 获取卡片标题
    getCardTitle() {
      return getCardTitle(this.name, this.type, this.data);
    },

    // 清理字段名
    cleanFieldName(fieldName) {
      const match = fieldName.match(/^\$[^\s]*\s+(.+)$/);
      return match ? match[1] : fieldName;
    },

    // 添加emoji到字段名
    addEmoji(fieldName) {
      return addEmojiToFieldName(fieldName);
    },

    // 获取直接字段
    getDirectFields() {
      return getDirectFields(this.data);
    },

    // 获取子部分
    getSubsections() {
      return getSubsections(this.data);
    },

    // 检查是否为器材对象
    isEquipmentObject(obj) {
      return isEquipmentObject(obj);
    },

    // 获取字段显示值
    getFieldDisplayValue(fieldName, value, sectionData = null) {
      return getFieldDisplayValue(fieldName, value, this.data, sectionData);
    },

    // 检查字段是否应该隐藏
    shouldHideField(fieldName, sectionName = "") {
      return shouldHideField(fieldName, sectionName);
    },

    // 检查性爱部分是否可见
    shouldShowIntimacy() {
      return shouldShowIntimacy(this.data);
    },

    // 获取性爱部分占位符文本
    getIntimacyPlaceholder() {
      return getIntimacyPlaceholder();
    },

    // 渲染角色卡片HTML
    renderCharacterCard() {
      return `
        <div class="bg-surface-primary border border-border-subtle rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
          <div
            class="flex items-center justify-between cursor-pointer select-none p-3 rounded-[var(--radius-element)] hover:bg-surface-black transition-colors duration-200"
            @click="collapsed = !collapsed"
          >
            <h2 class="text-accent-amber font-semibold text-left text-md tracking-wide flex items-center">${this.getCardTitle()}</h2>
            <span
              class="text-accent-silver text-xs font-bold transition-transform duration-200 ease-in-out"
              :class="collapsed ? 'rotate-45' : 'rotate-0'"
            >✕</span>
          </div>
          <div
            class="collapsible-content"
            :style="collapsed ? 'grid-template-rows: 0fr' : 'grid-template-rows: 1fr'"
          >
            <div class="min-h-0 overflow-hidden">
              <div class="woman-card-scroll-container">
                <div class="woman-card-content">
                  <div class="flex flex-col gap-2.5 p-3">
                    ${this.renderDirectFields()}
                    ${this.renderEquipmentCards()}
                    ${this.renderSubsections()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 渲染直接字段
    renderDirectFields() {
      const fields = this.getDirectFields();
      return Object.entries(fields)
        .map(([fieldName, value]) => {
          if (this.shouldHideField(fieldName)) return "";

          const cleanName = this.cleanFieldName(fieldName);
          const displayValue = this.getFieldDisplayValue(fieldName, value);
          const label = this.addEmoji(cleanName);

          if (Array.isArray(value)) {
            const tags = value
              .map((item) => `<span class="tag-base">${item}</span>`)
              .join("");
            return `
            <div class="field-container">
              <div class="field-label">${label}:</div>
              <div class="field-value">
                <div class="tag-container">${tags}</div>
              </div>
            </div>
          `;
          } else {
            // 检查是否包含HTML标签（如想法字段的<em>）
            const isHtml =
              typeof displayValue === "string" && displayValue.includes("<");
            return `
            <div class="field-container">
              <div class="field-label">${label}:</div>
              <div class="field-value">${displayValue}</div>
            </div>
          `;
          }
        })
        .join("");
    },

    // 渲染器材卡片
    renderEquipmentCards() {
      const subsections = this.getSubsections();
      return Object.entries(subsections)
        .map(([sectionName, sectionData]) => {
          if (!this.isEquipmentObject(sectionData)) return "";

          const cleanName = this.cleanFieldName(sectionName);
          const title = this.addEmoji(cleanName);
          const categories = Object.entries(sectionData)
            .map(([categoryName, items]) => {
              const cleanCategoryName = this.cleanFieldName(categoryName);
              const categoryTitle = this.addEmoji(cleanCategoryName);
              const isOther = cleanCategoryName === "其他";
              const tags = items
                .map((item) => `<span class="tag-base">${item}</span>`)
                .join("");

              return `
            <div class="bg-gradient-to-br from-surface-secondary to-surface-accent border border-border-subtle p-2.5 rounded-[var(--radius-element)] ${isOther ? "lg:col-span-2" : ""}">
              <div class="text-accent-red font-semibold mb-2 text-sm tracking-wide uppercase">${categoryTitle}</div>
              <div class="tag-container">${tags}</div>
            </div>
          `;
            })
            .join("");

          return `
          <div class="bg-surface-primary border border-border-subtle rounded-[var(--radius-card)] shadow-[var(--shadow-card)] mt-3">
            <div
              class="flex items-center justify-between cursor-pointer select-none p-3 rounded-[var(--radius-element)] hover:bg-surface-black transition-colors duration-200"
              @click="equipmentCollapsed = !equipmentCollapsed"
            >
              <h3 class="text-accent-amber font-semibold text-left text-md tracking-wide flex items-center">${title}</h3>
              <span
                class="text-accent-silver text-xs font-bold transition-transform duration-200 ease-in-out"
                :class="equipmentCollapsed ? 'rotate-45' : 'rotate-0'"
              >✕</span>
            </div>
            <div
              class="collapsible-content"
              :style="equipmentCollapsed ? 'grid-template-rows: 0fr' : 'grid-template-rows: 1fr'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="p-3">
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    ${categories}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    },

    // 渲染子部分
    renderSubsections() {
      const subsections = this.getSubsections();
      const nonEquipmentSections = Object.entries(subsections).filter(
        ([_, sectionData]) => !this.isEquipmentObject(sectionData),
      );

      if (nonEquipmentSections.length === 0) return "";

      const sections = nonEquipmentSections
        .map(([sectionName, sectionData]) => {
          const cleanName = this.cleanFieldName(sectionName);
          const title = this.addEmoji(cleanName);

          // 性爱部分特殊处理
          if (cleanName === "性爱" && !this.shouldShowIntimacy()) {
            return `
            <div class="masonry-item">
              <div class="bg-surface-accent border border-border-accent p-3 rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)] flex flex-col gap-2">
                <h3 class="text-accent-amber font-semibold text-left text-md tracking-wide flex items-center">${title}</h3>
                <div class="text-center py-8 text-text-muted">${this.getIntimacyPlaceholder()}</div>
              </div>
            </div>
          `;
          }

          // 普通子部分
          const fields = Object.entries(sectionData)
            .map(([fieldName, value]) => {
              if (this.shouldHideField(fieldName, cleanName)) return "";

              const cleanFieldName = this.cleanFieldName(fieldName);
              const fieldLabel = this.addEmoji(cleanFieldName);
              const displayValue = getFieldDisplayValue(
                fieldName,
                value,
                this.data,
                sectionData,
              );

              if (Array.isArray(value)) {
                const tags = value
                  .map((item) => `<span class="tag-base">${item}</span>`)
                  .join("");
                return `
              <div class="field-container">
                <div class="field-label">${fieldLabel}:</div>
                <div class="field-value">
                  <div class="tag-container">${tags}</div>
                </div>
              </div>
            `;
              } else {
                return `
              <div class="field-container">
                <div class="field-label">${fieldLabel}:</div>
                <div class="field-value">${displayValue}</div>
              </div>
            `;
              }
            })
            .join("");

          return `
          <div class="masonry-item">
            <div class="bg-surface-accent border border-border-accent p-3 rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)] flex flex-col gap-2">
              <h3 class="text-accent-amber font-semibold text-left text-md tracking-wide flex items-center">${title}</h3>
              ${fields}
            </div>
          </div>
        `;
        })
        .join("");

      return `<div class="masonry-grid mt-3">${sections}</div>`;
    },
  };
}

// 将函数暴露到全局作用域供Alpine.js使用
window.statusApp = statusApp;
window.characterCard = characterCard;
