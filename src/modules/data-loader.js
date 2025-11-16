/**
 * 数据加载模块
 * 负责从不同源加载和处理数据
 */

import { DATA_LOADING, API_ENDPOINTS } from './constants.js';
import {
  validateStatusBarData,
  validateAndCleanFieldPrefixes,
  isValidStatusData,
  AppError,
} from './data-validator.js';

/**
 * 使用 API 从生产环境加载状态数据
 * @async
 * @returns {Promise<Object>} 状态数据对象
 * @throws {AppError} 如果 API 调用失败
 */
async function loadStatusData() {
  try {
    // 调用外部 STscript API
    const raw = await STscript(API_ENDPOINTS.GET_STATUS);
    const statusData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    
    if (!isValidStatusData(statusData)) {
      throw new AppError('获取的状态数据无效', 'INVALID_STATUS_DATA');
    }
    
    return statusData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `生产数据加载失败: ${error.message}`,
      'PRODUCTION_DATA_ERROR'
    );
  }
}

/**
 * 从本地 JSON 文件加载测试数据
 * @async
 * @returns {Promise<Object>} 测试数据对象
 * @throws {AppError} 如果数据加载或解析失败
 */
async function loadTestData() {
  try {
    // 检查协议
    if (
      window.location.protocol !== 'http:' &&
      window.location.protocol !== 'https:'
    ) {
      throw new Error('请使用 HTTP 服务器访问此页面');
    }

    // 从配置中读取测试数据文件名
    const testDataFile = DATA_LOADING.TEST_DATA_FILE;
    const response = await fetch(testDataFile);

    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }

    const charData = await response.json();

    // 检查状态栏字段
    const statusKey = DATA_LOADING.STATUS_BAR_KEY;
    if (!charData[statusKey]) {
      throw new AppError(
        `字段"${statusKey}"不存在于测试数据中`,
        'MISSING_STATUS_FIELD'
      );
    }

    // 解析状态栏数据
    let statusBarData = charData[statusKey];
    statusBarData = validateStatusBarData(statusBarData);

    // 清理字段名前缀并返回处理后的数据
    return validateAndCleanFieldPrefixes(statusBarData);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `测试数据加载失败: ${error.message}`,
      'TEST_DATA_ERROR'
    );
  }
}

/**
 * 智能数据加载器 - 在开发模式下优先使用测试数据，否则优先尝试生产数据
 * @async
 * @returns {Promise<Object>} 加载的数据对象
 * @throws {AppError} 如果所有加载方式都失败
 */
async function loadData() {
  let productionError = null;
  let testError = null;
  
  // 检查是否处于开发模式（STscript API 不可用）
  const isDevelopment = typeof STscript === 'undefined';
  
  if (isDevelopment) {
    // 开发模式：优先加载测试数据
    console.log('📝 开发模式检测到，优先使用测试数据...');
    
    try {
      const data = await loadTestData();
      console.log('✓ 使用测试数据源');
      return data;
    } catch (error) {
      testError = error;
      console.log('⚠ 测试数据加载失败，尝试生产数据...');
    }
    
    // 开发模式下回退到生产数据
    try {
      const data = await loadStatusData();
      console.log('✓ 使用生产数据源');
      return data;
    } catch (error) {
      productionError = error;
    }
  } else {
    // 生产模式：优先加载生产数据
    try {
      const data = await loadStatusData();
      console.log('✓ 使用生产数据源');
      return data;
    } catch (error) {
      productionError = error;
      console.log('⚠ 生产数据加载失败，尝试测试数据...');
    }
    
    // 生产模式下回退到测试数据
    try {
      const data = await loadTestData();
      console.log('✓ 使用测试数据源');
      return data;
    } catch (error) {
      testError = error;
    }
  }

  // 所有方式都失败
  const errorMessage = `无法加载数据:\n` +
    `- ${productionError ? `生产数据: ${productionError.message}` : '生产数据: 未尝试'}\n` +
    `- ${testError ? `测试数据: ${testError.message}` : '测试数据: 未尝试'}`;
  
  throw new AppError(errorMessage, 'ALL_DATA_LOADING_FAILED');
}

/**
 * 清理字段名前缀的函数（备用，独立实现）
 * 移除 $ 开头的前缀
 * @param {Object} obj - 原始数据对象
 * @returns {Object} 清理后的数据对象
 * @deprecated 使用 data-validator.js 中的 validateAndCleanFieldPrefixes 代替
 */
function cleanFieldPrefixes(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanFieldPrefixes);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // 移除$开头的前缀
    const cleanKey = key.replace(/^\$[^\s]*\s+/, '');
    cleaned[cleanKey] = cleanFieldPrefixes(value);
  }

  return cleaned;
}

/**
 * 获取加载状态消息
 * @returns {string} 加载中的提示文本
 */
function getLoadingMessage() {
  return DATA_LOADING.LOADING_TEXT;
}

/**
 * 获取错误提示文本
 * @param {Error|string} error - 错误对象或错误消息
 * @returns {string} 格式化的错误提示
 */
function getErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return DATA_LOADING.ERROR_PREFIX + message;
}

export {
  loadStatusData,
  loadTestData,
  loadData,
  cleanFieldPrefixes,
  getLoadingMessage,
  getErrorMessage,
};
