---
"seam-hooks": patch
"seam-react": patch
---

修复声明产物在 node16/nodenext 下无法解析的问题（issue #83）：tsrs 在 Bundler 解析模式下把源码的无后缀相对导入原样输出到 `.d.ts`，导致严格解析的消费者把所有导出类型当成 `any`（skipLibCheck 下静默失效）。改为逐入口打包声明（rollup-plugin-dts），产物自包含、无相对导入；构建内置自检 + `scripts/consumer-smoke` 提供 nodenext 消费方回归检查。
