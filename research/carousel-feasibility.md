# Carousel 组件可行性报告

> 调研日期：2026-11-11
> 结论对象：`seam-react` 新增 `Carousel`
> 参考实现：Animate UI Carousel、shadcn/ui Carousel、Embla Carousel 8.6.0
> 关联文档：`DESIGN.md`、`AGENTS.md`、`research/carousel-requirements.md`
> 决策状态：2026-11-11 已确认 M1 范围 —— 基础轮播先行，`scale`、Dots、Counter 留在 M2；命名采用仓库风格，`align: start`，依赖 exact pin + externalize，v1 支持 RTL。M1 已实现，验证记录见 `research/carousel-requirements.md` 第 17 节。

## 预览范围与方法

- 阅读 Animate UI Carousel 官方文档，并检查 npm 包 `@animate-ui/react@2.4.3` 的公开产物，确认其行为与实现边界。
- 阅读 shadcn/ui Carousel 源码与 MIT 许可证，确认基础结构与已知问题。
- 阅读 Embla Carousel v8 文档、v8 Options/Methods/Events 页面，并检查 `embla-carousel@8.6.0`、`embla-carousel-react@8.6.0` 的 npm 产物、peer 依赖和 ESM gzip 体积。
- 检查本仓库的 `Tabs`、`Marquee`、`Dialog`、`Drawer`、`motion.ts`、token、构建配置、vitest/Playwright 配置与文档站注册方式。
- 本轮是文档与产物级预览，**尚未运行浏览器原型**；`scale` 的性能与视觉结论需要下一步原型验证。

## 0. 结论先行

技术上可行，但建议分两阶段交付，不要把“基础轮播”和“签名缩放效果”绑成同一个不可拆的里程碑。

| 维度              | 判断         | 说明                                                                                                             |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| 基础轮播          | 高可行性     | Embla 8.6.0 稳定、MIT、React 19 peer 兼容；核心 ESM gzip 约 11.2KB，wrapper 约 0.5KB，reactive-utils 约 0.65KB。 |
| `scale`/`visible` | 中高可行性   | 视觉可以复现，但需要 JS 测量 slide 尺寸并在滚动帧内插值；必须做浏览器原型和 60fps 验证。                         |
| Dots / Counter    | 中可行性     | 基础选中态简单；参考里的“跨 dot 拉伸 pill”和“数字滑动”是额外动效，建议放在第二阶段。                             |
| 可访问性          | 可行且可更优 | Embla 自带 `watchFocus`，可让聚焦的 slide 滚入视口；不要复制 shadcn 的 root 方向键捕获。                         |
| 许可证            | 有条件       | Animate UI 是 MIT + Commons Clause，不能把它的组件源码原样放进 `seam-react` 再发布。必须独立实现。               |
| 测试              | 有条件       | jsdom 没有布局，Embla 行为必须在 Playwright 里验证；当前仓库 e2e 只跑 Chromium，Safari/Firefox 需人工验收。      |
| 主要风险          | 中高         | `scale` 逐帧性能、SSR 首屏尺寸、动态 slide、插件单实例、Embla v9 仍是 RC。                                       |
| 推荐方案          | 分阶段       | M1 基础版（P0）+ M2 签名效果（P1，opt-in）。如果必须一次交付，先完成三方向原型并设性能门槛。                     |

一句话：**Embla 负责滚动引擎，shadcn 提供可借鉴的结构，Animate UI 只作为视觉参考；不要把 Animate UI 的源码当作实现基础。**

## 1. 参考实现拆解

### 1.1 Animate UI Carousel 的事实

来自官方文档和 npm 包 `@animate-ui/react@2.4.3` 的公开产物：

- 它明确建立在 `embla-carousel-react` 之上，并声称是 shadcn/ui Carousel 的 drop-in replacement，API 基本一致。
- 组成：`Carousel`、`CarouselContent`、`CarouselItem`、`CarouselPrevious`、`CarouselNext`，以及包内额外的 `CarouselDots`、`CarouselCounter`、`useEmblaCarousel`。
- `scale` 与 `visible` 是扩展的 Embla options：
  - `scale`：邻居 slide 向中心缩放，中心 slide 最大；滑动过程中逐帧跟随，而不是只在吸附后切换。
  - `visible`：按可见数量计算 slide 尺寸；奇数居中，偶数时边缘露出半张。
  - 没有 `scale` / `visible` 时，布局和运动与 shadcn/ui 一致。
