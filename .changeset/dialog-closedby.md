---
"seam-react": patch
---

修复 Dialog 的原生 light dismiss：`closedby` 现在跟随 `closeOnEscape` / `closeOnBackdropClick` —— 关闭 `closeOnBackdropClick` 时保留 Escape 关闭，关闭 `closeOnEscape` 时不再由原生取消。
