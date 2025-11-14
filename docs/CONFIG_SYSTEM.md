# 配置系统完整指南

## 系统架构

```
data/status.yaml (Schema 定义)
  ↓
  ├─ 定义所有支持的字段及类型
  ├─ 提供默认值
  └─ 完整的字段列表
  
data/status.json (运行时覆盖值)
  ↓
  ├─ 只包含当前已初始化的字段
  ├─ 覆盖 schema 中的默认值
  └─ 可以是不完整的子集
  
build-config.js (合并生成)
  ↓
  ├─ 合并 schema defaults + status.json 覆盖
  ├─ 验证数据类型一致性
  └─ 生成完整的运行时数据

status-vars.debug.json (最终运行时数据)
  ↓
  ├─ 无 $XXX 类型前缀
  ├─ 包含所有字段（来自 schema defaults）
  ├─ 反映 status.json 的覆盖值
  └─ 游戏直接使用
```

## 三个关键文件

### 1. `data/status.yaml` (Schema 源文件)

**用途**: 定义所有支持的字段及其类型约束

**特点**:
- YAML 格式，易于维护
- 定义完整的字段列表
- 提供每个字段的默认值
- 永不由工具修改

**示例**:
```yaml
{{user}}:
  description: "玩家角色"
  fields:
    资金:
      type: "number"
      default: 10000
    行业等级:
      type: "$enum={专业;资深;名家}"
      default: "专业"
    拍摄任务:
      type: "$list"
      default: []
```

### 2. `data/status.json` (运行时覆盖值)

**用途**: 存储当前游戏状态中已初始化的值

**特点**:
- JSON 格式
- 只包含需要覆盖的字段值
- 可以是不完整的（缺少的字段使用 schema 默认值）
- 值为 JSON 原生类型（数字、字符串、数组等）
- 字段名带 $XXX 类型前缀

**示例**:
```json
{
  "{{user}}": {
    "$enum={专业;资深;名家} 行业等级": "专业",
    "$range=[0,100] 堕落度": 0,
    "资金": 10000,
    "器材": {
      "$list 机身": ["Canon EOS R6 (二手)"]
    }
  }
}
```

### 3. `status-vars.debug.json` (最终运行时数据)

**用途**: 游戏运行时使用的数据

**特点**:
- 由 build-config.js 自动生成
- 无 $XXX 类型前缀
- 包含所有字段（schema defaults + status.json 覆盖）
- 可直接在游戏中使用

**示例**:
```json
{
  "状态栏": {
    "小二": {
      "行业等级": "专业",
      "堕落度": 0,
      "资金": 10000,
      "穿搭": "黑色短袖T恤配牛仔裤。",
      "想法": "...",
      "拍摄任务": [],
      "器材": {
        "机身": ["Canon EOS R6 (二手)"],
        "镜头": [],
        "灯光": [],
        "配件": [],
        "其他": []
      }
    },
    "女人": {
      "六花": { ... }
    }
  }
}
```

## 类型系统

### 支持的类型前缀

```yaml
# 枚举类型 - 值只能从指定列表中选择
type: "$enum={值1;值2;值3}"
default: "值1"

# 范围类型 - 值在 [min, max] 范围内
type: "$range=[0,100]"
default: 50

# 列表类型 - 值为数组
type: "$list"
default: []

# 只读字段 - 值不应被修改
type: "$ro"
default: "固定值"

# 基础类型 - 不带前缀
type: "number"
default: 10

type: "string"
default: "文本"
```

## 工作流程

### 步骤 1: 定义新字段

编辑 `data/status.yaml`，在 schema 中添加新字段：

```yaml
某个人物:
  fields:
    新字段:
      type: "$enum={选项1;选项2}"
      default: "选项1"
```

### 步骤 2: 生成运行时数据

```bash
pnpm run config:build
```

