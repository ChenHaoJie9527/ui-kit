---
"seam-react": patch
---

修复 ImageViewer 多实例场景下灯箱弹出原点错乱：页面存在多个 ImageViewer 且共用相同图片 src 时，灯箱会匹配到其他实例的缩略图、从错误位置弹出。改为实例级缩略图注册表（Thumbnail 挂载时按 imageId 注册、卸载时注销），灯箱只从当前实例自己的缩略图位置浮出 / 缩回。
