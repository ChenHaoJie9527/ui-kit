# Image Viewer 可行性分析

> 参考来源：https://beui.dev/components/motion/image-viewer（morphing-lightbox）
> 结论：**高可行性**。所有核心能力（Motion 共享布局、模态焦点管理、可控状态、图标、Portal）在本仓库均已就绪，无新增运行时依赖。

## 1. 参考组件是什么

beui 的 Image Viewer（原名 morphing-lightbox）是一个**可组合的图片画廊 + 形态变换灯箱**：

- 缩略图网格点击后，图片从缩略图位置**共享布局形变**到全屏灯箱；
- 灯箱内支持左右切换（滑动/箭头/触控滑动手势）、计数器、说明文字、关闭；
- 放大镜（2x）+ 拖拽平移 + 键盘平移；
- 受控/非受控选中态、i18n 文案、加载失败占位、reduced-motion 全量降级。

### 公开 API（参考）

| 部件                                        | 职责                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `ImageViewer`                               | Root：images 数据、受控/非受控选中值、label、renderCaption、LayoutGroup |
| `ImageViewerGallery`                        | 网格容器（section + aria-label）                                        |
| `ImageViewerThumbnail`                      | 单图缩略图（motion.button，含 layoutId 图片）                           |
| `ImageViewerContent`                        | 灯箱：Portal、模态作用域、滑动/缩放/手势、header/footer 插槽            |
| `ImageViewerCounter` / `ImageViewerCaption` | aria-live 计数器 / 说明                                                 |
| `ImageViewerClose` / `Previous` / `Next`    | 控制按钮                                                                |
| `useImageViewer()`                          | 自定义画廊/自定义控件的共享状态钩子                                     |

## 2. 与本仓库技术栈逐项核对

| 需求                               | seam-react 现状                                                                                           | 结论            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------- |
| 形态变换（shared layout）          | `motion/react@^14.4.0` 已是直接依赖，Dialog/Drawer 已用 AnimatePresence + MotionConfig                    | ✅ 无需新增依赖 |
| 模态：焦点圈闭 / 滚动锁            | `seam-hooks` 提供 `useFocusTrap`、`useLockBodyScroll`、`useControllableState`                             | ✅ 直接复用     |
| 图标（X / Chevron / Plus / Minus） | `lucide-animated` 已含全部所需图标（已核实）                                                              | ✅              |
| Portal + SSR 安全                  | DialogContent 已有 `useSyncExternalStore` 客户端快照模式                                                  | ✅ 照搬模式     |
| 过渡/弹簧令牌                      | `packages/ui/src/motion.ts` 已有 `OVERLAY_SPRING`、`EASE_OUT`、`EASE_DRAWER`、`REDUCED_MOTION_TRANSITION` | ✅              |
| CSS 令牌体系                       | `--uk-*` tokens + 组件级 css + generate-styles.mjs 自动聚合                                               | ✅              |
| 测试/文档/发布                     | vitest + testing-library、apps/docs 页面 + Demo/PropsTable、Changesets                                    | ✅              |

## 3. 关键设计决策（需用户拍板）

### 决策 A：模态地基 —— 原生 `<dialog>` vs Portal div + inert

- **beui 方案**：`createPortal` 到 body 的 div，用 `inertOwners` 计数把兄弟节点置 inert + 手写焦点圈闭 + 滚轮锁。
- **本仓库契约**（DESIGN.md）："Dialogs continue to use the native `<dialog>` foundation unless a recorded decision changes that contract"。Dialog/Drawer 已沉淀"原生 dialog + AnimatePresence 退出 + useFocusTrap + useLockBodyScroll"的成熟配方。
- **建议**：沿用本仓库配方（原生 `<dialog>` + `showModal` + aria-label）。共享布局的 layoutId 跨 Portal 依然生效（LayoutGroup 经 React context 流动，与 DOM 挂载点无关），需要原型验证一次。

### 决策 B：API 形态

- beui 是**扁平导出**（`ImageViewerThumbnail` 等 9 个顶层组件）。
- 本仓库 Dialog 是**命名空间复合 API**（`Dialog.Root / Trigger / Content ...`），Carousel 是分文件导出。
- **建议**：按 Dialog 惯例做 `ImageViewer`（Root）+ `ImageViewer.Gallery / Thumbnail / Content / Counter / Caption / Close / Previous / Next` 复合部件；Root 提供便捷 facade（`<ImageViewer images={...}>` 无 children 时渲染默认画廊+灯箱），与 beui 的"children 可选"对齐。

### 决策 C：i18n

