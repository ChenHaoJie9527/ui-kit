# @seam/ui

基于 `@seam/hooks` 的 React 组件库，内置可访问性与主题 token。

## 安装

包发布在 JSR，公共包安装不需要登录或访问令牌：

```bash
pnpm add jsr:@seam/ui
# npm 项目
npx jsr add @seam/ui
```

## 使用

```tsx
import { Button, Tabs, Dialog } from "@seam/ui";
import { SeamStyles } from "@seam/ui/styles";

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

- Tabs 支持方向键切换与 ARIA 关联。
- Dialog 自带焦点陷阱、Esc 关闭与滚动锁定。
- Toast 支持自动消失与手动关闭。

完整文档：[chenhaojie9527.github.io/ui-kit](https://chenhaojie9527.github.io/ui-kit/)

## License

MIT
