# ui-kit

> React hooks 内核 + 组件库。逻辑可单测，组件只负责渲染与可访问性。

[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-139%20passed-22c55e)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-4f46e5)](https://chenhaojie9527.github.io/ui-kit/)

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
- **可发布**：ESM + CJS 双产物、类型声明、`sideEffects: false`、tree-shaking 友好。
- **可访问的组件**：原生语义优先，Tabs / Dialog / Toast 自带键盘导航与 ARIA 关联。
- **可验证**：Vitest + Testing Library，139 个用例覆盖状态切换、定时器、异步竞态、焦点与边界索引。

## Hooks 一览

**浏览器 / 环境**

- `useMedia(query)`：订阅 CSS 媒体查询。
- `useWindowSize()`：跟踪窗口尺寸。
- `useLocation()`：跟踪 pathname / search / hash，包含 pushState / replaceState。
- `useStartTyping()`：检测用户是否开始在空白处输入。
- `usePageLeave(onLeave?)`：鼠标离开页面边界时触发。

**交互**

- `useClickAway(ref, handler, events?)`：点击目标区域外时触发。
- `useFocusTrap({ active, containerRef, ... })`：把焦点限制在容器内，支持初始焦点、关闭后恢复与嵌套陷阱。
- `useDropArea(options)` / `useDrop()`：拖放文件、链接和文本。
- `useFullscreen(ref, options?)`：元素全屏，提供 enter / exit / toggle。
- `useVideo(ref)`：播放、暂停、seek、音量、倍速与状态跟踪。

**状态**

- `useMap(initial?)` / `useList(initial?)`：Map / 数组的不可变状态管理。
- `useObservable(observable, initialValue?)`：订阅 Observable 的最新值。
- `useGetSet(initial)`：返回 getter，读取不触发渲染。
- `useSetState(initial)`：类似 this.setState 的浅合并更新。

**异步**

- `useAsync(fn, deps?, options?)`：执行 async 函数并跟踪 loading / error / value。
- `useAsyncFn(fn, deps?)`：`[state, run]` 形式的手动异步调用。
- `useAsyncRetry(fn, deps?)`：在 useAsync 基础上提供 retry()。

**工具**

- `useDebounce(fn, delay?)` / `useThrottle(fn, wait?, options?)`：函数防抖 / 节流。
- `useCopyToClipboard()`：复制文本，带 execCommand 降级。
- `useLocalStorage(key, initialValue, options?)`：localStorage 持久化与跨标签同步。
- `useLockBodyScroll(locked?)`：锁定 body 滚动，支持嵌套引用计数。
- `useTitle(title, options?)`：设置页面标题，可选择性恢复。

已有的 `useControllableState`、`useEventCallback`、`useDebouncedValue`、`useVirtualList` 保持不变。

## 组件一览

- `Button`：primary / secondary / outline / ghost / danger 五种变体，三种尺寸，fluid 按压反馈，loading 自动禁用。
- `Input`：透传原生输入属性，`invalid` 映射到 `aria-invalid`，焦点状态使用共享动效 token。
- `Switch`：基于原生 checkbox，受控与非受控写法一致，支持点击、键盘和拖拽 spring。
- `Tabs`：组合式 API，roving tabindex、方向键循环、Home/End、完整 ARIA 关联与共享布局指示器。
- `Dialog`：组合式 Root / Trigger / Content / Header / Title / Description / Body / Footer / Close 语义层，基于原生 `<dialog>` 并内置焦点、Esc、遮罩与滚动锁定。
- `Toast`：`ToastProvider` + `useToast()`，AnimatePresence 管理可中断队列、自动关闭、悬停暂停与 `aria-live`。

在应用根部渲染一次 `<SeamStyles />` 即可引入组件样式；颜色、间距、圆角、阴影、时长和缓动都是 CSS 变量，支持 `light-dark()` 与 reduced-motion。

## 安装

包发布在 **npm**，安装不需要访问令牌：

```bash
pnpm add seam-react
# 或
npm install seam-react
```

`seam-react` 依赖 `seam-hooks` 与 Motion，安装组件包即可同时使用全部 hooks 和流体动效。只想要无渲染逻辑时，也可以单独安装：

```bash
pnpm add seam-hooks
```

也可以从 JSR 安装同名能力：

```bash
pnpm add jsr:@seam/ui
pnpm add jsr:@seam/hooks
```

## 使用

### 受控 / 非受控

```tsx
import { useControllableState } from "seam-hooks";

function Input({ value, defaultValue = "", onChange }: Props) {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  });

  return <input value={current} onChange={(e) => setCurrent(e.target.value)} />;
}
```

### 万级列表

```tsx
import { useVirtualList } from "seam-hooks";

const { start, end, totalHeight, offsetTop } = useVirtualList({
  count: 10_000,
  itemHeight: 36,
  viewportHeight: 288,
  scrollTop,
});
```

### 稳定回调

```tsx
const report = useEventCallback(() => {
  setTimeout(() => reportLatest(count), 1000);
});
```

### 组件

```tsx
import { Button, Dialog, Tabs, ToastProvider, useToast } from "seam-react";
import { SeamStyles } from "seam-react/styles";

function App() {
  return (
    <>
      <SeamStyles />
      <ToastProvider>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label="说明">
            <Tabs.Trigger value="overview">概览</Tabs.Trigger>
            <Tabs.Trigger value="api">API</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview">
            <Button>保存</Button>
          </Tabs.Content>
          <Tabs.Content value="api">...</Tabs.Content>
        </Tabs>
      </ToastProvider>
    </>
  );
}
```

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

# 本地构建文档站（CI 会在 push 时自动构建并部署）
pnpm build
pnpm build:docs
```

文档站使用 Tailwind CSS v4，但组件包本身仍是手写 CSS：

- `packages/ui` 的样式不依赖 Tailwind，消费者不需要安装或配置它
- `apps/docs/src/app.css` 用 `@theme inline` 把 `--doc-*` 桥接成 Tailwind token，
  `light-dark()` 与 `[data-theme]` 继续生效
- 全局 `@layer` 顺序写在 `apps/docs/index.html` 的内联 `<style>` 里（必须先于任何打包 CSS）：
  `properties, theme, base, uk.tokens, uk.components, components, utilities`。
  `utilities` 高于 `uk.components`，所以 `className="rounded-full"` 能覆盖组件样式；
  `properties` 必须最先，否则 Tailwind 给 Safari 生成的 `--tw-*` 兜底层会成为
  最高优先级的层，把 translate / rotate / shadow 等工具类全部盖掉
- 覆盖层、`<details>` 三角、滚动条等无法用工具类表达的细节放在 `app.css` 的自定义 utility 里

## 代码规范

Lint 与格式化统一交给 [Oxc](https://oxc.rs)：`oxlint` 负责规则检查，`oxfmt` 负责格式。

```bash
pnpm lint          # oxlint .
pnpm lint:fix      # oxlint . --fix
pnpm format        # oxfmt .
pnpm format:check  # 只检查，不改文件
pnpm check         # format:check + lint + typecheck + test
```

仓库内置 `.vscode/settings.json`，打开项目后安装推荐扩展 `oxc.oxc-vscode` 即可：
保存时自动格式化（默认格式化器已指向 Oxc）、按类型实时提示 lint，
无需再装 ESLint / Prettier 扩展。

## 设计取舍

| 决策     | 选择                       | 原因                                       |
| -------- | -------------------------- | ------------------------------------------ |
| 状态管理 | `useState` + `ref`         | 不引入外部状态库                           |
| 虚拟滚动 | 固定行高                   | 区间计算是 O(1)，可单测；动态高度另开 hook |
| 回调稳定 | `useLayoutEffect` 更新 ref | 绘制前同步，避免事件读到旧闭包             |
| 产物格式 | ESM + CJS                  | 兼容现代构建工具与 Node 环境               |

## Roadmap

- [x] `packages/ui`：Button、Input、Switch、Tabs、Dialog、Toast 最小闭环
- [ ] `packages/ui`：VirtualList、Menu、Select 等第二批组件
- [ ] 文档站补充每个组件的 API 表格与边界用例
- [x] 用 Changesets 管理版本并发布到 npm 与 JSR
- [ ] 增加 1 万行列表的首屏渲染基准（全量 vs 虚拟滚动）

## 发布

合并 Changesets 的版本 PR 后，GitHub Actions 会通过 npm Trusted Publishing
自动发布 `seam-hooks` → `seam-react`。JSR 使用独立的 `publish` workflow 和
GitHub Actions OIDC 发布，两套流程不需要长期 token。

## License

[MIT](./LICENSE) © ChenHaoJie9527
