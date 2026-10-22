# seam-hooks

31 个生产级 React hooks：受控状态、计数器、虚拟滚动、异步竞态、焦点管理与浏览器能力封装。

## 安装

包发布在 npm，安装不需要访问令牌。

```bash
pnpm add seam-hooks
```

也可以从 JSR 安装：

```bash
pnpm add jsr:@seam/hooks
```

## 快速开始

```tsx
import { useControllableState, useVirtualList } from "seam-hooks";

const [value, setValue] = useControllableState({ defaultValue: "" });

const { start, end, totalHeight, offsetTop } = useVirtualList({
  count: 10_000,
  itemHeight: 36,
  viewportHeight: 288,
  scrollTop,
});
```

## 包含的能力

- **状态**：`useControllableState`、`useCounter`、`useSetState`、`useMap`、`useList`、`useGetSet`
- **异步**：`useAsync`、`useAsyncFn`、`useAsyncRetry`
- **性能**：`useVirtualList`、`useDebounce`、`useDebouncedValue`、`useThrottle`、`useEventCallback`
- **交互**：`useClickAway`、`useFocusTrap`、`useDropArea`、`useFullscreen`、`useVideo`
- **浏览器**：`useMedia`、`useWindowSize`、`useLocation`、`usePageLeave`、`useStartTyping`
- **存储**：`useLocalStorage`、`useCopyToClipboard`

完整文档：[chenhaojie9527.github.io/ui-kit](https://chenhaojie9527.github.io/ui-kit/)

## License

MIT
