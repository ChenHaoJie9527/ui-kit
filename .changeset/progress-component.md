---
"seam-react": patch
---

新增 Progress 组件：progressbar 语义根组件 + Progress.Label / Progress.Value / Progress.Description 组合式部件（平铺别名 ProgressLabel / ProgressValue / ProgressDescription 等价）。interactive 模式切换为原生 input type=range（slider 语义），支持点击轨道跳转、拖拽圆点连续调整与键盘（方向键 / PageUp / PageDown / Home / End），填充与圆点线性过渡，拖拽时关闭过渡直接跟手；支持受控 / 非受控（defaultValue / onValueChange）、min / max / step / disabled。只读模式 value 为 null 时渲染不确定进度动画（reduced-motion 下降级为透明度脉动），Progress.Description 提供 role=status 的动态状态文案区域。
