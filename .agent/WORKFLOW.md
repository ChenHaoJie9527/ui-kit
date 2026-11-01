# AI Component Development Workflow

Agent 按以下阶段顺序执行。普通 bugfix 可以裁掉新组件专用的 Spec 撰写步骤，
但不得跳过行为定义、验证、独立审查和人工门禁。

## Phase 0: Scaffold

```bash
node .agent/scaffold.mjs <ComponentName> <type>
```

填写 `task.md`。如果需求不明确，停下来问。

对既有组件的增强 Issue 使用 `enhance(Component): ...` 标题。Agent 从标题
括号中的 scope 识别目标组件，先进入 Spec，不进入新组件脚手架。例如：

```text
enhance(Form): validation timing, layout and label wrapping
```

## Phase 1: Baseline + Spec（只读，不写代码）

1. 选择模式：读 `.agent/patterns/` 找到最匹配的模式
2. 读取该模式的完整文件
3. 读取最相近的现有组件源码、测试和 CSS
4. 填写 `spec.md`，只记录该组件相对模式的差异
5. enhancement Spec 必须包含 `<!-- agent-files ... -->` 文件计划；计划中只列
   真正需要修改或新增的源码、测试和文档文件

**硬性规则：此阶段禁止修改任何代码文件。**
**停止条件：将 spec.md 呈现给用户确认。**

## Phase 2: Decision Record

spec 确认后，写 `decisions.md`，记录每个设计决策（编号、原因、备选方案）。

**停止条件：如果引入新交互语言或跨多个组件的变更，先做三个原型给用户选择。**

## Phase 3: Implementation

实现阶段复用 Issue 的 Spec 分支时，工作流先合并最新的 `origin/main`。
这样工作流与 Agent 自身的修复不会因为分支创建时间较早而被旧版本覆盖。
随后只保留该分支的 `.agent/runs` 运行记录，并将其余 `.agent` 基础设施恢复为
`origin/main` 的版本，同时校验恢复结果。旧分支不能继续携带过期的 Agent 代码、
模板或说明文档。

每次执行已批准 Spec 的实现前，计划中的源码、测试和文档路径先恢复为
`origin/main`；计划内尚不存在的新文件会被删除。这样重跑不会把上一轮失败或
半成品代码当成输入，也不会让问题跨轮累积。`.agent/runs` 中的 Spec 与验证记录
不受影响。

按顺序：

1. 实现（`.tsx`）
2. 样式（`.css`，只用 `--uk-*` token）
3. 测试（Vitest + Testing Library）
4. 文档（docs 页面、路由与组件目录）
5. 导出（`index.ts`）
6. Changeset（`pnpm changeset`）

enhancement 只能写入已批准 Spec 文件计划中的路径。允许的路径根为
`packages/ui/src/`、`packages/hooks/src/`、`apps/docs/src/` 和
`e2e/tests/`；工作流、Agent 配置、包清单和构建配置不在自动修改范围内。

规则：

- 复用现有 hooks、utils 和 CSS token
- 简单状态切换用 CSS；出场/手势/弹簧用 Motion
- 每个公开组件必须有导出、测试、文档和 Changeset

## Phase 4: Verification

```bash
CI=true pnpm check
CI=true pnpm test:e2e
CI=true pnpm build
```

验证失败时，将日志和本次变更的源码回传给 Agent，进行定向修复后重新验证。
最多执行 5 次完整验证（初次验证 + 4 次修复后复验）。修复只允许修改
本次变更中的 `packages/`、`apps/`、`e2e/` 源码文件，不得借机修改工作流或
无关代码。自动 lint 修复只作用于本次变更文件，并在 `lint --fix` 后再次执行
格式化，避免全仓库自动修复改写 Agent 自身文件并污染验证结果。

验证修复请求只携带失败日志中明确引用的源码文件，并预填第一个报错文件的
`=== FILE: ... ===` 头部，避免模型再次分析整份变更而不输出文件。修复结果在
写回前逐文件执行格式化校验；无法解析或语法无效时保留 `repair-raw.md` 并结束
本轮，不把不可验证内容当成修复成功。

运行测试失败时，修复上下文会沿测试文件的相对 import 和同名实现文件展开，
同时携带测试与对应组件源码。修复必须优先修正符合 Spec 的生产行为；只有测试
与批准 Spec 或实际公共 API 冲突时才允许修改测试，禁止删除、跳过或弱化覆盖来
换取通过。

进入验证前的格式化是尽力执行：格式化器遇到语法错误时必须继续运行
`pnpm check`，把真实错误交给修复 Agent，而不是提前终止修复循环。增强实现每
写入一个源码文件就立即用 `oxfmt` 做语法校验；语法无效时恢复该文件原有内容，
并将它作为缺失文件单独重试。

大批次生成会预填首个 `=== FILE: ... ===` 助手消息，并要求模型直接从文件正文
续写；采样温度保持为 Coding Plan 模型兼容的值。每次请求只携带该批次自己的
现有文件，避免整份实现计划干扰单文件输出。模型若仍返回完整文件标记，Agent
不会重复添加预填内容。

