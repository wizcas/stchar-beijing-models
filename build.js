const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// ==================== 代码生成模块 ====================
// 从 config.json 生成源代码

function loadConfig() {
  const configPath = path.join(__dirname, "src", "config.json");
  const configContent = fs.readFileSync(configPath, "utf8");
  return JSON.parse(configContent);
}

// 生成 css-constants.js
function generateCssConstants(config) {
  const { cssClasses, tagClasses, collapsibleClasses } = config;
  
  let code = `// CSS类名常量定义模块 (自动生成，勿手动修改)\n\n`;
  code += `// CSS类名常量对象\n`;
  code += `const CSS_CLASSES = {\n`;
  
  for (const [key, value] of Object.entries(cssClasses)) {
    code += `  ${key}: "${value}",\n`;
  }
  
  code += `};\n\n`;
  code += `// 标签相关的CSS类名\n`;
  code += `const TAG_CLASSES = {\n`;
  
  for (const [key, value] of Object.entries(tagClasses)) {
    code += `  ${key}: "${value}",\n`;
  }
  
  code += `};\n\n`;
  code += `// 可折叠内容相关的CSS类名\n`;
  code += `const COLLAPSIBLE_CLASSES = {\n`;
  
  for (const [key, value] of Object.entries(collapsibleClasses)) {
    code += `  ${key}: "${value}",\n`;
  }
  
  code += `};\n\n`;
  code += `// 导出CSS常量\n`;
  code += `export { CSS_CLASSES, TAG_CLASSES, COLLAPSIBLE_CLASSES };\n`;
  
  return code;
}

