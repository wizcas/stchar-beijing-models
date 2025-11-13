# Status Dashboard

一个用于显示角色状态信息的响应式仪表板。

## 项目结构

```
├── src/                    # 源代码目录
│   ├── index.html         # HTML模板
│   ├── main.js           # JavaScript逻辑
│   └── style.css         # CSS样式
├── build.js              # 构建脚本
├── package.json          # 项目配置
├── status.raw.html       # 构建输出的单文件HTML
└── char-var.json         # 测试数据文件（需要自己创建）
```

## 开发

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build          # 构建一次
npm run dev            # 开发模式，文件变化时自动重建
```

### 测试

1. 创建 `char-var.json` 文件，包含 `状态栏` 字段
2. 启动HTTP服务器：`http-server`
3. 访问：`http://localhost:8000/status.debug.html`

## 数据格式

外部JSON文件应包含 `状态栏` 字段，支持以下特性：

- **字段前缀清理**：自动移除 `$XXX ` 格式的前缀
- **字段合并**：昵称+真名 → 名字，三围合并等
- **单位添加**：身高自动添加cm，体重自动添加kg
- **Emoji图标**：所有字段自动添加相应的emoji

## 功能特性

- 📱 响应式设计，支持桌面和移动端
- 🎨 工业风深色主题
- 🏷️ 标签式数据展示
- 📸 器材部分特殊网格布局
- 🔄 支持生产和开发环境数据源切换

## 生产部署

修改 `src/main.js` 中的数据源：

```javascript
// 改为使用生产API
const statusData = await loadStatusData();
// const statusData = await loadTestData();
```

然后重新构建即可。
