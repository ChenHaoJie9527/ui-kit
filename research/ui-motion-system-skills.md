# Emil Kowalski skills 与 ui-kit 动效体系

> Historical research: Tactile and Expressive are now references only. Fluid is
> the selected production motion language. See `DESIGN.md` for the final rules.

调研日期：2026-10-21

## 结论

`emilkowalski/skills` 很适合帮助 agent 做动效设计、实现、审查和性能诊断，
但它不应成为 `seam-react` 的运行时依赖，也不应把仓库中的每条强规则原样变成
组件 API 或 lint 规则。

建议把它放在“开发期 agent 工具”层：

- 用 `animate` 指导新动效的具体取值和实现。
- 用 `review-animations` 审查动效 diff。
- 用 `animation-performance` 定位掉帧。
- 用 `find-animation-opportunities` 做低频、阶段性的机会扫描。
- 用 `prototype` 做少数真正需要审美取舍的组件方向探索。

组件库自身仍需要维护一套更小、更稳定、可测试的 motion system，包括 token、
语义配方、Motion 配置、reduced-motion 策略和 review checklist。第三方 skills
提供判断方法，不拥有最终规则。

## 仓库事实

仓库地址：<https://github.com/emilkowalski/skills>

README 把仓库定位为帮助设计师和工程师更快做出更好的 UI 决策，并称其内容来自
作者在 Vercel 和 Linear 的工作经验。仓库提供：

```bash
npx skills@latest add emilkowalski/skills
```

