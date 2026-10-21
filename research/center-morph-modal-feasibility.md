# Center Morph Modal 分析与 ui-kit 可行性

> Historical research: the final product decision is Fluid, implemented across
> all six primitives. `center-morph` is not part of the initial production
> migration. See `DESIGN.md` for the authoritative design contract.

调研日期：2026-10-21

## 结论

`Center Morph Modal` 的视觉效果高度可移植到当前 `ui-kit`。用户已明确希望把
Motion 作为组件库的正式动效层，因此建议引入 npm 包 `motion`，使用
`motion/react` 的 `motion`、`AnimatePresence`、`useIsPresent` 和
`useReducedMotion`，而不是继续用 CSS 手动模拟 AnimatePresence。

推荐把它实现为现有 `Dialog` 的可选动效变体，例如
`motion="center-morph"`，但仍保留当前原生 `<dialog>`、受控 API 和无障碍能力，
不复制 beUI 的整套自绘模态层和组合式 API。

- Motion 可以直接驱动 `clipPath: inset(...)`，不需要测量面板尺寸。
- `ui-kit` 已有原生 `<dialog>`、顶层渲染、Esc/遮罩关闭、焦点陷阱、焦点恢复与
  body 滚动锁定，可继续复用。
- AnimatePresence 会保留正在退出的 `DialogLayer` 子树，动画结束后才卸载，从
  结构上解决原生 dialog 立即消失的问题。
- 真正的新增复杂度在 Dialog 外壳拆分、关闭请求收敛和 Motion 的加载/配置边界。

可行性判断：

| 维度       | 判断         | 说明                                                             |
| ---------- | ------------ | ---------------------------------------------------------------- |
| 视觉还原度 | 高           | 固定圆角 + 中心裁切即可复现主要观感，不需要共享布局动画          |
| 跨浏览器   | 高           | `clip-path` 已广泛支持；需做 Chromium、Safari、Firefox 视觉验收  |
| 新增依赖   | `motion`     | 使用 `motion/react`；建议基准版本 `^14.4.0`                      |
| 实现复杂度 | 中           | 需要拆分常驻 Dialog 外壳和可退出的原生 dialog 子树               |
| 可访问性   | 可高于原实现 | 直接复用 `useFocusTrap`、`useLockBodyScroll` 和原生 dialog 语义  |
| 推荐优先级 | 中高         | 适合作为显眼的品牌级确认框或营销弹窗，不建议设为默认 Dialog 动效 |

## Motion 引入评估

以下为 Motion 官方文档和 npm registry 中的事实：

1. 包名是 `motion`，安装命令为 `pnpm add motion`，React API 从
   `"motion/react"` 导入。Motion 文档要求 React 18.2 或更高版本。
   <https://motion.dev/docs/react-installation>
2. `AnimatePresence` 用于在 React 子节点移除时执行 `exit` 动画。直接子节点需要
   稳定且唯一的 `key`，并且 `AnimatePresence` 自身必须位于条件渲染之外。
   <https://motion.dev/docs/react-animate-presence>
3. `useIsPresent()` 可以在退出期间让交互层立即变成 `inert`；
   `onExitComplete` 可用于退出动画真正结束后的收尾。
   <https://motion.dev/docs/react-animate-presence#access-presence-state>
   <https://motion.dev/docs/react-animate-presence#onexitcomplete>
4. `MotionConfig reducedMotion` 默认值是 `"never"`。若希望自动尊重系统设置，
   应显式传入 `"user"`；`useReducedMotion()` 可用于把大幅几何动画替换成透明度
   过渡。
   <https://motion.dev/docs/react-motion-config#reducedmotion>
   <https://motion.dev/docs/react-accessibility>
5. 官方体积说明指出：普通 `motion` 组件最低约 43 kB；`m` + `LazyMotion` 初始约
   5 kB，启用 `domAnimation` 再加约 24 kB；`useAnimate` mini 约 3.3 kB。
   <https://motion.dev/docs/react-reduce-bundle-size>
