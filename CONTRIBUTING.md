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

## 提交粒度

提交必须按可独立说明的功能点拆分，不要把同一轮工作中的多个功能、修复或重构合并成一个提交。

- 每个提交只表达一个行为变化或工程决策，标题应能独立说明这次提交解决了什么。
- 功能实现与它直接对应的测试、文档和 Changeset 放在同一个提交；与当前功能无关的文档或格式化另行提交。
- 独立缺陷修复、行为重构、视觉增强和规范文档分开提交；不要用“顺手调整”把无关改动混入当前功能。
- 提交前逐项审查暂存区，避免直接使用 `git add .`。每个提交都应能单独解释、回滚和验证。
- 同一轮工作需要多个提交时，按可独立验证的顺序排列；靠后的提交不能成为靠前提交通过检查的前提。

例如，一次 Form 校验迭代可以拆成：

```
fix(ui): isolate Form errors to interacted fields
fix(ui): revalidate touched Form fields on change
feat(ui): add Form validation feedback motion
docs(contributing): codify atomic commit scope
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

## 开发流程

常规开发通过分支和 Pull Request 完成，不需要创建 Issue 或添加流水线标签：

1. 从最新的 `main` 创建 `codex/<topic>` 分支；
2. 在本地完成实现、测试、文档和 Changeset；
3. 推送分支并创建 Pull Request，CI 会自动运行 `pnpm check`、端到端测试和构建；
4. CI 通过并完成人工审查后合并到 `main`。

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
