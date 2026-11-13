# Image Viewer 需求文档

> 组件名：`ImageViewer`（包：`seam-react`，目录 `packages/ui/src/ImageViewer/`）
> 参考：https://beui.dev/components/motion/image-viewer（morphing-lightbox），按本仓库 DESIGN.md / AGENTS.md 改编
> 状态：**待用户确认决策 A–E 后进入实现**

## 1. 语义与最近原生元素

- **目的**：图片画廊 + 灯箱。缩略图点击后以共享布局形变展开为全屏查看器，支持浏览、缩放、平移、关闭。
- **最近原生语义**：缩略图 = `<button>`（open 语义）；灯箱 = **原生 `<dialog>`**（`aria-modal` 模态表面，与 Dialog 契约一致）；网格 = `<section aria-label>`；计数器/说明 = `aria-live="polite"` 的 `span/div`。

## 2. 状态模型

| 状态              | 说明                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `value: string    | null`                                                               | 当前选中图片 id（null = 关闭），受控（`value`+`onValueChange`）或非受控（`defaultValue`） |
| `zoom: boolean`   | 当前图片是否 2x 放大                                                |
| `pan: {x, y}`     | 放大时的平移范围（由 ResizeObserver 实测 frame 与图片 2x 差值算出） |
| `failed: boolean` | 当前图片加载失败                                                    |
| 滑动会话          | 记录 session（id+src）、进入方向、当前位置，用于切换动画方向推导    |

约束：`images` 的 id 必须唯一、`width/height` 必须为正数（非法即 throw，与 beui 一致）；`value` 指向已移除的 id 时自动回落到 `null`（防止重加图片复活旧会话）。

## 3. 公开 API

```ts
interface ImageViewerImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number; // 必填，形变保真前提
  caption?: string;
}

interface ImageViewerProps {
  images: ImageViewerImage[];
  value?: string | null; // 受控
  defaultValue?: string | null; // 默认 null
  onValueChange?: (id: string | null) => void;
  label?: string; // 画廊/灯箱可访问名称
  className?: string; // 默认画廊布局的类
  thumbnailClassName?: string;
  renderCaption?: (image: ImageViewerImage) => ReactNode;
  children?: ReactNode; // 提供自定义画廊/灯箱组合时省略默认布局
  labels?: Partial<ImageViewerLabels>; // 中文默认文案覆盖
}

interface ImageViewerLabels {
  label: string;
  open: string;
  counter: string;
  close: string;
  previous: string;
  next: string;
  loadError: string;
  zoomIn: string;
  zoomOut: string;
  panHelp: string;
}
```

### 复合部件（命名空间，仿 Dialog）

- `ImageViewer`（Root：上下文 + LayoutGroup + 便捷 facade）
- `ImageViewer.Gallery`（默认 `grid` 网格容器）
- `ImageViewer.Thumbnail`（`imageId`、`imageClassName`、透传 button 属性）
- `ImageViewer.Content`（`className`、`header?`、`children?` 自定义 footer）
- `ImageViewer.Counter` / `ImageViewer.Caption` / `ImageViewer.Close` / `ImageViewer.Previous` / `ImageViewer.Next`
- `useImageViewer()`：返回 `images/value/image/index/hasPrevious/hasNext/select/close/previous/next`

## 4. 键盘与焦点行为

| 操作                   | 行为                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| 打开                   | 点击缩略图（`aria-expanded` 同步）；焦点落到灯箱内第一个可聚焦控件         |
| Esc                    | 关闭并返回打开前的缩略图                                                   |
| Tab / Shift+Tab        | 灯箱内循环圈闭（useFocusTrap）                                             |
| ← / →                  | 切换上一张/下一张（不在输入框/编辑域内时）                                 |
| 缩放按钮聚焦后 ←/→/↑/↓ | 每次平移 40px，越界钳制                                                    |
| 放大时拖拽             | 指针平移，边界钳制，弹性 0.08，无动量                                      |
| 打开期间               | 兄弟节点 inert（原生 dialog 顶层机制）+ 背景滚动锁定                       |
| 退出期间               | 退出动画播放时面板立即 inert，指针/焦点/AT 树即刻释放（PresenceGate 模式） |

## 5. 响应式与内容边界

- 灯箱 frame：`aspect-ratio: width/height`，宽度 `min(100%, (100dvh - 160px) * 宽高比)`，垂直/水平居中，`object-contain`。
- 移动端：frame 占满 `inset-3/6` 安全边距；控制按钮 `size-10`（44px 触控目标）；滑动手势替代箭头。
- 长说明文字：`min-w-0` + 居中截断不溢出；超长网格：缩略图懒加载。
- 空图/失败：`role="status"` 占位 + `loadError` 文案。

## 6. 运动规格（频率 → 驱动器，见可行性分析第 4 节）

