console.log('测试脚本启动');

// 导入fs模块
import { readFileSync } from 'fs';

// 读取数据文件
const data = JSON.parse(readFileSync('./data/status-vars.debug.json', 'utf8'));
console.log('成功读取数据', Object.keys(data['状态栏']));

// 更新出场女模
data['状态栏']['世界']['出场女模'] = ['Luna', '梦瑶'];

// 打印结果
console.log('更新后出场女模:', data['状态栏']['世界']['出场女模']);
console.log('脚本执行完成');
