# seam-react

基于 `seam-hooks` 的 React 组件库，内置可访问性与主题 token。

## 安装

包发布在 npm，安装不需要访问令牌：

```bash
pnpm add seam-react
# 或
npm install seam-react
```

## 使用

```tsx
import {
  Button,
  Tabs,
  Dialog,
  Sidebar,
  ToastStack,
  useToast,
} from "seam-react";
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

组件包含：Button、Input、Form、Switch、Tabs、Carousel、Dialog、Toast、Tooltip、Sidebar。

- Tabs 支持方向键切换、ARIA 关联与 fluid 指示器。
- Carousel 基于 Embla，支持横向/纵向、拖拽、受控 snap 索引、RTL 与 reduced-motion 降级。
- Switch 支持点击、键盘和拖拽 spring。
- Dialog 提供 Root / Trigger / Content 与语义化内容层，自带 Motion 进出场、焦点陷阱、Esc 关闭与滚动锁定。
- Toast 提供 `useToast` 状态队列与 `ToastStack` 呈现层，支持六向定位、自动关闭、状态图标、操作和拖拽关闭。
- Tooltip 提供延迟显示、键盘与触屏访问、视口翻转/避让，以及可让相邻触发器共享并连续移动表面的 Group / Item 组合。
- Form 提供组合式字段、同步/异步规则、服务端错误和失败聚焦；安装 `valibot` 后可通过 `seam-react/valibot` 接入 schema 校验。
- Sidebar 提供可折叠 Group、可配置分组间距，以及互斥的轨道与背景 hover 模式。

完整文档：[ui-kit.cn](https://ui-kit.cn/)

## License

MIT
