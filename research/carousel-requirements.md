# Carousel 组件需求文档

> 状态：M1 已实现（2026-11-11）
> 目标包：`seam-react`
> 关联文档：`research/carousel-feasibility.md`、`DESIGN.md`、`AGENTS.md`
> 参考：Animate UI Carousel（视觉参考）、shadcn/ui Carousel（结构参考）、Embla Carousel 8.6.0（滚动引擎）

## 0. 已确认决策（2026-11-11）

| 决策             | 结果                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `scale` 签名效果 | 不进入首个发布；M2 opt-in。                                                              |
| 组合 API 命名    | 仓库风格：`Carousel.Content` / `Carousel.Item` / `Carousel.Previous` / `Carousel.Next`。 |
| 默认 `align`     | `start`。                                                                                |
| 依赖形态         | `dependencies` + exact pin `8.6.0` + Vite externalize。                                  |
| RTL              | v1 支持并测试。                                                                          |
| M1 范围          | 基础轮播；不含 `scale`、`Carousel.Dots`、`Carousel.Counter`。                            |

M1 先交付可组合、可访问、可受控的基础轮播；`scale`、Dots、Counter 留在 M2。

## 1. 背景与目标

`seam-react` 需要一个可组合、可访问、支持真实拖拽与吸附的 Carousel。它不能只是“能左右滑的 div”，而应具备：

- 与 `Tabs`、`Dialog`、`Drawer` 一致的分部件 API；
- 受控/非受控状态；
- 键盘、触摸、鼠标等价的操作结果；
- 明确的 reduced-motion 行为；
- 可选的、克制的签名视觉，而不是默认堆动效。

### 1.1 目标

1. 提供横向/纵向轮播，支持拖拽、按钮、dots 和受控索引。
2. 提供 `Carousel` / `Carousel.Content` / `Carousel.Item` / `Carousel.Previous` / `Carousel.Next` 的基础组合。
3. 提供可访问名称、slide 位置播报、可见焦点、触屏目标和 reduced-motion 降级。
4. 复用现有 `Button`、`useControllableState`、Motion token 与 CSS token。
5. 在不复制第三方源码的前提下，复现 Animate UI 参考中的核心视觉：邻居缩放、中心聚焦、dots 当前项、counter 位置。
6. 为后续插件（autoplay、wheel gestures、class names）保留逃生舱，但不把插件行为内置到 v1。

### 1.2 非目标

- v1 不内置自动播放、暂停按钮、`aria-live` 轮播播报。
- v1 不做缩略图导航、多 carousel 同步、虚拟化。
- v1 不做“无限克隆 DOM”的 loop；loop 由 Embla 的原生位移实现。
- v1 不保证嵌套 carousel 的拖拽手势。
- v1 不把 Animate UI 的源码、类名或算法文本作为实现基础。
- v1 不新增第二套动画运行时；现有 Motion 是唯一动画层。
- v1 不为了 Carousel 修改 `Button`、`Tabs` 或全局 token 的既有行为。

## 2. 用户与场景

| 场景                | 需求                                            |
| ------------------- | ----------------------------------------------- |
| 商品/作品图集       | 一次看 1–3 张，拖拽或按钮切换，中心项突出       |
| 营销卡片            | loop、自动布局、dots 指示位置                   |
| 文档/教程步骤       | 受控索引，外部“上一步/下一步”按钮同步           |
| 纵向公告/时间线     | 固定高度，纵向吸附，按钮上下切换                |
| 移动端图片浏览      | 触摸滑动，控件始终可见，触屏目标足够大          |
| 键盘用户            | Tab 到按钮/dots/slide 内链接，焦点不被劫持      |
| 读屏用户            | 区域有名称，slide 有位置，控件有名称            |
| reduced-motion 用户 | 程序化切换直接跳转，无缩放/滑动数字，拖拽仍可用 |

## 3. 设计原则与参考边界

### 3.1 原则

- **滚动是功能，不是装饰**。拖拽/吸附是核心交互，不能因为 reduced motion 就完全禁用。
- **一个空间故事**：slide 沿一个轴移动；不要同时做淡入、飞入、旋转。
- **高频操作即时**：按钮按下反馈用现有 Button token；不做入场动画。
- **可访问性不是后续补丁**：slide 标签、焦点滚入视口、按钮名称在首个完整版本里完成。
- **签名效果 opt-in**：`scale` / 拉伸 dots / 数字滑动默认关闭或只在显式开启时出现。

### 3.2 参考边界

- Embla：滚动、吸附、拖拽、loop、事件与 API。
- shadcn/ui：Root/Content/Item/Previous/Next 的结构与命名可借鉴；不继承 root 方向键捕获。
- Animate UI：`scale`/`visible`、dots、counter 的视觉结果可参考；不复制源码。
- 所有外部样式、类名、ARIA 文案都要按本仓库的 token 和命名重写。

## 4. 组件模型

### 4.1 结构

```tsx
<Carousel aria-label="作品集" opts={{ loop: true }} gap="1rem">
  <Carousel.Content className="rounded-xl">
    <Carousel.Item>...</Carousel.Item>
    <Carousel.Item>...</Carousel.Item>
    <Carousel.Item>...</Carousel.Item>
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
  <Carousel.Dots />
  <Carousel.Counter />
</Carousel>
```

DOM 结构：

```html
<div
  role="region"
  aria-roledescription="carousel"
  aria-label="作品集"
  class="uk-carousel"
>
  <div class="uk-carousel__viewport">
    <div class="uk-carousel__track">
      <div
        role="group"
        aria-roledescription="slide"
        aria-label="1 of 3"
        class="uk-carousel__item"
      >
        <!-- scale 模式下多一层 inner -->
        <div class="uk-carousel__item-inner">...</div>
      </div>
    </div>
  </div>
  <button class="uk-button uk-carousel__control" data-side="previous">
    ...
  </button>
  <button class="uk-button uk-carousel__control" data-side="next">...</button>
  <div class="uk-carousel__dots">...</div>
  <div class="uk-carousel__counter" aria-hidden="true">...</div>
</section>
```

### 4.2 组合边界