- `scale` 的视觉细节：slide 内容缩放、层叠、边缘裁剪、远处 slide 透明；远处 slide 会被设为 `inert` 和 `aria-hidden`。
- `CarouselDots`：当前 dot 是一个会跟随滚动、在 dot 之间拉伸的 pill。
- `CarouselCounter`：数字滚动到下一个值。
- reduced motion：slide 保持原始尺寸，counter 数字立即变化。

**许可证结论**：Animate UI 使用 “MIT + Commons Clause License Condition”。Commons Clause 限制“单独或打包出售/再分发组件本身”。`seam-react` 是发布到 npm 的组件库，直接复制其 Carousel 源码存在明确的许可证风险。可复用的是**设计意图和交互结果**，不是源码、类名、算法实现或文档文本。

### 1.2 shadcn/ui Carousel 的事实

shadcn/ui Carousel 是 MIT，结构简单，适合作为“基础行为”的参考：

- `Carousel` 根节点：`role="region"`、`aria-roledescription="carousel"`、`data-slot="carousel"`。
- `CarouselContent`：外层 `overflow-hidden` viewport，内层 `flex` track。
- `CarouselItem`：`role="group"`、`aria-roledescription="slide"`、`flex: 0 0 100%`。
- `CarouselPrevious` / `CarouselNext`：复用 Button，默认绝对定位在两侧。
- 它的 root 使用 `onKeyDownCapture` 监听 ArrowLeft / ArrowRight，并直接 `preventDefault()`。

这里有一个**不应继承的问题**：root 捕获方向键会在焦点位于 slide 内的输入框、文本域、下拉框时劫持按键。Carousel 的可访问性应该依靠原生按钮、Tab 顺序和 Embla 的 `watchFocus`，而不是全局方向键捕获。

### 1.3 Embla Carousel 的事实

以稳定版 `8.6.0` 为准：

- 包结构：`embla-carousel`（核心）+ `embla-carousel-react`（React wrapper）+ `embla-carousel-reactive-utils`。
- License：MIT。
- React peer：`^16.8.0 || ^17.0.1 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc`，当前仓库 React 19 可用。
- `embla-carousel-react` 的 `useEmblaCarousel(options, plugins)` 返回 `[viewportRefCallback, api]`；API 在 effect 中创建，SSR 安全。
- 必需结构：viewport（`overflow: hidden`）→ container（`display: flex`，`touch-action: pan-y pinch-zoom`）→ slides（`flex: 0 0 100%`，`min-width: 0`）。
- 常用能力：`loop`、`align`、`containScroll`、`slidesToScroll`、`dragFree`、`direction`、`breakpoints`、`duration`、`startIndex`。
- 常用事件：`init`、`reInit`、`select`、`scroll`、`settle`、`resize`、`slidesInView`、`slideFocus`、`pointerDown`、`pointerUp`。
- 常用方法：`scrollTo(index, jump?)`、`scrollPrev`、`scrollNext`、`canScrollPrev`、`canScrollNext`、`selectedScrollSnap`、`scrollSnapList`、`scrollProgress`、`slidesInView`、`slideNodes`、`containerNode`、`rootNode`、`reInit`、`destroy`。
- `watchFocus: true` 是默认值：slide 内的可聚焦元素获得焦点时，Embla 会把该 slide 滚入视口。这对“屏幕外 slide 仍可 Tab 到”的可访问性很关键。
- `duration` 不是毫秒，而是 Embla 的吸引力物理参数，官方建议 20–60；拖拽不受它影响。
- `loop` 在 slide 数量不足时会自动回退为 `false`，不会为了 loop 复制 DOM。
- RTL 需要同时设置 `direction: "rtl"` 和 HTML `dir="rtl"`。
- `slidesToScroll` 分组后，`selectedScrollSnap()` 返回的是 **snap index**，不一定等于 slide index。

