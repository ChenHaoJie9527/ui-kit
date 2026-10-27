# 从零开始：为 seam UI 构建 AI 组件开发助手

这份教程面向没有 AI Agent 开发经验、但熟悉基本前端开发和 Git 的读者。目标不是立刻做出一个大型平台，而是先把“一个组件从需求到发布”的流程变成 AI 可以稳定执行、人工可以检查的工作系统。

## 1. 先建立一个正确的心智模型

AI 组件助手不是一个无所不知的聊天窗口，也不是把所有历史都塞给模型的“大数据库”。

更准确的构成是：

```text
能推理的模型
  + 能执行任务的工具
  + 明确的流程和停止条件
  + 可检索的仓库资料
  + 可检查的任务产物
  + 自动化的 CI 和发布系统
```

模型负责判断、生成和诊断；脚本负责确定性操作；Git、GitHub、npm 和 CI 负责保管事实。

### 1.1 几个常见术语

| 术语              | 通俗解释                                          |
| ----------------- | ------------------------------------------------- |
| 模型              | 理解需求、写代码、分析错误                        |
| Agent             | 模型 + 工具 + 执行循环                            |
| Tool              | Agent 可以使用的终端、文件、浏览器、GitHub 等能力 |
| Context           | 模型某一次调用真正看到的内容                      |
| Memory            | 以后任务可以复用的工作方法                        |
| Artifact          | 本次任务生成、可供人检查的文件或结果              |
| Compaction        | 长任务中的上下文压缩                              |
| Eval              | 用固定测试题衡量助手是否可靠                      |
| Human-in-the-loop | 关键决策和不可逆操作由人确认                      |

### 1.2 最重要的原则

> 聊天记录不是项目记录。

组件规格、设计决策、测试结果和发布事实必须写入文件或外部系统。聊天上下文可以压缩、截断甚至丢失，但仓库和发布记录不能依赖聊天记忆。

## 2. 当前 ui-kit 已经具备什么

这个仓库已经有一半以上的基础：

- `AGENTS.md` 规定执行顺序和工作边界
- `DESIGN.md` 规定视觉、动效和无障碍契约
- `CONTRIBUTING.md` 规定提交、Changeset 和发布
- 组件实现、样式、测试和文档都在仓库中
- `.github/workflows/ci.yml` 运行完整检查
- `.github/workflows/release.yml` 处理 Changesets 发布
- `.github/workflows/pages.yml` 部署文档站
- `scripts/publish-npm.mjs` 发布 npm 包
- `scripts/update-component-releases.mjs` 自动维护新组件发布时间
- `component-releases.json` 驱动侧边栏的 `New` 标识

因此第一步不是“开发一个 AI 平台”，而是把现有规范组织成 Agent 可以稳定遵循的流程。

## 3. 数据从哪里来

不要建立一个包含所有信息的单一数据库。保持每种事实由最可靠的系统拥有。

| 数据类型           | 权威来源                           |
| ------------------ | ---------------------------------- |
| 当前代码           | Git 工作区                         |
| 代码历史           | Git commits                        |
| 分支、PR、Review   | GitHub                             |
| CI、构建、发布结果 | GitHub Actions                     |
| npm 版本和发布时间 | npm registry                       |
| 设计规则           | `DESIGN.md`                        |
| 提交和发布规则     | `CONTRIBUTING.md`                  |
| 组件生命周期       | 组件发布台账                       |
| 当前开发状态       | 任务运行目录                       |
| 外部 UI 参考       | 固定版本的上游源码、文档和 License |

### 3.1 四种数据不要混淆

#### 永久事实

例如：

- 组件在哪个版本发布
- 哪个 PR 合并了它
- 谁批准了合并
- npm 实际发布时间
- 组件何时被废弃

这些数据应该永久保留。

#### 当前任务状态

例如：

- 当前正在实现哪个组件
- 已经确认哪些 API
- 哪些问题还没解决
- 下一步要运行什么命令

这些数据属于一次任务，可以归档或清理。

#### 证据

例如：

- 测试输出
- CI Run ID
- 浏览器截图
- 无障碍树
- 性能数据