| 部件                | 职责                                  | 是否必需 |
| ------------------- | ------------------------------------- | -------- |
| `Carousel`          | Context、Embla 实例、状态、可访问区域 | 是       |
| `Carousel.Content`  | viewport + track，承载 Embla ref      | 是       |
| `Carousel.Item`     | slide 语义、标签、可选 inner 包装     | 是       |
| `Carousel.Previous` | 上一张按钮                            | 否       |
| `Carousel.Next`     | 下一张按钮                            | 否       |
| `Carousel.Dots`     | 按 snap 渲染 dot 按钮                 | 否       |
| `Carousel.Counter`  | 当前位置文本                          | 否       |
| `useCarousel`       | 自定义控件的上下文出口                | 否       |

`Carousel.Content` 把 Embla 要求的 viewport/track 两层收进一个部件，避免用户错误地把按钮放进 viewport。`className` 作用于 viewport（可见盒子，负责宽高/裁切/圆角）；`trackClassName` 作用于 track（flex 布局、间距、对齐）。`gap` 在 Root 上统一设置，避免用户手动写 `-ml-*` / `pl-*`。

### 4.3 状态模型

```ts
interface CarouselState {
  /** 当前 snap 索引，0-based。不是 slide 索引。 */
  index: number;
  /** snap 总数。分组滚动时可能小于 slide 数。 */
  count: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation: "horizontal" | "vertical";
  api: CarouselApi | undefined;
}
```

- `index` 受控/非受控共享同一套语义。
- `canScrollPrev/Next` 由 Embla 的 `select` / `reInit` 更新；初始为 `false`。
- `count` 来自 `api.scrollSnapList().length`；初始为 0。
- `api` 在挂载后可用；卸载时 `setApi(undefined)`。
- `orientation` 由 prop 决定，`opts.axis` 被覆盖。

## 5. 公开 API

### 5.1 `Carousel`

```ts
export type CarouselProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-labelledby"
> &
  CarouselLabelProps & {
    orientation?: "horizontal" | "vertical";
    opts?: CarouselOptions;
    plugins?: CarouselPlugin[];
    setApi?: (api: CarouselApi | undefined) => void;
    index?: number;
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
    gap?: string;
    visible?: number;
    scale?: number;
    children?: ReactNode;
  };
```

| Prop                             | 类型                         | 默认                   | 范围 | 说明                                                       |
| -------------------------------- | ---------------------------- | ---------------------- | ---- | ---------------------------------------------------------- |
| `orientation`                    | `"horizontal" \| "vertical"` | `"horizontal"`         | P0   | 滚动轴；覆盖 `opts.axis`。                                 |
| `opts`                           | `EmblaOptionsType`           | —                      | P0   | Embla 选项；`axis` 由 `orientation` 管理。                 |
| `plugins`                        | `EmblaPluginType[]`          | —                      | P0   | Embla 插件；不内置任何插件。                               |
| `setApi`                         | `(api \| undefined) => void` | —                      | P0   | 获取原始 API；卸载时传 `undefined`。                       |
| `index`                          | `number`                     | —                      | P0   | 受控 snap 索引。                                           |
| `defaultIndex`                   | `number`                     | `opts.startIndex ?? 0` | P0   | 非受控初始 snap 索引；显式提供时映射到 `opts.startIndex`。 |
| `onIndexChange`                  | `(index: number) => void`    | —                      | P0   | 用户/拖拽/API 导致 snap 变化时触发；初次挂载不触发。       |
| `gap`                            | `string`                     | `"0px"`                | P0   | slide 间距，CSS 长度；用 padding + negative margin 实现。  |
| `visible`                        | `number`                     | `1`                    | P0   | 可见 slide 数；正数，可小数（露出半张）。CSS-only。        |
| `scale`                          | `number`                     | —                      | P1   | 邻居缩放比例 0–1；设置后启用签名效果。                     |
| `aria-label` / `aria-labelledby` | `string`                     | 必须二选一             | P0   | 区域可访问名称。                                           |
| `className`                      | `string`                     | —                      | P0   | Root 类名。                                                |
| `children`                       | `ReactNode`                  | —                      | P0   | 组合部件。                                                 |

类型层面的可访问名称：

```ts
type CarouselLabelProps =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };
```

如果维护者认为类型约束太强，可退化为开发期 `console.warn`；但文档和示例必须始终提供名称。

### 5.2 `Carousel.Content`

| Prop             | 类型             | 默认 | 说明                                     |
| ---------------- | ---------------- | ---- | ---------------------------------------- |
| `className`      | `string`         | —    | 作用于 viewport；用于宽高、圆角、裁切。  |
| `trackClassName` | `string`         | —    | 作用于 track；用于 flex 对齐等高级布局。 |
| `children`       | `ReactNode`      | —    | 应为 `Carousel.Item`。                   |
| 其他 `div` 属性  | —                | —    | 透传到 viewport。                        |
| `ref`            | `HTMLDivElement` | —    | 指向 viewport。                          |

约束：

- `Carousel.Content` 必须渲染在 `Carousel` 内，且包含至少一个 `Carousel.Item`。
- 不要在其中放 `Carousel.Previous/Next`，否则按钮会参与拖拽区域。
- 纵向时，`className` 必须给出明确高度（例如 `h-[320px]`）。

### 5.3 `Carousel.Item`

| Prop            | 类型             | 默认          | 说明               |
| --------------- | ---------------- | ------------- | ------------------ |
| `className`     | `string`         | —             | slide 类名。       |
| `aria-label`    | `string`         | 自动 `x of y` | 覆盖自动位置标签。 |
| `children`      | `ReactNode`      | —             | slide 内容。       |
| 其他 `div` 属性 | —                | —             | 透传。             |
| `ref`           | `HTMLDivElement` | —             | 指向 slide。       |

行为：

- 渲染 `role="group"`、`aria-roledescription="slide"`。
- 挂载后根据 DOM 顺序计算 `index` / `count`，设置 `aria-label="1 of 3"`；用户传入的 `aria-label` 优先。
- 动态增删 slide 时，在 Embla `reInit` 后重新计算。
- `scale` 设置时，内部渲染 `uk-carousel__item-inner`；未设置时不额外包一层。
- 不在默认情况下设置 `inert` / `aria-hidden`。屏幕外 slide 仍可被 Tab 到，Embla `watchFocus` 会把它滚入视口。
- 不设置 `tabIndex`；slide 本身不是停点，内部可聚焦元素才是。