Embla 8.6.0 是稳定版；npm 上的 9.0.0 仍是 RC（调研时最新为 `9.0.0-rc04`）。v9 调整了若干 option 名称（例如 `watchDrag`/`watchResize`/`watchSlides` 与 `draggable`/`resize`/`slideChanges` 的差异），现在不应把 v9 RC 作为生产基线。

### 1.4 三者关系

```text
Embla Carousel        → 滚动、吸附、拖拽、loop、事件与 API
shadcn/ui Carousel    → 可借鉴的基础结构和部件命名
Animate UI Carousel   → scale/visible、dots、counter 的视觉参考
seam-react Carousel   → 自己的组合 API、状态语义、可访问性与动效契约
```

## 2. 与现有 `seam-react` 的契合度

### 2.1 可直接复用的部分

- 组合式 API：`Tabs`、`Dialog`、`Drawer` 已经采用 Root + 子部件的模式。
- 受控/非受控状态：`useControllableState` 可直接用于 snap index。
- 按钮：`Button` 已有 `variant`、`size`、`iconOnly`、`focus-visible` 和 press 反馈，可直接复用。
- 动效 token：`INDICATOR_SPRING`、`UI_SPRING`、`REDUCED_MOTION_TRANSITION`、`EASE_OUT` 等已在 `motion.ts`。
- CSS token：颜色、间距、圆角、时长、缓动、焦点环都已存在。
- 文档站：`apps/docs/src/pages/*` + `content/components.ts` + `routes.tsx` 的注册方式清晰。
- 测试：Vitest + Testing Library、Playwright + axe、视觉快照和 reduced-motion 测试已有基础设施。

### 2.2 需要新增的部分

- `embla-carousel-react` 与 `embla-carousel` 依赖。
- `Carousel.tsx`、`carousel.css`、导出与样式入口。
- 文档页、API 表、演示和导航条目。
- 单元测试、e2e、a11y、视觉快照。
- Changeset（新增组件按 Drawer 先例使用 minor）。

### 2.3 与仓库约定的差异

- jsdom 没有真实布局，Embla 的 scroll/snap 不能靠单元测试验证；单元测试需要 mock `embla-carousel-react`，真实行为放 Playwright。
- 当前 Playwright 只配置 Chromium；Safari 的 `touch-action`、`transform`、`focus` 行为和 Firefox 的滚动行为需要人工验收，或另加项目。
- 文档站是 Vite SPA，不覆盖 SSR；如果要对 Next.js 用户承诺 SSR 无闪烁，需要单独做 SSR 验证。

## 3. 技术可行性

### 3.1 基础 Carousel（P0）

**结论：高可行性。**

需要的能力都能由 Embla 直接提供：

| 需求              | Embla 能力                            | 判断     |
| ----------------- | ------------------------------------- | -------- |
| 横向/纵向滚动     | `axis: "x" \| "y"`                    | 直接     |
| 上一张/下一张     | `scrollPrev()` / `scrollNext()`       | 直接     |
| 边界禁用          | `canScrollPrev()` / `canScrollNext()` | 直接     |
| 循环              | `loop: true`                          | 直接     |
| 起始位置          | `startIndex`                          | 直接     |
| 对齐              | `align: "start" \| "center" \| "end"` | 直接     |
| 分组滚动          | `slidesToScroll`                      | 直接     |
| 拖拽/触摸         | 内建                                  | 直接     |
| 动态 slide        | `watchSlides` + `reInit`              | 直接     |
| 焦点进入视口      | `watchFocus` + `slideFocus`           | 直接     |
| 受控 snap index   | `select` 事件 + `scrollTo()`          | 需要封装 |
| 受控 index 的边界 | snap index 与 slide index 的差异      | 需要文档 |
| 空/单 slide       | 需要验证 Embla 的零 slide 行为        | 需要测试 |

基础版的实现重点是**状态语义和可访问性**，不是滚动算法。

