# 🔧 构建脚本优化报告

## 🎯 **优化目标**

实现生产和开发模式的构建分离，支持 `--prod` 标志切换到生产模式，使用 `loadStatusData` 替代 `loadTestData`，并将生产版本输出到 `build` 目录。

## 🔧 **技术实现**

### **1. 构建模式检测**
```javascript
// 检查是否为生产模式
const isProduction = process.argv.includes("--prod");
```

### **2. 生产模式代码转换**
```javascript
if (isProduction) {
  console.log("🚀 Building for production...");
  
  // 1. 替换函数调用
  jsContent = jsContent.replace(
    /const statusData = await loadTestData\(\);/g,
    'const statusData = await loadStatusData();'
  );
  
  // 2. 移除整个 loadTestData 函数定义
  jsContent = jsContent.replace(
    /\/\/ 测试数据函数（从外部文件读取）\s*async function loadTestData\(\)\s*\{[\s\S]*?\}\s*(?=\/\/|async function|$)/g,
    ''
  );
  
  // 3. 移除测试数据相关的注释块
  jsContent = jsContent.replace(
    /\/\/ Production: 使用 loadStatusData\(\) 从API获取数据\s*\/\/ Development: 使用 loadTestData\(\) 从char-var\.json获取测试数据\s*\/\/ const statusData = await loadStatusData\(\);/g,
    '// Production: 使用 loadStatusData() 从API获取数据'
  );
  
  // 4. 清理多余的空行
  jsContent = jsContent.replace(/\n\s*\n\s*\n/g, '\n\n');
}
```

### **3. 输出路径配置**
```javascript
// 确定输出目录和文件名
const outputDir = isProduction ? "build" : ".";
const outputFile = isProduction ? "status.html" : "status.raw.html";
const outputPath = path.join(outputDir, outputFile);

// 确保输出目录存在
if (isProduction && !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 写入最终文件
fs.writeFileSync(outputPath, finalHtml);
```

### **4. package.json 脚本配置**
```json
{
  "scripts": {
    "build": "node build.js",
    "build:prod": "node build.js --prod",
    "dev": "concurrently 'node build.js --watch' 'http-server'"
  }
}
```

## 📊 **构建模式对比**

### **开发模式** (`npm run build`)
```
输入: src/main.js (包含 loadTestData)
处理: 无代码转换
输出: status.raw.html (当前目录)
用途: 本地开发和测试
数据源: char-var.json (测试数据)
```

### **生产模式** (`npm run build:prod`)
```
输入: src/main.js (包含 loadTestData)
处理: 代码转换和清理
输出: build/status.html (build目录)
用途: 生产环境部署
数据源: STscript API (真实数据)
```

## 🔄 **代码转换流程**

### **转换前 (开发模式)**
```javascript
// 测试数据函数（从外部文件读取）
async function loadTestData() {
  try {
    // 方案1: 如果在HTTP服务器环境下，使用fetch
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      let response = await fetch("char-var.json");
      // ... 测试数据加载逻辑
    }
  } catch (error) {
    // ... 错误处理
  }
}

// 初始化页面
async function init() {
  try {
    // Production: 使用 loadStatusData() 从API获取数据
    // Development: 使用 loadTestData() 从char-var.json获取测试数据
    // const statusData = await loadStatusData();
    const statusData = await loadTestData();
    // ...
  }
}
```

### **转换后 (生产模式)**
```javascript
// Production数据获取函数
async function loadStatusData() {
  const raw = await STscript("/getvar 状态栏");
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// 初始化页面
async function init() {
  try {
    // Production: 使用 loadStatusData() 从API获取数据
    const statusData = await loadStatusData();
    // ...
  }
}
```

## 🎯 **优化效果**

### **1. 代码清理**
- ✅ **移除测试代码**: 生产版本不包含测试数据逻辑
- ✅ **减少文件大小**: 移除不必要的代码和注释
- ✅ **提升安全性**: 避免暴露测试相关的代码路径

### **2. 部署优化**
- ✅ **独立目录**: 生产文件输出到 `build` 目录
- ✅ **清晰命名**: `status.html` vs `status.raw.html`
- ✅ **版本分离**: 开发和生产版本完全分离

### **3. 开发体验**
- ✅ **简单命令**: `npm run build:prod` 一键生产构建
- ✅ **自动转换**: 无需手动修改代码
- ✅ **保持开发**: 开发模式不受影响

## 📁 **文件结构**

### **构建前**
```
scripts/
├── src/
│   ├── main.js (包含测试和生产代码)
│   ├── style.css
│   └── index.html
├── package.json
└── build.js
```

### **构建后**
```
scripts/
├── src/ (源码不变)
├── build/
│   └── status.html (生产版本)
├── status.raw.html (开发版本)
├── package.json
└── build.js
```

## 🚀 **使用方法**

### **开发构建**
```bash
npm run build
# 输出: status.raw.html (包含测试数据逻辑)
```

### **生产构建**
```bash
npm run build:prod
# 输出: build/status.html (使用 loadStatusData)
```

### **开发模式**
```bash
npm run dev
# 启动开发服务器 + 文件监听
```

## 🔍 **技术细节**

### **1. 正则表达式匹配**
```javascript
// 函数调用替换
/const statusData = await loadTestData\(\);/g

// 函数定义移除
/\/\/ 测试数据函数（从外部文件读取）\s*async function loadTestData\(\)\s*\{[\s\S]*?\}\s*(?=\/\/|async function|$)/g

// 注释块清理
/\/\/ Production: 使用 loadStatusData\(\) 从API获取数据\s*\/\/ Development: 使用 loadTestData\(\) 从char-var\.json获取测试数据\s*\/\/ const statusData = await loadStatusData\(\);/g
```

### **2. 路径处理**
```javascript
const path = require("path");

// 动态路径生成
const outputDir = isProduction ? "build" : ".";
const outputFile = isProduction ? "status.html" : "status.raw.html";
const outputPath = path.join(outputDir, outputFile);
```

### **3. 目录管理**
```javascript
// 确保输出目录存在
if (isProduction && !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
```

## 🎉 **总结**

这次构建脚本优化实现了**完美的开发/生产分离**：

### **技术成就**
- ✅ **智能转换**: 自动替换数据加载函数
- ✅ **代码清理**: 移除测试相关代码
- ✅ **路径管理**: 生产版本独立目录
- ✅ **脚本简化**: 一键生产构建

### **开发体验**
- ✅ **无缝切换**: 开发和生产模式轻松切换
- ✅ **自动化**: 无需手动修改代码
- ✅ **版本分离**: 清晰的文件组织结构
- ✅ **部署就绪**: 生产版本可直接部署

### **维护优势**
- ✅ **单一源码**: 一套代码支持两种模式
- ✅ **自动同步**: 功能更新自动同步到两个版本
- ✅ **错误减少**: 避免手动切换的人为错误
- ✅ **CI/CD友好**: 适合自动化部署流程

现在构建系统具有了**专业级的开发/生产分离能力**，为项目的持续集成和部署提供了坚实的基础！🔧✨