### 5.4 `Carousel.Previous` / `Carousel.Next`

| Prop               | 类型                | 默认                                | 说明                                            |
| ------------------ | ------------------- | ----------------------------------- | ----------------------------------------------- |
| `variant`          | `ButtonVariant`     | `"outline"`                         | 复用 Button 变体。                              |
| `size`             | `ButtonSize`        | `"md"`                              | 复用 Button 尺寸。                              |
| `aria-label`       | `string`            | `"Previous slide"` / `"Next slide"` | 可访问名称。                                    |
| `children`         | `ReactNode`         | 默认 chevron                        | 自定义图标；仍需名称。                          |
| `onClick`          | `MouseEventHandler` | —                                   | 先执行用户回调；`preventDefault()` 可阻止滚动。 |
| `disabled`         | `boolean`           | —                                   | 与 `canScrollPrev/Next` 取或。                  |
| 其他 `button` 属性 | —                   | —                                   | 透传。                                          |

行为：

- 渲染 `Button`，`iconOnly`，圆角由 Carousel CSS 覆盖。
- 非 loop 到达边界时原生 `disabled`。
- loop 且 slide 足够时不 disabled。
- reduced motion 时用 `scrollTo(target, true)` 跳转，而不是 `scrollPrev/Next` 动画。
- 纵向时图标旋转 90°；RTL 时水平图标翻转。
- 默认绝对定位在 viewport 内侧边缘，始终可见；用户可用 `className` 移到外面。

### 5.5 `Carousel.Dots`

| Prop            | 类型                       | 默认                       | 说明               |
| --------------- | -------------------------- | -------------------------- | ------------------ |
| `label`         | `(index, count) => string` | `Go to slide ${index + 1}` | dot 的可访问名称。 |
| `className`     | `string`                   | —                          | 容器类名。         |
| 其他 `div` 属性 | —                          | —                          | 透传到容器。       |

行为：

- 渲染 `role="group"` + `aria-label="Slide controls"`（可通过 `aria-label` 覆盖）。
- 每个 dot 是原生 `<button type="button">`，`aria-current="true"` 标记当前 snap。
- `count <= 1` 时不渲染。
- 点击调用 `api.scrollTo(index)`；loop 下由 Embla 选择最近路径。
- 当前项视觉：P0 用共享 pill（Motion `layoutId`）或 CSS 过渡；P1 再做“跟随滚动拉伸”的连续 pill。
- reduced motion：不做布局/宽度动画，立即切换。
- 分组滚动（`slidesToScroll > 1`）时，dot 表示 snap/page，不是 slide；文档必须说明。

### 5.6 `Carousel.Counter`

| Prop            | 类型                            | 默认                           | 说明         |
| --------------- | ------------------------------- | ------------------------------ | ------------ |
| `format`        | `(current, count) => ReactNode` | `Slide ${current} of ${count}` | 文本格式。   |
| `className`     | `string`                        | —                              | 容器类名。   |
| 其他 `div` 属性 | —                               | —                              | 透传到容器。 |

行为：

- `count <= 1` 时不渲染。
- `aria-hidden="true"`，因为 slide 的 `aria-label` 已经提供位置；避免重复播报。
- P0 只做即时文本更新；P1 做当前数字的短位移动画。
- `format` 返回自定义节点时，P1 的数字动画只对默认格式生效；自定义格式由用户负责。
- reduced motion：立即替换，不滑动。

### 5.7 `useCarousel`

```ts
export interface UseCarouselReturn {
  api: CarouselApi | undefined;
  orientation: "horizontal" | "vertical";
  index: number;
  count: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
}

export function useCarousel(): UseCarouselReturn;
```

- 必须在 `Carousel` 内使用，否则抛出清晰错误。
- `api` 在挂载前为 `undefined`。
- `scrollPrev/Next` 在 api 未就绪时是 no-op。
- `scrollTo` 接受 snap index；`jump` 传给 Embla。

### 5.8 导出类型

```ts
export type CarouselApi = EmblaCarouselType;
export type CarouselOptions = EmblaOptionsType;
export type CarouselPlugin = EmblaPluginType;
```

不重新导出 `useEmblaCarousel`；需要底层能力的用户直接从 `embla-carousel-react` 导入。

## 6. 行为规格

### 6.1 滚动与吸附

- 默认 `align: "start"`（本项目选择），`containScroll: "trimSnaps"`（Embla 默认）。
- `opts.align` / `opts.containScroll` 可覆盖。
- 拖拽使用 Embla 原生物理吸附；不做自定义动画。
- 点击上一张/下一张调用 Embla；不做自定义 tween。
- 快速连续点击必须稳定落到有效 snap；不允许状态与视觉不同步。
- `dragFree: true` 时，dots/counter 反映最近的 snap；文档说明可能与拖拽位置有延迟。

### 6.2 loop

- 透传 `opts.loop`。
- slide 不足时 Embla 自动回退为 `false`；组件不复制 DOM。
- loop 且 slide 足够时，Prev/Next 在首尾不 disabled。
- `scale` + loop 需要更多 slide；开发期在数量不足时给出 warning（不阻断渲染）。

### 6.3 gap

- Root 设置 `--uk-carousel-gap`。
- Track 使用 negative margin，Item 使用同值 padding，`box-sizing: border-box`。
- 横向用 `margin-inline-start` / `padding-inline-start`；纵向用 block 方向。
- 默认 `gap: "0px"`；示例显式设置 `gap="1rem"`。
- `gap` 支持任意 CSS 长度/`calc()`；组件不做数值解析。

### 6.4 visible

- Root 设置 `--uk-carousel-visible`。
- Item `flex-basis: calc(100% / var(--uk-carousel-visible, 1))`。
- `visible` 为正数；小于 1 时 clamp 到 1；小数允许露出半张。
- 响应式：媒体查询覆盖 `--uk-carousel-visible` 即可，不需要 re-render。
- `scale` 模式需要 JS 计算更精确的 basis；CSS 值只作为首屏 fallback。

