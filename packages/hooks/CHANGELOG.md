# seam-hooks

## 0.3.1

### Patch Changes

- 721fd48: 把文档站地址从 GitHub Pages 切到自有域名 `https://ui-kit.cn/`。两个托管目标仍由同一次构建产出，但主入口改为自定义域名，`package.json` 的 `homepage` 与 README 链接一并更新。

## 0.3.0

### Minor Changes

- a0168fc: 新增 useAsyncEffect，支持状态跟踪、结果化清理和最新执行获胜的竞态保护。

## 0.2.0

### Minor Changes

- 1a04d9e: 新增 `useCounter`，支持受控与非受控模式、步长、边界裁剪、稳定 actions 与变更回调。