此命令会：
- 读取 `data/status.yaml` (schema)
- 读取 `data/status.json` (覆盖值)
- 合并生成完整的 `status-vars.debug.json`
- 验证数据类型一致性

### 步骤 3: 验证配置

```bash
pnpm run config:verify
```

此命令会验证：
- Schema 定义的有效性
- 覆盖值是否符合 schema
- 生成的 status-vars.debug.json 是否完整

### 步骤 4: 更新运行时值

若要修改游戏中的值，编辑 `data/status.json`：

```json
{
  "{{user}}": {
    "$range=[0,100] 堕落度": 50
  }
}
```

然后重新生成：

```bash
pnpm run config:build
```

## 数据流示例

### 场景: 添加新字段 "魅力"

**1. 在 schema 中定义** (data/status.yaml):
```yaml
{{user}}:
  fields:
    魅力:
      type: "$range=[0,100]"
      default: 50
```

**2. 生成运行时数据** (pnpm run config:build):
```
✓ 已生成 status-vars.debug.json (schema + status.json 覆盖)
✓ 覆盖值验证通过
```

**3. 在 status.json 中覆盖** (data/status.json):
```json
{
  "{{user}}": {
    "$range=[0,100] 魅力": 75
  }
}
```

**4. 重新生成** (pnpm run config:build):
```
✓ 已生成 status-vars.debug.json (schema + status.json 覆盖)
✓ 覆盖值验证通过
```

**5. 结果** (status-vars.debug.json):
```json
{
  "状态栏": {
    "小二": {
      "魅力": 75
    }
  }
}
```

## 最佳实践

### ✓ 正确做法

1. **在 schema 中定义所有字段**
   ```yaml
   字段名:
     type: "类型定义"
     default: 默认值
   ```

2. **只在 status.json 中覆盖需要的值**
   ```json
   {
     "字段名": 覆盖值
   }
   ```

3. **定期运行验证**
   ```bash
   pnpm run config:verify
   ```

### ✗ 错误做法

1. **直接修改 status-vars.debug.json**
   - ❌ 修改会在下次 build 时被覆盖

2. **在 status.json 中添加不在 schema 中的字段**
   - ❌ 会得到验证警告

3. **不同步更新 schema 和 status.json**
   - ❌ 可能导致数据不一致

## 验证机制

### Schema 验证

检查:
- 所有字段都有 `default` 值
- 默认值符合类型定义
- `$range` 中 min ≤ max
- `$enum` 中的值用分号分隔

### 覆盖值验证

检查:
- 所有覆盖字段都在 schema 中定义
- 覆盖值符合类型约束
- 数值在范围内
- 字符串在枚举列表中

### 生成数据验证

检查:
- status-vars.debug.json 包含所有字段
- 数据结构完整有效
- 无遗漏的必需字段

## 常见问题

**Q: 为什么需要三个文件？**
A: 职责分离的设计模式：
- schema 定义完整的字段和约束
- 运行时数据存储覆盖值
- 生成工具合并两者

**Q: 我的新字段没有出现在 status-vars.debug.json 中？**
A: 检查：
1. 字段是否在 schema (status.yaml) 中定义
2. 是否运行了 `pnpm run config:build`
3. 是否有 `default` 值

**Q: 如何添加新的角色？**
A: 在 schema 中添加新的顶级分组：
```yaml
新人物:
  description: "描述"
  fields:
    字段1:
      type: "类型"
      default: 值
```

**Q: 值的类型错了怎么办？**
A: 运行 `pnpm run config:verify` 会提示警告：
```
⚠ [路径] 类型不匹配: 定义为 $range 但值是 string
```

**Q: 修改了 schema，但 status.json 中没有对应字段？**
A: 这是正常的。status.json 只存储覆盖值，缺少的字段会使用 schema 的默认值。

## 命令参考

```bash
# 从 schema 和 status.json 生成 status-vars.debug.json
pnpm run config:build

# 验证 schema、status.json 和 status-vars.debug.json
pnpm run config:verify
```