### 3.2 `scale` / `visible` 签名效果（P1）

**结论：中高可行性，但不能只靠 CSS。**

`visible` 本身可以 CSS-only：

```css
.uk-carousel__item {
  flex: 0 0 calc(100% / var(--uk-carousel-visible, 1));
}
```

配合 Embla 推荐的 padding + negative margin 间距方案，可以实现不依赖 JS 测量的多图可见布局，SSR 也稳定。

但 Animate UI 的 `scale` 不是简单的“选中项放大”：

- 邻居要按距离连续缩小，而不是吸附后跳变；
- 缩放后的 slide 要重新排布，保持 gap；
- 远处 slide 要层叠、变透明；
- 首尾/loop 需要不同的距离计算；
- 偶数 `visible` 时边缘要露出半张。

这要求 JS 在滚动过程中持续计算。可行实现路径：

| 方案                      | 做法                                                              | 优点                                          | 风险                                     |
| ------------------------- | ----------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| A. CSS class 切换         | 根据 `selectedScrollSnap` 给邻居加 class，CSS transition          | 简单、无逐帧 JS                               | 不是连续缩放；拖动时不同步               |
| B. rAF + CSS 变量（推荐） | 监听 `scroll`，每帧写 `--scale` / `--shift` / `--opacity` / `--z` | 不触发 React 重渲染；transform/opacity 可合成 | 需要缓存尺寸、避免布局抖动               |
| C. Motion 逐 slide        | 每个 slide 一个 MotionValue                                       | 与 Motion 生态一致                            | slide 多时 Motion 节点和调度成本高       |
| D. Scroll-driven CSS      | `animation-timeline: scroll()`                                    | 纯 CSS                                        | 浏览器支持与容器结构限制，不适合作为基线 |

推荐 B，但必须满足：

1. **缓存测量**：只在 `reInit` / `resize` 时读 slide 尺寸，不在每帧 `getBoundingClientRect()`。
2. **限制更新窗口**：只更新中心附近的 slide，远处 slide 用静态状态。
3. **只写 transform/opacity**：不写 width/height/margin/top/left。
4. **rAF 合并**：一次滚动事件只安排一帧。
5. **SSR fallback**：首屏用 CSS 的 `flex-basis: calc(100% / visible)`，挂载后再细化；不能等服务端测量。
6. **reduced motion**：直接关闭 scale，保持原始尺寸。
7. **不默认 `inert`**：远处 slide 仍可被聚焦，`watchFocus` 会把它带入视口；如果为了性能必须隐藏，至少跳过包含焦点的 slide。

`scale` 模式还需要额外的 DOM 包装：如果直接缩放 `Carousel.Item`，flex 布局尺寸不变，视觉 gap 会变大；参考实现缩放的是 item 的第一个子元素。我们不能要求用户“每个 Item 只能有一个 child”，更稳妥的是在 `Carousel.Item` 内部渲染一个 `uk-carousel__item-inner`，只缩放这个 inner。代价是 DOM 多一层，需要在文档里说明。

**判断**：技术上能做，但它是这个组件里唯一需要“原型 + 性能门槛”的部分。建议 opt-in，默认关闭。

### 3.3 Dots / Counter（P1）

**Dots 基础态**：中等偏低难度。

- 数量来自 `api.scrollSnapList().length`，当前项来自 `selectedScrollSnap()`。
- 订阅 `select` / `reInit` 即可更新。
- 每个 dot 是原生 `<button>`，`aria-current="true"` 标记当前项。
- 选中态可以用 Motion `layoutId` 的共享 pill（和 Tabs indicator 类似），也可以用 CSS width/color transition。

**参考里的“拉伸 pill”**：中高难度。

- 需要根据 `scrollProgress()` 计算当前 pill 覆盖的 dot 区间；
- 需要在 `resize` / `reInit` 时缓存 dot 的中心点；
- loop 时从最后一个回到第一个要处理跨越；
- 每帧只写 transform/width，不能触发 React state。

建议：M1 先做“共享 pill 滑动”，M2 再决定是否做“连续拉伸”。两者视觉接近，但实现成本差一个量级。

