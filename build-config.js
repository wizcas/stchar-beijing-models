#!/usr/bin/env node

/**
 * 配置生成工具
 * 
 * 流程:
 * 1. 读取 data/status.yaml (schema 定义)
 * 2. 从 schema 生成完整的 data/status.json (包含所有字段的默认值或覆盖值)
 * 3. 合并: schema defaults + 已有的 status.json 覆盖值
 * 4. 生成 data/status-vars.debug.json (完整的运行时数据)
 * 
 * 目标:
 * - status.json 始终包含 status.yaml 中定义的所有字段
 * - 用默认值初始化新字段
 * - 保留已有的自定义覆盖值
 * - 用于酒馆角色卡的初始化数据
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 从带类型前缀的字段名中提取真实字段名
 * 例如: "$range=[0,100] 堕落度" → "堕落度"
 */
function extractFieldName(fieldNameWithPrefix) {
  const prefixMatch = fieldNameWithPrefix.match(/^\$[a-z]+(\s*=\s*\{[^}]*\}|\s*=\s*\[[^\]]*\])?\s+/);
  if (prefixMatch) {
    return fieldNameWithPrefix.substring(prefixMatch[0].length);
  }
  return fieldNameWithPrefix;
}

/**
 * 递归提取字段定义，移除类型前缀
 */
function extractFieldDefinitions(obj) {
  const definitions = {};

  for (const [key, value] of Object.entries(obj)) {
    const fieldName = extractFieldName(key);

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      definitions[fieldName] = extractFieldDefinitions(value);
    } else {
      definitions[fieldName] = value;
    }
  }

  return definitions;
}

/**
 * 从 schema 构建完整的初始化结构（包含所有字段）
 * 保留类型前缀用于 status.json
 */
function buildInitialStructure(fields, existingData = {}) {
  const result = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const cleanFieldName = extractFieldName(fieldName);
    
    // 检查是否有现有的覆盖值
    let existingValue = null;
    let foundExisting = false;
    
    for (const [existingKey, existingVal] of Object.entries(existingData)) {
      if (extractFieldName(existingKey) === cleanFieldName) {
        existingValue = existingVal;
        foundExisting = true;
        break;
      }
    }

    if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig.fields) {
      // 嵌套对象：递归处理
      result[fieldName] = buildInitialStructure(
        fieldConfig.fields,
        foundExisting ? existingValue : {}
      );
    } else if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig.type) {
      // 有定义的字段：使用现有值或默认值
      if (foundExisting) {
        result[fieldName] = existingValue;
      } else {
        // 使用默认值，如果没有则使用类型的合理默认值
        if (fieldConfig.default !== undefined) {
          result[fieldName] = fieldConfig.default;
        } else {
          // 根据类型推断默认值
          if (fieldConfig.type === '$list') {
            result[fieldName] = [];
          } else if (fieldConfig.type.startsWith('$range')) {
            result[fieldName] = 0;
          } else if (fieldConfig.type.startsWith('$enum')) {
            // 枚举类型：使用第一个值作为默认
            const enumMatch = fieldConfig.type.match(/\$enum=\{([^}]+)\}/);
            if (enumMatch) {
              const firstValue = enumMatch[1].split(';')[0];
              result[fieldName] = firstValue;
            } else {
              result[fieldName] = null;
            }
          } else if (fieldConfig.type === '$ro') {
            // 只读字段：使用默认值或 null
            result[fieldName] = fieldConfig.default || null;
          } else {
            // 默认为字符串或 null
            result[fieldName] = fieldConfig.default || null;
          }
        }
      }
    }
  }

  return result;
}

/**
 * 递归合并: schema defaults + overrides
 * overrides 中的值会覆盖 defaults
 */
function mergeDefaults(schemaObj, overridesObj = {}) {
  const result = {};

  // 首先应用 schema 的默认值
  for (const [key, schemaValue] of Object.entries(schemaObj)) {
    if (schemaValue && typeof schemaValue === 'object' && schemaValue.default !== undefined) {
      result[key] = schemaValue.default;
    } else if (schemaValue && typeof schemaValue === 'object' && schemaValue.fields) {
      // 递归处理嵌套对象
      result[key] = mergeDefaults(schemaValue.fields, {});
    }
  }

  // 然后应用覆盖值
  for (const [key, overrideValue] of Object.entries(overridesObj)) {
    const cleanFieldName = extractFieldName(key);
    
    if (overrideValue !== null && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      // 嵌套对象：递归合并
      result[cleanFieldName] = mergeDefaults(
        schemaObj[key] && schemaObj[key].fields ? schemaObj[key].fields : {},
        overrideValue
      );
    } else {
      // 直接值：覆盖
      result[cleanFieldName] = overrideValue;
    }
  }

  return result;
}

/**
 * 验证覆盖值是否符合 schema 定义
 */