- beui 有 LocaleProvider 体系；本仓库没有。**建议**：只加 `labels?: Partial<ImageViewerLabels>` 单组件覆盖，内置中文默认文案（与仓库现有组件语言一致）；不引入 Provider，等第二个组件需要时再沉淀。

### 决策 D：图片尺寸

- beui 强制 `width/height`（用于保持宽高比做形变）。**建议**：必填保留（形变的保真前提），CSS 层面用 `aspect-ratio` + `width: min(100%, ...)` 计算；缺尺寸时回退为 `object-contain` 无固定比例。

### 决策 E：形态运动的取舍

- **保留**：缩略图 → 灯箱的共享布局形变（这是该组件的核心体验，对应 DESIGN.md "shared layout / measured origin" 用例）。
- **保留**：图片切换的横向滑入滑出（x 通道 tween 0.28s，EASE_DRAWER）。
- **保留**：缩放 2x + 拖拽平移（drag + 约束，spring 重定目标）。
- **降级**：reduced-motion 下全部换成短透明度交叉淡化，layoutId 关闭。
- 新增弹簧值（如 SPRING_LAYOUT 变体）按 DESIGN.md 规则**先记在实现旁**，出现第二次使用再折回 `motion.ts`。

## 4. Motion Gate（按 DESIGN.md 四问）

| 动画                  | 频率      | 目的         | 功能               | 成本                           |
| --------------------- | --------- | ------------ | ------------------ | ------------------------------ |
| 缩略图按下 scale 0.98 | 数十次/天 | 反馈         | 按压即时反馈       | SPRING_PRESS 级，无成本        |
| 形变开/关（layoutId） | 偶发      | 空间一致性   | 说明来源/去向      | 共享布局是连接来源的最便宜实现 |
| 图片切换滑动          | 偶发      | 状态指示     | 说明到了哪张、方向 | 0.28s tween，无入场延迟        |
| 遮罩淡入淡出          | 偶发      | 防止突兀变化 | 建立上下文         | 0.18s scrim，退出可略长于面板  |
| 缩放/平移             | 偶发      | 状态指示     | 放大是显式操作     | 临界阻尼弹簧，可中断           |

## 5. 风险与对策

| 风险                                            | 对策                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| layoutId 跨 Portal + AnimatePresence 的形变时序 | 先做隔离原型（决策 A 验证点）；灯箱 frame 常驻挂载、只换图片层（beui 做法）                        |
| 大网格（几十张图）全部挂 layoutId 的测量开销    | 默认只在选中缩略图 + 灯箱 frame 上挂 layoutId（beui 全部挂，需实测权衡）                           |
| 嵌套弹层（灯箱内开 Dialog）                     | 原生 dialog + useFocusTrap 的既有嵌套行为；e2e 覆盖                                                |
| 触控：滑动手势 vs 缩放拖拽冲突                  | zoom 时 `touch-action: none` 并禁用 swipe；未 zoom 时 swipe 阈值 50px + 横向主导 1.5x（beui 参数） |
| 未知宽高比图片                                  | 尺寸必填 + 无尺寸回退路径（决策 D）                                                                |
| 懒加载大图首帧闪烁                              | 缩略图 `loading="lazy"`；打开时灯箱图 eager                                                        |
| SSR 首屏                                        | 复用 DialogContent 的 isClient 快照模式                                                            |
| 焦点从灯箱返回缩略图                            | useFocusTrap 的 returnFocus（记录打开前 activeElement）                                            |

## 6. 复用清单 vs 新增清单

**复用**：`useFocusTrap` / `useLockBodyScroll` / `useControllableState`（seam-hooks）；`OVERLAY_SPRING` / `EASE_DRAWER` / `EASE_OUT` / `REDUCED_MOTION_TRANSITION`（motion.ts）；lucide-animated 图标；DialogContent 的 Portal/SSR 模式；`cx` 工具；`--uk-*` 令牌。

**新增**：`packages/ui/src/ImageViewer/`（部件 + context + css + index）；`image-viewer.css`（遮罩、控制按钮、frame 布局、focus-visible 样式）；`motion.ts` 若形变弹簧出现第二次使用；docs 页面 + demos + 路由；测试；Changeset。

## 7. 结论

无阻塞项。beui 实现约 600 行核心逻辑，本仓库具备同等甚至更好的基础设施（原生 dialog 焦点管理比手写 inert 更稳）。工作量集中在**形态运动与触控/缩放的状态交互**，这两块都需要原型验证。按 AGENTS.md 流程：先定决策 → 原型（如果引入新交互语言）→ 实现 → 验证 → 发布。
