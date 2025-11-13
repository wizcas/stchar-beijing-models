# 🔄 可折叠卡片复用功能报告

## 🎯 复用目标

提取器材卡片的折叠行为、动画和指示器，创建通用的可折叠卡片函数，并将其应用到所有角色卡片（user card 和 woman card）上。

## ✅ 实现方案

### 1. 通用折叠卡片函数

#### A. 函数签名
```javascript
function createCollapsibleCard(title, contentElement, isInitiallyCollapsed = true, customStyles = {})
```

#### B. 参数说明
- **title**: 卡片标题文本
- **contentElement**: 要包装的内容DOM元素
- **isInitiallyCollapsed**: 初始折叠状态（默认true）
- **customStyles**: 自定义样式配置对象

#### C. 自定义样式配置
```javascript
const customStyles = {
  cardClass: "卡片容器的CSS类名",
  titleClass: "标题的CSS类名", 
  useRawTitle: true/false  // 是否使用原始标题（不添加emoji）
};
```

### 2. 折叠功能核心逻辑

#### A. DOM结构
```javascript
// 卡片容器
const cardDiv = document.createElement("div");

// 可点击标题容器
const titleContainer = document.createElement("div");
titleContainer.className = "flex items-center justify-between cursor-pointer select-none";

// 标题文本
const titleDiv = document.createElement("div");

// 折叠指示器
const collapseIcon = document.createElement("div");
collapseIcon.className = "text-[var(--color-accent-amber)] text-lg font-bold transition-transform duration-200 ease-in-out";
collapseIcon.textContent = "✕";

// 可折叠内容容器
const collapsibleContent = document.createElement("div");
collapsibleContent.className = "overflow-hidden transition-all duration-200 ease-in-out";
```

#### B. 交互逻辑
```javascript
titleContainer.addEventListener("click", () => {
  isCollapsed = !isCollapsed;
  
  if (isCollapsed) {
    // 折叠状态：高度为0，图标旋转45度
    collapsibleContent.style.maxHeight = "0px";
    collapsibleContent.style.marginTop = "0px";
    collapseIcon.style.transform = "rotate(45deg)";
  } else {
    // 展开状态：高度为内容高度，图标不旋转
    collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + "px";
    collapsibleContent.style.marginTop = "16px";
    collapseIcon.style.transform = "rotate(0deg)";
  }
});
```

### 3. 应用到不同卡片类型

#### A. 器材卡片配置
```javascript
// 器材卡片：默认折叠，使用器材样式
const equipmentCard = createCollapsibleCard(title, equipmentGrid, true);
```

#### B. 角色卡片配置
```javascript
// 角色卡片样式配置
const characterCardStyles = {
  cardClass: "bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] p-6 md:p-5 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]",
  titleClass: "text-[var(--color-accent-gold)] text-xl sm:text-lg font-bold tracking-wide flex items-center",
  useRawTitle: true
};

// 角色卡片：默认展开，使用角色样式
const characterCard = createCollapsibleCard(
  generateCardTitle(sectionName, sectionData), 
  characterContent, 
  false,  // 默认展开
  characterCardStyles
);
```

## 🎨 视觉效果对比

### 1. 器材卡片
```
📸 器材                                    ⨯  (默认折叠)
┌─────────────────────────────────────────────┐
│ (内容已折叠)                                │
└─────────────────────────────────────────────┘

点击展开后：
📸 器材                                    ✕
┌─────────────────────────────────────────────┐
│  📷 机身        🔍 镜头                      │
│  [Canon EOS R6] [RF 50mm f/1.8]            │
│  💡 灯光        🎒 配件                      │
│  [Godox AD200]  [三脚架] [背包]             │
└─────────────────────────────────────────────┘
```

### 2. 角色卡片
```
小花(田中花子)                              ✕  (默认展开)
┌─────────────────────────────────────────────┐
│  💭 想法: 今天天气真好...                   │
│  👥 关系: [好友] [同事]                     │
│  🎨 外型: 身高165cm, 体重50kg               │
│  💼 职业: 摄影师                            │
└─────────────────────────────────────────────┘

点击折叠后：
小花(田中花子)                              ⨯
┌─────────────────────────────────────────────┐
│ (内容已折叠)                                │
└─────────────────────────────────────────────┘
```

