# 配置系统快速参考

## 系统概览

```
data/status.yaml ─────────────┐
                              ├─→ build-config.js ─→ data/status-vars.debug.json
data/status.json ─────────────┘
                              ↓
                         verify-config.js
```

## 四个文件的角色

| 文件 | 类型 | 说明 | 修改 |
|------|------|------|------|
| `status.yaml` | 输入 | 完整的字段 schema 定义 | 手工维护 |
| `status.json` | 输入 | 当前的覆盖值/运行时数据 | 手工维护 |
| `build-config.js` | 工具 | 合并 schema + overrides | 自动生成 data/status-vars.debug.json |
| `verify-config.js` | 工具 | 验证配置一致性 | 检查和报告 |
| `data/status-vars.debug.json` | 输出 | 游戏运行时的完整数据 | 自动生成 |

## 类型系统

```yaml
# 范围类型
type: "$range=[0,100]"
default: 50

# 枚举类型
type: "$enum={值1;值2;值3}"
default: "值1"

# 列表类型
type: "$list"
default: []

# 只读字段
type: "$ro"
default: "固定值"

# 基础类型
type: "number" | "string"
default: 值
```

## 常用操作

### 1. 添加新字段

**编辑** `data/status.yaml`:
```yaml
人物名:
  fields:
    新字段名:
      type: "类型定义"
      default: 默认值
```

**生成**:
```bash
pnpm run config:build
```

### 2. 修改运行时值

**编辑** `data/status.json`:
```json
{
  "人物名": {
    "$type 字段名": 新值
  }
}
```

**生成**:
```bash
pnpm run config:build
```

### 3. 验证配置

```bash
pnpm run config:verify
```

### 4. 查看生成的数据

```bash
cat data/status-vars.debug.json
```

## 关键区别

### status.yaml vs status.json

| 特性 | status.yaml | status.json |
|------|-------------|------------|
| 内容 | 所有字段定义 | 部分覆盖值 |
| 格式 | YAML | JSON |
| 类型前缀 | 有 | 有 |
| 完整性 | 完整 | 可不完整 |
| 修改方式 | 手工 | 手工 |
| 被覆盖 | 否 | 否 |

## 数据流

```
Schema (yaml) 中的字段          Status (json) 中的覆盖值
        ↓                              ↓
     默认值                         新值
        ↓                              ↓
        └────────── 合并 ──────────────┘
                    ↓
            完整运行时数据 (data/status-vars.debug.json)
                    ↓
              移除类型前缀
                    ↓
          游戏使用的最终数据
```

## 验证输出

### ✓ 成功
```
✓ Schema 定义有效
✓ 覆盖值与 schema 一致
✓ data/status-vars.debug.json 完整且有效
```

### ⚠ 警告
```
⚠ [路径] 字段不在 schema 中
⚠ [路径] 类型不匹配: 定义为 $range 但值是 string
⚠ [路径] 值超出范围: 150 不在 [100,100] 内
```

## 故障排除

### 问题: 新字段没有出现在 data/status-vars.debug.json

**检查清单**:
1. ✓ 字段是否在 schema (status.yaml) 中定义?
2. ✓ 字段是否有 `default` 值?
3. ✓ 是否运行了 `pnpm run config:build`?

### 问题: 收到类型验证警告

**解决方法**:
1. 运行 `pnpm run config:verify` 查看详细信息
2. 检查 status.json 中的值类型
3. 确保值符合 schema 中的类型定义

### 问题: data/status-vars.debug.json 没有更新

**检查清单**:
1. ✓ 是否修改了 status.yaml 或 status.json?
2. ✓ 是否运行了 `pnpm run config:build`?
3. ✓ 是否检查了错误消息?

## 示例工作流

### 场景: 为玩家添加"魅力"属性

**第 1 步**: 编辑 schema
```bash
# 编辑 data/status.yaml，在 {{user}} 的 fields 下添加:
魅力:
  type: "$range=[0,100]"
  default: 50
```

**第 2 步**: 生成
```bash
pnpm run config:build
```

**第 3 步**: 验证
```bash
pnpm run config:verify
# 输出: ✓ Schema 定义有效
```

**第 4 步**: 查看生成的数据
```bash
cat data/status-vars.debug.json | grep -A 5 小二
# 应该看到 "魅力": 50
```

**第 5 步**: 修改玩家的初始值（可选）
```json
// 编辑 data/status.json
{
  "{{user}}": {
    "$range=[0,100] 魅力": 75
  }
}
```

**第 6 步**: 重新生成
```bash
pnpm run config:build
```

**结果**: data/status-vars.debug.json 中 "魅力": 75

## 最佳实践

✓ **定期验证** - 修改后运行 `pnpm run config:verify`

✓ **在 schema 中定义** - 所有字段都应在 status.yaml 中定义

✓ **只覆盖需要的值** - status.json 中只放需要的字段

✓ **保持类型一致** - 值的类型必须符合 schema

✓ **查看日志** - 注意 build-config.js 的输出和警告

✗ **不要直接编辑** - 不要手动修改 data/status-vars.debug.json

✗ **不要跳过验证** - 始终运行 verify 检查配置

## 命令速查

```bash
# 生成运行时数据
pnpm run config:build

# 验证配置系统
pnpm run config:verify

# 同时生成和验证
pnpm run config:build && pnpm run config:verify
```
