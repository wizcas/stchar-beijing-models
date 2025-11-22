/**
 * 格式化工具模块
 * 提供数字、货币、字段名等格式化功能
 */

import { formatNumberWithCommas } from '../renderer.js';

/**
 * 为 Promise 添加超时保护
 * @param {Promise} promise - 原始 Promise
 * @param {number} timeoutMs - 超时时间（毫秒）
 * @param {string} timeoutMessage - 超时错误信息
 * @returns {Promise} 带超时保护的 Promise
 */
export function withTimeout(promise, timeoutMs = 5000, timeoutMessage = 'API 请求超时') {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

/**
 * 验证拍摄任务 Key 格式
 * 格式: 模特名--日期-时间
 * 例如: 六花--2024-12-20-1430
 * @param {string} taskKey - 任务 Key
 * @returns {boolean} Key 格式是否有效
 */
export function validateTaskKeyFormat(taskKey) {
  if (typeof taskKey !== 'string') {
    return false;
  }
  // 格式: 任意字符(模特名)--YYYY-MM-DD(-HHMM可选)
  const pattern = /^[^-]+--.+$/;
  return pattern.test(taskKey);
}

/**
 * 格式化货币，添加￥符号和千位分隔符
 * @param {number} num - 金额
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(num) {
  if (typeof num === 'number') {
    return '￥' + formatNumberWithCommas(num);
  }
  return num;
}

/**
 * 清理字段名，移除类型前缀
 * @param {string} fieldName - 原始字段名
 * @returns {string} 清理后的字段名
 */
export function cleanFieldName(fieldName) {
  const match = fieldName.match(/^\$[^\s]*\s+(.+)$/);
  return match ? match[1] : fieldName;
}

/**
 * 处理特殊字段合并和格式化
 * @param {Object} obj - 原始数据对象
 * @returns {Object} 处理后的数据对象
 */
export function processSpecialFields(obj) {
  const processed = { ...obj };

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
  if (processed["身高"] && typeof processed["身高"] === "number") {
    processed["身高"] = processed["身高"] + " cm";
  }

  // 处理体重单位
  if (processed["体重"] && typeof processed["体重"] === "number") {
    processed["体重"] = processed["体重"] + " kg";
  }

  return processed;
}

/**
 * 获取字段显示值，处理特殊字段的显示逻辑
 * @param {string} fieldName - 字段名
 * @param {any} value - 字段值
 * @param {Object} parentData - 完整数据对象（用于查找描述字段）
 * @param {Object} sectionData - 当前子部分数据（用于查找同级描述字段）
 * @returns {any} 处理后的显示值
 */
export function getFieldDisplayValue(fieldName, value, parentData, sectionData = null) {
  const cleanName = cleanFieldName(fieldName);

  // 处理想法字段 - 用<em>包裹
  if (cleanName === "想法") {
    return `<em>${value}</em>`;
  }

  // 处理堕落度和好感度的描述映射
  if (cleanName === "堕落度" || cleanName === "好感度") {
    const descriptionFieldName = cleanName + "描述";

    // 首先在同级数据中查找（子部分内部）
    if (sectionData) {
      for (const [key, val] of Object.entries(sectionData)) {
        if (cleanFieldName(key) === descriptionFieldName) {
          return val;
        }
      }
    }

    // 然后在父级数据中查找（根级别）
    if (parentData) {
      for (const [key, val] of Object.entries(parentData)) {
        if (cleanFieldName(key) === descriptionFieldName) {
          return val;
        }
      }
    }
  }

  // 处理资金格式化
  if (cleanName === "资金" && typeof value === "number") {
    return formatCurrency(value);
  }

  return value;
}
