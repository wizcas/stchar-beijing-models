#!/usr/bin/env node

/**
 * 提取 White-X 上下文信息脚本
 * 读取本地变量（世界信息、用户、女性角色数据）
 * 并生成 XML 格式的上下文字符串
 */

const fs = require('fs');
const path = require('path');

// 常量定义（复制自 src/modules/constants.js）
const DATA_LOADING = {
  LOADING_TEXT: "正在加载状态数据...",
  ERROR_PREFIX: "加载失败: ",
  TEST_DATA_FILE: "status-vars.debug.json",
  STATUS_BAR_KEY: "状态栏",
  WOMAN_SECTION_KEY: "女人",
};

const API_ENDPOINTS = {
  GET_STATUS: "/getvar 状态栏",
};

const CHARACTER_TYPES = {
  USER: "user",
  WOMAN: "woman",
};

/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * 验证数据是否为有效的对象
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
 * 验证状态栏数据结构
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
 * 验证并清理字段名前缀（移除 $ 开头的前缀）
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
 */
function isValidStatusData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // 检查是否包含至少一个数据部分
  return Object.keys(data).length > 0;
}

/**
 * 从本地 JSON 文件加载测试数据
 */
function loadTestData() {
  try {
    // 从配置中读取测试数据文件名
    const testDataFile = DATA_LOADING.TEST_DATA_FILE;
    const testDataPath = path.join(__dirname, '..', 'data', testDataFile);

    if (!fs.existsSync(testDataPath)) {
      throw new Error(`测试数据文件不存在: ${testDataPath}`);
    }

    const statusContent = fs.readFileSync(testDataPath, 'utf8');
    const charData = JSON.parse(statusContent);

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
 * 检测角色类型
 */
function detectCharacterType(sectionName, sectionData) {
  // 检查是否为用户角色
  if (sectionData && typeof sectionData === 'object') {
    // 用户角色通常有 "拍摄任务" 或 "资金" 字段
    if ('拍摄任务' in sectionData || '资金' in sectionData) {
      return CHARACTER_TYPES.USER;
    }
  }
  
  return CHARACTER_TYPES.WOMAN;
}

/**
 * 提取嵌套对象的值
 */
function getNestedValue(obj, path) {
  if (!obj) return undefined;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * 主函数：提取上下文信息
 */
function extractContext() {
  try {
    console.log('📖 加载本地数据...');
    
    // 加载数据
    const data = loadTestData();
    
    console.log('✓ 数据加载成功');
    
    // 初始化上下文对象
    const context = {
      世界: {
        时间: null,
        地点: null,
      },
      用户: {
        拍摄任务: null,
        资金: null,
        堕落度: null,
      },
      女性角色: {},
    };

    // 提取世界信息
    if (data['世界']) {
      const worldData = data['世界'];
      context.世界.时间 = worldData['时间'] || null;
      context.世界.地点 = worldData['地点'] || null;
    }

    // 查找并提取用户数据
    let userName = null;
    for (const [sectionName, sectionData] of Object.entries(data)) {
      if (typeof sectionData === 'object' && sectionData !== null) {
        const characterType = detectCharacterType(sectionName, sectionData);

        if (characterType === CHARACTER_TYPES.USER) {
          userName = sectionName;
          
          // 提取用户的拍摄任务
          for (const [key, value] of Object.entries(sectionData)) {
            if (key.includes('拍摄任务')) {
              if (Array.isArray(value)) {
                context.用户.拍摄任务 = value;
              } else if (typeof value === 'object' && value !== null) {
                // 转换对象格式为数组
                context.用户.拍摄任务 = Object.keys(value)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(k => value[k]);
              }
              break;
            }
          }
          
          // 提取用户的资金
          if ('资金' in sectionData) {
            context.用户.资金 = sectionData['资金'];
          }
          
          // 提取用户的堕落度
          if ('堕落度' in sectionData) {
            context.用户.堕落度 = sectionData['堕落度'];
          }
          
          break;
        }
      }
    }

    // 提取女性角色数据
    const womanKey = DATA_LOADING.WOMAN_SECTION_KEY;
    if (data[womanKey]) {
      for (const [characterName, characterData] of Object.entries(data[womanKey])) {
        if (typeof characterData === 'object' && characterData !== null) {
          const womanInfo = {
            好感度: null,
            堕落度: null,
            动情程度: null,
            尺度: null,
            人设: null,
          };

          // 从关系子部分提取
          if (characterData['关系']) {
            const relationship = characterData['关系'];
            womanInfo.好感度 = getNestedValue(relationship, '好感度');
            womanInfo.堕落度 = getNestedValue(relationship, '堕落度');
            womanInfo.动情程度 = getNestedValue(relationship, '动情程度');
            womanInfo.尺度 = getNestedValue(relationship, '尺度');
          }

          // 从直接字段提取人设（如果有的话）
          if ('人设' in characterData) {
            womanInfo.人设 = characterData['人设'];
          }

          context.女性角色[characterName] = womanInfo;
        }
      }
    }

    // 生成 JSON 字符串
    const jsonString = JSON.stringify(context, null, 2);

    // 组合为 XML 格式
    const xmlContext = `<context>
${jsonString}
</context>`;

    // 输出结果
    console.log('\n✓ 上下文提取成功\n');
    console.log(xmlContext);
    
    return xmlContext;
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

// 运行脚本
extractContext();