6. npm registry 的 `motion@14.4.0` 声明 React/React DOM 对等依赖为
   `^18.0.0 || ^19.0.0`，`sideEffects: false`，当前直接依赖为 `tslib` 和
   `framer-motion`。
   <https://registry.npmjs.org/motion/latest>

建议结论：当前只有一个 Dialog 动效需求时，普通 `motion` + `AnimatePresence`
实现最直接，先接受约 43 kB 的声明式动画运行成本；如果项目后续会大量使用动效，
再统一迁移到 `LazyMotion`，不要在第一批实现里同时引入两种模式。`ui-kit` 的
构建必须先验证树摇和外部化结果，不能把整个 Motion 重复打进组件库产物。

## beUI 的实现事实

信息来自组件页的 Code、Usage、API Reference 和实时预览：

<https://beui.dev/components/motion/center-morph-modal>

### 1. 结构

组件由以下部分组成：

- `CenterMorphModal`：Context Provider，支持受控与非受控开关。
- `CenterMorphModalTrigger`：用 `cloneElement` 给一个子按钮注入点击行为及
  `aria-haspopup="dialog"`、`aria-expanded`、`aria-controls`。
- `CenterMorphModalContent`：Portal 到 `document.body`，渲染遮罩、居中层和
  `role="dialog"` 面板。
- `CenterMorphModalClose`：可选的组合式子元素关闭按钮。

内容组件公开的主要 props 为：

- 必填 `ariaLabel`
- 可选 `ariaDescribedBy`
- `dismissible`，默认 `true`
- `showCloseButton`，默认 `true`
- `closeButtonLabel`
- `className`
- `backdropClassName`

### 2. 动效不是 layout morph

面板本身保持固定宽度和布局，动画只改变裁切区域：

```text
打开前：inset(48% 48% 48% 48% round 30px)
打开后：inset(0% 0% 0% 0% round 30px)
```

因此视觉上像一张面板从正中心向四周展开，实际上没有改变 DOM 尺寸、位置或共享
布局。源码注释还特别说明：圆角保持常量，避免复杂 clip-path 在收尾阶段跳变。

主要时序：

- 面板展开/折叠：`430ms`
- 展开缓动：`cubic-bezier(0.2, 0, 0.2, 1)`
- 遮罩淡入淡出：`280ms`
- 关闭按钮：延迟 `160ms` 后淡入并缩放
- `prefers-reduced-motion`：取消裁切/缩放，退化为约 `140ms` 的透明度过渡

面板在展开前内容已经渲染，只是被裁切；因此文字不会像逐个元素弹出的效果。

### 3. 深度和遮罩

- 遮罩是覆盖全屏的 `motion.button`，带背景色、透明度和 `backdrop-filter` 模糊。
- 面板外层使用 `drop-shadow`，让阴影跟随裁切后的可见轮廓。
- 内容居中区域保留视口安全边距，并允许纵向滚动。
- 面板使用 `will-change: clip-path`。

### 4. 退出与焦点

- `AnimatePresence` 在关闭时保留 DOM，直到退出动画结束。
- `PresenceGate` 使用 `useIsPresent()` 在退出开始时立即将交互层设为
  `pointer-events: none`，并通过 `inert` 移出焦点顺序。
- 打开时锁定 body 滚动，并在下一帧聚焦面板中的第一个可聚焦元素。
- 关闭后把焦点恢复到 Trigger。
- 使用 `window` 级 `keydown` 处理 Esc 和正反向 Tab 循环。

## 不应直接照搬的部分

### 1. 依赖范围

beUI 的页面列出的依赖包括 `motion`、`lucide-react`、`clsx` 和
`tailwind-merge`。Motion 是本项目明确要引入的正式动效层，但其余 Tailwind、
`clsx` 和图标依赖不应随本次迁移一起进入 `seam-react`。

### 2. 自绘模态底层

