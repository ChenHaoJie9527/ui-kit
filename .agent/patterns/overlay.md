# Overlay Pattern

## 适用组件

Dialog, Tooltip, Popover, Toast, Select（下拉面板）

## 复用 primitives

| 需求             | 来源                                                   |
| ---------------- | ------------------------------------------------------ |
| 受控/非受控状态  | `useControllableState` from `seam-hooks`               |
| 事件回调稳定引用 | `useEventCallback` from `seam-hooks`                   |
| 焦点陷阱         | `useFocusTrap` from `seam-hooks`                       |
| 锁定滚动         | `useLockBodyScroll` from `seam-hooks`                  |
| 点击外部关闭     | `useClickAway` from `seam-hooks`                       |
| Portal 渲染      | `createPortal` from `react-dom`                        |
| 出场动画管理     | `AnimatePresence` + `useIsPresent` from `motion/react` |
| Reduced motion   | `useReducedMotion` from `motion/react`                 |

## 组合模式

### Root / Trigger / Content

所有 overlay 组件使用相同的组合模式：

```tsx
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger>打开</Dialog.Trigger>
  <Dialog.Content>内容</Dialog.Content>
</Dialog.Root>
```

Context 管理 `open`、trigger/content 的 `useId()`、以及共享状态。

### Trigger 克隆

Trigger 通过 `cloneElement` 注入：

- `onClick` → `setOpen(!open)`
- `aria-expanded` / `aria-haspopup`
- `aria-controls` → content 的 `useId()`
- `ref` → 用于定位和焦点恢复

## 键盘行为

| 行为         | Dialog              | Tooltip                 | Popover   | Toast      |
| ------------ | ------------------- | ----------------------- | --------- | ---------- |
| Escape 关闭  | ✅ `closeOnEscape`  | ✅                      | ✅        | 可配置     |
| Tab 焦点陷阱 | ✅ `useFocusTrap`   | ❌ 不陷阱               | 可配置    | ❌         |
| 聚焦恢复     | ✅ `returnFocusRef` | ✅                      | ✅        | ❌         |
| 方向键       | ❌                  | ❌                      | ✅ 菜单项 | ❌         |
| 打开延迟     | 无                  | `delayDuration` (300ms) | 无        | 无         |
| 关闭延迟     | 无                  | `closeDelay` (80ms)     | 无        | `duration` |

## ARIA 模式

| 组件    | role                | 附加属性                                                   |
| ------- | ------------------- | ---------------------------------------------------------- |
| Dialog  | `dialog`            | `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Tooltip | `tooltip`           | `aria-describedby` 在 trigger 上                           |
| Popover | 可变                | `aria-expanded`, `aria-haspopup`                           |
| Toast   | `status` 或 `alert` | `aria-live="polite"` 或 `"assertive"`                      |

## 动效参数

| Token                           | 用途                | CSS 变量                      |
| ------------------------------- | ------------------- | ----------------------------- |
| `--uk-duration-overlay` (240ms) | Dialog/Popover 进入 | `OVERLAY_SPRING` in motion.ts |
| `--uk-duration-exit` (180ms)    | 退出                | `AnimatePresence` exit        |
| `--uk-duration-fast` (120ms)    | Tooltip 进入        | `TOOLTIP_TRANSITION`          |
| `--uk-duration-control` (200ms) | Select 下拉         | `SELECT_SUBMENU_TRANSITION`   |

**规则**：

- 进入用 `ease-out`（`EASE_OUT`）
- 退出用 `ease-out`，时长比进入短
- 禁止大幅位移动画（scale 0.95 → 1 或 opacity 0 → 1 即可）
- `useReducedMotion()` 时使用 `REDUCED_MOTION_TRANSITION`（120ms ease-out，无位移）

## 边缘情况

- 嵌套 overlay：z-index 递增（`--uk-z-dialog: 1000`, `--uk-z-tooltip: 1100`）
- 内容溢出视口：碰撞检测 + 翻转
- 触发器被移除：`useEffect` cleanup，关闭 overlay
- 快速开关：`AnimatePresence` 管理退出，`useIsPresent` 阻止过早移除 DOM
- 焦点移入后失焦：Dialog trap 不可逃逸；Popover/Tooltip 延迟关闭

## CSS Token 引用

```css
.overlay-content {
  background: var(--uk-surface-raised);
  border: 1px solid var(--uk-border);
  border-radius: var(--uk-radius-lg);
  box-shadow: var(--uk-shadow-lg);
  z-index: var(--uk-z-dialog); /* 或 --uk-z-tooltip */
}
```