### 3. 用户卡片
```
{{user}}                                   ✕  (默认展开)
┌─────────────────────────────────────────────┐
│  ⭐ 行业等级: 新手                          │
│  💭 想法: 想要学习摄影技巧                  │
│  😈 堕落度: 0                               │
│  👕 穿搭: 休闲装                            │
│  📸 器材: [折叠的器材卡片]                  │
└─────────────────────────────────────────────┘
```

## 🔧 技术实现细节

### 1. 样式继承和覆盖
```javascript
// 默认样式
const defaultCardClass = "bg-[var(--color-surface-accent)] border border-[var(--color-border-accent)] p-5 rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)]";

// 自定义样式覆盖
cardDiv.className = customStyles.cardClass || defaultCardClass;
```

### 2. 标题处理
```javascript
// 支持原始标题和emoji标题
titleDiv.textContent = customStyles.useRawTitle ? title : addEmojiToFieldName(title);
```

### 3. 初始状态设置
```javascript
// 异步设置初始状态，确保DOM渲染完成
setTimeout(() => {
  if (isCollapsed) {
    collapsibleContent.style.maxHeight = "0px";
    collapsibleContent.style.marginTop = "0px";
    collapseIcon.style.transform = "rotate(45deg)";
  } else {
    collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + "px";
    collapsibleContent.style.marginTop = "16px";
    collapseIcon.style.transform = "rotate(0deg)";
  }
}, 0);
```

## 📊 复用效果

### 构建结果
```
✅ Tailwind CSS processed successfully
📦 CSS size: 5227 bytes → 20890 bytes
📦 Final HTML size: 35607 bytes → 36318 bytes
🎯 Final file: status.raw.html (35.5 KB)
```

### 功能统一
- ✅ **器材卡片**: 默认折叠，节省空间
- ✅ **角色卡片**: 默认展开，便于查看
- ✅ **用户卡片**: 默认展开，重要信息优先显示
- ✅ **动画一致**: 所有卡片使用相同的200ms折叠动画
- ✅ **指示器统一**: 所有卡片使用相同的 `✕` / `⨯` 指示器

### 代码优化
- ✅ **代码复用**: 折叠逻辑只需维护一份
- ✅ **样式灵活**: 支持不同卡片类型的自定义样式
- ✅ **配置简单**: 通过参数控制初始状态和样式
- ✅ **维护性**: 修改折叠行为只需更新一个函数

## 🎯 设计优势

### 1. 一致性
- **交互一致**: 所有卡片使用相同的折叠交互方式
- **动画一致**: 统一的200ms动画时长和缓动函数
- **指示器一致**: 统一的折叠状态指示器设计

### 2. 灵活性
- **样式可定制**: 支持不同卡片类型的专门样式
- **状态可配置**: 可以设置不同的初始折叠状态
- **内容无关**: 可以包装任何类型的内容元素

### 3. 可维护性
- **单一职责**: 折叠功能独立封装
- **参数化**: 通过参数控制行为和样式
- **易于扩展**: 可以轻松添加新的配置选项

## 🚀 使用示例

### 1. 创建器材卡片
```javascript
const equipmentCard = createCollapsibleCard(
  "器材", 
  equipmentGrid, 
  true  // 默认折叠
);
```

### 2. 创建角色卡片
```javascript
const characterCard = createCollapsibleCard(
  generateCardTitle(name, data), 
  characterContent, 
  false,  // 默认展开
  {
    cardClass: "bg-[var(--color-surface-primary)] ...",
    titleClass: "text-[var(--color-accent-gold)] ...",
    useRawTitle: true
  }
);
```

### 3. 创建自定义卡片
```javascript
const customCard = createCollapsibleCard(
  "自定义标题", 
  customContent, 
  true,  // 默认折叠
  {
    cardClass: "custom-card-style",
    titleClass: "custom-title-style",
    useRawTitle: false  // 使用emoji标题
  }
);
```

## 🎉 复用完成

可折叠卡片功能复用已全部完成：

- ✅ **通用函数**: 创建了可复用的折叠卡片函数
- ✅ **器材卡片**: 使用通用函数，默认折叠
- ✅ **角色卡片**: 使用通用函数，默认展开，自定义样式
- ✅ **用户卡片**: 使用通用函数，默认展开，自定义样式
- ✅ **动画统一**: 所有卡片使用相同的200ms折叠动画
- ✅ **指示器统一**: 所有卡片使用相同的折叠指示器设计

现在所有卡片都具备了一致的折叠功能和流畅的动画效果！🔄✨
