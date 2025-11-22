---
rule_name: Worldbook-s 简化文档库导航
rule_key: 导航,索引,快速参考
version: 1
rule_type: 文档组织
rule_type_describe: 简化版文档快速导航和查阅指南
filename: _index.md
---

# 📚 Worldbook-s 简化文档库

**Worldbook-s** 是对 `worldbooks/` 的精简版本，用于**快速查阅和AI上下文优化**。完整规范仍在 `worldbooks/` 目录中。

---

## 🗂️ 简化文档清单

### 核心系统（已简化）

| 文档 | 原始大小 | 简化后 | 简化率 | 用途 |
|------|--------|-------|-------|------|
| **favor-system.md** | 96行 | 76行 | 20.8% | 好感度分级 & 变动因素速查表 |
| **moral-system.md** | 212行 | 118行 | 44.3% | 堕落度阶段描述 & 变动因素速查表 |
| **COT.md** | 780行 | 209行 | 73.2% | 7步决策流程简化版 |
| **status.md** | 433行 | 198行 | 54.3% | Schema定义 & 关键约束说明 |
| **plot-log-format-guide.md** | 723行 | 360行 | 50.2% | 强制规则 & 检查清单 |
| **总计** | 2242行 | 961行 | **57.1%** | - |

---

## 📖 各文档速查指南

### 6️⃣ **model-system.md** - 模特职业系统
**何时查阅**：需要了解模特分级、任务系统、结局分支时
**核心内容**：
- ✅ 首次生成约束（强制项 & 禁止项）
- ✅ 7种身份系统速查表
- ✅ {{user}}的四重诱惑力
- ✅ 模特三阶段心理
- ✅ 任务系统（主线、支线、突发、特殊）
- ✅ 4种结局分支

**详见**：
```
worldbook-s/model-system.md (简化版，压缩率 35%)
worldbooks/model-system.md  (完整版，理论深度)
```

---

### 7️⃣ **random-model.md** - 随机模特生成
**何时查阅**：AI需要生成新女模角色时
**核心内容**：
- ✅ 三级模特等级 (新手/进阶/资深)
- ✅ 主动 vs 被动接触路线
- ✅ 拒绝机制 & 成长变化
- ✅ 角色生成核心要素
- ✅ 首次生成NSFW强制约束
- ✅ 渐进式深度表

**详见**：
```
worldbook-s/random-model.md (简化版，压缩率 54%)
worldbooks/random-model.md  (完整版，详细规则)
```

---

### 8️⃣ **plot-rules.md** - 剧情生成规则
**何时查阅**：生成故事剧情时的驱动规则
**核心内容**：
- ✅ 核心冲突 (占有欲 vs 专业性)
- ✅ 四种故事线 (纯爱/后宫/堕落/冷血)
- ✅ 女模生命周期 & 复出场景
- ✅ 五类挫折与困难
- ✅ 五大故事方向
- ✅ 检查清单 & 禁忌底线

**详见**：
```
worldbook-s/plot-rules.md (简化版，压缩率 59%)
worldbooks/plot-rules.md  (完整版，详细设计)
```

---

### 9️⃣ **{{user}}.md** - 主角人物设定
**何时查阅**：需要了解{{user}}的性格、外貌、NSFW设定时
**核心内容**：
- ✅ 核心信息 (26岁男摄影师)
- ✅ 背景 & 外貌速查表
- ✅ 性格 & 社交表现
- ✅ 生活方式 & 沟通特征
- ✅ NSFW完整设定 (性器官/偏好/禁忌/反应/精液特征)
- ✅ 癖好 & 情结

**详见**：
```
worldbook-s/{{user}}.md (简化版，已精简优化)
worldbooks/{{user}}.md  (完整版，详细描述)
```

---

### 🔟 **writing-style.md** - 文风与叙述规范
**何时查阅**：AI生成故事文本时的风格约束
**核心内容**：
- ✅ 第三人称限制视角规则
- ✅ 幽默诙谐文风 (手法、语言、人物)
- ✅ 儿化音速查表 (可用/禁用词汇)
- ✅ 口语转写规则 (那个→内个 / 特么 / 怎么vs咋)
- ✅ 脱话与堕落度关系表 (等级 → 频率 → 性别差异)
- ✅ 称呼与关系等级表 (陌生→亲密进阶)
- ✅ 禁忌清单 & 避坑指南