beUI 使用普通 Portal 和 `role="dialog"` 自建模态层。`ui-kit` 已基于原生
`<dialog>.showModal()`，天然拥有 top layer、模态语义和浏览器关闭请求处理。移植
视觉动效时继续使用原生 dialog，可以避免重复实现且减少层级穿透问题。

### 3. 全局焦点与滚动实现

beUI 直接在 `window` 上处理键盘，并直接覆写 body overflow。`ui-kit` 的
`useFocusTrap` 已处理最上层陷阱、外部聚焦回收和退出后的焦点恢复；
`useLockBodyScroll` 使用引用计数，更适合嵌套弹窗。应继续使用这两个现有能力。

### 4. 完整组合式 API

当前 `Dialog` 是受控 API，已有 `open`、`onOpenChange`、标题、描述、footer 和
关闭选项。为了一个视觉变体新增 Trigger/Content/Close 三层 Context，会增加 API
表面积，并与当前组件的使用方式不一致。优先添加一个动效 prop。

## 推荐实现方案

### API

建议保持向后兼容：

```tsx
<Dialog open={open} onOpenChange={setOpen} motion="center-morph" title="...">
  ...
</Dialog>
```

默认仍使用当前 `uk-dialog-in`，只有显式选择 `center-morph` 才启用新动效。

后续如确实需要品牌级速度调节，可以再增加受控的 CSS 变量，而不是暴露大量
JavaScript 动效参数。

### 生命周期

推荐把 `AnimatePresence` 作为常驻外壳，把原生 dialog 内容放进条件渲染的
`DialogLayer`：

```text
Dialog
└── MotionConfig
    └── AnimatePresence
        └── open ? <DialogLayer key="dialog" /> : null
            └── native <dialog> + motion panel
```

实现约束：

1. `DialogLayer` 挂载后调用原生 `showModal()`；`open=true` 时面板执行
   `initial → animate`。
2. `open=false` 时 `AnimatePresence` 保留 `DialogLayer`，面板执行 `exit`，
   动画完成后再卸载整棵子树，原生 dialog 随之退出 top layer。
3. `useFocusTrap` 和 `useLockBodyScroll` 放在 `DialogLayer` 内，生命周期覆盖
   整个退出动画，焦点恢复发生在最终卸载时。
4. 使用 `useIsPresent()` 标记退出的视觉层，立即设置 `inert` 和
   `pointer-events: none`，避免用户在折叠过程中继续操作。
5. 快速重新打开时依赖稳定的 `key` 让 AnimatePresence 复用或重新挂载同一面板；
   不能把 `AnimatePresence` 本身放进 `open && ...` 条件里。
6. 使用 `useReducedMotion()` 显式把中心折叠替换成短透明度过渡。不能只依赖
   `MotionConfig`：官方默认 `reducedMotion` 是 `"never"`，且自动策略只保证关闭
   transform/layout 动画，不保证任意 clip-path 动画符合 reduced-motion 语义。

### Esc 和原生 `cancel`

原生 dialog 的 Esc 默认会立刻关闭，导致无法播放退出动画。启用 center-morph
时，应：

- 在 `closeOnEscape=true` 且可关闭时拦截 `cancel` 的默认行为。
- 改为调用 `onOpenChange(false)` 启动视觉退出。
- 让 AnimatePresence 在折叠结束后卸载 dialog，并避免卸载期间重复触发
  `onOpenChange(false)`。
- `closeOnEscape=false` 时继续保持当前修复后的强阻止行为。

### Motion 轮廓

可增加独立的 `.uk-dialog--center-morph` 外壳，并由 Motion 驱动：

- `initial` / `exit` 使用 `clipPath: inset(48% 48% 48% 48% round 30px)`。
- `animate` 使用 `clipPath: inset(0% 0% 0% 0% round 30px)`。
- `transition` 使用 `duration: 0.43`、`ease: [0.2, 0, 0.2, 1]`。
- 阴影放在不裁切的外层，避免 `box-shadow` 被 clip-path 切掉。
- 面板的最大高度和现有 `.uk-dialog__body` 内部滚动继续有效。
- 原生 `::backdrop` 无法直接渲染为 `motion` 节点，继续用 CSS 在
  present/exiting 状态间做透明度过渡。