保存摘要、关键文件和链接，不必把所有完整日志永久复制到仓库。

#### 工作记忆

例如：

- “新组件开始前必须读取完整 DESIGN.md”
- “公开 API 变化必须有 Changeset”
- “第三方库只能作为参考，不能直接复制 API”

这里保存的是以后做类似任务时仍然有用的方法，不是某个组件的具体实现。

## 4. Context 是什么

Context 是模型在当前一次调用中看到的一切。它通常包括：

- 系统和工作区指令
- 用户的需求
- 最近对话
- Agent 选中的源码
- 测试失败日志
- 截图或浏览器状态
- 之前生成的阶段摘要

Context 不是数据库，也不是永久记忆。

### 4.1 Context 应该动态组装

开发 Tooltip 时，不需要把整个仓库放进去。应该只选择：

```text
用户需求
+ AGENTS.md 的执行规则
+ DESIGN.md 的相关部分
+ Tooltip 的源码和测试
+ 最接近的 Dialog 浮层实现
+ 当前失败日志或截图
+ 相关设计决策和发布记录
```

无关的 Hooks、其他组件和完整 Git 历史留在工作区，等需要时再读取。

### 4.2 Context 的来源优先级

推荐按以下顺序选择信息：

1. 当前用户要求和已确认决策
2. 仓库规则
3. 当前相关源码和测试
4. 当前失败证据
5. 组件历史和外部参考
6. 不相关的长日志和历史对话

前面的内容优先级更高，后面的内容只有在确实相关时才加载。

## 5. Context 压缩是什么

长任务会超过模型一次可以处理的上下文长度，因此需要压缩。

压缩的目标不是“删掉旧对话”，而是保留后续阶段需要的工作状态，减少无关 token。

### 5.1 正确顺序

```text
重要结论写入任务文件
  ↓
保存证据链接
  ↓
压缩当前 Context
  ↓
下一阶段需要时重新读取文件
```

### 5.2 每个阶段都应该留下

- 已确认需求
- 已确认 API
- 关键设计决策
- 当前实现状态
- 已失败并排除的假设
- 剩余问题
- 修改文件列表
- 验证命令和证据
- 下一步动作

### 5.3 压缩后必须保留的内容

```text
目标：实现可访问的 Tooltip
已确认：Root / Trigger / Content 与 Group / Item
已决定：120ms presence，关闭时由 Motion 管理退出
未解决：嵌套 Dialog 中的 top-layer 定位
当前证据：Tooltip 13 个测试通过，公网 New 标识已验证
下一步：确认 npm 0.3.0 registry 传播
```

不要只保留“继续刚才的工作”这类无法恢复状态的信息。

### 5.4 不要依赖压缩后的 Context 保存事实

以下事实必须写入文件：

- API 决策
- 测试结果
- 发布版本
- npm 发布时间
- PR 和 commit
- License 和参考来源

## 6. 一个组件会反复返工，流程应该怎么建

不要设计成：

```text
需求 → 一次实现 → 发布
```

应该设计成状态机：

```text
需求
  → 规格
  → 原型
  → 人工选方向
  → 实现
  → 自动检查
  → 浏览器验证
  → 诊断
  → 修改
  → 再次验证
  → Review
  → 发布
  → 维护 / 废弃
```

### 6.1 每轮返工只记录增量

不要保存所有完整终端输出。每轮记录：

```text
Iteration 3

假设：
Tooltip 第一次出现时从左上角飞入，是因为定位前已经参与 layout 动画。

修改：
定位完成前保持 hidden，首次布局不播放 layout。

验证：
Tooltip 翻转测试通过。
浏览器中首次出现只做透明度缩放，不再从 0,0 移动。

结果：
通过。
```

### 6.2 给 Agent 设置停止条件

- 同一错误连续修复三次仍无进展：停止并报告
- 需要改变公开 API：等待人工确认
- 需要选择视觉方向：展示原型并停止
- 需要删除数据或正式发布：等待人工批准
- 设计规范与需求冲突：先报告冲突

## 7. 参考其他 UI 库和阅读源码