| 动画           | 值                                                    | 驱动器               |
| -------------- | ----------------------------------------------------- | -------------------- |
| 缩略图按压     | scale 0.98，SPRING_PRESS 级                           | Motion（whileTap）   |
| 形变开/关      | layoutId 共享布局，弹簧（首次值记实现旁）             | Motion shared layout |
| 图片切换       | x 通道 tween 0.28s，EASE_DRAWER（进入/退出方向相反）  | Motion variants      |
| 遮罩           | opacity 0→1 / 1→0，0.18s EASE_OUT                     | Motion               |
| 缩放           | scale 2↔1，可中断弹簧                                 | Motion               |
| reduced-motion | 全部降级为 ≤0.1s 透明度交叉淡化；关闭 layoutId 与滑动 | useReducedMotion     |

## 7. 无障碍

- 缩略图：`aria-label="打开 {alt}"`、`aria-haspopup="dialog"`、`aria-expanded`。
- 灯箱：原生 dialog + `aria-modal` + `aria-label`；`focus-visible` 圆环（`--uk-ring` 令牌）始终可见，不依赖 hover。
- 计数器/说明：`aria-live="polite"`。
- 缩放按钮：`aria-pressed` + `aria-describedby`（panHelp 提示为 `sr-only`）。
- 图标按钮均有可访问名称；加载失败用 `role="status"`。
- 触控目标 ≥ 44px；hover 动效按能力门控。

## 8. 测试用例

**单测（vitest + testing-library）**

- 受控/非受控切换：value 变化、onValueChange 回调、defaultValue 初始值；
- id 唯一性与正尺寸校验 throw；已移除 id 回落 null；
- 键盘：Esc 关闭、←/→ 切换（含边界禁用 Previous/Next）、Tab 圈闭、缩放态方向键平移钳制；
- reduced-motion（`prefers-reduced-motion` mock）：无 layoutId、切换为交叉淡化；
- 加载失败显示 `role="status"`；
- 自定义 children 组合与 useImageViewer 钩子。

**e2e（Playwright + axe）**

- 打开/关闭形变、焦点进入与返回、Esc；
- 触控滑动切换（阈值 50px / 横向主导）；
- 缩放 + 拖拽平移越界钳制；
- 无障碍扫描（axe）无违规。

## 9. 交付清单（按 CONTRIBUTING.md / AGENTS.md）

1. `packages/ui/src/ImageViewer/`：`ImageViewer.tsx`（Root + facade）、`ImageViewerGallery.tsx`、`ImageViewerThumbnail.tsx`、`ImageViewerContent.tsx`（含 LightboxFrame：滑动/缩放/手势）、`ImageViewerCounter.tsx`、`ImageViewerCaption.tsx`、`ImageViewerControls.tsx`（Close/Previous/Next）、`image-viewer-context.ts`、`image-viewer.css`、`index.ts`；
2. `packages/ui/src/index.ts` 导出全部部件 + 类型 + `useImageViewer`；
3. `packages/ui/src/styles.css` 注册 `@import`（generate-styles.mjs 自动聚合）；
4. `packages/ui/src/__tests__/ImageViewer.test.tsx`；
5. `apps/docs/src/pages/image-viewer.tsx`（Demo + PropsTable + 键盘/无障碍说明）+ `apps/docs/src/routes.tsx` 注册；
6. Changeset（`feat(ui): 新增 ImageViewer 图片画廊灯箱组件`，minor）；
7. 本机 `pnpm check` 通过 + 相关包构建通过。

## 10. 待确认问题

1. **决策 A**：灯箱地基用原生 `<dialog>`（推荐，符合仓库契约）还是 beui 的 inert-sibling 方案？
2. **决策 B**：命名空间复合 API（`ImageViewer.Thumbnail`，推荐）还是扁平导出（`ImageViewerThumbnail`）？
3. **决策 C**：labels 默认文案用中文还是英文？
4. **决策 D**：`width/height` 是否必填？（推荐必填，提供无尺寸回退）
5. **决策 E**：缩略图→灯箱形变是否保留？还是先做纯淡入版本（少一个原型变量）？
6. **范围**：是否包含缩放+平移（beui 有）？可拆为第一阶段交付。
7. 是否需要原型先行（按 AGENTS.md 第 4 步，若引入新交互语言需 3 个方向）——本组件沿用"模态 + 共享布局"既有语言，倾向于**不独立原型**，直接进实现。

## 11. 已确认决策与实现记录（2026-11 实现轮）

用户确认全部推荐方案：原生 `<dialog>` 地基、命名空间复合 API、中文文案、尺寸必填、保留形变+缩放、不做独立原型。

### 实现后评审修复的三个视觉缺陷

**1. 图片切换后右侧/边缘残留旧图痕迹（不同尺寸图片必现）**

