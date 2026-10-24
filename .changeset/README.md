# Changesets

每次对 `packages/*` 产生用户可见的改动时，运行：

```bash
pnpm changeset
```

选择受影响的包与升级类型；常规组件 / Hook 迭代默认使用 patch（+0.0.1），只有破坏性变更或系统性里程碑才使用 minor / major，并写一句变更说明。
提交合并到 `main` 后，Changesets 会自动开一个 “Version Packages” PR；
合并该 PR 时自动构建并发布到 GitHub Packages。
