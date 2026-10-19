# @chenhaojie9527/ui-kit

基于 `@chenhaojie9527/ui-kit-hooks` 的 React 组件库，内置可访问性与主题 token。

## 安装

包发布在 GitHub Packages，需要先在 `~/.npmrc` 配置：

```ini
@chenhaojie9527:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
pnpm add @chenhaojie9527/ui-kit
```

## 使用

```tsx
import { Button, Tabs, Dialog } from "@chenhaojie9527/ui-kit";
import "@chenhaojie9527/ui-kit/styles.css";
```

组件包含：Button、Input、Switch、Tabs、Dialog、Toast。

- Tabs 支持方向键切换与 ARIA 关联。
- Dialog 自带焦点陷阱、Esc 关闭与滚动锁定。
- Toast 支持自动消失与手动关闭。

完整文档：[chenhaojie9527.github.io/ui-kit](https://chenhaojie9527.github.io/ui-kit/)

## License

MIT
