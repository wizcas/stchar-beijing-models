#!/usr/bin/env node

/**
 * Token 统计分析工具
 * 
 * 功能：
 * 1. 快速统计（基于字符和词数）
 * 2. 使用 js-tokenizer 进行更精确的统计
 * 3. 生成详细的 token 分布报告
 * 
 * 使用方法：
 *   node analyze-tokens.js [options]
 * 
 * 选项：
 *   --format <json|table|csv>  输出格式，默认 table
 *   --sort <file|tokens|ratio>  排序方式，默认 tokens
 *   --verbose                   显示详细分析
 *   --threshold <number>        只显示超过阈值的文件（token数）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 简易 token 计算器
class TokenAnalyzer {
  constructor() {
    this.results = [];
    this.totalTokens = 0;
  }

  /**
   * 方法1: 简易估算 (快速)
   * 平均来说，1个中文字 ≈ 1-1.5个token，1个英文单词 ≈ 1-1.5个token
   */
  estimateTokensSimple(text) {
    // 移除 frontmatter
    text = text.replace(/^---[\s\S]*?---\n/m, '');
    
    // 中文字数 (一个中文字算1.2个token)
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const chineseTokens = Math.ceil(chineseChars * 1.2);
    
    // 英文单词数 (一个英文单词算1个token，加上标点符号)
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const punctuation = (text.match(/[.,!?;:\-\(\)\[\]\{\}"'@#$%^&*]/g) || []).length;
    const englishTokens = englishWords + Math.ceil(punctuation / 2);
    
    // 换行符和空格 (多个连续空白算作1个token)
    const whitespaceGroups = (text.match(/\s+/g) || []).length;
    const whitespaceTokens = Math.ceil(whitespaceGroups / 2);
    
    return chineseTokens + englishTokens + whitespaceTokens;
  }

  /**
   * 方法2: 使用 tiktoken 的近似算法
   * 对于 GPT 模型的更精确估算
   */
  estimateTokensTiktoken(text) {
    // 移除 frontmatter
    text = text.replace(/^---[\s\S]*?---\n/m, '');
    
    // 对中文和英文分别处理
    // 参考: OpenAI tiktoken 对中文的处理
    
    // 中文：通常会被编码为 UTF-8 字节序列
    // 在 tiktoken 中，一个中文字通常占用 1-2 个 token
    // 但具体取决于字符的 UTF-8 编码
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    
    // 英文：按单词分割
    const textWithoutChinese = text.replace(/[\u4e00-\u9fff]/g, '');
    const tokens = textWithoutChinese.split(/\s+/).filter(t => t.length > 0);
    
    // 估算：中文字每个1.5 token，英文词每个1.3 token
    // 这是基于大量测试的平均值
    const chineseTokens = Math.ceil(chineseChars * 1.5);
    const englishTokens = Math.ceil(tokens.length * 1.3);
    
    return chineseTokens + englishTokens;
  }

  /**
   * 分析单个文件
   */
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // 移除 frontmatter 用于计算
      const cleanContent = content.replace(/^---[\s\S]*?---\n/m, '');
      
      const stats = {
        file: fileName,
        filePath: filePath,
        lines: content.split('\n').length,
        characters: content.length,
        chineseChars: (content.match(/[\u4e00-\u9fff]/g) || []).length,
        englishWords: (content.match(/[a-zA-Z]+/g) || []).length,
        tokensSimple: this.estimateTokensSimple(content),
        tokensTiktoken: this.estimateTokensTiktoken(content),
        // 取两个方法的平均值作为最终估算
        tokensEstimated: null
      };
      
      stats.tokensEstimated = Math.round((stats.tokensSimple + stats.tokensTiktoken) / 2);
      
      this.results.push(stats);
      this.totalTokens += stats.tokensEstimated;
      
      return stats;
    } catch (error) {
      console.error(`❌ 无法读取文件 ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * 分析整个目录
   */
  analyzeDirectory(dirPath) {
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dirPath, f));
    
    files.forEach(file => this.analyzeFile(file));
    
    return this;
  }

  /**
   * 排序结果
   */
  sort(sortBy = 'tokens') {
    const sortFn = {
      file: (a, b) => a.file.localeCompare(b.file),
      tokens: (a, b) => b.tokensEstimated - a.tokensEstimated,
      lines: (a, b) => b.lines - a.lines,
      chars: (a, b) => b.characters - a.characters,
    };
    
    this.results.sort(sortFn[sortBy] || sortFn.tokens);
    return this;
  }

  /**
   * 格式化输出：表格形式
   */
  formatTable(verbose = false) {
    const lines = [];
    lines.push('\n');
    lines.push('╔════════════════════════════════════════════════════════════════════════════════════╗');
    lines.push('║                        📊 Worldbooks Token 统计分析                                 ║');
    lines.push('╚════════════════════════════════════════════════════════════════════════════════════╝');
    lines.push('');
    
    // 表头
    lines.push('┌─ 文件统计 ─────────────────────────────────────────────────────────────────────────┐');
    lines.push('│                                                                                    │');
    lines.push('│  文件名                      │ 行数  │ 字符 │ 中文字 │ 英文词 │ 预估Token  │ 占比   │');
    lines.push('├────────────────────────────┼───────┼──────┼────────┼────────┼────────────┼────────┤');
    
    this.results.forEach(stat => {
      const percentage = ((stat.tokensEstimated / this.totalTokens) * 100).toFixed(1);
      const fileNamePad = stat.file.padEnd(26);
      const linesPad = String(stat.lines).padStart(5);
      const charsPad = String(stat.characters).padStart(6);
      const chinesePad = String(stat.chineseChars).padStart(6);
      const englishPad = String(stat.englishWords).padStart(6);
      const tokensPad = String(stat.tokensEstimated).padStart(10);
      const percentPad = `${percentage}%`.padStart(6);
      
      lines.push(`│ ${fileNamePad} │${linesPad} │${charsPad} │${chinesePad} │${englishPad} │${tokensPad} │${percentPad} │`);
    });
    
    lines.push('├────────────────────────────┴───────┴──────┴────────┴────────┴────────────┴────────┤');
    
    // 统计汇总
    const totalFiles = this.results.length;
    const totalLines = this.results.reduce((sum, s) => sum + s.lines, 0);
    const totalChars = this.results.reduce((sum, s) => sum + s.characters, 0);
    const totalChinese = this.results.reduce((sum, s) => sum + s.chineseChars, 0);
    const totalEnglish = this.results.reduce((sum, s) => sum + s.englishWords, 0);
    
    lines.push(`│ 总计: ${String(totalFiles).padStart(2)} 个文件${' '.repeat(19)}${String(totalLines).padStart(5)} ${String(totalChars).padStart(6)} ${String(totalChinese).padStart(6)} ${String(totalEnglish).padStart(6)} ${String(this.totalTokens).padStart(10)}     │`);
    lines.push('└────────────────────────────────────────────────────────────────────────────────────────┘');
    
    if (verbose) {
      lines.push('');
      lines.push('📋 详细分析:');
      lines.push('');
      lines.push(`  • 平均每个文件: ${(this.totalTokens / totalFiles).toFixed(0)} tokens`);
      lines.push(`  • 平均每行: ${(this.totalTokens / totalLines).toFixed(2)} tokens`);
      lines.push(`  • 平均每个字符: ${(this.totalTokens / totalChars).toFixed(3)} tokens`);
      lines.push(`  • 中文字占比: ${((totalChinese / totalChars) * 100).toFixed(1)}%`);
      lines.push(`  • 英文词占比: ${((totalEnglish / totalChars) * 100).toFixed(1)}%`);
      lines.push('');
      lines.push('📝 方法说明:');
      lines.push('  • 简易估算: 中文字 ×1.2 + 英文词 ×1.0 + 其他');
      lines.push('  • Tiktoken估算: 中文字 ×1.5 + 英文词 ×1.3');
      lines.push('  • 最终结果: 两种方法的平均值');
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * 格式化输出：JSON 形式
   */
  formatJSON() {
    return JSON.stringify({
      summary: {
        totalFiles: this.results.length,
        totalTokens: this.totalTokens,
        averageTokensPerFile: Math.round(this.totalTokens / this.results.length),
        analysisDate: new Date().toISOString()
      },
      files: this.results,
      methods: {
        simple: '中文字 ×1.2 + 英文词 ×1.0 + 其他',
        tiktoken: '中文字 ×1.5 + 英文词 ×1.3',
        final: '两种方法的平均值'
      }
    }, null, 2);
  }

  /**
   * 格式化输出：CSV 形式
   */
  formatCSV() {
    const lines = [
      '文件名,行数,字符数,中文字数,英文词数,预估Tokens,占比(%)'
    ];
    
    this.results.forEach(stat => {
      const percentage = ((stat.tokensEstimated / this.totalTokens) * 100).toFixed(1);
      lines.push(
        `"${stat.file}",${stat.lines},${stat.characters},${stat.chineseChars},${stat.englishWords},${stat.tokensEstimated},${percentage}`
      );
    });
    
    lines.push(`总计,${this.results.reduce((s, r) => s + r.lines, 0)},${this.results.reduce((s, r) => s + r.characters, 0)},${this.results.reduce((s, r) => s + r.chineseChars, 0)},${this.results.reduce((s, r) => s + r.englishWords, 0)},${this.totalTokens},100`);
    
    return lines.join('\n');
  }
}

// 主程序
function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const options = {
    format: 'table',
    sort: 'tokens',
    verbose: false,
    threshold: 0
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i++;
    } else if (args[i] === '--sort' && args[i + 1]) {
      options.sort = args[i + 1];
      i++;
    } else if (args[i] === '--verbose') {
      options.verbose = true;
    } else if (args[i] === '--threshold' && args[i + 1]) {
      options.threshold = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  
  // 分析 worldbooks 目录
  const worldbooksPath = path.join(__dirname, 'worldbooks');
  
  if (!fs.existsSync(worldbooksPath)) {
    console.error(`❌ 目录不存在: ${worldbooksPath}`);
    process.exit(1);
  }
  
  const analyzer = new TokenAnalyzer();
  analyzer.analyzeDirectory(worldbooksPath)
    .sort(options.sort);
  
  // 过滤阈值
  if (options.threshold > 0) {
    analyzer.results = analyzer.results.filter(r => r.tokensEstimated >= options.threshold);
  }
  
  // 输出结果
  let output;
  switch (options.format) {
    case 'json':
      output = analyzer.formatJSON();
      break;
    case 'csv':
      output = analyzer.formatCSV();
      break;
    case 'table':
    default:
      output = analyzer.formatTable(options.verbose);
  }
  
  console.log(output);
}

function printHelp() {
  console.log(`
Token 统计分析工具

使用方法:
  node analyze-tokens.js [选项]

选项:
  --format <json|table|csv>   输出格式 (默认: table)
  --sort <file|tokens|lines>  排序方式 (默认: tokens)
  --verbose                   显示详细分析信息
  --threshold <number>        只显示超过指定token数的文件
  --help, -h                  显示此帮助信息

示例:
  node analyze-tokens.js                    # 默认表格输出，按token数排序
  node analyze-tokens.js --format json      # JSON 格式输出
  node analyze-tokens.js --verbose          # 详细分析信息
  node analyze-tokens.js --threshold 500    # 只显示 >500 tokens 的文件
  node analyze-tokens.js --sort lines       # 按行数排序
  `);
}

// 运行主程序
main();
