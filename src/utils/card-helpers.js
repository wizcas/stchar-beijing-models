/**
 * 卡片辅助工具模块
 * 提供卡片相关的工具函数
 */

import { cleanFieldName } from './formatters.js';

/**
 * 获取卡片标题
 * @param {string} characterName - 角色名称
 * @param {string} characterType - 角色类型
 * @param {Object} characterData - 角色数据
 * @returns {string} 卡片标题
 */
export function getCardTitle(characterName, characterType, characterData) {
  if (characterType === 'user') {
    return `👤 ${characterName}`;
  } else if (characterType === 'woman') {
    // 查找昵称和真名
    let nickname = null;
    let realName = null;

    // 遍历所有字段查找昵称和真名
    for (const [key, value] of Object.entries(characterData)) {
      const cleanKey = cleanFieldName(key);
      if (cleanKey === '昵称') {
        nickname = value;
      } else if (cleanKey === '真名') {
        realName = value;
      }
    }

    // 根据找到的信息生成标题
    if (nickname && realName) {
      return `👩 ${nickname} (${realName})`;
    } else if (nickname) {
      return `👩 ${nickname}`;
    } else if (realName) {
      return `👩 ${realName}`;
    } else {
      return `👩 ${characterName}`;
    }
  }
  return characterName;
}

/**
 * 获取直接字段（非对象字段）
 * @param {Object} data - 角色数据
 * @returns {Object} 直接字段对象
 */
export function getDirectFields(data) {
  const directFields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      // 过滤掉拍摄任务字段（因为它已经是独立的卡片了）
      const cleanKey = cleanFieldName(key);
      if (cleanKey !== "拍摄任务") {
        directFields[key] = value;
      }
    }
  }
  return directFields;
}

/**
 * 获取子部分（对象字段）
 * @param {Object} data - 角色数据
 * @returns {Object} 子部分对象
 */
export function getSubsections(data) {
  const subsections = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // 过滤掉拍摄任务字段（因为它已经是独立的卡片了）
      const cleanKey = cleanFieldName(key);
      if (cleanKey !== "拍摄任务") {
        subsections[key] = value;
      }
    }
  }
  return subsections;
}

/**
 * 检查是否为器材对象
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 是否为器材对象
 */
export function isEquipmentObject(obj) {
  if (!obj || typeof obj !== "object") return false;

  const keys = Object.keys(obj);
  // 支持摄影器材和服装两种类型
  const equipmentKeys = [
    // 摄影器材
    "机身", "镜头", "灯光", "配件", "其他", "设备",
    // 服装器材
    "上装", "下装", "内衣", "鞋子", "配饰"
  ];

  return keys.length > 0 && keys.every(key => {
    const cleanKey = cleanFieldName(key);
    return equipmentKeys.includes(cleanKey) && Array.isArray(obj[key]);
  });
}
