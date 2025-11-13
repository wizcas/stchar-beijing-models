const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

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

// Tailwind CSS 处理函数 - 正确的 v4 处理方式
async function processTailwind() {
  try {
    console.log("🎨 Building Tailwind CSS v4...");

    // 确保 dist 目录存在
    if (!fs.existsSync("dist")) {
      fs.mkdirSync("dist", { recursive: true });
    }

    // 读取源 CSS
    const css = fs.readFileSync("src/style.css", "utf8");
    const originalSize = Buffer.byteLength(css, "utf8");

    // 使用 @tailwindcss/postcss 正确处理 Tailwind v4
    const tailwindcss = require("@tailwindcss/postcss");

    // 创建 PostCSS 处理流程
    const result = await postcss([
      // Tailwind CSS v4 - 必须是第一个插件
      tailwindcss(),
      // 其他插件
      autoprefixer(),
      cssnano({
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            colormin: true,
            mergeRules: true,
            minifyFontValues: true,
            minifySelectors: true,
            normalizeWhitespace: true,
            calc: true,
            minifyGradients: true,
          },
        ],
      }),
    ]).process(css, {
      from: path.resolve("src/style.css"),
      to: path.resolve("dist/style.css"),
      // 重要：告诉 postcss 处理 @import 语句
      map: false,
    });

    // 写入处理后的 CSS
    fs.writeFileSync("dist/style.css", result.css);

    // 计算压缩比例
    const processedSize = Buffer.byteLength(result.css, "utf8");
    const ratio = (((originalSize - processedSize) / originalSize) * 100).toFixed(1);

    console.log(`✅ Tailwind CSS v4 processed successfully`);
    console.log(
      `📦 CSS size: ${originalSize} bytes → ${processedSize} bytes (${ratio}% reduction)`,
    );
  } catch (error) {
    console.error("❌ Tailwind CSS processing failed");
    console.error("原因:", error.reason || error.message);
    
    // 备用方案：移除 @import 行并继续
    console.warn("⚠️  使用备用方案处理 CSS...");
    
    const css = fs.readFileSync("src/style.css", "utf8");
    const originalSize = Buffer.byteLength(css, "utf8");
    
    // 移除 Tailwind 特定的指令
    let processed = css
      .replace(/@import\s+["']tailwindcss["'];?\s*\n?/g, "")
      .replace(/@source\s+["'][^"']*["'];?\s*\n?/g, "");

    // 应用 PostCSS 处理
    const result = await postcss([
      autoprefixer(),
      cssnano({
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            colormin: true,
            mergeRules: true,
            minifyFontValues: true,
            minifySelectors: true,
            normalizeWhitespace: true,
            calc: true,
            minifyGradients: true,
          },
        ],
      }),
    ]).process(processed, {
      from: path.resolve("src/style.css"),
      to: path.resolve("dist/style.css"),
    });

    fs.writeFileSync("dist/style.css", result.css);
    
    const processedSize = Buffer.byteLength(result.css, "utf8");
    const ratio = (((originalSize - processedSize) / originalSize) * 100).toFixed(1);
    
    console.log(`✅ CSS 已通过备用方案处理`);
    console.log(
      `📦 CSS size: ${originalSize} bytes → ${processedSize} bytes (${ratio}% reduction)`,
    );
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

        // 处理 Tailwind CSS
        await processTailwind();

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

        // 内联到HTML中
        let finalHtml = htmlTemplate
          .replace("<!-- CSS_PLACEHOLDER -->", `<style>${cssContent}</style>`)
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
        console.log(
          `📦 Final HTML size: ${originalHtmlSize} bytes → ${finalSize} bytes (${htmlCompressionRatio}% reduction)`,
        );
        console.log(
          `🎯 Final file: ${outputPath} (${(finalSize / 1024).toFixed(1)} KB)`,
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
