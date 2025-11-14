#!/usr/bin/env node

/**
 * 配置验证工具
 * 
 * 验证:
 * 1. data/status.yaml (schema) 的有效性
 * 2. data/status.json (overrides) 是否符合 schema
 * 3. 生成的 data/status-vars.debug.json 是否完整
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 从带类型前缀的字段名中提取真实字段名
 */
function extractFieldName(fieldNameWithPrefix) {
  const prefixMatch = fieldNameWithPrefix.match(/^\$[a-z]+(\s*=\s*\{[^}]*\}|\s*=\s*\[[^\]]*\])?\s+/);
  if (prefixMatch) {
    return fieldNameWithPrefix.substring(prefixMatch[0].length);
  }
  return fieldNameWithPrefix;
}

/**
 * 验证 schema 中的字段定义
 */
function validateSchema(schema, path = '') {
  const warnings = [];

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'description') continue;

    const fullPath = path ? `${path}.${key}` : key;

    if (value && typeof value === 'object') {
      if (value.fields) {
        // 这是一个分组对象
        warnings.push(...validateSchema(value.fields, fullPath));
      } else if (value.type && value.default === undefined) {
        warnings.push(`⚠ [${fullPath}] 缺少 default 值`);
      } else if (value.type) {
        // 验证 default 值是否符合类型定义
        const typePrefix = value.type;

        if (typePrefix.startsWith('$range')) {
          const rangeMatch = typePrefix.match(/\$range=\[([^,]+),([^\]]+)\]/);
          if (rangeMatch) {
            const [, minStr, maxStr] = rangeMatch;
            const min = parseFloat(minStr);
            const max = parseFloat(maxStr);

            if (min > max) {
              warnings.push(`❌ [${fullPath}] 范围错误: min (${min}) > max (${max})`);
            }

            if (typeof value.default !== 'number') {
              warnings.push(`⚠ [${fullPath}] 类型不匹配: 定义为 $range 但 default 是 ${typeof value.default}`);
            } else if (value.default < min || value.default > max) {
              warnings.push(`⚠ [${fullPath}] default 超出范围: ${value.default} 不在 [${min}, ${max}] 内`);
            }
          }
        }

        if (typePrefix.startsWith('$enum')) {
          const enumMatch = typePrefix.match(/\$enum=\{([^}]+)\}/);
          if (enumMatch) {
            const validValues = enumMatch[1].split(';');
            if (!validValues.includes(value.default)) {
              warnings.push(`⚠ [${fullPath}] default 不在枚举中: "${value.default}" 不在 {${validValues.join(';')}} 中`);
            }
          }
        }

        if (typePrefix === '$list' && !Array.isArray(value.default)) {
          warnings.push(`⚠ [${fullPath}] 类型不匹配: 定义为 $list 但 default 是 ${typeof value.default}`);
        }
      }
    }
  }

  return warnings;
}

/**
 * 验证 schema 和 status.json 的一致性
 */
function validateConsistency(schema, statusJson) {
  const warnings = [];

  function checkFields(schemaFields, statusFields, path = '') {
    if (!statusFields) return;

    for (const [statusKey, statusValue] of Object.entries(statusFields)) {
      const cleanFieldName = extractFieldName(statusKey);
      const fullPath = path ? `${path}.${cleanFieldName}` : cleanFieldName;

      // 查找对应的 schema 字段
      let found = false;
      for (const [schemaKey, schemaValue] of Object.entries(schemaFields)) {
        if (schemaKey === cleanFieldName) {
          found = true;
          
          // 如果是嵌套对象，递归检查
          if (schemaValue.fields && statusValue !== null && typeof statusValue === 'object' && !Array.isArray(statusValue)) {
            checkFields(schemaValue.fields, statusValue, fullPath);
          }
          break;
        }
      }

      if (!found) {
        warnings.push(`⚠ [${fullPath}] 字段不在 schema 中`);
      }
    }
  }

  if (schema['{{user}}'] && schema['{{user}}'].fields && statusJson['{{user}}']) {
    checkFields(schema['{{user}}'].fields, statusJson['{{user}}'], '{{user}}');
  }

  if (schema['女人'] && schema['女人'].fields && schema['女人'].fields['六花'] && schema['女人'].fields['六花'].fields && statusJson['女人'] && statusJson['女人']['六花']) {
    checkFields(schema['女人'].fields['六花'].fields, statusJson['女人']['六花'], '女人.六花');
  }

  return warnings;
}

try {
  console.log('验证配置系统...\n');

  // 验证 schema
  console.log('1. 验证 data/status.yaml (schema)');
  const yamlPath = path.join(__dirname, 'data/status.yaml');
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const schema = yaml.load(yamlContent);
  const schemaWarnings = validateSchema(schema);

  if (schemaWarnings.length === 0) {
    console.log('   ✓ Schema 定义有效\n');
  } else {
    console.log(`   ⚠ 检测到 ${schemaWarnings.length} 个问题:\n`);
    schemaWarnings.forEach(w => console.log(`   ${w}`));
    console.log();
  }

  // 验证 status.json
  console.log('2. 验证 data/status.json (覆盖值)');
  const statusJsonPath = path.join(__dirname, 'data/status.json');
  let statusJson = {};
  let hasStatusJson = false;
  try {
    statusJson = JSON.parse(fs.readFileSync(statusJsonPath, 'utf8'));
    hasStatusJson = true;
  } catch (e) {
    console.log('   ⚠ data/status.json 未找到或为空\n');
  }

  if (hasStatusJson) {
    const consistencyWarnings = validateConsistency(schema, statusJson);
    if (consistencyWarnings.length === 0) {
      console.log('   ✓ 覆盖值与 schema 一致\n');
    } else {
      console.log(`   ⚠ 检测到 ${consistencyWarnings.length} 个问题:\n`);
      consistencyWarnings.forEach(w => console.log(`   ${w}`));
      console.log();
    }
  }

  // 验证 status-vars.debug.json
  console.log('3. 验证 data/status-vars.debug.json (生成数据)');
  const charVarPath = path.join(__dirname, 'data/status-vars.debug.json');
  try {
    const charVar = JSON.parse(fs.readFileSync(charVarPath, 'utf8'));
    const xiaoi = charVar['状态栏']['小二'];
    const liuhua = charVar['状态栏']['女人']['六花'];

    if (xiaoi && Object.keys(xiaoi).length > 0 && liuhua && Object.keys(liuhua).length > 0) {
      console.log('   ✓ status-vars.debug.json 完整且有效');
      console.log(`     - 小二字段数: ${Object.keys(xiaoi).length}`);
      console.log(`     - 六花字段数: ${Object.keys(liuhua).length}`);
    } else {
      console.log('   ❌ status-vars.debug.json 数据不完整');
    }
  } catch (e) {
    console.log('   ⚠ status-vars.debug.json 无法读取');
  }

  console.log('\n✓ 验证完成');

} catch (error) {
  console.error('❌ 验证失败:', error.message);
  process.exit(1);
}