### 6.5 scale（P1，opt-in）

约束：

- 设置 `scale` 后，默认 `align: "center"`、`containScroll: false`；用户显式覆盖时尊重，但开发期 warning。
- `scale` 取值 0–1；`1` 等价于关闭效果；建议 0.7–0.9。
- `visible` 建议 ≥ 3；`scale` + `visible: 1` 没有可见邻居，应 warning。
- loop 时 slide 数建议 ≥ `2 * floor(visible / 2) + 3`；不足时 warning。
- 每个 `Carousel.Item` 内部渲染 inner wrapper；缩放和位移只作用于 inner。
- 中心 slide `scale: 1`，邻居按距离递减；远处 slide 可降低 opacity；`z-index` 中心最高。
- 只写 `transform` / `opacity` / `z-index`，不写布局属性。
- 测量只在 `reInit` / `resize`；滚动帧用 rAF 合并。
- 只更新中心附近窗口内的 slide；远处 slide 用静态值。
- reduced motion：跳过 scale，所有 inner 保持 `scale(1)`；不渲染逐帧更新。
- 屏幕外 slide 不默认 `inert` / `aria-hidden`；如果后续为了性能启用，必须跳过包含焦点的 slide，并保证 `watchFocus` 仍能把内容带入视口。
- SSR：首屏用 CSS fallback basis；挂载后细化；文档说明可能出现一次尺寸调整。

### 6.6 纵向

- `orientation="vertical"` → `axis: "y"`。
- Content 必须有明确高度；track `height: 100%`。
- `touch-action: pan-x pinch-zoom`。
- 上一张/下一张图标旋转 90°（上/下）。
- dots/counter 默认仍在下方；用户可自行布局。
- 纵向 + `visible` 的 flex-basis 相对 track 高度计算。

### 6.7 RTL

- 用户设置 `dir="rtl"`，并传 `opts.direction: "rtl"`。
- CSS 使用 logical properties，gap 在 RTL 下自动正确。
- 水平箭头的图标水平翻转；纵向箭头不翻转。
- Prev/Next 的“上一张/下一张”是逻辑顺序，不是视觉左右；文档说明。
- e2e 至少覆盖：RTL 下点击 Next，逻辑下一张进入视口。

### 6.8 受控 index

- `index` 提供即受控；`defaultIndex` 仅在非受控时生效。
- 优先级：`index` > 显式 `defaultIndex` > `opts.startIndex` > `0`。
- 未显式提供 `defaultIndex` 时，不要用默认值覆盖 `opts.startIndex`。
- 外部 index 变化 → `scrollTo(index)`；不重复触发 `onIndexChange`。
- 用户拖拽/点击 → `select` → 更新 index → `onIndexChange`。
- 初次挂载不触发 `onIndexChange`。
- `reInit` 后同步；index 超出范围时 clamp。
- 分组滚动时 index 是 snap index；文档用示例说明。

### 6.9 动态 slide / resize

- 默认 `watchSlides: true`；增删 slide 触发 `reInit`。
- `reInit` 后更新 count、canScroll、slide 标签、dots、counter。
- 视口尺寸变化触发 Embla `resize`；`scale` 模式重新测量。
- 不允许因为 slide 变化导致 carousel 重建（保持 DOM/焦点）。
- `Carousel.Item` 的 key 必须稳定；文档示例使用稳定 id。

### 6.10 空 / 单 slide

- 0 个 slide：不崩溃；Prev/Next disabled；dots/counter 不渲染；区域仍可访问。
- 1 个 slide：Prev/Next disabled；dots/counter 不渲染（或 counter 显示 1 of 1，二者择一，建议隐藏）。
- 需要 e2e 覆盖 0/1 slide 的挂载与卸载。

### 6.11 嵌套交互 / 拖拽 vs 点击

- slide 内的链接、按钮、输入框必须可正常点击/聚焦。
- Embla 的 `dragThreshold`（默认 10px）负责区分拖拽与点击；不额外加 click 拦截。
- 不做 root 方向键捕获；输入框内方向键保持原生行为。
- 嵌套 carousel 不作为 v1 验收项；文档标注“未测试”。

### 6.12 自动播放（非目标）

- v1 不提供 `autoplay` prop、暂停按钮或 `aria-live`。
- `plugins` 允许用户自行传 autoplay；文档明确：自动播放的可访问性（暂停、hover/focus 暂停、播报）由使用者负责。
- 后续若要内置，必须单独提案，包含 WCAG 2.2.2 的暂停机制。

## 7. 键盘与焦点

### 7.1 键盘

- 所有控件使用原生 `<button>`；Enter / Space 激活。
- 不做 root `onKeyDownCapture`；不劫持 ArrowLeft/ArrowRight/ArrowUp/ArrowDown。
- 用户通过 Tab 在 Prev/Next、dots、slide 内可聚焦元素之间移动。
- `watchFocus: true` 让 Tab 到屏幕外 slide 时自动滚入视口。
- 如果未来增加方向键，只在 viewport 自身获得焦点且焦点不在交互控件内时生效；v1 不做。

### 7.2 焦点

- 控件和 dots 有 `:focus-visible` 环；不依赖 hover。
- slide 内容可能被 viewport 裁切焦点环；文档建议使用 inset ring/`outline-offset` 负值。
- 不使用焦点陷阱（非模态）。
- 关闭/卸载时不强制恢复焦点。
- 快速拖动/点击后，焦点保持在触发控件上，不被抢走。
- 当 slide 被移出视口时，如果其中包含焦点，不得设置 `inert` / `aria-hidden`。

### 7.3 触屏

- 控件始终可见，不做 hover-only。
- 视觉尺寸 40px 左右，命中区域 ≥ 44×44 CSS px。
- dots 视觉小，但按钮命中区域 ≥ 24×24（尽量 44×44）。
- `touch-action` 按方向设置，允许页面在另一个轴滚动。
- 拖拽与点击的阈值由 Embla 处理。

## 8. ARIA 与屏幕阅读器