外部参考会增加信息量，但只要按需读取并记录来源，不会让系统失控。

### 7.1 建立参考登记表

```json
{
  "id": "radix-tooltip",
  "url": "https://github.com/radix-ui/primitives",
  "versionOrCommit": "固定版本或 commit",
  "license": "MIT",
  "usedFor": ["键盘关闭行为对比", "碰撞定位方案"],
  "decision": "只参考行为，不复制 API 和实现"
}
```

### 7.2 阅读源码的流程

1. 固定版本或 commit
2. 确认 License
3. 只打开相关组件和测试
4. 写出关键行为差异
5. 判断是否适合当前设计系统
6. 记录哪些代码属于参考、哪些属于原创实现
7. 不把整个第三方仓库复制进 Context

本项目要求外部设计作为参考，最终 API 必须适配自己的 React、CSS、Token 和可访问性约定。

## 8. 建议的任务工作区

每个组件开发任务创建一个独立目录：

```text
.agent/runs/tooltip-2026-10-21/
  manifest.json
  task.md
  spec.md
  decisions.md
  plan.md
  references.json
  evidence.json
  checkpoint.md
  screenshots/
  logs/
```

### 8.1 manifest.json

```json
{
  "runId": "tooltip-2026-10-21",
  "component": "Tooltip",
  "type": "new-component",
  "baseBranch": "main",
  "workBranch": "codex/tooltip-component",
  "status": "verification",
  "startedAt": "2026-10-21T00:00:00Z",
  "updatedAt": "2026-10-21T07:40:00Z"
}
```

### 8.2 spec.md

```markdown
# Tooltip

## Purpose

显示简短的补充说明，不承载交互内容。

## States

- closed
- open
- switching

## Public API

- Tooltip.Root
- Tooltip.Trigger
- Tooltip.Content
- Tooltip.Group
- Tooltip.Item

## Keyboard

- 聚焦触发器后显示
- Escape 关闭，不移动焦点

## Accessibility

- role="tooltip"
- 显示时合并 aria-describedby
- 内容不进入 Tab 顺序

## Failure States

- 无触发器
- 引用元素不存在
- 内容溢出视口

## Motion Gate

- 高频解释性界面
- 目的：避免突然出现
- 200ms 内完成
- 禁止大幅位移动画

## Compatibility

新增组件，不修改已有 API。
```

### 8.3 decisions.md

```markdown
# Decisions

## D1：使用共享 Tooltip 表面对话

日期：2026-10-21
决定：多个相邻标签共享一个表面
原因：用户希望视觉上表现为切换，而不是重复打开和关闭
备选：每个触发器拥有独立 Tooltip
结果：采用共享表面
```

## 9. 第一版应该怎么开始

不要从“大平台”开始。第一版只需要一个可重复的人工触发流程。

### 第一步：准备组件输入模板

建议用户每次提供：

```text
我要开发：Badge
目标用户：后台系统
必须支持：状态、可关闭、长文本
明确不支持：富文本、异步加载
参考：某 UI 库的 Badge
是否需要视觉原型：可以由助手判断
```

需求越明确，Agent 越不容易自行补出不存在的产品要求。

### 第二步：让 Agent 先输出规格

此阶段禁止修改代码。只允许读取仓库并输出：

- 最接近的现有组件
- 可复用 API 和 Token
- 新组件状态模型
- 键盘和焦点
- 失败状态
- 动效判断
- 测试计划
- 需要用户确认的问题

人工确认规格后再进入实现。

### 第三步：生成实现任务

实现阶段按以下顺序：

1. 代码
2. 样式
3. 测试
4. 文档
5. Changeset
6. 自动检查
7. 浏览器验证

### 第四步：生成 Draft PR

Draft PR 应该包含：

- 行为规格
- 关键决策
- 验证命令
- 测试结果
- 浏览器验证摘要
- 截图或 Run 链接
- 已知限制

不要自动合并或发布。

## 10. 怎样组织 Context

推荐实现一个 `Context Builder`，它不是模型，而是一个普通函数：

