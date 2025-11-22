import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join('./data', 'status-vars.debug.json');

console.log('🔍 验证并完成测试数据生成...');

// 读取数据
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

// 检查并补充缺失的字段
const statusBar = data['状态栏'];

console.log('📊 数据分析:');
console.log(`  ✨ 出场女模: ${statusBar['世界']['出场女模'].length} 个`);
console.log(`  📸 女模: ${Object.keys(statusBar['女模']).length} 个`);
console.log(`  🎯 拍摄任务: ${Object.keys(statusBar['小二']['拍摄任务']).length} 个`);

// 检查世界表中的新字段
if (statusBar['世界']['当前任务数']) {
  console.log('✅ 当前任务数字段已添加');
} else {
  statusBar['世界']['当前任务数'] = 4;
  console.log('✨ 添加了当前任务数字段');
}

if (statusBar['世界']['总收入']) {
  console.log('✅ 总收入字段已添加');
} else {
  statusBar['世界']['总收入'] = 25000;
  console.log('✨ 添加了总收入字段');
}

if (statusBar['世界']['项目总进度']) {
  console.log('✅ 项目总进度字段已添加');
} else {
  statusBar['世界']['项目总进度'] = 65;
  console.log('✨ 添加了项目总进度字段');
}

// 检查并更新拍摄任务表
if (statusBar['小二']['拍摄任务']) {
  console.log(`✅ 拍摄任务表的检查结果: 已添加 ${Object.keys(statusBar['小二']['拍摄任务']).length} 项`);
} else {
  console.log('⚠️ 拍摄任务表为空，尝试从角色中找出任务');
  
   // 如果拍摄任务表为空，尝试从女模列表中找出有需求的拍摄任务
  const roleTasks = {};
   Object.entries(statusBar['女模']).forEach(([roleName, roleData]) => {
    if (roleData['职务信息']) {
      const taskInfo = roleData['职务信息'];
      roleTasks[`${roleName}-创意-2024-12-28`] = {
        '状态': '未开始',
        '模特': roleName,
        '目标': '角色拍摄任务',
        '期限': '2024-12-28',
        '报酬': 2000,
        '特殊要求': taskInfo['拍摄要求'] || '无特定要求'
      };
    }
  });
  
  statusBar['小二']['拍摄任务'] = roleTasks;
  console.log(`✨ 添加了 ${Object.keys(roleTasks).length} 个角色拍摄任务`);
}

// 检查并添加客户信息（仅用于测试）
statusBar['客户'] = {
  '咨询公司': {
    '联系信息': '010-12345678',
    '主要需求': '商业摄影和广告',
    '合作项目': ['商业摄影', '广告创意'],
    '项目状态': '咨询阶段'
  }
};

// 保存数据
writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

console.log('\n🎉 验证和新数据添加完成!');
console.log('📋 最终项目总结:');
console.log(`  ✨ 出场女模: ${statusBar['世界']['出场女模'].join(', ')}`);
console.log(`  📈 项目进度: ${statusBar['世界']['项目总进度']}%`);
console.log(`  💰 预计收入: ¥${statusBar['世界']['总收入'].toLocaleString()}`);
console.log(`  🎯 待处理任务: ${Object.keys(statusBar['小二']['拍摄任务']).join(', ')})`);
console.log(`  👥 合作客户: ${Object.keys(statusBar['客户']).join(', ')})`);