function validateOverrides(schemaObj, overridesObj, path = '') {
  const warnings = [];

  for (const [overrideKey, overrideValue] of Object.entries(overridesObj)) {
    const cleanFieldName = extractFieldName(overrideKey);
    const fullPath = path ? `${path}.${cleanFieldName}` : cleanFieldName;

    // 查找对应的 schema 定义
    let schemaFieldConfig = null;
    for (const [schemaKey, schemaValue] of Object.entries(schemaObj)) {
      if (schemaKey === cleanFieldName || extractFieldName(schemaKey) === cleanFieldName) {
        schemaFieldConfig = schemaValue;
        break;
      }
    }

    if (!schemaFieldConfig) {
      warnings.push(`⚠ [${fullPath}] 字段不在 schema 中定义`);
      continue;
    }

    // 如果是嵌套对象，递归验证
    if (schemaFieldConfig.fields && overrideValue !== null && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      warnings.push(...validateOverrides(schemaFieldConfig.fields, overrideValue, fullPath));
    } else if (schemaFieldConfig.type) {
      // 验证类型约束
      const typePrefix = schemaFieldConfig.type;

      if (typePrefix.startsWith('$range')) {
        const rangeMatch = typePrefix.match(/\$range=\[([^,]+),([^\]]+)\]/);
        if (rangeMatch) {
          const [, minStr, maxStr] = rangeMatch;
          const min = parseFloat(minStr);
          const max = parseFloat(maxStr);
          
          if (typeof overrideValue !== 'number') {
            warnings.push(`⚠ [${fullPath}] 类型不匹配: schema 定义为 $range 但值是 ${typeof overrideValue}`);
          } else if (overrideValue < min || overrideValue > max) {
            warnings.push(`⚠ [${fullPath}] 值超出范围: ${overrideValue} 不在 [${min}, ${max}] 内`);
          }
        }
      }

      if (typePrefix.startsWith('$enum')) {
        const enumMatch = typePrefix.match(/\$enum=\{([^}]+)\}/);
        if (enumMatch) {
          const validValues = enumMatch[1].split(';');
          if (!validValues.includes(overrideValue)) {
            warnings.push(`⚠ [${fullPath}] 值不在枚举列表中: "${overrideValue}" 不在 {${validValues.join(';')}} 中`);
          }
        }
      }

      if (typePrefix === '$list' && !Array.isArray(overrideValue)) {
        warnings.push(`⚠ [${fullPath}] 类型不匹配: schema 定义为 $list 但值是 ${typeof overrideValue}`);
      }
    }
  }

  return warnings;
}

/**
 * 从 schema 和 overrides 生成 status-vars.debug.json
 */
function buildCharVarJson(schema, statusJson) {
  const charVar = {
    "状态栏": {
      "小二": {},
      "女人": {
        "六花": {}
      }
    }
  };

  // 处理 {{user}} → 小二
  if (schema['{{user}}'] && schema['{{user}}'].fields) {
    const merged = mergeDefaults(
      schema['{{user}}'].fields,
      statusJson['{{user}}'] || {}
    );
    charVar['状态栏']['小二'] = merged;
  }

  // 处理 女人.六花
  if (schema['女人'] && schema['女人'].fields && schema['女人'].fields['六花'] && schema['女人'].fields['六花'].fields) {
    const merged = mergeDefaults(
      schema['女人'].fields['六花'].fields,
      statusJson['女人'] && statusJson['女人']['六花'] ? statusJson['女人']['六花'] : {}
    );
    charVar['状态栏']['女人']['六花'] = merged;
  }

  return charVar;
}

try {
  // 读取 schema
  const yamlPath = path.join(__dirname, 'data/status.yaml');
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const schema = yaml.load(yamlContent);

  // 读取现有的 status.json
  const statusJsonPath = path.join(__dirname, 'data/status.json');
  let existingStatusJson = {};
  try {
    existingStatusJson = JSON.parse(fs.readFileSync(statusJsonPath, 'utf8'));
  } catch (e) {
    console.log('⚠ data/status.json 不存在或无效，将从 schema 创建');
  }

  // 从 schema 构建完整的初始化结构，保留现有的覆盖值
  const updatedStatusJson = {
    "{{user}}": buildInitialStructure(
      schema['{{user}}'].fields,
      existingStatusJson['{{user}}'] || {}
    ),
    "女人": {
      "六花": buildInitialStructure(
        schema['女人'].fields['六花'].fields,
        existingStatusJson['女人'] && existingStatusJson['女人']['六花'] 
          ? existingStatusJson['女人']['六花'] 
          : {}
      )
    }
  };

  // 写入更新后的 status.json
  fs.writeFileSync(statusJsonPath, JSON.stringify(updatedStatusJson, null, 2) + '\n');
  console.log('✓ 已生成 data/status.json (包含所有 schema 字段)');

  // 验证覆盖值
  const warnings = [];
  if (updatedStatusJson['{{user}}']) {
    warnings.push(...validateOverrides(schema['{{user}}'].fields, updatedStatusJson['{{user}}'], '{{user}}'));
  }
  if (updatedStatusJson['女人'] && updatedStatusJson['女人']['六花']) {
    warnings.push(...validateOverrides(schema['女人'].fields['六花'].fields, updatedStatusJson['女人']['六花'], '女人.六花'));
  }

  // 输出警告
  if (warnings.length > 0) {
    console.log('⚠ 覆盖值验证警告:\n');
    warnings.forEach(w => console.log(w));
    console.log();
  }

  // 生成 status-vars.debug.json
  const charVarJson = buildCharVarJson(schema, updatedStatusJson);
  const charVarPath = path.join(__dirname, 'data/status-vars.debug.json');
  fs.writeFileSync(charVarPath, JSON.stringify(charVarJson, null, 2) + '\n');
  console.log('✓ 已生成 data/status-vars.debug.json (schema + status.json 合并)');

  if (warnings.length === 0) {
    console.log('✓ 所有验证通过');
  }

} catch (error) {
  console.error('❌ 生成失败:', error.message);
  process.exit(1);
}
