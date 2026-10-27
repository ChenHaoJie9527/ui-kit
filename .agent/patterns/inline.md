# Inline Pattern

## 适用组件

Button, Badge, Marquee, Avatar（未来）, Chip（未来）

## 复用 primitives

| 需求              | 来源                                      |
| ----------------- | ----------------------------------------- |
| cx 合并 className | `cx` from `utils/cx`                      |
| 按压动效          | `--uk-scale-press` + `--uk-duration-fast` |
| Reduced motion    | `useReducedMotion` from `motion/react`    |

## 核心原则

内联组件通常**不需要 Motion**。高频操作的反馈用 CSS transition 就够了。只有需要 layout 动画（如 Badge 出现/消失）时才用 Motion。

## Button 的变体模型

```tsx
type ButtonVariant = "solid" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
```

| 变体    | 背景                 | 文字                    | 边框                    |
| ------- | -------------------- | ----------------------- | ----------------------- |
| solid   | `--uk-primary-solid` | `--uk-primary-contrast` | 无                      |
| outline | transparent          | `--uk-primary`          | `1px solid --uk-border` |
| ghost   | transparent          | `--uk-text`             | 无                      |
| danger  | `--uk-danger-solid`  | `--uk-danger-contrast`  | 无                      |

## 状态模型

| 状态          | CSS 选择器              | 效果                                      |
| ------------- | ----------------------- | ----------------------------------------- |
| default       | `.button`               | 基础样式                                  |
| hover         | `.button:hover`         | 背景加深                                  |
| active        | `.button:active`        | `transform: scale(var(--uk-scale-press))` |
| focus-visible | `.button:focus-visible` | focus ring                                |
| disabled      | `.button:disabled`      | `opacity: 0.5; pointer-events: none`      |
| loading       | `.button[data-loading]` | spinner + `pointer-events: none`          |

## 动效

| 场景            | 实现                                            | Token                        |
| --------------- | ----------------------------------------------- | ---------------------------- |
| hover 背景变化  | CSS `transition`                                | `--uk-duration-base` (160ms) |
| 按压缩放        | CSS `:active` + `transform`                     | `--uk-duration-fast` (120ms) |
| focus ring 出现 | CSS `:focus-visible` + `box-shadow`             | `--uk-duration-fast`         |
| Badge 出现/消失 | Motion `AnimatePresence`                        | `--uk-duration-fast`         |
| Marquee 滚动    | CSS `animation` + `prefers-reduced-motion` 暂停 | —                            |

**Motion Gate 结论**：内联组件是高频操作。默认不添加动画。仅有的视觉反馈是 hover 背景变化和按压缩放，都是 120-160ms 的 CSS transition。

## CSS Token 引用

```css
.button {
  display: inline-flex;
  align-items: center;
  gap: var(--uk-space-2);
  padding: var(--uk-space-2) var(--uk-space-4);
  border-radius: var(--uk-radius-md);
  font-size: var(--uk-text-md);
  transition: var(--uk-transition);
}

.button:active {
  transform: scale(var(--uk-scale-press));
  transition-duration: var(--uk-duration-fast);
}

.button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--uk-focus-ring);
}
```