| 元素      | 角色/属性                                                                                              | 说明                          |
| --------- | ------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Root      | 有名称的 `<section>`（暴露 region）、`aria-roledescription="carousel"`、`aria-label`/`aria-labelledby` | 区域名称必须存在。            |
| Content   | 无角色                                                                                                 | 纯 viewport。                 |
| Item      | `role="group"`、`aria-roledescription="slide"`、`aria-label="x of y"`                                  | 自动标签，可覆盖。            |
| Previous  | `<button>`、`aria-label="Previous slide"`                                                              | 图标 `aria-hidden`。          |
| Next      | `<button>`、`aria-label="Next slide"`                                                                  | 图标 `aria-hidden`。          |
| Dots 容器 | `role="group"`、`aria-label="Slide controls"`                                                          | 可覆盖。                      |
| Dot       | `<button>`、`aria-label="Go to slide n"`、`aria-current="true"`                                        | 当前项标记。                  |
| Counter   | `aria-hidden="true"`                                                                                   | slide 标签已提供位置。        |
| 禁用控件  | 原生 `disabled`                                                                                        | 不使用 `aria-disabled` 模拟。 |

- 手动轮播不加 `aria-live`；只有自动播放才需要。
- `aria-roledescription` 使用英文默认值 "carousel" / "slide"；可被用户传入的属性覆盖。
- 所有默认文案英文，提供 `aria-label` / `label` / `format` 供本地化。
- slide 自动标签使用 `x of y`（例如 `2 of 5`），避免和 `aria-roledescription="slide"` 重复成 "slide ... slide"。

## 9. 动效规格

### 9.1 Motion gate

| 动效            | 频率              | 目的                  | 功能               | 驱动                  | reduced motion                             |
| --------------- | ----------------- | --------------------- | ------------------ | --------------------- | ------------------------------------------ |
| 吸附滚动        | 每天数十次        | 空间一致性 / 状态指示 | 让用户看到位置变化 | Embla JS transform    | 程序化切换 `scrollTo(..., true)`；拖拽保留 |
| 按钮按压        | 每天数十次        | 反馈                  | 即时按下反馈       | CSS（Button token）   | 保留颜色，去掉空间缩放（沿用现有 Button）  |
| 当前 dot        | 每次切换          | 状态指示              | 指示当前位置       | Motion 共享布局 / CSS | 立即切换                                   |
| Counter 数字    | 每次切换          | 状态指示              | 确认当前页         | Motion 短位移 / CSS   | 立即替换                                   |
| scale 邻居缩放  | 拖拽/滚动期间高频 | 空间一致性 / 聚焦     | 强调中心、建立层次 | rAF + CSS 变量        | 关闭 scale，保持原始尺寸                   |
| 远处 slide 淡出 | 随 scale          | 防止视觉拥挤          | 让中心更清楚       | CSS 变量              | 关闭，保持可见                             |
| 入场/退场       | 不适用            | —                     | —                  | —                     | 不做                                       |

没有命名的动画一律不加。Carousel 不做“卡片飞入”“逐帧弹跳”“自动呼吸”等装饰动效。

### 9.2 驱动选择

- 吸附/拖拽：Embla（必须）。
- 按钮按压：CSS（现有 Button）。
- dot 当前项：Motion `layoutId` 共享布局，或 CSS width/color transition；二选一，原型决定。
- counter：Motion `AnimatePresence` 短位移，或 CSS transform；二选一。
- scale：rAF + CSS 变量；不使用逐帧 React state，不使用 `transition: all`。
- 不新增动画运行时；Motion 已是仓库标准。

### 9.3 时长与曲线

- 复用 `motion.ts` 的 `INDICATOR_SPRING` / `UI_SPRING` / `REDUCED_MOTION_TRANSITION`。
- 如果 dot/counter 需要新的 spring，先复用现有 token；只有出现第二个使用场景才新增。
- Embla `duration` 统一放在一个模块常量里（默认 25，reduced motion 20）；不散落魔法数字。
- 不使用 `ease-in` 作为入场曲线。
- 不做超过 220ms 的常规控件动效；scale 跟随滚动，不受时长 token 约束。

### 9.4 reduced motion

- `useReducedMotion()` 为 true 时：
  - 程序化 Prev/Next/dot 切换用 `scrollTo(index, true)`；
  - `scale` 关闭，所有 inner `scale(1)`，不跑逐帧更新；
  - dot 不做布局动画；
  - counter 立即替换；
  - 保留颜色/边框/焦点变化；
  - 拖拽仍可用，Embla `duration` 设为最小推荐值 20。
- 不人为增加等待；不保留“为了动效”的延迟。
- 需要在 Playwright 里用 `emulateMedia({ reducedMotion: "reduce" })` 验证。

### 9.5 中断与快速操作

- 拖拽中点击 Prev/Next：Embla 重新指向目标；不允许动画队列堆积。
- 快速点击 10 次 Next：最终落到有效 snap；不出现 index 与视觉长期不一致。
- 动态增删 slide 时，正在进行的滚动应被 `reInit` 收敛到有效 snap。
- 组件卸载时取消 rAF、移除 Embla 事件监听、调用 `destroy()`（wrapper 已处理 destroy；自定义 effect 需清理）。

## 10. 视觉规格

### 10.1 CSS 变量

| 变量                            | 默认       | 说明                                                          |
| ------------------------------- | ---------- | ------------------------------------------------------------- |
| `--uk-carousel-gap`             | `0px`      | Root 设置，来自 `gap` prop。                                  |
| `--uk-carousel-visible`         | `1`        | Root 设置，来自 `visible` prop。                              |
| `--uk-carousel-scale`           | `1`        | `scale` prop 的目标值。                                       |
| `--uk-carousel-item-basis`      | —          | `scale` 模式下 JS 计算的 basis；无值时回退 `100% / visible`。 |
| `--uk-carousel-control-size`    | `2.5rem`   | 控件视觉尺寸。                                                |
| `--uk-carousel-control-hit`     | `2.75rem`  | 控件命中区域。                                                |
| `--uk-carousel-dot-size`        | `0.375rem` | dot 视觉直径。                                                |
| `--uk-carousel-dot-active-size` | `1.25rem`  | 当前 dot 的 pill 宽度。                                       |
| `--uk-carousel-slide-scale`     | `1`        | 每个 inner 的缩放，JS 写入。                                  |
| `--uk-carousel-slide-shift`     | `0`        | 每个 inner 的位移，JS 写入。                                  |
| `--uk-carousel-slide-opacity`   | `1`        | 每个 inner 的透明度，JS 写入。                                |
| `--uk-carousel-slide-z`         | `0`        | 每个 slide 的层级，JS 写入。                                  |

