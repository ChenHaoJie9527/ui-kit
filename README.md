# ui-kit

> React hooks 内核 + 组件库。逻辑可单测，组件只负责渲染与可访问性。

[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-10%20passed-22c55e)](#)
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
- **可验证**：Vitest + Testing Library，10 个用例覆盖受控切换、定时器与边界索引。

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

  return (
    <input value={current} onChange={(e) => setCurrent(e.target.value)} />
  );
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
├─ docs/              GitHub Pages 站点产物
└─ scripts/
   └─ build-docs.mjs  文档构建脚本
```

## 开发

```bash
pnpm install
pnpm --filter @ui-kit/hooks test
pnpm --filter @ui-kit/hooks typecheck
pnpm --filter @ui-kit/hooks build
pnpm build:docs    # 用 Vite 构建静态文档站到 docs/
```

## 设计取舍

| 决策 | 选择 | 原因 |
| --- | --- | --- |
| 状态管理 | `useState` + `ref` | 不引入外部状态库，保持零依赖 |
| 虚拟滚动 | 固定行高 | 区间计算是 O(1)，可单测；动态高度另开 hook |
| 回调稳定 | `useLayoutEffect` 更新 ref | 绘制前同步，避免事件读到旧闭包 |
| 产物格式 | ESM + CJS | 兼容现代构建工具与 Node 环境 |

## Roadmap

- [ ] `packages/ui`：Tabs（键盘导航 / ARIA）、Dialog（焦点陷阱）、VirtualList 组件
- [ ] 文档站补充 API 与边界用例
- [ ] 用 Changesets 管理版本并发布 npm
- [ ] 增加 1 万行列表的首屏渲染基准（全量 vs 虚拟滚动）

## License

[MIT](./LICENSE) © ChenHaoJie9527
