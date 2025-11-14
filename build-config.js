#!/usr/bin/env node

/**
 * 配置生成工具
 * 
 * 流程:
 * 1. 读取 data/status.yaml (schema 定义)
 * 2. 读取 data/status.json (运行时覆盖值)
 * 3. 合并: schema defaults + status.json 覆盖
 * 4. 生成 data/status-vars.debug.json (完整的运行时数据)
 * 
 * 约束:
 * - 不修改 status.yaml (schema 源文件)
 * - 不修改 status.json (运行时数据源文件)
 * - 只生成 status-vars.debug.json
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
 * 从 schema 构建完整字段定义（包含类型前缀）
 */
function buildSchemaWithPrefix(fields) {
  const result = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig.fields) {
      // 递归处理嵌套对象
      result[fieldName] = buildSchemaWithPrefix(fieldConfig.fields);
    } else if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig.type) {
      // 添加类型前缀
      if (fieldConfig.type.startsWith('$')) {
        result[`${fieldConfig.type} ${fieldName}`] = fieldConfig.default !== undefined ? fieldConfig.default : null;
      } else {
        result[fieldName] = fieldConfig.default !== undefined ? fieldConfig.default : null;
      }
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

  // 读取运行时覆盖值
  const statusJsonPath = path.join(__dirname, 'data/status.json');
  let statusJson = {};
  try {
    statusJson = JSON.parse(fs.readFileSync(statusJsonPath, 'utf8'));
  } catch (e) {
    // status.json 可能不存在或为空，使用空对象
    console.log('⚠ data/status.json 未找到或为空，使用 schema 默认值');
  }

  // 验证覆盖值
  const warnings = [];
  if (statusJson['{{user}}']) {
    warnings.push(...validateOverrides(schema['{{user}}'].fields, statusJson['{{user}}'], '{{user}}'));
  }
  if (statusJson['女人'] && statusJson['女人']['六花']) {
    warnings.push(...validateOverrides(schema['女人'].fields['六花'].fields, statusJson['女人']['六花'], '女人.六花'));
  }

  // 输出警告
  if (warnings.length > 0) {
    console.log('⚠ 覆盖值验证警告:\n');
    warnings.forEach(w => console.log(w));
    console.log();
  }

  // 生成 status-vars.debug.json
  const charVarJson = buildCharVarJson(schema, statusJson);
  const charVarPath = path.join(__dirname, 'data/status-vars.debug.json');
  fs.writeFileSync(charVarPath, JSON.stringify(charVarJson, null, 2) + '\n');
  console.log('✓ 已生成 data/status-vars.debug.json (schema + status.json 覆盖)');

  if (warnings.length === 0) {
    console.log('✓ 覆盖值验证通过');
  }

} catch (error) {
  console.error('❌ 生成失败:', error.message);
  process.exit(1);
}