**详见**：
```
worldbook-s/writing-style.md (简化版，压缩率 34%)
worldbooks/writing-style.md  (完整版，详细指南)
```

---

### 1️⃣ **favor-system.md** - 好感度系统
**何时查阅**：需要快速了解好感度的分级和变动因素时
**核心内容**：
- ✅ 阶段分级表 [-100 到 100]
- ✅ 摄影师/模特行为表现
- ✅ 增加/减少因素列表
- ✅ 联动机制（与堕落度的交互）

**详见**：
```
worldbook-s/favor-system.md (简化版，实时查阅)
worldbooks/favor-system.md  (完整版，理论深度)
```

---

### 2️⃣ **moral-system.md** - 堕落度系统
**何时查阅**：需要了解摄影师堕落过程和阶段表现时
**核心内容**：
- ✅ 堕落度阶段表 [0 到 100]
- ✅ 各阶段摄影师行为变化
- ✅ 堕落因素列表
- ✅ 关键阈值（30、60、80、100）

**详见**：
```
worldbook-s/moral-system.md (简化版，实时查阅)
worldbooks/moral-system.md  (完整版，理论深度)
```

---

### 3️⃣ **COT.md** - 决策思考过程
**何时查阅**：AI需要生成故事推进时的决策参考
**核心内容**：
- ✅ 7步决策流程
- ✅ 简化示例
- ✅ 关键决策节点
- ❌ 详细字段说明已移除（详见 @worldbooks/plot-log-format-guide.md）

**决策流程**：
1. 分析当前故事状态
2. 识别角色动机
3. 评估关系状态
4. 生成3-5个可能走向
5. 评估道德/堕落影响
6. 选择最合适推进方向
7. 输出故事内容

**详见**：
```
worldbook-s/COT.md (简化版，决策参考)
worldbooks/COT.md  (完整版，详细说明)
```

---

### 4️⃣ **status.md** - 状态系统
**何时查阅**：需要了解状态结构和数据约束时

> ⚠️ **新架构**：完整规范分成两个文件：
> - `status-quick.md` (~730 tokens) - **日常查阅**
> - `status.md` (~1,441 tokens) - 完整参考

**核心内容**：
- ✅ 完整Schema定义
- ✅ 女模数据首次生成约束
- ✅ 必须生成项
- ✅ 禁止项（防止不合理假设）
- ✅ 关联字段同步规则

**关键约束**：
- 女模首次生成**必须包含性爱基础字段**
- 禁止刻板陈词滥调
- 禁止矛盾的性倾向
- 禁止不合理的背景编造

**详见**：
```
worldbooks/status-quick.md (~730 tokens，推荐日常使用)
worldbooks/status.md       (~1,441 tokens，完整参考)
```

---

### 5️⃣ **plot-log-format-guide.md** - Plot-Log 格式规范
**何时查阅**：生成状态更新时的格式验证依据

> ⚠️ **新架构**：完整规范分成三个文件：
> - `plot-log-quick.md` (~590 tokens) - **快速参考**（必读）
> - `EXAMPLES.md` (~3,496 tokens) - 详细示例和错误纠正
> - `plot-log-format-guide.md` (~978 tokens) - 完整规范

**核心内容**（plot-log-quick.md）：
- ✅ 3 个最强制规则（JSON、动作单一、合法解析）
- ✅ 快速检查清单（11项）
- ✅ 核心原则和禁止项

**详细内容**（EXAMPLES.md）：
- ✅ 常见错误纠正（7个类别）
- ✅ 完整示例（首次出场、中途更新、阈值突破）
- ✅ 关联字段更新详解
- ✅ 推进选项详细示例

**最强制规则**：
1. 必须 JSON 格式，禁止 YAML
2. 动作单一且合并（记下/调整/追加各出现 1 次）
3. JSON 必须合法可解析

**详见**：
```
worldbooks/plot-log-quick.md    (~590 tokens，推荐日常使用)
worldbooks/EXAMPLES.md          (~3,496 tokens，详细示例和错误纠正)
worldbooks/plot-log-format-guide.md (~978 tokens，完整规范)
```

