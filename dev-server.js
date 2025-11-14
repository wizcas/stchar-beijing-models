const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// 确保 debug 目录存在
if (!fs.existsSync("debug")) {
  fs.mkdirSync("debug", { recursive: true });
}

// 创建 status-vars.debug.json 的软链接到 debug 目录
const sourceFile = path.resolve("data/status-vars.debug.json");
const targetFile = "debug/status-vars.debug.json";

try {
  // 如果已存在，删除旧的链接
  if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
  }
  
  fs.symlinkSync(sourceFile, targetFile);
  console.log(`✅ Created symlink: ${targetFile} -> ${sourceFile}`);
} catch (error) {
  console.error(`❌ Failed to create symlink:`, error.message);
}

// 启动构建监听
const buildProcess = spawn("node", ["build.js", "--watch"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    NODE_ENV: "development",
  },
});

// 给构建进程一点时间启动，然后启动 http-server
setTimeout(() => {
  // 启动 http-server，指向 debug 目录作为根路径
  const httpProcess = spawn("http-server", ["debug", "-p", "8080"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      NODE_ENV: "development",
    },
  });

  console.log("🚀 HTTP Server started on http://localhost:8080");

  // 处理进程终止
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    buildProcess.kill();
    httpProcess.kill();
    process.exit(0);
  });
}, 1000);