// 生成 fields.js
function generateFieldsModule(config) {
  const { fields, fieldOrder, userFields, womanFields, systemFields } = config;
  
  let code = `// 字段配置和顺序管理模块 (自动生成，勿手动修改)\n\n`;
  code += `// 字段配置数组 - 定义所有字段及其emoji\n`;
  code += `const fieldConfig = [\n`;
  
  fields.forEach((field) => {
    code += `  { name: "${field.name}", emoji: "${field.emoji}" },\n`;
  });
  
  code += `];\n\n`;
  code += `// 从字段配置生成通用字段顺序\n`;
  code += `const universalFieldOrder = fieldConfig.map((field) => field.name);\n\n`;
  code += `// 从字段配置生成emoji映射\n`;
  code += `const emojiMap = {};\n`;
  code += `fieldConfig.forEach((field) => {\n`;
  code += `  emojiMap[field.name] = field.emoji;\n`;
  code += `});\n\n`;
  code += `// 为字段名添加emoji\n`;
  code += `function addEmojiToFieldName(fieldName) {\n`;
  code += `  const emoji = emojiMap[fieldName];\n`;
  code += `  return emoji ? emoji + ' ' + fieldName : fieldName;\n`;
  code += `}\n\n`;
  code += `// 特定角色类型的字段顺序配置\n`;
  code += `const fieldOrder = {\n`;
  
  for (const [key, value] of Object.entries(fieldOrder)) {
    code += `  "${key}": [${value.map((f) => `"${f}"`).join(", ")}],\n`;
  }
  
  code += `};\n\n`;
  code += `// 创建通用字段顺序的Set，提高查找性能\n`;
  code += `const universalFieldOrderSet = new Set(universalFieldOrder);\n\n`;
  code += `// 预计算字段顺序的Set，提高查找性能\n`;
  code += `const fieldOrderSets = {};\n`;
  code += `for (const [section, fields] of Object.entries(fieldOrder)) {\n`;
  code += `  fieldOrderSets[section] = new Set(fields);\n`;
  code += `}\n\n`;
  code += `// 检测角色类型的函数\n`;
  code += `function detectCharacterType(sectionName, sectionData) {\n`;
  code += `  // 检查是否包含用户特有字段\n`;
  code += `  const userFields = [${userFields.map((f) => `"${f}"`).join(", ")}];\n`;
  code += `  const hasUserFields = userFields.some(\n`;
  code += `    (field) => sectionData && sectionData.hasOwnProperty(field),\n`;
  code += `  );\n\n`;
  code += `  // 检查是否包含女性角色特有字段\n`;
  code += `  const womanFields = [${womanFields.map((f) => `"${f}"`).join(", ")}];\n`;
  code += `  const hasWomanFields = womanFields.some(\n`;
  code += `    (field) => sectionData && sectionData.hasOwnProperty(field),\n`;
  code += `  );\n\n`;
  code += `  // 检查是否为系统分类字段\n`;
  code += `  const systemFields = [${systemFields.map((f) => `"${f}"`).join(", ")}];\n`;
  code += `  const isSystemField = systemFields.includes(sectionName);\n\n`;
  code += `  if (hasUserFields || sectionName.includes("user") || sectionName.includes("小二")) {\n`;
  code += `    return "user";\n`;
  code += `  } else if (isSystemField) {\n`;
  code += `    return "system";\n`;
  code += `  } else if (hasWomanFields || (!hasUserFields && !isSystemField)) {\n`;
  code += `    return "woman";\n`;
  code += `  }\n\n`;
  code += `  return "unknown";\n`;
  code += `}\n\n`;
  code += `// 获取字段顺序的函数\n`;
  code += `function getFieldOrder(sectionName, sectionData = null) {\n`;
  code += `  // 优先使用精确匹配的特定配置\n`;
  code += `  if (fieldOrder[sectionName]) {\n`;
  code += `    return fieldOrder[sectionName];\n`;
  code += `  }\n\n`;
  code += `  // 基于内容检测角色类型\n`;
  code += `  const characterType = detectCharacterType(sectionName, sectionData);\n\n`;
  code += `  switch (characterType) {\n`;
  code += `    case "user":\n`;
  code += `      return fieldOrder["{{user}}"];\n`;
  code += `    case "woman":\n`;
  code += `      return fieldOrder["女人"];\n`;
  code += `    case "system":\n`;
  code += `      // 对于系统分类，尝试使用对应的配置\n`;
  code += `      if (fieldOrder[sectionName]) {\n`;
  code += `        return fieldOrder[sectionName];\n`;
  code += `      }\n`;
  code += `      return universalFieldOrder;\n`;
  code += `    default:\n`;
  code += `      return universalFieldOrder;\n`;
  code += `  }\n`;
  code += `}\n\n`;
  code += `// 获取字段顺序Set的函数\n`;
  code += `function getFieldOrderSet(sectionName, sectionData = null) {\n`;
  code += `  // 优先使用精确匹配的特定配置\n`;
  code += `  if (fieldOrderSets[sectionName]) {\n`;
  code += `    return fieldOrderSets[sectionName];\n`;
  code += `  }\n\n`;
  code += `  // 基于内容检测角色类型\n`;
  code += `  const characterType = detectCharacterType(sectionName, sectionData);\n\n`;
  code += `  switch (characterType) {\n`;
  code += `    case "user":\n`;
  code += `      return fieldOrderSets["{{user}}"] || new Set(fieldOrder["{{user}}"]);\n`;
  code += `    case "woman":\n`;
  code += `      return fieldOrderSets["女人"] || new Set(fieldOrder["女人"]);\n`;
  code += `    case "system":\n`;
  code += `      if (fieldOrderSets[sectionName]) {\n`;
  code += `        return fieldOrderSets[sectionName];\n`;
  code += `      }\n`;
  code += `      return universalFieldOrderSet;\n`;
  code += `    default:\n`;
  code += `      return universalFieldOrderSet;\n`;
  code += `  }\n`;
  code += `}\n\n`;
  code += `// 导出所有字段相关的功能\n`;
  code += `export {\n`;
  code += `  fieldConfig,\n`;
  code += `  universalFieldOrder,\n`;
  code += `  universalFieldOrderSet,\n`;
  code += `  emojiMap,\n`;
  code += `  addEmojiToFieldName,\n`;
  code += `  fieldOrder,\n`;
  code += `  fieldOrderSets,\n`;
  code += `  detectCharacterType,\n`;
  code += `  getFieldOrder,\n`;
  code += `  getFieldOrderSet,\n`;
  code += `};\n`;
  
  return code;
}

// 生成 Tailwind 配置脚本
function generateTailwindConfig(colors) {
  const entries = Object.entries(colors).map(
    ([key, _]) => `'${key}': 'var(--color-${key})'`
  );
  
  return entries.join(", ");
}

// 执行代码生成
function generateSourceFiles() {
  try {
    const config = loadConfig();
    
    // 生成 css-constants.js
    const cssConstantsCode = generateCssConstants(config);
    fs.writeFileSync(path.join(__dirname, "src", "css-constants.js"), cssConstantsCode);
    console.log("✅ Generated src/css-constants.js");
    
    // 生成 fields.js
    const fieldsCode = generateFieldsModule(config);
    fs.writeFileSync(path.join(__dirname, "src", "fields.js"), fieldsCode);
    console.log("✅ Generated src/fields.js");
    
    return config;
  } catch (error) {
    console.error("❌ Code generation failed:", error.message);
    throw error;
  }
}

// ==================== 原始 build.js 代码 ====================

