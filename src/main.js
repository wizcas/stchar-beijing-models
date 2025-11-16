/**
 * Alpine.js 主应用程序模块
 * 负责页面初始化和数据管理
 */

// 引入CSS
import "./style.css";

// 导入模块
import { detectCharacterType, addEmojiToFieldName } from './fields.js';
import {
  loadData,
  getErrorMessage,
  getLoadingMessage,
} from './modules/data-loader.js';
import { CHARACTER_TYPES, DATA_LOADING } from './modules/constants.js';
import {
  shouldShowIntimacySection,
  INTIMACY_VISIBILITY_CONFIG,
  formatNumberWithCommas
} from './renderer.js';

// 导入工具模块
import { formatCurrency, cleanFieldName, getFieldDisplayValue, processSpecialFields } from './utils/formatters.js';
import { shouldHideField, shouldShowIntimacy, getIntimacyPlaceholder } from './utils/visibility.js';
import { getCardTitle, getDirectFields, getSubsections, isEquipmentObject } from './utils/card-helpers.js';

/**
 * 主状态应用
 */
function statusApp() {
  return {
    // 状态数据
    loading: true,
    error: false,
    errorMessage: '',
    userName: null,
    userData: null,
    womanData: {},
    taskList: [],
    taskListCollapsed: true,

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
        console.log('✓ Alpine.js 状态栏渲染完成');
      } catch (err) {
        console.error('✗ 初始化失败:', err);
        this.error = true;
        this.errorMessage = getErrorMessage(err);
        this.loading = false;
      }
    },

    // 处理数据
    processData(data) {
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
        for (const [characterName, characterData] of Object.entries(data[womanKey])) {
          processedWomanData[characterName] = this.processCharacterData(characterData);
        }
        this.womanData = processedWomanData;
      }
    },

    // 处理角色数据，应用特殊字段处理
    processCharacterData(characterData) {
      const processed = { ...characterData };

      // 递归处理所有子对象
      for (const [key, value] of Object.entries(processed)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          processed[key] = processSpecialFields(value);
        }
      }

      // 处理根级别的特殊字段
      return processSpecialFields(processed);
    },

    // 处理任务列表
    processTaskList(userData) {
      // 查找拍摄任务数据
      for (const [key, value] of Object.entries(userData)) {
        if (key.includes('拍摄任务') && Array.isArray(value)) {
          this.taskList = value;
          break;
        }
      }
    },

    // 格式化数字
    formatNumber(num) {
      if (typeof num === 'number') {
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
    }
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
    shouldHideField(fieldName, sectionName = '') {
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
              class="text-accent-silver text-lg font-bold transition-transform duration-200 ease-in-out"
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
      return Object.entries(fields).map(([fieldName, value]) => {
        if (this.shouldHideField(fieldName)) return '';

        const cleanName = this.cleanFieldName(fieldName);
        const displayValue = this.getFieldDisplayValue(fieldName, value);
        const label = this.addEmoji(cleanName);

        if (Array.isArray(value)) {
          const tags = value.map(item => `<span class="tag-base">${item}</span>`).join('');
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
          const isHtml = typeof displayValue === 'string' && displayValue.includes('<');
          return `
            <div class="field-container">
              <div class="field-label">${label}:</div>
              <div class="field-value">${displayValue}</div>
            </div>
          `;
        }
      }).join('');
    },

    // 渲染器材卡片
    renderEquipmentCards() {
      const subsections = this.getSubsections();
      return Object.entries(subsections).map(([sectionName, sectionData]) => {
        if (!this.isEquipmentObject(sectionData)) return '';

        const cleanName = this.cleanFieldName(sectionName);
        const title = this.addEmoji(cleanName);
        const categories = Object.entries(sectionData).map(([categoryName, items]) => {
          const cleanCategoryName = this.cleanFieldName(categoryName);
          const categoryTitle = this.addEmoji(cleanCategoryName);
          const isOther = cleanCategoryName === '其他';
          const tags = items.map(item => `<span class="tag-base">${item}</span>`).join('');

          return `
            <div class="bg-gradient-to-br from-surface-secondary to-surface-accent border border-border-subtle p-2.5 rounded-[var(--radius-element)] ${isOther ? 'lg:col-span-2' : ''}">
              <div class="text-accent-red font-semibold mb-2 text-sm tracking-wide uppercase">${categoryTitle}</div>
              <div class="tag-container">${tags}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="bg-surface-primary border border-border-subtle rounded-[var(--radius-card)] shadow-[var(--shadow-card)] mt-3">
            <div
              class="flex items-center justify-between cursor-pointer select-none p-3 rounded-[var(--radius-element)] hover:bg-surface-black transition-colors duration-200"
              @click="equipmentCollapsed = !equipmentCollapsed"
            >
              <h3 class="text-accent-amber font-semibold text-left text-md tracking-wide flex items-center">${title}</h3>
              <span
                class="text-accent-silver text-lg font-bold transition-transform duration-200 ease-in-out"
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
      }).join('');
    },

    // 渲染子部分
    renderSubsections() {
      const subsections = this.getSubsections();
      const nonEquipmentSections = Object.entries(subsections).filter(([_, sectionData]) =>
        !this.isEquipmentObject(sectionData)
      );

      if (nonEquipmentSections.length === 0) return '';

      const sections = nonEquipmentSections.map(([sectionName, sectionData]) => {
        const cleanName = this.cleanFieldName(sectionName);
        const title = this.addEmoji(cleanName);

        // 性爱部分特殊处理
        if (cleanName === '性爱' && !this.shouldShowIntimacy()) {
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
        const fields = Object.entries(sectionData).map(([fieldName, value]) => {
          if (this.shouldHideField(fieldName, cleanName)) return '';

          const cleanFieldName = this.cleanFieldName(fieldName);
          const fieldLabel = this.addEmoji(cleanFieldName);
          const displayValue = getFieldDisplayValue(fieldName, value, this.data, sectionData);

          if (Array.isArray(value)) {
            const tags = value.map(item => `<span class="tag-base">${item}</span>`).join('');
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
        }).join('');

        return `
          <div class="masonry-item">
            <div class="bg-surface-accent border border-border-accent p-3 rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)] flex flex-col gap-2">
              <h3 class="text-accent-amber font-semibold text-left text-md tracking-wide flex items-center">${title}</h3>
              ${fields}
            </div>
          </div>
        `;
      }).join('');

      return `<div class="masonry-grid mt-3">${sections}</div>`;
    }
  };
}

// 将函数暴露到全局作用域供Alpine.js使用
window.statusApp = statusApp;
window.characterCard = characterCard;
