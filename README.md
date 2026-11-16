# ui-kit

> React hooks 内核 + 组件库。逻辑可单测，组件只负责渲染与可访问性。

[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![npm version](https://img.shields.io/npm/v/seam-react)](https://www.npmjs.com/package/seam-react)
[![Tests](https://img.shields.io/badge/tests-453%20passed-22c55e)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-4f46e5)](https://ui-kit.cn/)

## 为什么做这个项目

组件库真正的难点不在样式，而在**状态语义**与**性能边界**：

- 一个输入组件到底该受控还是非受控？两种模式如何共用一套 API？
- 一万行列表怎么渲染？虚拟滚动的区间怎么算、overscan 怎么定？
- 事件回调为什么总是读到旧闭包？怎样做到引用稳定 yet 值最新？

`ui-kit` 把这些通用问题抽成无渲染的 hooks，组件只负责结构与可访问性。

## 特性

- **受控 / 非受控统一**：`useControllableState` 提供一致的状态语义与变更通知。
- **稳定回调**：`useEventCallback` 让订阅、定时器始终读到最新值，且引用不变。
- **性能基础设施**：`useVirtualList` 把万级列表的渲染量压到可视区间。
- **高频输入控制**：`useDebouncedValue` 支持可配置延迟与同步退化。
- **可发布的组件**：ESM + CJS 双产物、逐入口打包的自包含类型声明（任何
  `moduleResolution` 都能正确解析）、`sideEffects` 声明、tree-shaking 友好。
- **可访问的组件**：原生语义优先，Tabs / Dialog 自带键盘导航与 ARIA 关联。
- **可验证**：Vitest + Testing Library，453 个用例覆盖状态切换、定时器、异步竞态、焦点与边界索引。

## 安装

```bash
pnpm add seam-react
# 或
npm install seam-react
```

`seam-react` 依赖 `seam-hooks`、Motion 与 Embla Carousel，安装组件包即可同时
使用全部 hooks、流体动效和轮播引擎。只想要无渲染逻辑时，也可以单独安装：

```bash
pnpm add seam-hooks
```

## 快速上手

```tsx
import { Button, Tabs } from "seam-react";
import { SeamStyles } from "seam-react/styles";

function App() {
  return (
    <>
      {/* 应用根部渲染一次即可引入全部组件样式 */}
      <SeamStyles />
      <Tabs defaultValue="overview">
        <Tabs.List aria-label="说明">
          <Tabs.Trigger value="overview">概览</Tabs.Trigger>
          <Tabs.Trigger value="api">API</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <Button>保存</Button>
        </Tabs.Content>
      </Tabs>
    </>
  );
}
```

样式不依赖 Tailwind：颜色、间距、圆角、阴影、时长和缓动都是 CSS 变量，
支持 `light-dark()` 与 reduced-motion。

## 组件

Button · Badge · CheckBox · RadioGroup · Select · Input · Form · Switch ·
Sidebar · Tabs · Carousel · Dialog · Drawer · Toast · Marquee · Tooltip ·
ImageViewer

每个组件的受控用法、API 表格与边界示例见 [文档站](https://ui-kit.cn/)（如
https://ui-kit.cn/#/components/button）。

## Hooks

useControllableState · useCounter · useEventCallback · useDebouncedValue ·
useVirtualList · useMedia · useWindowSize · useLocation · useStartTyping ·
usePageLeave · useClickAway · useDropArea · useDrop · useFullscreen ·
useVideo · useMap · useList · useObservable · useGetSet · useSetState ·
useAsync · useAsyncEffect · useAsyncFn · useAsyncRetry · useDebounce ·
useThrottle · useCopyToClipboard · useLocalStorage · useLockBodyScroll ·
useFocusTrap · useActiveSection · useTitle

完整签名、参数与返回值见 [文档站](https://ui-kit.cn/)（如
https://ui-kit.cn/#/hooks/use-debounced-value）。

## 包结构

```
ui-kit/
├─ packages/
│  ├─ hooks/          seam-hooks —— 无渲染逻辑
│  └─ ui/             seam-react —— 组件与样式
├─ apps/
│  └─ docs/           文档与交互演示（构建为静态站点）
└─ .github/workflows/ CI：发布包、构建并部署文档站
```

## 开发

```bash
pnpm install

# 启动开发服务器（默认 http://localhost:5173）
# 直接消费 packages/*/src，改组件或 hooks 会热更新，不需要先 build
pnpm dev

# 单项校验
pnpm --filter seam-hooks test
pnpm --filter seam-hooks typecheck
pnpm --filter seam-react test
pnpm --filter seam-react typecheck

# 提交前一次性跑完 format / lint / typecheck / test
pnpm check
```

Lint 与格式化统一交给 [Oxc](https://oxc.rs)：`oxlint` 负责规则检查，`oxfmt`
负责格式（`pnpm lint` / `pnpm format`，`pnpm check` 会一并校验）。仓库内置
`.vscode/settings.json`，安装推荐扩展 `oxc.oxc-vscode` 后保存即自动格式化，
无需再装 ESLint / Prettier 扩展。

提交规范、开发流程与版本发布见 `CONTRIBUTING.md`。

## License

[MIT](./LICENSE) © ChenHaoJie9527
