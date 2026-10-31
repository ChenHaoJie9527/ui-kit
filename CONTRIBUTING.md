# 提交规范

仓库使用 [Conventional Commits](https://www.conventionalcommits.org/)，提交信息格式：

```
type(scope): subject
```

- `type`：必填，取值为 `feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert`
- `scope`：可选，建议写包或模块名，如 `hooks`、`ui`、`docs`、`ci`
- `subject`：简短描述，不超过 100 字符，结尾不加句号

示例：

```
feat(ui): 新增 Badge 组件
fix(hooks): 修复 useFocusTrap 在嵌套弹层中的焦点回退
docs: 补充 Dialog 的无障碍说明
ci: 发布前自动校验提交信息
```

## 交互式提交

```bash
pnpm commit
```

按提示选择类型、范围并填写描述，cz-git 会生成符合规范的信息。

## 校验

`.husky/commit-msg` 会在每次提交时调用 commitlint，不合规的提交会被拒绝。

手动校验一条信息：

```bash
echo "feat(ui): 新增 Badge 组件" | pnpm exec commitlint
```

## 版本与发布

提交只做校验，不产生版本。版本由 Changesets 管理：

1. 对 `packages/*` 有用户可见改动时，运行 `pnpm changeset`，选择包与升级类型，写一句说明。组件和 Hook 的常规迭代默认使用 patch（+0.0.1）；只有破坏性变更或需要明确标记里程碑的系统性升级才使用 minor / major；
2. 提交并合并到 `main` 后，`release` 工作流会自动创建一个 “Version Packages” PR（含版本号与 CHANGELOG）；
3. 合并该 PR 后，`release` 工作流通过 npm Trusted Publishing 自动发布
   `seam-hooks` → `seam-react`，不需要保存 npm token。

本地预演：

```bash
pnpm changeset status    # 查看待发布的版本变化
pnpm version-packages    # 应用版本号与 CHANGELOG（通常由 CI 执行）
```

## AI 组件流水线

AI 自动化只负责生成、验证和审查证据，不自动合并、发布或部署。Draft PR
仍需要人工终审；AI Review 不是人工 approval，Bot approval 也不能代替人工
approval。

### 一次性配置

在仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret               | 用途                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `ARK_API_KEY`        | 调用火山方舟 Coding Plan 的 API Key                                                              |
| `ARK_MODEL`          | Builder / Finder 的 Coding Plan 模型 slug，例如 `kimi-k3.1-pro`（控制台显示为 `Kimi-K3.1-Pro`）  |
| `ARK_VERIFIER_MODEL` | 可选的独立 Verifier 模型 slug；未配置时使用 `ARK_MODEL`                                          |
| `AI_PIPELINE_TOKEN`  | 可选的 fine-grained PAT 或 GitHub App token，需有本仓库 contents / pull requests / issues 写权限 |

`AI_PIPELINE_TOKEN` 可选。配置后，Bot 的 push 会像普通 push 一样触发下游
CI；未配置时，流水线会用内置 `GITHUB_TOKEN` 显式 `workflow_dispatch` 一次
`ci.yml` 作为备用触发。不要给该 token Actions administration、合并或发布权限。

首次使用前，确保 Issues 中已经存在 `ai-develop` 标签。其余流水线标签由
工作流创建。对 `main` 启用 branch protection，至少要求现有 `CI` 检查通过，
并保留人工 approval；不要允许 Bot 自动合并。

### 从 Issue 到 Draft PR

1. 创建描述需求和验收条件的 Issue。
2. 人工添加 **`ai-develop`**。新组件，以及标题为
   `enhance(<Component>): ...` 的既有组件增强，都会先只生成 Spec，并推送
   `codex/*` 分支，添加 **`ai-spec-ready`**。enhancement Spec 必须列出
   Agent 可修改的文件计划。
3. 人工检查 Spec 中的 API、状态、键盘、无障碍、Motion Gate 和测试计划；
   可以直接在分支修正 `.agent/runs/<run-id>/spec.md`。
4. 人工添加 **`spec-approved`** 后，工作流才读取这份已确认 Spec 并生成实现。
   普通 `fix:` / `修复` Issue 可以跳过 Spec 审批，直接进入实现。
5. Builder 生成组件、样式、测试、导出、文档页/路由/组件目录和 Changeset，
   再依次执行格式化、`pnpm check`、`pnpm test:e2e`、`pnpm build`、独立 Review Loop。
   Finder 先产生 findings，Verifier 再逐项确认、驳回或交给人；只有
   `confirmed`、由本 PR 引入且非低严重度的问题可以触发最多两轮自动修订。
6. 验证和审查结束后创建或更新 Draft PR，并标记
   `ai-ready-for-human` 或 `ai-needs-human`，以及 `risk:low` /
   `risk:medium` / `risk:high`。

上下文或 diff 被截断、低置信度的阻断 finding、产品判断、跨范围修改和达到
修订上限都会停止自动修订并交给人工。

### PR 复审

人工读完 Draft PR 后，留下普通评论、review 或 inline comment，再添加
**`ai-revise`**。工作流只读取最近一次 AI Review 之后的人工反馈；没有新反馈
时会失败并要求补评论。Builder 修改后必须重新通过完整验证和 Review Loop 才能
推回分支。

Agent 自己添加的 `ai-revise` 不触发复审，避免循环。合并、Changesets 发布和
npm 发布仍按本文档前面的常规人工流程执行。
