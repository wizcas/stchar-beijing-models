#!/usr/bin/env node

/**
 * 配置验证工具 - 验证 status.yaml 的完整性和一致性
 * 
 * status.yaml 是唯一真实来源
 * 验证：
 * 1. status.yaml 的 schema 定义是否有效
 * 2. 所有字段是否有默认值
 * 3. 默认值是否符合类型约束
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 验证 schema 中的字段定义
 */
function validateSchema(fields, path = '') {
  const warnings = [];

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

    const fullPath = path ? `${path}.${fieldName}` : fieldName;

    if (fieldConfig.fields) {
      // 嵌套对象：递归验证
      warnings.push(...validateSchema(fieldConfig.fields, fullPath));
    } else if (fieldConfig.type) {
      // 有类型定义的字段：验证默认值

      // 1. 检查是否有默认值
      if (fieldConfig.default === undefined) {
        warnings.push(`⚠ [${fullPath}] 缺少 default 值`);
        continue;
      }

      const typePrefix = fieldConfig.type;

      // 2. 验证 default 值是否符合类型约束
      if (typePrefix.startsWith('$range')) {
        const rangeMatch = typePrefix.match(/\$range=\[([^,]+),([^\]]+)\]/);
        if (rangeMatch) {
          const [, minStr, maxStr] = rangeMatch;
          const min = parseFloat(minStr);
          const max = parseFloat(maxStr);

          if (min > max) {
            warnings.push(`❌ [${fullPath}] 范围错误: min (${min}) > max (${max})`);
          }

          if (typeof fieldConfig.default !== 'number') {
            warnings.push(`⚠ [${fullPath}] 类型不匹配: 定义为 $range 但 default 是 ${typeof fieldConfig.default}`);
          } else if (fieldConfig.default < min || fieldConfig.default > max) {
            warnings.push(`⚠ [${fullPath}] default 超出范围: ${fieldConfig.default} 不在 [${min}, ${max}] 内`);
          }
        }
      }

      if (typePrefix.startsWith('$enum')) {
        const enumMatch = typePrefix.match(/\$enum=\{([^}]+)\}/);
        if (enumMatch) {
          const validValues = enumMatch[1].split(';');
          if (!validValues.includes(fieldConfig.default)) {
            warnings.push(`⚠ [${fullPath}] default 不在枚举中: "${fieldConfig.default}" 不在 {${validValues.join(';')}} 中`);
          }
        }
      }

      if (typePrefix === '$list' && !Array.isArray(fieldConfig.default)) {
        warnings.push(`⚠ [${fullPath}] 类型不匹配: 定义为 $list 但 default 是 ${typeof fieldConfig.default}`);
      }

      if (typePrefix === '$ro' && fieldConfig.default === undefined) {
        warnings.push(`⚠ [${fullPath}] 只读字段应有 default 值`);
      }
    }
  }

  return warnings;
}

/**
 * 统计 schema 中的字段数量
 */
function countFields(fields) {
  let count = 0;
  for (const [, fieldConfig] of Object.entries(fields)) {
    if (!fieldConfig || typeof fieldConfig !== 'object') continue;

    if (fieldConfig.fields) {
      count += countFields(fieldConfig.fields);
    } else {
      count++;
    }
  }
  return count;
}

try {
  console.log('🔍 验证配置系统...\n');

  // 读取和解析 schema
  console.log('1. 解析 data/status.yaml');
  const yamlPath = path.join(__dirname, 'data/status.yaml');
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const schema = yaml.load(yamlContent);
  console.log('   ✓ YAML 解析成功\n');

  // 验证各部分的 schema
  console.log('2. 验证 schema 定义');
  let totalWarnings = [];

  // 验证世界部分
  if (schema['世界'] && schema['世界'].fields) {
    const worldWarnings = validateSchema(schema['世界'].fields, '世界');
    if (worldWarnings.length === 0) {
      const count = countFields(schema['世界'].fields);
      console.log(`   ✓ 世界部分 (${count} 个字段)`);
    } else {
      totalWarnings.push(...worldWarnings);
    }
  }

   // 验证用户部分
   if (schema['user'] && schema['user'].fields) {
     const userWarnings = validateSchema(schema['user'].fields, 'user');
     if (userWarnings.length === 0) {
       const count = countFields(schema['user'].fields);
       console.log(`   ✓ user 部分 (${count} 个字段)`);
    } else {
      totalWarnings.push(...userWarnings);
    }
  }

    // 验证女模部分
   if (schema['女模'] && schema['女模'].fields) {
     for (const [charName, charConfig] of Object.entries(schema['女模'].fields)) {
       if (charConfig && charConfig.fields) {
         const charWarnings = validateSchema(charConfig.fields, `女模.${charName}`);
         if (charWarnings.length === 0) {
           const count = countFields(charConfig.fields);
           console.log(`   ✓ 女模.${charName} (${count} 个字段)`);
        } else {
          totalWarnings.push(...charWarnings);
        }
      }
    }
  }

  console.log();

  // 验证生成的文件
  console.log('3. 验证生成的文件');

  // 检查 status.json
  try {
    const statusJsonPath = path.join(__dirname, 'data/status.json');
    const statusJson = JSON.parse(fs.readFileSync(statusJsonPath, 'utf8'));
    console.log('   ✓ data/status.json 有效');
  } catch (e) {
    console.log(`   ⚠ data/status.json 无效: ${e.message}`);
  }

  // 检查 status-vars.debug.json
  try {
    const charVarPath = path.join(__dirname, 'data/status-vars.debug.json');
    const charVar = JSON.parse(fs.readFileSync(charVarPath, 'utf8'));
    
    if (charVar['状态栏']) {
      const worldData = charVar['状态栏']['世界'];
      const userData = charVar['状态栏']['小二'];
       const womenData = charVar['状态栏']['女模'];

      let count = 0;
      if (worldData) count += Object.keys(worldData).length;
      if (userData) count += Object.keys(userData).length;
      if (womenData && womenData['六花']) count += Object.keys(womenData['六花']).length;

      console.log(`   ✓ data/status-vars.debug.json 有效 (${count} 个字段)`);
    }
  } catch (e) {
    console.log(`   ⚠ data/status-vars.debug.json 无效: ${e.message}`);
  }

  console.log();

  // 输出验证结果
  if (totalWarnings.length === 0) {
    console.log('✅ 所有验证通过\n');
    process.exit(0);
  } else {
    console.log(`⚠️  检测到 ${totalWarnings.length} 个问题:\n`);
    totalWarnings.forEach(w => console.log(`  ${w}`));
    console.log();
    process.exit(1);
  }

} catch (error) {
  console.error('❌ 验证失败:', error.message);
  process.exit(1);
}