颜色、间距、圆角、时长、缓动全部使用现有 `--uk-*` token；不新增平行颜色/时长体系。

### 10.2 控件

- 复用 `Button`，默认 `variant="outline"`、`size="md"`、`iconOnly`。
- 圆角 `var(--uk-radius-full)`。
- 默认绝对定位在 viewport 内侧边缘，垂直居中；不依赖外部留白。
- 背景使用 `var(--uk-surface-raised)` + `var(--uk-border)`，保证在图片上可读；不使用重度 blur。
- hover 只改颜色/边框/背景；按下使用现有 `scale(0.97)`。
- `:focus-visible` 使用 `--uk-focus-ring`。
- 纵向：图标旋转 90°；RTL 水平：图标 `scaleX(-1)`。
- 触屏命中区域通过伪元素扩展到 `--uk-carousel-control-hit`。
- 控件永远可见；不做 hover 才显示。

### 10.3 Dots / Counter

- dots 容器在 Content 下方居中，间距 `--uk-space-2`。
- dot 视觉小、命中大；当前项用 pill/颜色/宽度区分，不能只靠颜色（形状也变化）。
- 当前项 `aria-current="true"`；视觉与 ARIA 同步。
- counter 使用 `--uk-text-sm`、`--uk-text-muted`；等宽数字（`font-variant-numeric: tabular-nums`）避免宽度跳动。
- 两者在 `count <= 1` 时隐藏。
- 亮/暗主题使用 token，不写死颜色。

### 10.4 状态

| 状态               | 表现                                    |
| ------------------ | --------------------------------------- |
| 默认               | slide 正常排列；控件可见                |
| hover（控件）      | 背景/边框变化；不做位移                 |
| focus-visible      | 2px 焦点环，偏移 2px                    |
| active（控件按下） | Button 现有 `scale(0.97)`               |
| disabled（边界）   | 原生 disabled，opacity 由 Button 处理   |
| 当前 dot           | pill/加宽 + `aria-current`              |
| 拖拽中             | 可选 `cursor: grabbing`；不改变布局     |
| reduced motion     | 无 scale/dot/counter 动画；颜色反馈保留 |

### 10.5 亮/暗与触屏

- 亮/暗主题通过 `light-dark()` token 自动适配；视觉快照覆盖两套主题。
- 触屏不依赖 hover；控件和 dots 始终可点。
- 图片 slide 建议在文档中使用 `object-cover`、固定 aspect ratio 和内部 inset ring，避免 outline 被 viewport 裁切。

## 11. 响应式与内容边界

- `visible` 用 CSS 变量；文档示例展示媒体查询覆盖。
- `gap` 可用 CSS 变量/媒体查询覆盖。
- 纵向必须设置高度；文档示例 `h-[320px]`。
- slide 内容默认 stretch；长内容由用户决定滚动/裁切；组件不强制等高。
- 变宽 slide：用户可覆盖 `flex-basis`；此时 `visible` 的等宽假设失效，文档说明。
- 大量 slide：基础版可工作；`scale` 模式建议 ≤ 30 个可见窗口内的 slide；不做虚拟化。
- 嵌套 carousel：不保证手势；文档标注未测试。
- RTL：logical properties；文档示例 `dir="rtl"` + `opts.direction`。
- `box-sizing: border-box` 必须在 Item 上显式设置，避免 padding 撑大宽度。

## 12. 测试与验收

### 12.1 单元测试（Vitest + jsdom）

Mock `embla-carousel-react`，覆盖：

- Root 渲染有名称的 `<section>`（region）、`aria-roledescription`。
- Content/Item/Previous/Next 在 Root 外抛错。
- Item 渲染 `role="group"`、`aria-roledescription="slide"`、自动标签（fake API/DOM）。
- Previous/Next 的 disabled 组合逻辑。
- `onClick` 的 `preventDefault()` 阻止滚动。
- 受控/非受控 index 的同步逻辑（fake API 触发 select）。
- `onIndexChange` 初次挂载不触发、拖拽/点击触发。
- Dots 渲染数量、`aria-current`、点击调用 `scrollTo`、`count <= 1` 隐藏。
- Counter 格式、`aria-hidden`、`count <= 1` 隐藏。
- `useCarousel` 在 Root 外抛错。
- reduced motion 分支（mock `useReducedMotion`）不执行 scale/dot/counter 动画分支。

不要把 Embla 的真实滚动放进 jsdom 测试。

### 12.2 e2e（Playwright）

至少覆盖：

1. 基础：3 张 slide，Next/Previous 改变可见 slide；边界 disabled。
2. loop：最后一张 Next 回到第一张；第一张 Previous 到 last。
3. 拖拽：鼠标拖动改变 snap；拖拽结束稳定吸附。
4. 快速点击：连续 10 次 Next 后处于有效 snap。
5. 受控 index：外部按钮改变 carousel；拖拽更新外部 readout。
6. Dots：点击第 3 个 dot，当前项和 carousel 同步。
7. Counter：切换后计数正确。
8. 纵向：`data-orientation="vertical"`，上下按钮工作，高度生效。
9. RTL：`dir="rtl"` + `direction: "rtl"`，Next 逻辑正确，图标翻转。
10. 动态 slide：添加/删除 slide 后 count、dots、标签更新。
11. 键盘：Tab 遍历控件；Enter/Space 激活；slide 内输入框按 ArrowRight 不切换 slide。
12. 焦点：Tab 到第 3 张 slide 内链接，链接进入视口；焦点不被抢走。
13. 屏幕外 slide：不在默认 DOM 中设置 `inert` / `aria-hidden`（或验证例外规则）。
14. reduced motion：程序化切换立即跳转；scale 为 1；dot/counter 无动画。
15. 0/1 slide：不崩溃，控件/dots/counter 状态正确。
16. scale（P1）：中心 slide scale≈1，邻居 <1；reduced motion 下全部为 1。

