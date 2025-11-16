#!/usr/bin/env node

/**
 * 将 status.json 压缩成单行并复制到剪贴板
 * 用法: node copy-status.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// 读取 status.json
const statusPath = path.join(__dirname, 'data', 'status.json');

try {
  const statusContent = fs.readFileSync(statusPath, 'utf8');
  
  // 解析并再次序列化，移除所有空白字符
  const parsed = JSON.parse(statusContent);
  const compressed = JSON.stringify(parsed);
  
  console.log('📊 压缩统计:');
  console.log(`   原始大小: ${statusContent.length} 字符`);
  console.log(`   压缩大小: ${compressed.length} 字符`);
  console.log(`   压缩率: ${((1 - compressed.length / statusContent.length) * 100).toFixed(1)}%`);
  console.log('');
  
  // 根据操作系统选择不同的剪贴板工具
  const platform = process.platform;
  let copied = false;
  
   if (platform === 'darwin') {
     // macOS
     try {
       spawnSync('pbcopy', { input: compressed, encoding: 'utf8', stdio: ['pipe', 'ignore', 'ignore'] });
       console.log('✅ status.json 已压缩并复制到剪贴板 (macOS)');
       copied = true;
     } catch (e) {
       // 继续尝试其他方法
     }
   } else if (platform === 'linux') {
     // Linux - 尝试多个工具
     const tools = [
       { cmd: 'xclip', args: ['-selection', 'clipboard'] },
       { cmd: 'xsel', args: ['-b', '-i'] },
       { cmd: 'wl-copy', args: [] }
     ];
     
     for (const tool of tools) {
       try {
         spawnSync(tool.cmd, tool.args, { input: compressed, encoding: 'utf8', stdio: ['pipe', 'ignore', 'ignore'] });
         console.log(`✅ status.json 已压缩并复制到剪贴板 (Linux - ${tool.cmd})`);
         copied = true;
         break;
       } catch (e) {
         // 继续尝试下一个工具
       }
     }
     
     if (!copied) {
       console.warn('⚠️  无法找到剪贴板工具。');
       console.warn('   请安装以下任一工具: xclip, xsel 或 wl-copy');
     }
   } else if (platform === 'win32') {
     // Windows
     try {
       spawnSync('clip', { input: compressed, encoding: 'utf8', shell: true, stdio: ['pipe', 'ignore', 'ignore'] });
       console.log('✅ status.json 已压缩并复制到剪贴板 (Windows)');
       copied = true;
     } catch (e) {
       // 继续
     }
   }
  
  if (!copied) {
    console.log('📋 内容已生成，可手动复制:');
    console.log('   内容预览 (前200字符):');
    console.log('   ' + compressed.substring(0, 200) + '...');
    console.log('');
    console.log('   完整内容已输出到标准输出，可使用管道重定向:');
    console.log('   node copy-status.js | xclip -selection clipboard');
  }
  
  // 如果未成功复制，输出内容到stdout
  if (!copied) {
    console.log('');
    console.log('--- 开始: status.json 压缩内容 ---');
    console.log(compressed);
    console.log('--- 结束: status.json 压缩内容 ---');
  }
  
  process.exit(0);
  
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
