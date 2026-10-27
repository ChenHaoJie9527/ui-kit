# AI Component Development Workflow

Agent 必须按以下阶段顺序执行。不可跳过任何阶段。

## Phase 0: Scaffold

```bash
node .agent/scaffold.mjs <ComponentName> <type>
```

填写 `task.md`。如果需求不明确，停下来问。

## Phase 1: Baseline + Spec（只读，不写代码）

1. 选择模式：读 `.agent/patterns/` 找到最匹配的模式
2. 读取该模式的完整文件
3. 读取最相近的现有组件源码、测试和 CSS
4. 填写 `spec.md`，只记录该组件相对模式的差异

**硬性规则：此阶段禁止修改任何代码文件。**
**停止条件：将 spec.md 呈现给用户确认。**

## Phase 2: Decision Record

spec 确认后，写 `decisions.md`，记录每个设计决策（编号、原因、备选方案）。

**停止条件：如果引入新交互语言或跨多个组件的变更，先做三个原型给用户选择。**

## Phase 3: Implementation

按顺序：

1. 实现（`.tsx`）
2. 样式（`.css`，只用 `--uk-*` token）
3. 测试（Vitest + Testing Library）
4. 文档（docs 站）
5. 导出（`index.ts`）
6. Changeset（`pnpm changeset`）

规则：

- 复用现有 hooks、utils 和 CSS token
- 简单状态切换用 CSS；出场/手势/弹簧用 Motion
- 每个公开组件必须有导出、测试、文档和 Changeset

## Phase 4: Verification

```bash
CI=true pnpm check
CI=true pnpm test:e2e
```

验证失败时，将日志和本次变更的源码回传给 Agent，进行定向修复后重新验证。
最多执行 3 次完整验证（初次验证 + 2 次修复后复验）。修复只允许修改
本次变更中的 `packages/`、`apps/`、`e2e/` 源码文件，不得借机修改工作流或
无关代码。

全部通过后更新 `evidence.json`；仍失败则保留 Draft PR、验证日志和失败状态，
交给人处理。

**停止条件：同一错误修复 3 次仍失败 → 停止并报告。**

## Phase 5: Checkpoint

更新 `checkpoint.md`。

## 硬性规则

1. 不跳过 spec 阶段
2. 不自动合并、发布、部署
3. 不修改 DESIGN.md 除非用户要求
4. 不创建并行 token 系统或动画系统
5. 每个动画必须过 Motion Gate 四问
6. 每个公开 API 变化必须有 Changeset
7. 外部 UI 库代码仅作参考，不复制
8. 同一错误 3 次失败 → 停止