### 12.3 可访问性

- 把 Carousel 页面加入 `e2e/tests/a11y.spec.ts` 的 `COMPONENT_PAGES`。
- axe-core `wcag2a` / `wcag2aa` / `wcag21a` / `wcag21aa` 无 critical/serious 违规（沿用现有排除 color-contrast 的策略）。
- 手工检查：VoiceOver（macOS）读取 region 名称、slide `x of y`、dot 名称、按钮名称。
- 检查 disabled 按钮、`aria-current`、焦点顺序。
- 检查 reduced motion 下没有空间位移动画。

### 12.4 视觉

- 把 carousel 页面加入 `e2e/tests/visual.spec.ts`，亮/暗主题快照。
- 至少覆盖：基础、多图可见、dots、纵向。
- 快照更新需要 review，不盲目接受。
- 动画中间帧不做 CI 快照；用 computed style 断言。

### 12.5 人工验收

- Chromium（CI 已覆盖）。
- Safari：触摸/滚动/`touch-action`/焦点环/scale 渲染。
- Firefox：滚动吸附/transform。
- 移动端模拟：至少一个 390px 宽视口。
- 高对比度/强制颜色模式（Windows）抽查。
- 200% 缩放/长内容抽查。

### 12.6 性能

- 基础版：滚动期间无 React state 逐帧更新；Performance 面板无长任务。
- scale：20 slides、3–5 visible，拖动时目标 60fps；4× CPU throttle 下无明显卡顿。
- 包体：`dist/index.js` 不包含 Embla core；新增 gzip 约 12KB。
- 构建后 grep `dist/index.js` 确认 external import。
- 记录测量结果到 PR 描述；不把 FPS 作为 CI 断言。

### 12.7 验收标准

- [x] 所有 P0 行为在 Chromium e2e 通过。
- [x] 键盘/焦点/读屏语义通过 axe + 手工检查。
- [x] reduced motion 下无 scale/dot/counter 动画，程序化切换跳转。
- [x] 动态 slide、resize、0/1 slide 不崩溃。
- [x] 亮/暗视觉快照通过。
- [x] 构建 externalize 验证通过。
- [x] 文档页、API 表、演示、README、Changeset 完成。
- [x] P1 的 scale/dots/counter 未进入 M1；M2 再按原型和性能门槛评估。

## 13. 文档与发布

### 13.1 文档页

新增 `apps/docs/src/pages/carousel.tsx`，并注册：

- `apps/docs/src/routes.tsx`：`carousel: CarouselPage`
- `apps/docs/src/content/components.ts`：`path: "components/carousel"`、summary、tags
- 导航自动从 `componentMetas` 生成

文档内容（M1 最终版）。目录名称与 API / 组件名对应，不使用“主题 + 场景”的双层命名：

1. 引入
2. `visible`：商品卡片，`visible={2}`，说明 snap 数不等于 slide 数
3. `Carousel.Item`：变宽故事流，覆盖 `flex-basis`
4. `loop`：客户评价，文字型卡片
5. `index`：引导步骤，外部按钮 + 进度条 + `onIndexChange`
6. `orientation`：纵向议程，`visible={3}` 的紧凑行
7. `direction`：阿拉伯语商品
   - 明确写出问题：只设置 `dir` 不够，Embla 仍按 LTR 计算。
   - 明确写出用法：`dir="rtl"` + `opts.direction: "rtl"`。
   - 说明组件处理了什么：控件位置、箭头翻转、logical gap；不要手动反转 slides。
8. `useCarousel`：缩略图导航，读取 `index` 并调用 `scrollTo`
9. `setApi`：播放列表，用 `api.slideNodes()` 读取实际 slide 数，演示增删 / 0 张边界
10. `watchFocus`：搜索结果
    - 搜索框和链接放进 slide。
    - 给出两步操作说明：输入框内按 ←/→ 不切换；Tab 到屏幕外链接会滚入视口。
    - 给出反模式：不要用 root `onKeyDownCapture` 捕获方向键。
11. API 表
12. 可访问性说明
13. reduced motion 说明
14. 与 Embla 的关系 / 插件逃生舱
15. autoplay 非目标说明

内容贴边（变宽 slide、quote 文本、表单、右侧标签）时，示例改用 `useCarousel` 把控件放到内容外，避免默认浮层按钮遮挡内容。

避免使用外链图片；用 CSS 渐变媒体区 + 真实文案卡片（商品、故事、评价、议程、缩略图、播放列表、搜索结果），保证离线和 CI 稳定。

### 13.2 README / 包元数据

- `README.md` 组件列表增加 Carousel。
- `packages/ui/package.json` keywords 增加 `carousel`、`embla`、`slider`。
- 如果使用 dependencies 方案，安装说明不需要额外步骤；否则补 `pnpm add embla-carousel-react`。
- 文档站安装说明如有 peer 依赖，也同步。

### 13.3 构建

- `packages/ui/src/styles.css` 增加 `@import "./carousel.css";`。
- `packages/ui/vite.config.ts` external 增加：
  - `embla-carousel-react`
  - `embla-carousel`
  - 可选 `embla-carousel-reactive-utils`
- `packages/ui/package.json` dependencies：
  - `embla-carousel-react: "8.6.0"`
  - `embla-carousel: "8.6.0"`
- 构建后检查：
  - `dist/index.js` 只有 external import，没有 Embla core 代码；
  - `.d.ts` 能解析 Embla 类型；
  - `styles.css`/`styles.generated.ts` 包含 carousel 样式。

### 13.4 Changeset

- 新增组件是用户可见功能，按 Drawer 先例使用 **minor**（`0.15.0`），不是 patch。
- Changeset 文案示例：`新增 Carousel 组件：基于 Embla 的横向/纵向轮播，支持受控 snap 索引、可访问控件、RTL 与 reduced-motion 降级。`

## 14. 里程碑

### M1：基础版（P0）

范围：

- Root/Content/Item/Previous/Next
- 受控/非受控 snap index
- 横向/纵向、loop、gap、CSS visible
- 键盘/焦点/ARIA
- RTL
- reduced motion
- 单元 + e2e + a11y + 视觉
- 文档与 Changeset