生成测试或文档批次时，还会只读注入该批次相对 import 指向、且已存在于批准
文件计划中的实现源码。测试必须依据这套真实 API 编写，不能自行发明 prop、
规则结构、属性或错误文案。生成批次固定按“实现/样式/导出 → 测试 → 文档 →
E2E”排序，测试不会与实现源码共用同一批次，确保它读取到本轮真实的公共接口。

全部通过后更新 `evidence.json`；仍失败则保留 Draft PR、验证日志和失败状态，
交给人处理。验证或独立审查未成功时，即使 Draft PR 为保留证据而更新，最终
workflow 也必须失败，不能以绿色状态结束。

`implementation-raw.md`、`repair-raw.md` 与 `verification-*.log` 是临时诊断文件，
只上传为 Actions Artifacts，不提交到 PR。增强实现按文件规模和数量分批生成，
避免单次模型输出上限导致文件截断；任一批次格式不完整时会拆分剩余文件重试。
提交前必须再次格式化所有运行文档。

**停止条件：完整验证 5 次仍失败 → 停止并报告。**

## CI 失败后的自动修复

`AI CI Repair` 在 PR 的 `ci` 工作流失败后运行，仅处理同仓库的
`codex/*` 分支。先执行格式化与可自动修复的 lint，再运行完整检查；仍失败时，
将失败日志和相对 `origin/main` 的变更文件交给 Agent 修复。

修复结果必须在本地提交后继续通过独立 Review Loop，只有 Review 到达
`awaiting-human-review` 才推回原 PR；否则保留在本地并标记
`ai-needs-human`。每个 PR 通过
`ai-ci-repair-attempted` 标签限制为一次自动尝试，避免失败提交形成循环；人工
移除该标签后才允许再次尝试。不处理 fork，不自动合并。

`workflow_dispatch` 的 `workflow_run.head_branch` 可能报告默认分支而不是实际
PR 分支，因此自动修复按 `head_sha` 解析唯一的同仓库 `codex/*` PR，并使用
`head_sha` 隔离并发任务。修复开始前同样恢复 `.agent` 基础设施，只保留 Spec
分支中的运行记录。

## Phase 4.5: Independent Review Before The PR

审查发生在创建 Draft PR 之前。`AI Reviewer` 使用独立上下文，读取 Spec、
完整变更文件、相关调用方、测试、`AGENTS.md`、`DESIGN.md` 与 `REVIEW.md`，
不得修改代码、推送或合并。

主 Reviewer 发现问题后，第二个验证上下文逐项判断 finding 是
`confirmed`、`rejected` 还是 `needs_human`。只有带证据、由本次 PR 引入的
已确认问题才能触发 Builder 修改。自动修改与复审最多两轮，且每轮必须重新
通过 `pnpm check` 与 `pnpm test:e2e`。上下文或 diff 被截断时直接交给人，
不得自动审批或自动修改。

Verifier 同时读取 Spec、`AGENTS.md`、`DESIGN.md` 与 `REVIEW.md`。低置信度的
阻断 finding 即使被 Verifier 确认，也只能交给人，不得直接触发 Builder。每轮
Review 会携带上一轮的 finding ledger；同一缺陷沿用稳定 ID，已驳回的问题只有
在新的代码或契约证据下才能重新提出，避免重复修订和重复评论。

- `ai-ready-for-human`：审查和验证完成，等待人工终审；这不是人工 approval。
- `ai-needs-human`：存在产品判断、上下文不足、验证失败或已达到修订上限。
- `risk:low | medium | high`：由变更路径和组件类型决定，不按作者决定。
- `ai-spec-ready`：新组件的 Spec 已生成，等待人工添加 `spec-approved`。

新组件必须先完成 Spec 人工确认。普通 bugfix 可以全自动执行到 PR。Draft PR
应包含 Spec 位置、风险等级、验证结果、复核后的 findings 和人工审查重点。

人工在 PR 留下意见并显式添加 `ai-revise` 后，Builder 才能再次修改。修改完
仍须通过完整检查、主审和 finding 验证后才能推回。AI 自己添加的标签不得触发
修订，也不得绕过人工合并。

`AI_PIPELINE_TOKEN` 可选：配置后 Bot push 会正常触发下游 CI；未配置时，
流水线通过 `workflow_dispatch` 显式触发 `ci.yml`。该 token 只应有本仓库
contents / pull requests / issues 写权限，不应拥有 Actions administration、
合并或发布权限。

AI Review 只提供证据，不是人工 approval。组件 PR 与 Version Packages PR
始终由人决定是否合并。

## Phase 5: Checkpoint

更新 `checkpoint.md`。

## 硬性规则

1. 新组件、公共 API 或新交互语言不得跳过 spec 确认；普通 bugfix 可复用已有模式
2. 不自动合并、发布、部署
3. 不修改 DESIGN.md 除非用户要求
4. 不创建并行 token 系统或动画系统
5. 每个动画必须过 Motion Gate 四问
6. 每个公开 API 变化必须有 Changeset
7. 外部 UI 库代码仅作参考，不复制
8. 完整验证 5 次仍失败 → 停止
