# Form Control Pattern

## 适用组件

Input, CheckBox, Switch, Select, Radio（未来）

## 复用 primitives

| 需求             | 来源                                     |
| ---------------- | ---------------------------------------- |
| 受控/非受控状态  | `useControllableState` from `seam-hooks` |
| 事件回调稳定引用 | `useEventCallback` from `seam-hooks`     |
| ID 生成          | `useId` from `react`                     |
| Spring 动效      | `UI_SPRING` from `motion.ts`             |
| Reduced motion   | `useReducedMotion` from `motion/react`   |

## 核心原则

**保留原生元素语义**。底层使用原生 `<input>` / `<select>` / `<textarea>`，让表单提交、键盘操作和屏幕阅读器语义"免费"获得。视觉部分由包裹的 `<span>` 承担。

```tsx
// Switch 的实际结构
<span className="switch">
  <input type="checkbox" role="switch" ... />  ← 原生语义
  <span className="track" aria-hidden="true">  ← 视觉层
    <span className="thumb" />
  </span>
  <label>{children}</label>
</span>
```

## 受控/非受控

```tsx
const [current, setCurrent] = useControllableState({
  value: checked,
  defaultValue: defaultChecked,
  onChange: onCheckedChange,
});
```

## 键盘行为

| 组件     | 键盘操作                                     | 说明           |
| -------- | -------------------------------------------- | -------------- |
| Input    | 原生 `<input>`                               | 无需额外处理   |
| CheckBox | 原生 `<input type="checkbox">`               | Space 切换     |
| Switch   | 原生 `<input type="checkbox" role="switch">` | Space 切换     |
| Select   | 自定义列表框                                 | 略复杂，见下方 |

### Select 的键盘模式（参考现有实现）

- roving tabindex：活动选项 `tabIndex=0`，其余 `-1`
- Arrow Up/Down：在选项间移动活动索引
- Enter/Space：选择当前活动项
- Escape：关闭下拉
- Home/End：跳到第一个/最后一个选项
- 字符输入：跳到匹配项

## 状态模型

| 状态          | 视觉       | CSS                                                                |
| ------------- | ---------- | ------------------------------------------------------------------ |
| default       | 无特殊样式 | `.checkbox`                                                        |
| hover         | 边框加深   | `:hover`                                                           |
| focus-visible | focus ring | `:focus-visible + .track { box-shadow: ... var(--uk-focus-ring) }` |
| checked       | 选中样式   | `:checked + .track`                                                |
| disabled      | 降低透明度 | `:disabled`                                                        |
| invalid       | 红色边框   | `:invalid` 或 `[aria-invalid="true"]`                              |

## ARIA

| 组件     | role          | 附加属性                                                  |
| -------- | ------------- | --------------------------------------------------------- |
| CheckBox | 原生 checkbox | `aria-describedby` 关联描述                               |
| Switch   | `switch`      | `aria-checked`, `aria-describedby`                        |
| Select   | `listbox`     | `aria-activedescendant`, `aria-expanded`, `aria-required` |
| Option   | `option`      | `aria-selected`                                           |

## 动效

| 组件          | 动画                  | Token                        |
| ------------- | --------------------- | ---------------------------- |
| Switch thumb  | 位移 + spring         | `UI_SPRING` (duration 0.3)   |
| CheckBox 对勾 | SVG stroke-dashoffset | `--uk-duration-fast` (120ms) |
| Select 下拉   | scale + opacity       | `SELECT_SUBMENU_TRANSITION`  |
| Select tag    | layout shift          | `TAG_TRANSITION`             |

**规则**：按压反馈用 `scale: 0.97`（`--uk-scale-press`），120ms 内完成。

## CSS Token 引用

```css
.form-control-track {
  border: 1px solid var(--uk-border);
  border-radius: var(--uk-radius-sm);
  background: var(--uk-surface);
  transition: var(--uk-transition);
}

.form-control-track:hover {
  border-color: var(--uk-border-strong);
}

input:focus-visible + .form-control-track {
  box-shadow: 0 0 0 2px var(--uk-focus-ring);
}

input:checked + .form-control-track {
  background: var(--uk-primary-solid);
  border-color: var(--uk-primary-solid);
}
```
