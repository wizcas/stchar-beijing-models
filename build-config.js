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

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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
      if (fieldConfig.type === '$list') {
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
 * 从 yaml 生成带前缀的完整结构（用于 status.json）
 */
function buildPrefixedStructure(fields, defaults = {}) {
  const result = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

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

  // 处理所有顶级字段（包括世界、{{user}}、女人等）
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
  if (schema['{{user}}'] && schema['{{user}}'].fields) {
    const userDefaults = extractDefaults(schema['{{user}}'].fields);
    // 使用第一个用户的昵称作为 key，或默认为 "小二"
    const userName = '小二';
    charVar['状态栏'][userName] = buildPlainStructure(schema['{{user}}'].fields, userDefaults);
  }

  // 添加女性角色
  if (schema['女人'] && schema['女人'].fields) {
    charVar['状态栏']['女人'] = {};
    for (const [characterName, characterConfig] of Object.entries(schema['女人'].fields)) {
      if (characterConfig && characterConfig.fields) {
        const charDefaults = extractDefaults(characterConfig.fields);
        charVar['状态栏']['女人'][characterName] = buildPlainStructure(characterConfig.fields, charDefaults);
      }
    }
  }

  // 写入 status-vars.debug.json
  const charVarPath = path.join(__dirname, 'data/status-vars.debug.json');
  fs.writeFileSync(charVarPath, JSON.stringify(charVar, null, 2) + '\n');
  console.log('✓ 已生成 data/status-vars.debug.json (无类型前缀，用于本地测试)');

  console.log('\n✓ 配置生成完成');

} catch (error) {
  console.error('❌ 生成失败:', error.message);
  process.exit(1);
}