- 根因：frame 的 image-box 按当前图片宽高比设置 `width: min(100%, …)`，切换时 layoutId 投影用弹簧把 box 从旧尺寸长到新尺寸（如 436→852px）；滑动图层的退出偏移是"自身宽度的 100%"，box 生长使旧图右缘在视口内滞留约 240ms。
- 修复：frame 改为**固定尺寸**（`inset: 0` 填充视口，图片 `object-contain`），不再按图片比例生长；切换时 box 恒定，滑动百分比偏移稳定，旧图准时离场。

**2. 关闭瞬间消失，而非平滑缩回缩略图**

- 根因一：layer 内部 `if (!image) return <></>` —— 关闭时 AnimatePresence 保留层，但层重新渲染读到 live context 的 `image=undefined`，把 dialog 内容同步清空，退出动画跑在空壳上（t=0 即卸载）。修复：冻结最后一张图（`frozenImage` 派生状态），退出期间内容保持。
- 根因二：layoutId 元素的投影 `relegate()` 让 AnimatePresence 等投影 `animationComplete`（约 0.36s 弹簧），层保持挂载——这是**特性而非缺陷**：panel 退出淡出（0.16s）后 dialog 变为透明，缩略图反向形变透过透明层可见，用户看到图片平滑缩回网格后才卸载。
- 修复：panel 退出动画改为透明度淡出（非 reduce 也执行），保持"先淡出表面、投影交接后卸载"的时序。

**3. 放大后缩小瞬间复位**

- 根因：缩小按钮里 `x.set(0); y.set(0)` 对拖拽后的偏移是瞬时复位。
- 修复：改用 `animate(x, 0, IMAGE_VIEWER_LAYOUT_SPRING)` 平滑回中；scale 2→1 本身已是弹簧动画。

### 弹出方向与关闭尺寸调整（2026-11 二轮复评，三轮定稿）

三轮定稿交互：**打开与占位图关联——从哪里点开就从哪里浮出；关闭回到打开
的地方（缩略图矩形：位置 + 尺寸），缩到与占位图完全一致后淡出消失**。

- 打开：box `transform-origin: 0 0`，起点 = 缩略图矩形（translate 到缩略图
  位置 + scale 到占位图尺寸比例），弹簧放大到全屏 + 0.18s 淡入。
- 关闭：box 用 tween（`IMAGE_VIEWER_CLOSE_SHRINK`，0.32s ease-out）缩回缩略图
  矩形，终点渲染矩形精确等于占位图（tween 避免弹簧回弹越界）；面板延迟淡出
  （0.18s 后 0.14s）与缩小同步收尾，到位后整体淡出消失。
- 逐帧验证（第 2 张缩略图）：打开起点 rect [524,775,189,126] ≈ 缩略图
  [527,779,184,123]；关闭终点 rect [527,779,184,123] **与缩略图完全一致**；
  面板淡出与缩小同步（320ms 卸载）。单测与 98 项 e2e 全绿。

### 关闭尺寸不符问题修复（2026-11 四轮复评）

用户截图反馈：关闭时图片缩小的尺寸与占位尺寸明显不符——根因是此前用
**非均匀 scale（scaleX ≠ scaleY）**驱动 box 形变，图片随 box 被拉伸变形，
显示尺寸自然对不上占位图。

修复：改用 **width / height（布局属性）动画**替代 transform scale——
box 宽高连续变化时，内部图片 `object-contain` 每帧重排、**全程保持比例
不变形**；终点 box 与图片均为缩略图尺寸，图片正好等于占位图里的样子。
逐帧验证（竖图）：关闭终点 box=img=[331,726,184,230]，与缩略图 rect
完全一致。

### 实现原理修正（2026-11 复评）：缩略图保持原位，复制图浮出

BeUI 的实际效果是：**点击图片后缩略图仍留在网格原位，浮起来的是复制的一份**
（复制图做大小动画），关闭时复制图缩小平滑消失——占位图不会变成空白。

初版实现把 `layoutId` 直接放在缩略图 img 上，Motion 会把非主导（非 lead）的
共享布局元素隐藏，导致灯箱打开期间缩略图位置变空白。复评后改为：

- 缩略图 img 改为**普通静态图**（无 layoutId），始终留在网格；
- 灯箱 frame（image-box）用 **x / y / scaleX / scaleY 运动值**做手动测量形变：
  打开时先落位到缩略图矩形（`queueMicrotask` 延迟测量，避开父层 showModal
  之前 dialog 为 display:none 导致测量为 0 的问题），再放大到全屏；关闭时
  缩回缩略图矩形，面板延迟淡出（0.3s 后 0.1s）承载层卸载；
- 移除了不再需要的 LayoutGroup / groupId。

验证：打开期间缩略图 `visibility: visible`、transform 不变、相对画廊位置稳定；
box transform 采样 0.2→1（浮出）、1→0.19×0.35+translate（缩回，精确落在
缩略图上）；切换 / 缩放 / 关闭行为不变，单测与 98 项 e2e 全绿。
