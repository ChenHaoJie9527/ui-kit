---
"seam-react": minor
---

新增 ImageViewer 图片画廊与形态变换灯箱组件：缩略图保持原位，点击后复制图从缩略图矩形（位置 + 尺寸）浮出到全屏，支持方向键 / 触控滑动切换、计数与说明、2x 缩放与拖拽 / 键盘平移、受控与非受控选中、加载失败占位与 reduced-motion 降级。关闭时复制图以 width/height 动画保持比例缩回占位图尺寸（无变形、精确到位）后淡出消失。模态语义由原生 `<dialog>` 承载，焦点圈闭与滚动锁复用 seam-hooks；组合式 API 提供 Gallery / Thumbnail / Content / Counter / Caption / Close / Previous / Next 部件与 `useImageViewer()` 钩子。