**Counter**：中等难度。

- 计数来自 snap 列表，不是 slide 列表（分组滚动时两者不同）。
- 默认格式 `Slide {current} of {count}`，通过 `format` 支持自定义。
- 数字滑动用 `AnimatePresence` + 短位移/透明度即可；reduced motion 立即替换。
- 建议 `aria-hidden="true"`，因为 slide 自身的 `aria-label` 已经提供位置；避免重复播报。

### 3.4 受控 snap index

**结论：中等偏低难度，但值得做。**

`Tabs` 已经是受控/非受控模型；Carousel 如果只有 `setApi`，会让库内 API 风格不一致。建议提供：

```tsx
<Carousel index={index} onIndexChange={setIndex} />
```

实现要点：

- `useControllableState` 管理 index。
- `select` 事件读 `api.selectedScrollSnap()`，同步到 state。
- 外部 index 变化时调用 `api.scrollTo(next)`；用 ref 避免回环触发。
- 初次挂载不触发 `onIndexChange`（与 Tabs 的用户交互语义一致）。
- `reInit` 后重新同步；如果 slide 数变少，clamp 到有效范围。
- **语义必须写清楚**：index 是 snap index，不是 slide index。`slidesToScroll: 1` 时两者相同；分组滚动时不同。Dots/Counter 也按 snap 计数。

风险：用户以为 index 是 slide index；文档和类型注释必须明确。另一个选择是只提供 `setApi`，把受控逻辑留给用户；但这会让基础体验不完整。建议 v1 提供受控 index。

### 3.5 SSR / 首屏

**结论：基础版可控，scale 模式需要额外处理。**

- `useEmblaCarousel` 在 effect 中创建，服务端不会访问 DOM，SSR 安全。
- 基础版用 CSS `flex-basis` 设置 slide 尺寸，首屏不需要测量。
- 受控 index / dots / counter 依赖 `api`，首屏可能显示 0 或空；需要预留高度，避免 CLS。
- `scale` 模式首屏只能给 CSS fallback basis，挂载后再细化；参考实现也承认“slide 在挂载后才有精确尺寸”。
- 不要在 render 阶段读 `window` / `matchMedia`；`useReducedMotion` 在 SSR 返回安全值。

建议：文档明确“基础版 SSR 稳定；scale 模式首屏可能有一次尺寸细化，不要把它放在对 CLS 极敏感的页面顶部”。

### 3.6 RTL / 纵向 / 响应式

**结论：可行，但需要测试。**

- RTL：`dir="rtl"` + `opts.direction: "rtl"`；CSS 用 logical properties（`margin-inline-start`、`padding-inline-start`）；箭头图标水平翻转。
- 纵向：`orientation="vertical"` → `axis: "y"`；Content 必须有明确高度；track 需要 `height: 100%`；箭头图标旋转 90°；`touch-action: pan-x pinch-zoom`。
- 响应式：`visible` 用 CSS 变量，媒体查询可直接覆盖；Embla 的 `breakpoints` 可以改行为；`scale` 模式需要在 resize 时重新读取 `--uk-carousel-visible` 并重新测量。
- RTL + 纵向：不要翻转上下箭头；只处理水平方向。

### 3.7 性能预算

基础版：

- Embla 用 `transform` 移动 container，不触发布局。
- 只在 `select` / `reInit` 时更新 React state；`scroll` 事件不更新 state。
- 点击/拖拽期间最多更新按钮禁用状态和 dots 当前项。

scale 模式：

- 目标：20 个 slide、3–5 个可见、桌面 60fps，4× CPU throttle 下不明显掉帧。
- 每帧最多写中心附近 5–7 个 slide 的 CSS 变量。
- 禁止每帧读布局；测量只在 `reInit` / `resize`。
- 不默认 `will-change`；如果启用，只在拖动/滚动期间加，`settle` 后移除。
- 用 Playwright trace / Performance 面板人工验收；CI 只做功能断言，不做 FPS 断言。

包体：