来源：[README](https://github.com/emilkowalski/skills/blob/main/README.md)

许可证为 MIT：
[LICENSE](https://github.com/emilkowalski/skills/blob/main/LICENSE)。

截至调研日，`skills/` 下有 15 个 skill：

| Skill                          | 作用                               | 与 ui-kit 的关系                   |
| ------------------------------ | ---------------------------------- | ---------------------------------- |
| `animate`                      | 从零设计并实现一个动效             | 核心                               |
| `review-animations`            | 严格审查动效                       | 核心                               |
| `improve-animations`           | 扫描代码库并生成修复计划           | 做一次基线审计时使用               |
| `find-animation-opportunities` | 寻找值得增加的动效                 | 低频使用，避免过度动画             |
| `animation-performance`        | 排查卡顿与主线程问题               | 核心                               |
| `animation-vocabulary`         | 用准确术语描述动效                 | 设计讨论时使用                     |
| `apple-design`                 | 流体界面、手势、spring、材质与排版 | 选择性采用                         |
| `prototype`                    | 同时构建多个真实可交互方向         | 阶段性设计探索                     |
| `mobile-native`                | 移动端触控与原生感细节             | 发布前检查                         |
| `break-ui`                     | 用现实最坏数据压测 UI              | 组件质量检查                       |
| `pick-ui-library`              | 从作者偏好列表选择库               | 与已经决定采用 Motion 的目标弱相关 |
| `emil-design-eng`              | 综合设计工程哲学                   | 作为原则参考                       |
| `animate-expo`                 | React Native / Expo                | 当前不适用                         |
| `write-swift`                  | Swift                              | 不适用                             |

来源：
[skills 目录](https://github.com/emilkowalski/skills/tree/main/skills)、
[README Reference](https://github.com/emilkowalski/skills/blob/main/README.md)。

## 值得吸收的方法

### 1. 先判断是否应该动画

`animate` 和 `find-animation-opportunities` 都把“是否应该动”放在工具、时长和
缓动之前。它们按使用频率分档：

- 每天 100 次以上或键盘触发：通常不动画。
- 每天几十次：只做极轻或极短的反馈。
- 偶发：Modal、Drawer 可使用标准动画。
- 罕见/首次：允许更多 delight。

来源：
[animate](https://github.com/emilkowalski/skills/blob/main/skills/animate/SKILL.md)、
[find-animation-opportunities](https://github.com/emilkowalski/skills/blob/main/skills/find-animation-opportunities/SKILL.md)。

对 `ui-kit` 的启发：不要把“所有组件都要有漂亮动效”设为目标。组件库应该让
高频、键盘驱动和纯信息场景很容易保持静止。

### 2. 动效必须有语义

技能要求每个动效明确属于以下用途之一：反馈、空间一致性、状态指示、避免突兀
变化、解释或稀有场景的 delight。

对 `ui-kit` 的启发：非语义的弹簧、悬浮抖动和装饰性微动画不应进入通用组件。
`center-morph` 是一次有明确空间意义的入场/退场，不是单纯给对方“加个动画”。

### 3. 先选最便宜的工具

`animate` 的工具体系是：

1. CSS transition。
2. CSS `@starting-style`。
3. CSS animation。
4. WAAPI。
5. Motion：spring、layout、exit、手势驱动。

来源：
[animate](https://github.com/emilkowalski/skills/blob/main/skills/animate/SKILL.md)。

这与“引入 Motion”并不冲突。正确落点是：

- Button、Input、Switch、Tabs 等简单状态继续保持 CSS。
- Dialog 的退出生命周期和后续手势组件使用 Motion。
- 不把所有 CSS 过渡重写成 Motion。

### 4. 动效必须有统一词汇

建议采用的进入/退出配方来自：

- Button press：`scale(0.97)`，100–160ms，强 ease-out。
- Modal：中心 origin，`scale(0.96)` + opacity，约 250ms ease-out。
- Popover：从 trigger origin 出现，`scale(0.95)` + opacity，约 200ms。

来源：
[animate RECIPES](https://github.com/emilkowalski/skills/blob/main/skills/animate/RECIPES.md)。

Modal 明确是 `transform-origin: center` 的例外；不要为了“origin-aware”把 Modal
错误绑定到某个 trigger。

### 5. 性能规则应进入工程验收

`animation-performance` 建议优先 transform / opacity，明确避免 `transition:
all` 和逐帧 React state，警惕继承 CSS 变量的重算、过大 blur、过大的合成层。
它也允许对 clip-path 等属性做跨浏览器验证，而不是一概禁止。

来源：
[animation-performance](https://github.com/emilkowalski/skills/blob/main/skills/animation-performance/SKILL.md)、
[performance-cheatsheet.md](https://github.com/emilkowalski/skills/blob/main/performance-cheatsheet.md)。

### 6. Prototype 之后再做 API

`prototype` 要求先做 3 个真正不同且可交互的方向，由用户选择后再进入生产代码。
它反对用三个颜色差异伪装成三个方案。

来源：
[prototype](https://github.com/emilkowalski/skills/blob/main/skills/prototype/SKILL.md)。

对 `ui-kit` 的启发：先做 `Quiet / Tactile / Expressive` 三个 Dialog 或整体
interaction demo，再决定哪些动效进入默认值，而不是先设计大量 props。

## 不应直接照搬的部分

### 1. 不把全部 15 个 skill 都安装到日常上下文

仓库覆盖面很大，包含 Swift、Expo、Sonner 和库选择。全部安装会让 agent 在任务
开始时面对大量不适用的规则。对当前组件库，优先采用 `animate`、
`review-animations`、`animation-performance`；其余按需使用。

这是基于仓库 inventory 的适配建议，不是上游的硬性结论。

### 2. 不把强偏好直接变成不可变 lint 规则

例如“UI 动画必须低于 300ms”和仓库自身对 Modal 200–500ms 的
配方存在适用范围差异；“永不动画键盘操作”也是产品策略，不是所有模态关闭都应
立即跳变。它们是判断启发式，应结合频率和语义使用。

同样，skill 中关于 Motion transform shorthand 是否硬件加速的描述需要以当前
Motion 版本和真实浏览器 profiling 为准，不能只靠规则文字决定实现。

来源：
[emil-design-eng](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md)、
[animate RECIPES](https://github.com/emilkowalski/skills/blob/main/skills/animate/RECIPES.md)、
[animation-performance](https://github.com/emilkowalski/skills/blob/main/skills/animation-performance/SKILL.md)。

### 3. 不把第三方 skill 当作稳定 API

仓库没有面向 npm 的语义化版本，skill 文本会继续演进。团队应固定采用的 commit
或在自有 skill 中提炼规则，而不是假设未来内容不变。MIT 许可证允许再利用，但
复制实质内容时要保留许可声明。

## ui-kit 当前动效基线

当前实现已有一些好基础：

- 使用命名的 `--uk-transition`，没有大面积 `transition: all`：
  [tokens.css](../packages/ui/src/styles/tokens.css:57)。
- Dialog 从 `scale(0.98)` 进入，没有从 `scale(0)` 出现：
  [dialog.css](../packages/ui/src/dialog.css:83)。
- `prefers-reduced-motion` 已覆盖 token 与 Dialog。

但系统还没有真正形成：

- 一个 duration scale，目前只有单一 160ms transition token。
- 独立的 enter / move / continuous / expressive easing token。
- Button 的 `:active` 按压反馈。
- 统一的 hover capability gating。
- Motion 的时间、spring 与 reduced-motion 配置。

关键位置：

- [button.css](../packages/ui/src/button.css:16)
- [dialog.css](../packages/ui/src/dialog.css:19)
- [switch.css](../packages/ui/src/switch.css:25)
- [tabs.css](../packages/ui/src/tabs.css:13)

## 推荐的 motion system

### 1. 风格定位

建议把 `ui-kit` 的动效人格定义为：

> Quiet, precise, tactile. Expressive only by opt-in.

即默认克制、精确、有触感；高表现力动效只在显式选择时出现。默认不使用弹跳和
overshoot，spring 留给手势、拖拽和可中断交互。

### 2. Token

CSS 与 Motion 应共享同一组语义，而不是各自发明数值：

```css
--uk-duration-fast: 120ms;
--uk-duration-base: 160ms;
--uk-duration-control: 200ms;
--uk-duration-overlay: 240ms;
--uk-duration-expressive: 430ms;

--uk-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--uk-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--uk-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

这些是起点，不应在未做视觉比对前直接宣布为最终品牌曲线。`center-morph`
当前仍使用自身的 430ms 与 cubic-bezier 配方，因为它属于 expressive 动效，
不能被 base 的 160ms token 强行压缩。

Motion 侧可提供对应的 JS 常量：

```ts
export const durations = {
  fast: 0.12,
  base: 0.16,
  control: 0.2,
  overlay: 0.24,
  expressive: 0.43,
} as const;

export const easeOut = [0.23, 1, 0.32, 1] as const;
export const easeInOut = [0.77, 0, 0.175, 1] as const;

export const springs = {
  ui: { type: "spring", duration: 0.4, bounce: 0 },
  gesture: { type: "spring", duration: 0.4, bounce: 0.15 },
} as const;
```

建议先保持 token 内部使用，等 API 和语义稳定后再公开导出。

### 3. 语义配方

| 语义          | 默认实现      | 规则                                               |
| ------------- | ------------- | -------------------------------------------------- |
| Press         | CSS           | `scale(0.97)`，120–160ms ease-out                  |
| Hover         | CSS           | 只提供颜色/表面变化；使用 hover capability query   |
| Control state | CSS           | Switch/checkbox 等短 transform + color             |
| Overlay enter | Motion        | opacity + scale(0.96)，中心 origin                 |
| Overlay exit  | Motion        | AnimatePresence + useIsPresent，退场迅速且不可交互 |
| Disclosure    | CSS/Motion    | 高度或布局动画必须有限定范围，做性能验证           |
| Gesture       | Motion spring | 从 current value 重定向，保留 velocity             |
| Expressive    | Motion opt-in | Center Morph 等低频品牌场景                        |

### 4. Reduced motion

不要只把全部时长改为 0。更合理的降级是：

- 去掉位移、缩放、折叠和弹跳。
- 保留 100–160ms 的 opacity/color 变化，帮助理解状态切换。
- 不因动画结束回调切到错误分支；presence 逻辑必须与视觉时长解耦。

### 5. 审查与验收

建议建立 `review-animations` 风格的 PR checklist：

- 动效是否有明确用途。
- 是否符合该组件的使用频率。
- 是否复用现有 token。
- 进入/退出是否在空间上一致。
- 是否从合理的 scale/origin 开始。
- 是否可中断；快速重复操作是否稳定。
- 是否动画 transform/opacity/clip-path，其他属性是否有理由。
- 是否处理 reduced motion、hover capability、focus。
- 是否在真实中端手机、Safari/Firefox 验收。
- 是否在 2–5 倍慢速下逐帧检查。

## 建议落地顺序

1. 先固定 `ui-kit` 自己的 Motion 引入方式和 `MotionConfig` 策略。
2. 用 `prototype` 方法做 3 个真正不同的动效方向 POC，而不是直接改全部组件。
3. 选一个方向，提炼 duration/easing/spring token 和 reduced-motion 策略。
4. 用 Motion 实现 `center-morph` Dialog，作为第一个 presence 样板。
5. 用 `review-animations` 审查实现，并按发现修正。
6. 再把同一套模式迁移到未来 Drawer/Popover。
7. 高频、键盘驱动和纯信息场景默认无动画，避免为了统一而过度动画。

## 最终判断

这套 skills 对 `ui-kit` 有实际价值，最大价值不在于“让 AI 更有品味”的口号，
而在于把模糊的审美变成可讨论的决策顺序、具体数值和可执行审查表。

推荐采用其中 3–5 个与当前任务直接相关的 skill，并在此基础上形成 project-local
的 `seam-motion` skill；不建议把整个仓库视为组件库规范，也不建议让第三方 opinion
直接冻结 `ui-kit` 的品牌动效。