不需要 ResizeObserver，也不需要读取面板的宽高。

### 包与构建边界

- 安装并声明 `motion` 为 `seam-react` 的运行时依赖，不能只放
  `devDependencies`。基准版本建议从 `^14.4.0` 开始并锁定同一个小版本系列。
- 在 Vite library config 中把 `motion` 和 `motion/react` 加入
  `rollupOptions.external`，否则会把 Motion 重复打入 `seam-react` 产物，也会
  破坏消费者树摇。
- 不引入旧的 `framer-motion` 包名，统一从 `"motion/react"` 导入。
- `motion/react` 在 Next.js App Router 中需要 Client Component 边界；组件库
  构建和文档需要验证 `"use client"` 语义。
- 当前 `seam-react` 的 React peer 范围是 `>=18`，Motion 安装文档要求 18.2+。
  如果 Motion 成为无条件的生产依赖，应评估把 peer 最低版本收紧到 18.2，并
  用 Changeset 标明兼容性影响。
- 如果希望基础 Dialog 完全不为 Motion 付体积，可后续提供
  `seam-react/motion` 子路径或独立 motion 包；第一版直接放主包更简单，但应在
  bundle analysis 中明确新增成本。

## 风险与缓解

| 风险                                   | 影响                   | 缓解                                                   |
| -------------------------------------- | ---------------------- | ------------------------------------------------------ |
| 原生 dialog 关闭过早                   | 没有退场动画           | 拦截 `cancel`/Esc，由 AnimatePresence 延迟卸载子树     |
| AnimatePresence 被条件卸载             | 退场动画完全不执行     | 外壳常驻，条件渲染只放在 AnimatePresence 内部          |
| 快速连续开关                           | 动画状态错乱、重复回调 | 稳定 key，关闭统一走 requestClose，避免直接 close()    |
| Motion 被重复打包                      | 主包明显膨胀           | external 配置、产物扫描、bundle size 基线              |
| MotionConfig 默认不遵从 reduced motion | 无障碍回退失效         | 显式 `useReducedMotion()`；全局可配 `"user"`           |
| clip-path 与阴影被裁切                 | 视觉边缘生硬           | 裁切面板、阴影放外层 wrapper                           |
| 长内容与移动端                         | 折叠中心偏移或溢出     | 保持视口安全边距和内部滚动，必要时改用短淡出           |
| `backdrop-filter + drop-shadow` 性能   | 低端设备掉帧           | 控制面板面积，验证帧率；按设备降级为透明度过渡         |
| 父组件条件卸载 Dialog                  | 无法播放退场           | 文档明确要求 Dialog 保持挂载，只切换 `open`            |
| 与“不可轻易关闭”逻辑冲突               | 双重关闭或关闭保护失效 | Esc、backdrop、button 全部汇聚到同一 requestClose 路径 |

## 工作量

- 视觉 POC：约 0.5–1 个工作日，可完成中心展开和基础遮罩。
- 达到可发布质量：约 2–3 个工作日，包含 Motion 依赖/构建配置、
  AnimatePresence 生命周期、Esc/重开边界、减弱动效、单元测试、文档演示和
  三浏览器视觉验收。

## 建议落地顺序

1. 引入 `motion`，补齐 external、直接依赖和 bundle size 基线。
2. 把 Dialog 拆为常驻外壳与条件渲染的 DialogLayer，先用 Motion 复刻默认
   fade-scale 以验证 AnimatePresence 与原生 dialog 生命周期。
3. 在现有 Dialog 增加 `motion="center-morph"`，不改默认行为。
4. 补齐快速重开、Esc、`closeOnEscape=false`、焦点恢复与 reduced-motion 测试。
5. 增加 shared motion tokens、文档 Demo，并完成 Chrome、Safari、Firefox 的
   视觉/性能检查后再发布。