- Embla 三件套 gzip 约 12.4KB（实测 ESM 文件 gzip：core 11,189B，wrapper 535B，reactive-utils 649B）。
- 必须 externalize，不能把 core 打进 `dist/index.js`；否则用户再装 autoplay 插件时可能出现两份 core。

### 3.8 测试可行性

| 层级           | 能测什么                                                                           | 不能测什么                                         |
| -------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Vitest + jsdom | 组合结构、context、按钮禁用逻辑、dots 渲染、ARIA 属性、受控 index 逻辑（mock API） | 真实滚动、吸附、拖拽、loop、resize、focus 滚入视口 |
| Playwright     | 拖拽、按钮、loop、dots、counter、纵向、RTL、动态 slide、focus、reduced motion      | 真实移动端惯性、Safari 渲染差异                    |
| axe-core       | 可访问名称、角色、对比度之外的结构问题                                             | 动态焦点行为、屏幕阅读器实际播报                   |
| 视觉快照       | 亮/暗主题、默认/激活态                                                             | 动画中间帧（需要额外取样）                         |

jsdom 测试建议 mock `embla-carousel-react`，返回一个可控的 fake API；不要试图在 jsdom 里模拟 Embla 的物理滚动。真实行为全部交给 Playwright。

## 4. 依赖与打包

### 4.1 版本选择

**建议 pin `8.6.0`，不要用 v9 RC。**

理由：

- 8.6.0 是 npm 的 stable；9.0.0 仍是 RC。
- Embla 插件（例如 autoplay）的 peer 依赖通常是精确版本，例如 `embla-carousel-autoplay@8.6.0` peer 是 `embla-carousel@8.6.0`。如果 `seam-react` 用 `^8.6.0` 未来装到 8.7，插件的精确 peer 可能不满足。
- v9 的 option 名称有变化，现在接入会把迁移成本提前。

### 4.2 依赖形态

三个选项：

| 方案             | 优点                                             | 缺点                                               | 建议                               |
| ---------------- | ------------------------------------------------ | -------------------------------------------------- | ---------------------------------- |
| dependencies     | 安装 `seam-react` 即用；与现有 `motion` 模式一致 | 用户自己装插件时可能出现版本/实例分裂              | 推荐，配合 exact pin + externalize |
| peerDependencies | 保证单实例；插件生态最稳                         | 用户必须额外安装；只装 `seam-react` 会 import 失败 | 如果维护者更看重插件生态，可选     |
| 打进 bundle      | 无外部依赖                                       | core 重复、插件实例不一致、包体变大                | 不推荐                             |

推荐：`dependencies` 中声明 `embla-carousel-react@8.6.0` 和 `embla-carousel@8.6.0`（后者用于类型解析），并在 `vite.config.ts` 的 `rollupOptions.external` 中 externalize 两者。`embla-carousel-reactive-utils` 是 wrapper 的传递依赖，通常不需要直接声明，但 externalize 列表里加上也无害。

### 4.3 插件单实例

`plugins` prop 是逃生舱。用户可能传 `Autoplay()`、`ClassNames()`、`WheelGestures()` 等。必须保证：

- `seam-react` 和插件使用同一份 `embla-carousel` core；
- `plugins` 数组变化时 Embla 会 `reInit`；
- 文档提醒插件版本与 core 匹配；
- v1 不内置 autoplay，不提供暂停按钮；如果用户自行传 autoplay，可访问性由用户负责（这不是理想状态，所以文档要明确）。

## 5. 可访问性可行性

### 5.1 应该继承的

- Root：`role="region"` + `aria-roledescription="carousel"` + 可访问名称。
- Item：`role="group"` + `aria-roledescription="slide"` + `x of y` 标签。
- 控件：原生 `<button>`，可见 `:focus-visible`，禁用态可感知。
- 焦点：Embla `watchFocus` 让 Tab 到屏幕外 slide 时自动滚入视口。
- 触屏：`touch-action` 正确；控件始终可见，不做 hover-only。

### 5.2 不应该继承的

