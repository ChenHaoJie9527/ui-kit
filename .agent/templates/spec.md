# {Component} Spec

## Purpose

{一句话说明这个组件解决什么问题}

## Pattern

{overlay | form-control | navigation | inline}

继承 `{pattern}` 模式的所有键盘、ARIA 和动效规则。以下仅记录该组件的差异化配置：

## States

- default
- hover
- focus-visible
- {active/checked/selected}
- disabled
- {loading/invalid/empty/overflow}

## Public API

```tsx
// 从 Root/Trigger/Content 或单组件中选择组合模式
interface {Component}Props {
  // 每个属性写清楚类型和含义
}
```

## Keyboard

继承 `{pattern}` 模式的键盘行为，以下仅记录差异：

- {如果无差异，写"无差异"}

## Accessibility

继承 `{pattern}` 模式的 ARIA 模式，以下仅记录差异：

- role: {从模式中选择}
- {其他 ARIA 属性}

## Failure States

- {当 X 发生时，组件应该 Y}

## Motion Gate

| 动画     | 频率                               | 目的       | 实现              | Token      |
| -------- | ---------------------------------- | ---------- | ----------------- | ---------- |
| {动画名} | {高频→无动画/中频→CSS/低频→Motion} | {具体目的} | {CSS/Motion/none} | {token 名} |

## Compatibility

- {新增组件 | 增强已有 API | breaking change}
- {影响范围}

## Test Plan

- [ ] {测试 1：默认渲染和基本交互}
- [ ] {测试 2：键盘行为}
- [ ] {测试 3：ARIA 属性}
- [ ] {测试 4：受控/非受控切换}
- [ ] {测试 5：disabled 状态}
- [ ] {测试 6：reduced motion}
- [ ] {测试 7：长内容/溢出}

## Open Questions

- {需要人工确认的设计决策，如果没有则删除此节}
