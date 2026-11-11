---
"seam-react": patch
---

Carousel.Dots 分页点升级为连续拉伸 pill：当前项跟随滚动在 dot 之间伸缩，loop 跨端时跨过全部 dot 回收；reduced motion 下 pill 停在当前项。另刷新全部组件视觉基线，完整 e2e 恢复全绿。
