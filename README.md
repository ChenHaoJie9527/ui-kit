# ui-kit

> React hooks 内核 + 组件库。逻辑可单测，组件只负责渲染与可访问性。

[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-87%20passed-22c55e)](#)
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
- **可验证**：Vitest + Testing Library，87 个用例覆盖状态切换、定时器、异步竞态与边界索引。

## Hooks 一览

**浏览器 / 环境**

- `useMedia(query)`：订阅 CSS 媒体查询。
- `useWindowSize()`：跟踪窗口尺寸。
- `useLocation()`：跟踪 pathname / search / hash，包含 pushState / replaceState。
- `useStartTyping()`：检测用户是否开始在空白处输入。
- `usePageLeave(onLeave?)`：鼠标离开页面边界时触发。

**交互**

- `useClickAway(ref, handler, events?)`：点击目标区域外时触发。
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

## 安装

```bash
pnpm add @ui-kit/hooks
# 或
npm i @ui-kit/hooks
```

## 使用

### 受控 / 非受控

```tsx
import { useControllableState } from "@ui-kit/hooks";

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
import { useVirtualList } from "@ui-kit/hooks";

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

## 包结构

```
ui-kit/
├─ packages/
│  └─ hooks/          @ui-kit/hooks —— 无渲染逻辑
├─ apps/
│  └─ docs/           文档演示（构建为静态站点）
└─ docs/              GitHub Pages 站点产物
```

## 开发

```bash
pnpm install
pnpm --filter @ui-kit/hooks test
pnpm --filter @ui-kit/hooks typecheck
pnpm --filter @ui-kit/hooks build
pnpm build:docs    # 用 Vite 构建静态文档站到 docs/
```

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
| 状态管理 | `useState` + `ref`         | 不引入外部状态库，保持零依赖               |
| 虚拟滚动 | 固定行高                   | 区间计算是 O(1)，可单测；动态高度另开 hook |
| 回调稳定 | `useLayoutEffect` 更新 ref | 绘制前同步，避免事件读到旧闭包             |
| 产物格式 | ESM + CJS                  | 兼容现代构建工具与 Node 环境               |

## Roadmap

- [ ] `packages/ui`：Tabs（键盘导航 / ARIA）、Dialog（焦点陷阱）、VirtualList 组件
- [ ] 文档站补充 API 与边界用例
- [ ] 用 Changesets 管理版本并发布 npm
- [ ] 增加 1 万行列表的首屏渲染基准（全量 vs 虚拟滚动）

## License

[MIT](./LICENSE) © ChenHaoJie9527