```ts
function buildContext(run: AgentRun) {
  return [
    read("AGENTS.md"),
    readRelevantSections("DESIGN.md", run.component),
    read(run.specPath),
    read(run.decisionPath),
    read(run.checkpointPath),
    searchSource(run.component),
    readLatestFailure(run),
    readRelevantLedgerEntries(run.component),
  ];
}
```

不同阶段使用不同 Context。

### 规格阶段

- `AGENTS.md`
- `DESIGN.md`
- 相近组件源码和测试
- 组件台账

### 实现阶段

- 已确认 spec
- decisions
- 相关源码
- 当前测试失败

### 验证阶段

- 修改文件
- CI 失败日志
- 浏览器截图
- 无障碍树
- 验收清单

### 发布阶段

- Changeset
- package 版本
- CI 结果
- PR 和 merge commit
- npm 与 Pages 状态

## 11. Compaction 应该发生在什么节点

不要在每一轮对话后都压缩。选择有意义的阶段边界：

- 规格确认后
- 原型方向确定后
- 第一版实现完成后
- 浏览器问题诊断完成后
- PR 提交前
- 发布完成后

压缩前先更新 `checkpoint.md`：

```markdown
# Checkpoint

## Current Goal

完成 Tooltip 的键盘和组合切换验证。

## Confirmed Facts

- 使用 Motion 管理退出生命周期
- 共享 Group 表面
- Escape 不移动焦点

## Changed Files

- packages/ui/src/Tooltip.tsx
- packages/ui/src/tooltip.css

## Evidence

- Tooltip tests: 13 passed
- release workflow: success
- npm latest: 0.3.0

## Open Questions

- 无

## Next Step

检查公网 New 标识 30 天窗口。
```

## 12. Memory 应该保存什么

Memory 适合保存工作方法和用户偏好，不适合保存组件的唯一事实。

### 适合保存

- 新组件必须先建立基线
- 公开 API 变化必须写 Changeset
- 浮层退出使用 Motion presence
- 设计冲突时停止并报告
- 用户偏好先看规格再看代码

### 不适合保存

- “Tooltip 当前有 13 个测试”
- “0.3.0 在某个时间发布”
- “某个 PR 的 merge commit”
- “某个第三方组件完整源码”

后者应该进入任务证据、组件台账或 Git。

## 13. 组件发布台账

建议长期保存：

```json
{
  "component": "Tooltip",
  "version": "0.3.0",
  "summary": "延迟显示、键盘和触屏支持、组合切换浮层",
  "source": {
    "branch": "codex/tooltip-component",
    "pullRequest": 6,
    "mergeCommit": "7fb435ac1415bf1c314bd574adca443ca87a4d04"
  },
  "timeline": {
    "mergedAt": "2026-10-21T07:35:12Z",
    "publishedAt": "由 npm registry 自动获取",
    "docsDeployedAt": "由 Pages workflow 自动获取"
  },
  "verification": {
    "ciRun": "自动获取",
    "releaseRun": "自动获取",
    "pagesRun": "自动获取",
    "uiTests": 47
  },
  "people": {
    "author": "GitHub PR",
    "merger": "合并记录",
    "publisher": "github-actions[bot] via npm OIDC"
  }
}
```

不要让模型手动编造这些数据，应从 GitHub、Actions 和 npm 自动采集。

## 14. 如何测试 AI 助手本身

准备固定评测任务：

1. 增加一个 Button 尺寸
2. 修复 Dialog 焦点恢复
3. 增加 Tooltip 组合切换
4. 修改一个 breaking API
5. 判断某个动画是否应该存在
6. 废弃并移除一个组件
7. 参考第三方 UI 库但不复制 API
8. 处理 CI 中仅浏览器出现的问题

每个任务观察：

- 是否先读规则
- 是否建立现有组件基线
- 是否先写行为规格
- 是否正确停下来请求决策
- 首次 CI 是否通过
- 是否遗漏测试或 Changeset
- 是否验证浏览器和可访问性
- 是否产生无关改动

### 推荐指标

- 首次 CI 通过率
- PR Review 修改次数
- 规则遗漏率
- 视觉回归数量
- 无障碍回归数量
- 人工介入次数
- 平均 token 成本
- 任务完成时间

