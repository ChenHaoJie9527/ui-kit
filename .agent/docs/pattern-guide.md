# Pattern Guide: 如何为新组件选择和扩展模式

## 选择流程

1. 看组件的**核心交互**是什么：
   - 弹出一个覆盖层 → `overlay`
   - 用户输入数据 → `form-control`
   - 在多个视图/页面间切换 → `navigation`
   - 触发一个动作或显示一个状态 → `inline`

2. 如果组件跨多个模式（如 Select 同时是 form-control + overlay），以**最复杂的模式**为主，另一个为辅助。

3. 差异化配置写在 spec.md 的对应节，不要在代码里发明新模式。

## 扩展模式

当新组件的行为无法用现有模式覆盖时：

1. 在 spec.md 的 Open Questions 节写明需要什么新行为
2. 等待人工确认
3. 将确认后的新行为写回对应的 pattern 文件
4. 下次 Agent 开发类似组件时自动遵循

## 当前模式覆盖

| 模式         | 已覆盖组件                           | 共享的 hooks                                  |
| ------------ | ------------------------------------ | --------------------------------------------- |
| overlay      | Dialog, Tooltip, Select(面板), Toast | useFocusTrap, useLockBodyScroll, useClickAway |
| form-control | Input, CheckBox, Switch, Select      | useControllableState                          |
| navigation   | Tabs, Sidebar                        | useControllableState, INDICATOR_SPRING        |
| inline       | Button, Badge, Marquee               | cx                                            |
