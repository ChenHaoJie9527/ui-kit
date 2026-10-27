# Navigation Pattern

## 适用组件

Tabs, Sidebar, Breadcrumb（未来）

## 复用 primitives

| 需求            | 来源                                        |
| --------------- | ------------------------------------------- |
| 受控/非受控状态 | `useControllableState` from `seam-hooks`    |
| ID 生成         | `useId` from `react`                        |
| 指示器动画      | `INDICATOR_SPRING` from `motion.ts`         |
| Reduced motion  | `useReducedMotion` from `motion/react`      |
| Context         | `createContext` + `useContext` from `react` |

## 组合模式

### Tabs 的 Root / List / Tab / Panel

```tsx
<Tabs value={value} onValueChange={setValue} orientation="horizontal">
  <Tabs.List aria-label="设置">
    <Tabs.Tab value="general">通用</Tabs.Tab>
    <Tabs.Tab value="advanced">高级</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="general">...</Tabs.Panel>
  <Tabs.Panel value="advanced">...</Tabs.Panel>
</Tabs>
```

### ID 关联

```ts
const baseId = useId();
const tabId = `${baseId}-tab-${encodeURIComponent(value)}`;
const panelId = `${baseId}-panel-${encodeURIComponent(value)}`;
```

Tab 上设置 `id={tabId}` `aria-controls={panelId}`，Panel 上设置 `id={panelId}` `aria-labelledby={tabId}`。

## 键盘行为

| 按键               | 水平 Tabs           | 垂直 Tabs           | Sidebar       |
| ------------------ | ------------------- | ------------------- | ------------- |
| Arrow Right / Left | 切换到下一个/上一个 | ❌                  | 展开子项/折叠 |
| Arrow Up / Down    | ❌                  | 切换到下一个/上一个 | 导航列表      |
| Home               | 第一个              | 第一个              | —             |
| End                | 最后一个            | 最后一个            | —             |
| Enter / Space      | 激活当前            | 激活当前            | 激活链接      |
| Escape             | —                   | —                   | 折叠 Sidebar  |

**Roving tabindex**：当前激活的 tab `tabIndex=0`，其余 `-1`。方向键移动焦点和激活同步（automatic activation）或分离（manual activation，需 Enter 确认）。

## ARIA

| 元素  | role       | 属性                              |
| ----- | ---------- | --------------------------------- |
| 容器  | `tablist`  | `aria-orientation`                |
| Tab   | `tab`      | `aria-selected`, `aria-controls`  |
| Panel | `tabpanel` | `aria-labelledby`, `tabIndex={0}` |

## 动效

| 元素            | 动画             | Token                                           |
| --------------- | ---------------- | ----------------------------------------------- |
| 活动指示器      | 位移 spring      | `INDICATOR_SPRING` (bounce 0.08, duration 0.34) |
| 面板切换        | opacity + 微位移 | `--uk-duration-base` (160ms)                    |
| 侧边栏展开/折叠 | width + spring   | `--uk-duration-overlay` (240ms)                 |

**规则**：指示器用 Motion `layoutId` 实现共享布局，在 tab 之间平滑移动。不要用 CSS `transform: translateX` 硬编码位置，因为 tab 宽度不固定。

## CSS Token 引用

```css
.tabs-list {
  display: flex;
  gap: var(--uk-space-1);
  border-bottom: 1px solid var(--uk-border);
}

.tabs-tab {
  padding: var(--uk-space-2) var(--uk-space-4);
  color: var(--uk-text-muted);
  font-size: var(--uk-text-sm);
}

.tabs-tab[aria-selected="true"] {
  color: var(--uk-text);
}

.tabs-tab:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--uk-focus-ring);
}
```