- shadcn 的 root `onKeyDownCapture` 方向键捕获：会劫持输入框、文本域、下拉框的方向键。
- Animate UI 对远处 slide 默认 `inert` + `aria-hidden`：会让键盘用户无法直接 Tab 到屏幕外内容，和 `watchFocus` 的目标冲突。除非做“跳过包含焦点的 slide”的精细处理，否则 v1 不默认启用。
- 只靠 hover 显示箭头：触屏和键盘用户会看不到控件。

### 5.3 需要明确决策的

- 手动轮播是否需要 `aria-live`：APG 的默认建议是不需要；只有自动轮播才需要。v1 不自动轮播，因此不加。
- Counter 是否 `aria-hidden`：建议是，因为 slide 标签已经提供位置；避免重复播报。
- 方向键：v1 不劫持。用户用 Tab + Enter/Space 操作按钮；slide 内可聚焦元素由 `watchFocus` 带入视口。如果未来要加方向键，只在 viewport 自身获得焦点且焦点不在交互控件内时生效。

## 6. 风险矩阵

| 风险                               | 概率 | 影响 | 缓解                                                               |
| ---------------------------------- | ---- | ---- | ------------------------------------------------------------------ |
| 复制 Animate UI 源码导致许可证问题 | 中   | 高   | 独立实现；只参考行为；文档注明参考来源；不复制代码/类名/算法文本   |
| scale 逐帧卡顿                     | 中高 | 高   | 原型 + 性能门槛；缓存测量；rAF；限制更新窗口；失败则降级为无 scale |
| SSR 首屏尺寸闪烁/CLS               | 中   | 中   | CSS fallback basis；挂载后细化；文档说明 scale 模式限制            |
| jsdom 测试覆盖不足                 | 高   | 中   | mock Embla；真实行为放 Playwright；补 e2e                          |
| Embla v9 RC 误用                   | 中   | 中   | pin 8.6.0；不追 RC；升级单独评估                                   |
| 插件版本/实例分裂                  | 中   | 中   | exact pin；externalize；文档说明                                   |
| 屏幕外 slide 的焦点/读屏行为       | 中   | 中高 | `watchFocus`；不默认 inert；e2e 验证 Tab/焦点                      |
| 方向键劫持                         | 中   | 中高 | 不做 root capture；只在按钮/dots 上处理原生键盘                    |
| Safari 触摸/滚动差异               | 中   | 中   | 人工 Safari 验收；避免依赖实验性 CSS                               |
| 受控 index 与分组滚动语义混淆      | 中   | 中   | 明确 snap index；类型注释；文档示例                                |
| 动态 slide 导致 dots/count 过期    | 中   | 中   | 订阅 `reInit`；e2e 增删 slide                                      |
| 范围蔓延（autoplay/缩略图/虚拟化） | 高   | 中   | 明确非目标；后续单独提案                                           |

## 7. 工作量估算

粗略估算，按一名熟悉仓库的工程师计算：

| 工作项                   | 估算    | 说明                                                     |
| ------------------------ | ------- | -------------------------------------------------------- |
| 参考拆解 + 三方向原型    | 1–2 天  | 含真实内容、reduced motion、性能观察                     |
| 基础组件 + CSS + 导出    | 2–3 天  | Root/Content/Item/Previous/Next、受控 index、gap/visible |
| 可访问性 + 键盘/焦点     | 1 天    | slide 标签、watchFocus、按钮/dots、axe                   |
| dots + counter（基础态） | 1–2 天  | 共享 pill、格式、reduced motion                          |
| scale/visible 签名效果   | 2–4 天  | 测量、rAF、CSS 变量、性能调优；不确定性最高              |
| 单元测试                 | 1 天    | mock Embla、context、受控逻辑                            |
| e2e + a11y + 视觉        | 2 天    | 拖拽、loop、纵向、RTL、动态、reduced motion              |
| 文档页 + 演示 + API 表   | 1–2 天  | 含 README、导航、changeset                               |
| 跨浏览器/人工验收        | 1 天    | Safari 必看；Firefox 抽查                                |
| 合计                     | 9–16 天 | 基础版约 5–7 天；签名效果另加 3–5 天                     |

