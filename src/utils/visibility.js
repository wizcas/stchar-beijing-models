/**
 * 字段可见性工具模块
 * 处理字段隐藏和显示逻辑
 */

import { shouldShowIntimacySection, INTIMACY_VISIBILITY_CONFIG } from '../renderer.js';
import { cleanFieldName } from './formatters.js';
import { SECTION_NAMES } from '../modules/constants.js';

/**
 * 检查字段是否应该隐藏
 * @param {string} fieldName - 字段名
 * @param {string} sectionName - 所属部分名称
 * @returns {boolean} 是否应该隐藏
 */
export function shouldHideField(fieldName, sectionName) {
  const cleanName = cleanFieldName(fieldName);

  // 隐藏性爱部分的动情程度字段
  if (sectionName === SECTION_NAMES.INTIMACY && cleanName === "动情程度") {
    return true;
  }

  // 隐藏描述字段
  if (cleanName === "堕落度描述" || cleanName === "好感度描述") {
    return true;
  }

  return false;
}

/**
 * 检查性爱部分是否可见
 * @param {Object} characterData - 角色数据
 * @returns {boolean} 是否应该显示
 */
export function shouldShowIntimacy(characterData) {
  return shouldShowIntimacySection(characterData);
}

/**
 * 获取性爱部分占位符文本
 * @param {string} userName - 用户名，用于替换占位符
 * @returns {string} 占位符文本
 */
export function getIntimacyPlaceholder(userName = null) {
  const placeholder = INTIMACY_VISIBILITY_CONFIG.placeholderText;
  if (userName && placeholder.includes('{{user}}')) {
    return placeholder.replace(/\{\{user\}\}/g, userName);
  }
  return placeholder;
}
