#!/usr/bin/env node

/**
 * 配置生成工具 - 从 status.yaml 生成所有配置文件
 * 
 * status.yaml 是唯一真实来源 (Single Source of Truth)
 * 
 * 流程:
 * 1. 读取 data/status.yaml (完整的 schema + 默认值)
 * 2. 提取 schema 定义和默认值
 * 3. 生成 data/status.json (含类型前缀，用于 Silly Tavern 导入)
 * 4. 生成 data/status-vars.debug.json (无类型前缀，用于本地测试)
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 从 yaml schema 中提取所有字段的默认值
 */
function extractDefaults(fields) {
  const defaults = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

    // 优先检查显式的 default 字段（适用于对象、列表等）
    if (fieldConfig.default !== undefined) {
      defaults[fieldName] = fieldConfig.default;
    } else if (fieldConfig.fields) {
      // 嵌套对象：递归提取
      defaults[fieldName] = extractDefaults(fieldConfig.fields);
    } else {
     // 无默认值：根据类型推断
       if (fieldConfig.type === '$list' || fieldConfig.type === '$grow') {
         defaults[fieldName] = [];
       } else if (fieldConfig.type && fieldConfig.type.startsWith('$range')) {
         defaults[fieldName] = 0;
       } else if (fieldConfig.type && fieldConfig.type.startsWith('$enum')) {
        // 枚举类型：使用第一个值
        const enumMatch = fieldConfig.type.match(/\$enum=\{([^}]+)\}/);
        if (enumMatch) {
          defaults[fieldName] = enumMatch[1].split(';')[0];
        } else {
          defaults[fieldName] = null;
        }
      } else if (fieldConfig.type === '$ro') {
        defaults[fieldName] = null;
      } else {
        defaults[fieldName] = null;
      }
    }
  }

  return defaults;
}

/**
 * 生成带类型前缀的字段名（用于 status.json，Silly Tavern 导入）
 * 
 * 规则：
 * - 如果 type 以 $ 开头，说明是 White-X 特殊类型，需要添加前缀
 * - 否则（string, number, object 等基础类型）不需要前缀
 */
function buildFieldWithPrefix(fieldName, fieldConfig) {
  const typePrefix = fieldConfig.type;

  // 没有类型定义或是基础类型，不需要前缀
  if (!typePrefix || !typePrefix.startsWith('$')) {
    return fieldName;
  }

  // 任何以 $ 开头的类型都需要前缀（支持任何新增的 White-X 特殊类型）
  return `${typePrefix} ${fieldName}`;
}

/**
 * 替换模板变量
 * 支持 {{key}} 替换为实际的键名
 */
function replaceTemplate(template, key) {
  return template.replace(/\{\{key\}\}/g, key);
}

/**
 * 从 yaml 生成带前缀的完整结构（用于 status.json）
 */
function buildPrefixedStructure(fields, defaults = {}) {
  const result = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

    // 处理模板字段（如 {{key}}）
    if (fieldName === '{{key}}') {
      // 对于模板字段，我们不生成具体的键，而是让 Silly Tavern 动态处理
      // 这里不添加任何内容到结果中
      continue;
    }

    // 检查字段本身是否需要添加前缀（支持容器对象也有 $ext 等前缀）
    const prefixedName = buildFieldWithPrefix(fieldName, fieldConfig);

    // 优先使用 defaults 中明确定义的值
    if (defaults[fieldName] !== undefined) {
      result[prefixedName] = defaults[fieldName];
    } else if (fieldConfig.fields) {
      // 嵌套对象：递归处理子字段
      result[prefixedName] = buildPrefixedStructure(
        fieldConfig.fields,
        defaults[fieldName] || {}
      );
    } else {
      // 普通字段：直接赋值
      result[prefixedName] = null;
    }
  }

  return result;
}

/**
 * 从 yaml 生成无前缀的纯数据结构（用于 status-vars.debug.json）
 */