不要只评价“代码看起来不错”。

## 15. 分阶段路线图

### 阶段 1：手工可重复

- 写任务模板
- 写 spec 模板
- 写 checkpoint 模板
- 用一个真实组件完整执行
- 不自动合并

### 阶段 2：仓库工具化

- 建立 `runs/`
- 建立参考登记表
- 建立组件发布台账
- 用脚本收集 CI、npm 和 GitHub 数据
- 生成 Draft PR 摘要

### 阶段 3：自动验证

- Playwright 截图
- 键盘和焦点自动化
- 无障碍树检查
- reduced-motion 检查
- 明暗主题检查

### 阶段 4：Issue 驱动

- 从 Issue 读取需求
- 自动创建任务目录
- 生成规格和 Draft PR
- CI 和验证报告自动回写
- 人工 Review 与合并

### 阶段 5：长期维护

- 自动更新组件台账
- 自动识别废弃关系
- 自动生成迁移说明
- 根据历史失败改进 Eval 和流程

## 16. 上生产前必须建立的边界

- 不把密钥放进 Context
- 不把未经审查的 Memory 当事实
- 不允许 Agent 自行修改发布权限
- 不允许自动合并 breaking change
- 不允许自动发布 npm，除非已经有人明确批准
- 第三方源码必须确认 License
- 外部网页和源码视为不可信输入
- 所有外部写入都需要明确授权

## 17. 你的第一个可执行练习

选择一个小型组件，例如 Badge，按以下顺序完成：

1. 创建 `.agent/runs/badge-YYYY-MM-DD/`
2. 填写 `task.md`
3. 让助手只生成 `spec.md`，不写代码
4. 人工确认规格
5. 生成 `decisions.md`
6. 实现、测试、文档和 Changeset
7. 运行 `pnpm check`
8. 构建 package 和文档
9. 写 `evidence.json`
10. 编写 `checkpoint.md`
11. 创建 Draft PR
12. 不自动合并
13. 合并和发布后写入组件台账

这套练习完成后，再考虑增加浏览器 Agent、Memory 和 Issue 自动触发。

## 18. 最小成功标准

第一版 AI 组件助手不需要像商业产品一样复杂。满足以下条件就已经有价值：

- 每次任务都能找到相似组件
- 每次任务都先输出规格
- 关键设计决策可追溯
- 修改后自动运行正确检查
- 失败时不会假装完成
- 发布信息可以自动收集
- 所有不可逆动作都有人工批准
- 新任务可以使用上一轮留下的方法，但不会把旧事实当新事实

## 19. 术语速查

### Token

模型处理文本的基本单位。代码、日志和截图描述都会占用 Context。上下文越长，成本和延迟通常越高。

### Retrieval

先从仓库或资料库中找出相关片段，再提供给模型。优先使用 `rg`、符号搜索和结构化查询；资料规模很大时再考虑 embedding 或向量检索。

### Embedding

把文本转成向量，用于语义相似搜索。它不是必需品。当前仓库规模下，`rg`、精确路径和 JSON 查询通常更可靠。

### Agent Loop

模型决定下一步、调用工具、读取结果、继续决定的循环。

### Tool Result

工具返回的内容，例如文件、命令输出、测试日志和页面结构。

### Compaction

把长任务状态压缩成更小、可继续执行的上下文。

### Memory

跨任务保存的可复用经验和工作偏好。

### Artifact

这次任务生成的可检查产物，例如规格、测试结果、截图和发布记录。

### Eval

用固定任务和判定标准反复评估 Agent。

## 20. 官方参考

- [Building Reliable Agents with Memory and Compaction](https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction)

官方文档强调三个职责分离：

- Compaction 帮助当前长任务继续
- Memory 帮助以后类似任务复用工作方法
- 经过 Review 的 Artifact 才是事实来源

这正好对应本教程的核心设计：

```text
Context 帮助当前一步工作
任务文件帮助整个任务继续
Memory 帮助以后任务做得更好
Git / CI / npm / 组件台账保存最终事实
```
