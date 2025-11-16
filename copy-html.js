#!/usr/bin/env node

/**
 * 压缩生产环境的 status.html 并复制到剪贴板
 * 用法: node copy-html.js
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// 定义 HTML 文件路径
const htmlPath = path.join(__dirname, "build", "status.html");

try {
  // 检查文件是否存在
  if (!fs.existsSync(htmlPath)) {
    console.error("❌ 错误: 找不到 build/status.html");
    console.log("   请先运行: pnpm run build:prod");
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  console.log("📊 HTML 统计:");
  console.log(`   文件大小: ${htmlContent.length} 字符`);
  console.log("");

  // 根据操作系统选择不同的剪贴板工具
  const platform = process.platform;
  let copied = false;

   if (platform === "darwin") {
     // macOS
     try {
       spawnSync("pbcopy", { input: htmlContent, encoding: "utf8", stdio: ["pipe", "ignore", "ignore"] });
       console.log("✅ status.html 已复制到剪贴板 (macOS)");
       copied = true;
     } catch (e) {
       // 继续
     }
   } else if (platform === "linux") {
     // Linux - 尝试多个工具
     const tools = [
       { cmd: "xclip", args: ["-selection", "clipboard"] },
       { cmd: "xsel", args: ["-b", "-i"] },
       { cmd: "wl-copy", args: [] },
     ];

     for (const tool of tools) {
       try {
         spawnSync(tool.cmd, tool.args, {
           input: htmlContent,
           encoding: "utf8",
           stdio: ["pipe", "ignore", "ignore"],
         });
         console.log(`✅ status.html 已复制到剪贴板 (Linux - ${tool.cmd})`);
         copied = true;
         break;
       } catch (e) {
         // 继续尝试下一个工具
       }
     }

     if (!copied) {
       console.warn("⚠️  无法找到剪贴板工具。");
       console.warn("   请安装以下任一工具: xclip, xsel 或 wl-copy");
     }
   } else if (platform === "win32") {
     // Windows
     try {
       spawnSync("clip", { input: htmlContent, encoding: "utf8", shell: true, stdio: ["pipe", "ignore", "ignore"] });
       console.log("✅ status.html 已复制到剪贴板 (Windows)");
       copied = true;
     } catch (e) {
       // 继续
     }
   }

  if (!copied) {
    console.log("📋 内容已生成，可手动复制:");
    console.log("   内容预览 (前200字符):");
    console.log("   " + htmlContent.substring(0, 200) + "...");
    console.log("");
    console.log("   完整内容已输出到标准输出，可使用管道重定向:");
    console.log("   node copy-html.js | xclip -selection clipboard");
  }

  // 如果未成功复制，输出内容到stdout
  if (!copied) {
    console.log("");
    console.log("--- 开始: status.html 内容 ---");
    console.log(htmlContent);
    console.log("--- 结束: status.html 内容 ---");
  }

  process.exit(0);
} catch (error) {
  console.error("❌ 错误:", error.message);
  process.exit(1);
}
