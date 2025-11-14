/**
 * 数据验证模块
 * 提供数据验证和错误处理功能
 */

/**
 * 自定义应用错误类
 * @class
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} message - 错误消息
   * @param {string} code - 错误代码
   */
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * 验证数据是否为有效的对象
 * @param {any} data - 要验证的数据
 * @returns {boolean} 数据是否有效
 * @throws {AppError} 如果数据无效
 */
function validateCharacterData(data) {
  if (data === null || data === undefined) {
    throw new AppError('数据不能为空', 'INVALID_DATA');
  }
  
  if (typeof data !== 'object') {
    throw new AppError('数据必须是对象类型', 'INVALID_TYPE');
  }
  
  return true;
}

/**
 * 验证数据对象包含必要的字段结构
 * @param {Object} data - 要验证的数据对象
 * @param {string[]} requiredFields - 必需字段列表
 * @returns {boolean} 验证结果
 * @throws {AppError} 如果缺少必需字段
 */
function validateRequiredFields(data, requiredFields = []) {
  if (!Array.isArray(requiredFields)) {
    return true;
  }
  
  const missingFields = requiredFields.filter(field => !(field in data));
  
  if (missingFields.length > 0) {
    throw new AppError(
      `缺少必需字段: ${missingFields.join(', ')}`,
      'MISSING_FIELDS'
    );
  }
  
  return true;
}

/**
 * 验证状态栏数据结构
 * @param {any} statusBarData - 状态栏数据
 * @returns {Object} 验证后的数据
 * @throws {AppError} 如果数据结构无效
 */
function validateStatusBarData(statusBarData) {
  if (typeof statusBarData === 'string') {
    try {
      return JSON.parse(statusBarData);
    } catch (error) {
      throw new AppError('状态栏数据 JSON 解析失败', 'PARSE_ERROR');
    }
  }
  
  validateCharacterData(statusBarData);
  return statusBarData;
}

/**
 * 验证并清理字段名前缀
 * 移除 $开头的前缀
 * @param {Object} obj - 原始数据对象
 * @returns {Object} 清理后的数据对象
 */
function validateAndCleanFieldPrefixes(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(validateAndCleanFieldPrefixes);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // 移除$开头的前缀
    const cleanKey = key.replace(/^\$[^\s]*\s+/, '');
    cleaned[cleanKey] = validateAndCleanFieldPrefixes(value);
  }

  return cleaned;
}

/**
 * 检查数据是否为有效的状态栏数据格式
 * @param {any} data - 要检查的数据
 * @returns {boolean} 是否为有效的状态栏数据
 */
function isValidStatusData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // 检查是否包含至少一个数据部分
  return Object.keys(data).length > 0;
}

export {
  AppError,
  validateCharacterData,
  validateRequiredFields,
  validateStatusBarData,
  validateAndCleanFieldPrefixes,
  isValidStatusData,
};
