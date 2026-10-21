# seam-react

基于 `seam-hooks` 的 React 组件库，内置可访问性与主题 token。

## 安装

包发布在 npm，安装不需要访问令牌：

```bash
pnpm add seam-react
# 或
npm install seam-react
```

也可以从 JSR 安装 `@seam/ui`。

## 使用

```tsx
import { Button, Tabs, Dialog } from "seam-react";
import { SeamStyles } from "seam-react/styles";

export function Root() {
  return (
    <>
      <SeamStyles />
      <Button>保存</Button>
    </>
  );
}
```

组件包含：Button、Input、Switch、Tabs、Dialog、Toast。

- Tabs 支持方向键切换、ARIA 关联与 fluid 指示器。
- Switch 支持点击、键盘和拖拽 spring。
- Dialog 使用 Motion 管理材质、进出场和拖动关闭，并自带焦点陷阱、Esc 关闭与滚动锁定。
- Toast 使用可中断队列，支持自动消失、悬停暂停与手动关闭。

完整文档：[chenhaojie9527.github.io/ui-kit](https://chenhaojie9527.github.io/ui-kit/)

## License

MIT
