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

    if (fieldConfig.fields) {
      // 嵌套对象：递归提取
      defaults[fieldName] = extractDefaults(fieldConfig.fields);
    } else if (fieldConfig.default !== undefined) {
      // 有默认值：直接使用
      defaults[fieldName] = fieldConfig.default;
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
 */
function buildFieldWithPrefix(fieldName, fieldConfig) {
  const typePrefix = fieldConfig.type;

  // 基础类型不需要前缀
  if (!typePrefix || typePrefix === 'string' || typePrefix === 'number' || typePrefix === 'object') {
    return fieldName;
  }

  // 特殊类型需要前缀
  return `${typePrefix} ${fieldName}`;
}

/**
 * 从 yaml 生成带前缀的完整结构（用于 status.json）
 */
function buildPrefixedStructure(fields, defaults = {}) {
  const result = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

    if (fieldConfig.fields) {
      // 嵌套对象：递归处理
      result[fieldName] = buildPrefixedStructure(
        fieldConfig.fields,
        defaults[fieldName] || {}
      );
    } else {
      // 添加类型前缀
      const prefixedName = buildFieldWithPrefix(fieldName, fieldConfig);
      result[prefixedName] = defaults[fieldName] !== undefined ? defaults[fieldName] : null;
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

    if (fieldConfig.fields) {
      // 嵌套对象：递归处理
      result[fieldName] = buildPlainStructure(
        fieldConfig.fields,
        defaults[fieldName] || {}
      );
    } else {
      // 不添加前缀
      result[fieldName] = defaults[fieldName] !== undefined ? defaults[fieldName] : null;
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

  // 处理世界信息
  if (schema['世界'] && schema['世界'].fields) {
    const worldDefaults = extractDefaults(schema['世界'].fields);
    statusJson['世界'] = buildPrefixedStructure(schema['世界'].fields, worldDefaults);
  }

  // 处理用户（{{user}}）
  if (schema['{{user}}'] && schema['{{user}}'].fields) {
    const userDefaults = extractDefaults(schema['{{user}}'].fields);
    statusJson['{{user}}'] = buildPrefixedStructure(schema['{{user}}'].fields, userDefaults);
  }

  // 处理女性角色
  if (schema['女人'] && schema['女人'].fields) {
    statusJson['女人'] = {};
    for (const [characterName, characterConfig] of Object.entries(schema['女人'].fields)) {
      if (characterConfig && characterConfig.fields) {
        const charDefaults = extractDefaults(characterConfig.fields);
        statusJson['女人'][characterName] = buildPrefixedStructure(characterConfig.fields, charDefaults);
      }
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