不包含：

- `scale` 签名缩放效果
- `Carousel.Dots`
- `Carousel.Counter`
- autoplay

完成标准：

- 12.7 的 P0 项全部通过。
- 基础版可以独立发布；Dots/Counter/scale 作为 M2 增量。

### M2：签名效果（P1）

范围：

- opt-in `scale` + `visible`
- `Carousel.Dots` 基础共享 pill
- `Carousel.Counter` 数字滑动
- scale 性能/Safari 验收

前置条件：

- 三方向原型完成，用户选定方向。
- scale 性能达到 3.7 的目标，或明确降级为无 scale。
- 不达标时，M2 只交付 dots/counter，scale 延后。

### M3：非目标 / 后续提案

- 内置 autoplay（暂停按钮、aria-live、WCAG 2.2.2）
- 缩略图导航
- 多 carousel 同步
- 虚拟化
- Safari/Firefox CI
- 嵌套 carousel 手势

## 15. 已确认决策与剩余问题

### 15.1 已确认（2026-11-11）

| 决策          | 结果                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| 组合 API 命名 | `Carousel.Content` / `Carousel.Item` / `Carousel.Previous` / `Carousel.Next`。 |
| `scale`       | 不进入首个发布；M2 opt-in。                                                    |
| 默认 `align`  | `start`。                                                                      |
| 依赖形态      | `dependencies` + exact pin `8.6.0` + externalize。                             |
| RTL           | v1 支持并测试。                                                                |
| 受控 `index`  | 提供；语义为 snap index。                                                      |
| M1 范围       | 基础轮播；不含 `scale`、Dots、Counter。                                        |

### 15.2 剩余问题（不阻塞 M1）

| #   | 问题                          | 当前建议                                               |
| --- | ----------------------------- | ------------------------------------------------------ |
| 1   | Dots/Counter 是否紧随 M1 发布 | 作为 M2 增量；若需要更完整的首个版本，可单独确认提前。 |
| 2   | Dots 的 snap 语义             | 按 snap 计数；分组滚动时称 page。                      |
| 3   | 拉伸 dots pill                | M2 评估；M1 不实现。                                   |
| 4   | Counter 数字动画              | M2；默认格式才动画。                                   |
| 5   | 控件默认位置                  | viewport 内侧，始终可见。                              |
| 6   | 屏幕外 slide 是否 inert       | 默认不；靠 `watchFocus`。                              |
| 7   | 可访问名称类型约束            | 类型层面二选一必填。                                   |
| 8   | Counter 是否 `aria-hidden`    | M2 实现时默认为是。                                    |

## 16. Definition of Done

- [x] `Carousel` 及子部件导出，类型完整。
- [x] `carousel.css` 进入 `styles.css` 和生成产物。
- [x] Embla 依赖、external、lockfile 更新。
- [x] Carousel 单元测试、e2e、a11y、视觉快照通过。
- [x] reduced motion、键盘、焦点、RTL、纵向、动态 slide 已验证。
- [x] 文档页 + API 表 + 可访问性说明 + 示例完成。
- [x] README / keywords 更新。
- [x] Changeset（minor）添加。
- [x] `pnpm check`、`pnpm -r build` 通过。
- [x] 构建产物确认 externalize，无重复 Embla core。
- [ ] 完整 `pnpm test:e2e`：Carousel 相关全通过，但既有页面视觉快照有基线漂移，需独立刷新。
- [ ] 正式性能 trace：M1 没有逐帧自定义动画；基础版滚动由 Embla transform 驱动。仍建议在合并前用 Performance 面板做一次 20 slide 拖动记录。
- [x] `scale` 未进入 M1；M2 再按原型和性能门槛评估，不把未验证效果写进 M1 发布说明。

## 17. M1 实现记录（2026-11-11）

### 17.1 交付文件

- `packages/ui/src/Carousel.tsx`
- `packages/ui/src/carousel.css`
- `packages/ui/src/index.ts`、`packages/ui/src/styles.css`、`packages/ui/src/styles.generated.ts`
- `packages/ui/package.json`、`packages/ui/vite.config.ts`
- `packages/ui/src/__tests__/Carousel.test.tsx`
- `apps/docs/src/pages/carousel.tsx`、`apps/docs/src/routes.tsx`、`apps/docs/src/content/components.ts`
- `e2e/tests/carousel.spec.ts`、`e2e/tests/a11y.spec.ts`、`e2e/tests/visual.spec.ts`
- `e2e/screenshots/visual.spec.ts-snapshots/carousel-{light,dark}-chromium-darwin.png`
- `README.md`、`packages/ui/README.md`、`.changeset/carousel-component.md`

### 17.2 验证结果

| 检查              | 结果                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm check`      | 通过（格式、lint、typecheck、单元测试）                                                                     |
| `pnpm -r build`   | 通过（hooks、ui、docs）                                                                                     |
| Carousel 单元测试 | 14/14 通过                                                                                                  |
| Carousel e2e      | 10/10 通过                                                                                                  |
| Carousel a11y     | axe-core 无 critical/serious 违规                                                                           |
| Carousel 视觉快照 | 亮/暗 2/2 通过                                                                                              |
| 构建 externalize  | `dist/index.js` 只保留 `embla-carousel-react` import，无 Embla core 代码                                    |
| 完整 e2e          | 70 通过；12 个既有页面（button/checkbox/input/radio-group/switch/tabs）的视觉快照存在基线漂移，未在本轮修改 |

关于完整 e2e 的 12 个失败：它们都是与 Carousel 无关的既有页面视觉快照差异（包含页脚版本徽标等），本轮没有刷新这些基线，避免把无关视觉变化混进 Carousel 变更。Carousel 自身的 e2e、a11y、视觉快照全部通过。

### 17.3 M2 待办

- `scale` / `visible` 签名效果：需要三方向原型与 60fps 性能门槛。
- `Carousel.Dots`：共享 pill 或连续拉伸 pill。
- `Carousel.Counter`：默认格式的数字滑动。
- autoplay：仍为非目标；如果实现，必须补暂停按钮、hover/focus 暂停与 `aria-live`。
- 完整视觉基线刷新：作为独立改动处理，不混入 Carousel。
