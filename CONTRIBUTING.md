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
docs: 补充 Toast 的无障碍说明
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