// HTML 压缩函数
function compressHtml(html) {
  return (
    html
      // 移除多余的空白字符
      .replace(/\s+/g, " ")
      // 移除标签间的空白
      .replace(/>\s+</g, "><")
      // 移除注释 (保留条件注释)
      .replace(/<!--(?!\[if).*?-->/g, "")
      // 移除行首行尾空白
      .trim()
      // 移除 style 和 script 标签内的多余空白
      .replace(/<style[^>]*>(.*?)<\/style>/gi, (match, content) => {
        return match.replace(content, content.replace(/\s+/g, " ").trim());
      })
      .replace(/<script[^>]*>(.*?)<\/script>/gi, (match, content) => {
        return match.replace(content, content.replace(/\s+/g, " ").trim());
      })
  );
}

// CSS 处理函数 - 仅处理自定义样式（Tailwind 现在通过 CDN 加载）
async function processStyles() {
  try {
    console.log("🎨 Processing custom styles...");

    // 确保 dist 目录存在
    if (!fs.existsSync("dist")) {
      fs.mkdirSync("dist", { recursive: true });
    }

    // 读取源 CSS
    const css = fs.readFileSync("src/style.css", "utf8");
    const originalSize = Buffer.byteLength(css, "utf8");

    // 由于 Tailwind 现在通过 CDN 加载，我们只需保留自定义样式和主题变量
    // 移除 @tailwind 指令（因为 CDN 已经提供），但保留 @theme 和 @layer
    let processed = css
      .replace(/@tailwind\s+\w+;/g, "")  // 移除 @tailwind 指令
      .replace(/@source\s+["'][^"']*["'];?/g, "")  // 移除 @source 指令
      .trim();

    // 写入处理后的 CSS
    fs.writeFileSync("dist/style.css", processed);

    // 计算大小
    const processedSize = Buffer.byteLength(processed, "utf8");
    const ratio = (((originalSize - processedSize) / originalSize) * 100).toFixed(1);

    console.log(`✅ Custom styles processed`);
    console.log(
      `📦 CSS size: ${originalSize} bytes → ${processedSize} bytes (${ratio}% reduction)`,
    );
  } catch (error) {
    console.error("❌ Style processing failed:", error.message);
    throw error;
  }
}

// 检查构建标志
const isProduction = process.argv.includes("--prod");
const shouldMinify = !process.argv.includes("--no-minify");

// HTML 内联插件
const htmlInlinePlugin = {
  name: "html-inline",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) return;

      try {
        // 如果是生产模式，先处理源文件
        if (isProduction) {
          console.log("🚀 Building for production...");

          // 读取源文件
          let sourceContent = fs.readFileSync("src/main.js", "utf8");

          // 1. 替换函数调用
          sourceContent = sourceContent.replace(
            /const statusData = await loadTestData\(\);/g,
            "const statusData = await loadStatusData();",
          );

          // 2. 移除整个 loadTestData 函数定义
          sourceContent = sourceContent.replace(
            /\/\/ 测试数据函数（从外部文件读取）[\s\S]*?async function loadTestData\(\)[\s\S]*?\{[\s\S]*?\}[\s\S]*?(?=\/\/ [A-Z]|async function loadStatusData|function [A-Z]|var [A-Z]|const [A-Z]|let [A-Z]|$)/g,
            "",
          );

          // 3. 移除测试数据相关的注释块
          sourceContent = sourceContent.replace(
            /\/\/ Production: 使用 loadStatusData\(\) 从API获取数据[\s\S]*?\/\/ Development: 使用 loadTestData\(\) 从char-var\.json获取测试数据[\s\S]*?\/\/ const statusData = await loadStatusData\(\);/g,
            "// Production: 使用 loadStatusData() 从API获取数据",
          );

          // 4. 添加 loadStatusData 函数（如果不存在）
          if (!sourceContent.includes("async function loadStatusData")) {
            const loadStatusDataFunction = `
// Production数据获取函数
async function loadStatusData() {
  const raw = await STscript("/getvar 状态栏");
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

`;
            // 在 init 函数之前插入
            sourceContent = sourceContent.replace(
              /(async function init\(\))/,
              loadStatusDataFunction + "$1",
            );
          }

          // 5. 清理多余的空行
          sourceContent = sourceContent.replace(/\n\s*\n\s*\n/g, "\n\n");

          // 写回临时文件
          fs.writeFileSync("src/main.temp.js", sourceContent);

          console.log(
            "✅ Switched to production data loading and removed test code",
          );
        }

        // 处理自定义样式
        await processStyles();

        // 确保 dist 目录中的文件存在
        if (!fs.existsSync("dist/main.js")) {
          console.error("❌ 错误：dist/main.js 未生成");
          console.error("检查 esbuild 是否成功完成");
          return;
        }

        // 读取构建后的文件
        const jsContent = fs.readFileSync("dist/main.js", "utf8");
        const cssContent = fs.readFileSync("dist/style.css", "utf8");
        const htmlTemplate = fs.readFileSync("src/index.html", "utf8");

        // 生成 Tailwind 配置脚本
        const tailwindConfigScript = generateTailwindConfig(config.colors);

        // 内联到HTML中（将 Tailwind 配置注入到第二个 script 标签）
        let finalHtml = htmlTemplate
          .replace("<!-- TAILWIND_CONFIG -->", `<script>tailwind.config = { theme: { extend: { colors: { ${tailwindConfigScript} } } } };</script>`)
          .replace("<!-- CSS_PLACEHOLDER -->", `<style type="text/tailwindcss">${cssContent}</style>`)
          .replace("<!-- JS_PLACEHOLDER -->", `<script>${jsContent}</script>`);

        // 根据标志决定是否压缩 HTML
        if (shouldMinify) {
          finalHtml = compressHtml(finalHtml);
        }

        // 计算原始大小
        const originalHtmlSize = Buffer.byteLength(
          htmlTemplate
            .replace(
              "<!-- CSS_PLACEHOLDER -->",
              `<style>${fs.readFileSync("src/style.css", "utf8")}</style>`,
            )
            .replace(
              "<!-- JS_PLACEHOLDER -->",
              `<script>${fs.readFileSync("src/main.js", "utf8")}</script>`,
            ),
          "utf8",
        );

        // 确定输出目录和文件名
        const outputDir = isProduction ? "build" : "debug";
        const outputFile = isProduction ? "status.html" : "status.debug.html";
        const outputPath = path.join(outputDir, outputFile);

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // 写入最终文件
        fs.writeFileSync(outputPath, finalHtml);

        // 计算最终文件大小
        const finalSize = Buffer.byteLength(finalHtml, "utf8");
        const htmlCompressionRatio = (
          ((originalHtmlSize - finalSize) / originalHtmlSize) *
          100
        ).toFixed(1);

        // 获取缩小前的 HTML 大小（仅压缩）
        const unminifiedHtml = htmlTemplate
          .replace(
            "<!-- CSS_PLACEHOLDER -->",
            `<style type="text/tailwindcss">${fs.readFileSync("dist/style.css", "utf8")}</style>`,
          )
          .replace(
            "<!-- JS_PLACEHOLDER -->",
            `<script>${fs.readFileSync("dist/main.js", "utf8")}</script>`,
          );
        const unminifiedSize = Buffer.byteLength(unminifiedHtml, "utf8");

        // 计算缩小效率
        const minifyEfficiency = shouldMinify
          ? (((unminifiedSize - finalSize) / unminifiedSize) * 100).toFixed(1)
          : 0;

        // 清理临时文件
        fs.rmSync("dist", { recursive: true, force: true });

        // 清理生产模式的临时文件
        if (isProduction && fs.existsSync("src/main.temp.js")) {
          fs.unlinkSync("src/main.temp.js");
        }

        const mode = isProduction ? "production" : "development";
        const minifyStatus = shouldMinify ? "minified" : "unminified";
        console.log(
          `✅ Built ${outputFile} for ${mode} (${minifyStatus}) with Tailwind CSS v4`,
        );
        const sizeInfo = `${unminifiedSize} → ${finalSize} bytes (${(finalSize / 1024).toFixed(1)} KB)`;
        const minifyInfo = shouldMinify ? ` | Minify: ${minifyEfficiency}%` : "";
        console.log(
          `📦 Size: ${sizeInfo}${minifyInfo}`,
        );
        console.log(
          `🎯 ${outputPath}`,
        );
      } catch (error) {
        console.error("❌ Build failed:", error.message);
      }
    });
  },
};

// 构建配置
const buildOptions = {
  entryPoints: [
    isProduction && fs.existsSync("src/main.temp.js")
      ? "src/main.temp.js"
      : "src/main.js",
  ],
  bundle: true,
  outdir: "dist",
  minify: true,
  minifyWhitespace: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  treeShaking: true,
  external: ["tailwindcss"], // 排除 tailwindcss 从 bundle 中
  plugins: [htmlInlinePlugin],
};

// 在构建前生成源文件
console.log("🔧 Generating source files from config.json...");
const config = generateSourceFiles();

if (process.argv.includes("--watch")) {
  esbuild
    .context(buildOptions)
    .then((ctx) => {
      ctx.watch();
      console.log("👀 Watching for changes...");
    })
    .catch(() => process.exit(1));
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
