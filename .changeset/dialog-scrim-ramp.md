---
"seam-react": patch
---

调整 Dialog 遮罩的进入过渡：改用 overlay 时长与新增的 `--uk-ease-scrim` 曲线，遮罩不再在头两帧内跳到位；退出一致保持更短的退出时长。`DESIGN.md` 补充该共享曲线与上下文层建立时间的说明。