---

## 🔗 交叉引用关系

```
worldbook-s/favor-system.md
    ↓ 参考
worldbook-s/moral-system.md (联动机制)

worldbook-s/status.md
    ↓ 引用
worldbook-s/plot-log-format-guide.md (操作规范)

worldbook-s/COT.md
    ↓ 引用
worldbook-s/status.md (状态结构)
worldbook-s/plot-log-format-guide.md (格式规范)

worldbook-s/plot-log-format-guide.md
    ↓ 引用
worldbook-s/status.md (Schema 定义)
```

---

## 💡 使用建议

### ✅ 何时使用 worldbook-s
- AI生成故事时的上下文快速查阅
- 需要快速理解系统规则时
- 上下文tokens受限时
- 需要速查表和总结时

### ✅ 何时使用 worldbooks
- 需要理解系统设计理由时
- 需要详细的背景说明时
- 需要完整的例子和用例时
- 做系统调整或优化时

---

## 📋 待简化文件清单

### ✅ 已完成简化（10 个文件）

| 文件 | 原始 | 简化 | 压缩率 |
|------|------|------|--------|
| favor-system.md | 96行 | 76行 | 20.8% |
| moral-system.md | 212行 | 118行 | 44.3% |
| COT.md | 780行 | 209行 | 73.2% |
| status.md | 433行 | 198行 | 54.3% |
| plot-log-format-guide.md | 723行 | 360行 | 50.2% |
| model-system.md | 197行 | 128行 | 35.0% |
| random-model.md | 204行 | 94行 | 53.9% |
| plot-rules.md | 293行 | 121行 | 58.7% |
| {{user}}.md | 139行 | 136行 | 2.2% |
| **writing-style.md** | **158行** | **104行** | **34.2%** |
| **总计** | **3435行** | **1544行** | **55.1%** |

### ⏳ 待简化文件（7 个文件）

以下 worldbooks 文件暂未创建简化版本：

- `equipment-requirements.md` - 器材需求系统
- `photographer-system.md` - 摄影师系统
- `plot-choices.md` - 剧情选择
- `opening.md` - 开场白
- `title-system.md` - 称号系统
- `censorship-system.md` - 审查系统
- `relationship-system-draft.md` - 关系系统（草稿）

### 🎯 推荐优先级

1. 📌 **高优先级**（核心系统）
   - `photographer-system.md` - 被 COT 和 favor 系统引用

2. 📌 **中优先级**（输出规范）
   - `plot-choices.md` - 关键选择系统
   - `equipment-requirements.md` - 器材系统

3. 📌 **低优先级**（补充系统）
   - `title-system.md` - 补充元素
   - `censorship-system.md` - 内容约束
   - `opening.md` - 开场设定
   - `relationship-system-draft.md` - 草稿

---

## 🔄 版本控制

| 版本 | 日期 | 改动 |
|------|------|------|
| 1.6 | 2024-11-23 | 精简完成：`plot-log-format-guide.md` 从 852→243 行（-71%），`status.md` 精简示例，总体节省 70% |
| 1.5 | 2024-11-23 | 重构：`status.md` 和 `plot-log-format-guide.md` 分层 → `*-quick.md` 极简版 + 详细参考 |
| 1.4 | 2024-11-23 | 新增 EXAMPLES.md（~3500 tokens）集中所有详细示例和错误纠正 |
| 1.3 | 2024-11-23 | 新增 writing-style.md 简化版（34%压缩），总文件数达 **10个**，总压缩率 **55.1%** |
| 1.2 | 2024-11-23 | 新增4个文件简化版：model-system / random-model / plot-rules / {{user}}，总压缩率 56.0% |
| 1.1 | 2024-12-16 | 新增 plot-log-format-guide.md 简化版（+360行），总压缩率达 57.1% |
| 1.0 | 2024-12-16 | 初始化索引，包含4个简化文档（压缩率 60.4%） |

---

## 📞 相关文档

- **完整文档库**：`worldbooks/` 目录
- **项目架构**：参考 `docs/CONFIG_SYSTEM.md`
- **快速开始**：参考 `docs/CONFIG_QUICK_GUIDE.md`