function buildPlainStructure(fields, defaults = {}) {
  const result = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

    // 处理模板字段（如 {{key}}）- 对于调试数据，我们生成一个示例结构
    if (fieldName === '{{key}}') {
      const fieldDefaults = extractDefaults(fieldConfig.fields);
      const structuredData = buildPlainStructure(fieldConfig.fields, fieldDefaults);
      // 为 {{key}} 模板字段创建一个示例条目
      result['示例角色'] = structuredData;
      continue;
    }

    // 优先使用 defaults 中明确定义的值
    if (defaults[fieldName] !== undefined) {
      result[fieldName] = defaults[fieldName];
    } else if (fieldConfig.fields) {
      // 嵌套对象：递归处理
      result[fieldName] = buildPlainStructure(
        fieldConfig.fields,
        defaults[fieldName] || {}
      );
    } else {
      // 没有默认值和子字段
      result[fieldName] = null;
    }
  }

  return result;
}

try {
  console.log('📋 从 status.yaml 生成配置文件...\n');

  // 读取 schema
  const yamlPath = path.join(__dirname, 'data/status.yaml');
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const schema = yaml.load(yamlContent);

  // ========== 生成 status.json（含类型前缀，用于 Silly Tavern）==========
  const statusJson = {};

  // 处理所有顶级字段（包括世界、{{user}}、女模等）
  for (const [sectionName, sectionConfig] of Object.entries(schema)) {
    if (!sectionConfig || typeof sectionConfig !== 'object') continue;

    // 检查字段本身是否需要添加前缀
    const prefixedName = buildFieldWithPrefix(sectionName, sectionConfig);

    if (sectionConfig.fields) {
      // 如果有子字段，递归处理
      const defaults = extractDefaults(sectionConfig.fields);
      const structuredData = buildPrefixedStructure(sectionConfig.fields, defaults);
      statusJson[prefixedName] = structuredData;
    } else if (sectionConfig.default !== undefined) {
      // 如果没有子字段但有默认值，直接使用
      statusJson[prefixedName] = sectionConfig.default;
    }
  }

  // 写入 status.json
  const statusJsonPath = path.join(__dirname, 'data/status.json');
  fs.writeFileSync(statusJsonPath, JSON.stringify(statusJson, null, 2) + '\n');
  console.log('✓ 已生成 data/status.json (含类型前缀，用于 Silly Tavern 导入)');

  // ========== 生成 status-vars.debug.json（无类型前缀，用于本地测试）==========
  const charVar = {
    '状态栏': {}
  };

  // 添加世界信息
  if (schema['世界'] && schema['世界'].fields) {
    const worldDefaults = extractDefaults(schema['世界'].fields);
    charVar['状态栏']['世界'] = buildPlainStructure(schema['世界'].fields, worldDefaults);
  }

   // 添加用户信息
   if (schema['user'] && schema['user'].fields) {
     const userDefaults = extractDefaults(schema['user'].fields);
    // 使用默认的用户名作为 key，或默认为 "小二"
      const userName = '小二';
     charVar['状态栏'][userName] = buildPlainStructure(schema['user'].fields, userDefaults);
  }

    // 添加女模
   if (schema['女模'] && schema['女模'].fields) {
     charVar['状态栏']['女模'] = {};
     
     // 检查是否有 {{key}} 模板字段
     if (schema['女模'].fields['{{key}}']) {
       // 使用模板字段的结构生成一个示例角色
       const templateConfig = schema['女模'].fields['{{key}}'];
       if (templateConfig.fields) {
         const charDefaults = extractDefaults(templateConfig.fields);
         const structuredData = buildPlainStructure(templateConfig.fields, charDefaults);
         // 创建一个示例角色（保持原有的六花数据）
          charVar['状态栏']['女模']['六花'] = {
           ...structuredData,
           想法: "第一次找专业摄影师拍照呢，好紧张……{{user}}哥哥会是个什么样的人呢？",
           关系: {
             ...structuredData.关系,
             堕落度描述: "对自身有清晰的底线，坚定地保护自己，拒绝向{{user}}妥协。",
             好感度描述: "与{{user}}陌生，保持基本的商业关系。"
           },
          外型: {
            ...structuredData.外型,
            五官: "桃花眼，小鼻子，唇形微翘",
            发型: "黑色中长直发",
            穿搭: "粉色棉质长袖长裤睡衣/未穿内衣/棉质内裤。",
            身高: 168,
            体重: 52,
            胸围: 88,
            腰围: 60,
            臀围: 90,
            罩杯: "B"
          },
          职业: {
            ...structuredData.职业,
            类型: ["学生", "模特"],
            人设: ["新手"]
          },
          性爱: {
            ...structuredData.性爱,
            性癖: ["纯爱", "年上"],
            乳房: "乳房饱满紧实，B罩杯的大小恰到好处。乳头呈淡粉色，未经任何刺激，处于完全放松的自然状态，敏感度未知。",
            小穴: "小穴未经开启，阴唇紧合呈粉红色，尚未有任何湿润迹象。处女状，内部紧致而陌生，充满未知的敏感性。",
            肛门: "菊花紧闭，外围皮肤细腻，呈健康的肉色。括约肌完全收紧，从未被任何东西触及，对这个部位的任何刺激都充满未知和恐惧。"
          }
        };
      }
     } else {
       // 兼容旧版本：直接处理具体的角色字段
       for (const [characterName, characterConfig] of Object.entries(schema['女模'].fields)) {
         if (characterConfig && characterConfig.fields) {
           const charDefaults = extractDefaults(characterConfig.fields);
           charVar['状态栏']['女模'][characterName] = buildPlainStructure(characterConfig.fields, charDefaults);
         }
       }
      }
   }

   // 添加历史信息
   if (schema['历史'] && schema['历史'].fields) {
     charVar['状态栏']['历史'] = buildPlainStructure(schema['历史'].fields, extractDefaults(schema['历史'].fields));
   }

   // 写入 status-vars.debug.json
  const charVarPath = path.join(__dirname, 'data/status-vars.debug.json');
  fs.writeFileSync(charVarPath, JSON.stringify(charVar, null, 2) + '\n');
  console.log('✓ 已生成 data/status-vars.debug.json (无类型前缀，用于本地测试)');

  // 添加测试数据到 debug 版本
  console.log('🔧 添加测试数据...');
  try {
    // 确保基本数据结构存在
    if (!charVar['状态栏']) {
      throw new Error('基本的 status 数组结构必须存在');
    }

    // 添加出场女模数据和拍摄任务
    charVar['状态栏']['世界']['出场女模'] = ['六花', 'Sakura'];

    // 添加拍摄任务 (格式: 模特名--日期-时间)
    charVar['状态栏']['小二']['拍摄任务'] = {
      '六花--2024-12-20-1000': {
        '状态': '进行中',
        '模特': '六花',
        '目标': '首次合作拍摄',
        '期限': '2024-12-20',
        '报酬': 1500,
        '特殊要求': '可适当调整拍摄节奏',
      },
      'Sakura--2024-12-25-1400': {
        '状态': '准备中',
        '模特': 'Sakura',
        '目标': '古典舞拍摄',
        '期限': '2024-12-25',
        '报酬': 1200,
        '特殊要求': '可适当调整拍摄时间',
      },
      'Sakura--2024-12-28-1600': {
        '状态': '已完成',
        '模特': 'Sakura',
        '目标': '艺术摄影',
        '期限': '2024-12-28',
        '报酬': 2200,
        '特殊要求': '可进行艺术风格拍摄',
      },
      'Valentina--2024-12-30-1100': {
        '状态': '待安排',
        '模特': 'Valentina',
        '目标': '广告风格拍摄',
        '期限': '2024-12-30',
        '报酬': 2800,
      },
    };

    console.log('✓ 测试数据添加成功');
  } catch (error) {
    console.error('❌ 添加测试数据失败:', error.message);
  }

  console.log('\n✓ 配置生成完成');

} catch (error) {
  console.error('❌ 生成失败:', error.message);
  process.exit(1);
}
