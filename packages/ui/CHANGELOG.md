# seam-react

## 0.11.0

### Minor Changes

- 74c030f: 调整 Toast 队列语义：showToast 每次调用都会新增通知并返回新 id；更新已有通知请使用
  updateToast。

## 0.10.0

### Minor Changes

- 8c1fa84: 新增 Toast 组件：提供 useToast 状态队列、六向布局栈、自动关闭、悬停暂停计时、Lucide
  状态图标、操作和拖拽关闭。

### Patch Changes

- 1dea728: 修复单选 Select 重开时未自动展开已选层级叶子所属子面板的问题。

## 0.9.1

### Patch Changes

- 7ea48d0: 为 Select 增加 loading 外部加载状态与 loadingText；加载期间触发器进入禁用态、显示 spinner、暴露 aria-busy 并阻止交互。
- 7ea48d0: 为 Select 增加递归 children 层级选项；子菜单从父级右侧平滑延伸，相邻父级切换时复用同一面板。只有叶子选项触发选择。

## 0.9.0

### Minor Changes

- 108ee51: 为 Select 增加 multiple 多选与 clear 一键清空，支持 Tag 选择与移除、键盘连续选择，并保留键盘搜索、弹出层定位与空态。

## 0.8.0

### Minor Changes

- d06dbcf: 新增 Select 组件，支持受控 / 非受控单选、键盘搜索、弹出层定位与空态。

## 0.7.0

### Minor Changes

- 54a04d2: 新增 CheckBox 组件，支持受控/非受控状态、SVG 描边对勾和按压反馈。
- 947a1e3: Marquee 新增 paused、items 和 onItemClick，支持手动暂停/恢复滚动，并在 item 激活时返回当前项元数据。

### Patch Changes

- Updated dependencies [a0168fc]
  - seam-hooks@0.3.0

## 0.6.0

### Minor Changes

- b56f827: 新增 Marquee 组件，支持水平与垂直无缝滚动、悬停暂停、渐变边缘和 reduced-motion 降级。

## 0.5.1

### Patch Changes

- Updated dependencies [1a04d9e]
  - seam-hooks@0.2.0

## 0.5.0

### Minor Changes

- 26b6a27: Add mutually exclusive rail and full-row hover states, apply the selected mode to both hover and active items, morph the shared background continuously from Group headers into child items, add a configurable Group gap, and add controlled or uncontrolled collapsible groups with accessible disclosure behavior.

## 0.4.0

### Minor Changes

- c546af2: Add an accessible grouped Sidebar with native link semantics, independent active and mouse-preview indicators that move continuously between items, coarse-pointer hit areas, and reduced-motion support.

## 0.3.0

### Minor Changes

- 8071fbd: Add an accessible, composable Tooltip with delayed hover and focus behavior, viewport-aware positioning, touch support, reduced-motion-aware presence, and grouped Tooltip surfaces that move between related triggers.

## 0.2.0

### Minor Changes

- 4c5542d: Adopt the Fluid motion system across Button, Input, Switch, Tabs, and Dialog. Add Motion-based spring feedback, shared tab indicators, animated overlay exits, and a semantic Dialog composition API while preserving the existing convenience API and accessibility.
- 8a69d89: Remove the unfinished Toast component, public exports, styles, tests, and documentation while the notification interaction model is redesigned separately.