这个估算不包含“自动播放”“缩略图导航”“虚拟化”“多实例同步”等非目标。

## 8. 方案选择

### 方案 A：基础版（推荐 M1）

包含：

- Root / Content / Item / Previous / Next
- 受控/非受控 snap index
- 横向/纵向、loop、gap、CSS `visible`
- 完整的键盘、ARIA、reduced motion
- 单元 + e2e + a11y + 视觉
- 文档与 Changeset

不包含：

- `scale` 签名效果
- 拉伸 dots pill
- counter 数字滑动
- autoplay
- RTL 作为发布门槛（可作为 P1 验证项）

风险低，能快速建立正确的 API 和可访问性基线。

### 方案 B：参考效果版（推荐 M2）

在 A 之上增加：

- opt-in `scale` + `visible`
- `Carousel.Dots` 基础共享 pill
- `Carousel.Counter` 数字滑动
- 纵向/RTL 的完整验收

需要先做原型和性能门槛。如果 scale 不达标，保留 A 的 API，M2 只交付 dots/counter，scale 延后。

### 方案 C：完整版（不建议 v1）

在 B 之上增加：

- 内置 autoplay（含暂停按钮、hover/focus 暂停、aria-live）
- 缩略图导航
- 多 carousel 同步
- 大数据量虚拟化
- Safari/Firefox CI

这些都应该单独提案，不应混进第一个 Carousel 版本。

## 9. 推荐决策

1. **做，但分阶段**：先 M1 基础版，再 M2 签名效果。
2. **Embla pin 8.6.0**，dependencies + externalize。
3. **独立实现**，不复制 Animate UI 源码；参考 shadcn 结构时保留 MIT 归属。
4. **不做 root 方向键捕获**；用按钮 + `watchFocus`。
5. **受控 index 作为一等 API**，明确是 snap index。
6. **`scale` opt-in**，默认关闭；开启时默认 `align: "center"`、`containScroll: false`。
7. **v1 不做 autoplay**；只保留 `plugins` 逃生舱，并在文档里说明 a11y 责任。
8. **先原型后实现**：按 `DESIGN.md` 的 prototype protocol，至少做三个方向的交互原型（安静基础版 / 参考 scale 版 / 克制 scale 版），确认性能与视觉后再改生产代码。
9. **测试以 Playwright 为准**；jsdom 只测结构与状态逻辑。
10. **Changeset 用 minor**（新增组件，参考 Drawer 先例），不是 patch。
11. **组合 API 命名优先于 shadcn 兼容**：用 `Carousel.Content` / `Carousel.Item`，与仓库 `Tabs.List` / `Dialog.Content` 一致；不做两套别名。

## 10. 参考来源

- Animate UI Carousel 文档：<https://animate-ui.com/docs/primitives/animate-ui/carousel>
- Animate UI npm 包：`@animate-ui/react@2.4.3`（调研时）
- Animate UI 许可证：MIT + Commons Clause
- shadcn/ui Carousel 源码：<https://github.com/shadcn-ui/ui>（MIT）
- Embla Carousel React 入门：<https://www.embla-carousel.com/docs/get-started/react>
- Embla Carousel v8 Options / Methods / Events：<https://www.embla-carousel.com/docs/v8/api/options>
- Embla Carousel Slide Gaps：<https://www.embla-carousel.com/docs/v8/guides/slide-gaps>
- npm registry：`embla-carousel@8.6.0`、`embla-carousel-react@8.6.0`、`embla-carousel-reactive-utils@8.6.0`（MIT）
- 仓库内参考：`DESIGN.md`、`packages/ui/src/Tabs.tsx`、`packages/ui/src/Marquee.tsx`、`packages/ui/src/motion.ts`、`packages/ui/vite.config.ts`、`e2e/tests/*`

> 说明：本报告中的包体大小来自对 npm tarball 中 ESM 文件的 gzip 实测；性能结论来自代码路径分析，尚未运行浏览器原型。`scale` 的 60fps 结论必须在原型阶段用真实设备/CPU throttle 验证。
