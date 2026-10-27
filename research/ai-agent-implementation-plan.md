# seam ui-kit AI Agent 实施方案

> 日期：2026-10-27
> 状态：决策型调研结论，待实施
> 前置调研：`ai-component-assistant-tutorial.md`（方法论）+ Grilling Session（13 项决策）

---

## 0. 决策摘要

| 决策         | 选择                       | 影响                                            |
| ------------ | -------------------------- | ----------------------------------------------- |
| 自动化级别   | Level C（全自动）          | Agent 从 Issue 到 npm 发布全流程，无人工编辑    |
| 目标规模     | 72+ 组件（对齐 beui.dev）  | ROI 成立，10 天基础设施投入净省 13+ 天          |
| 设计决策模式 | 人定义模式模板 → AI 填参数 | 需要规格模板系统（阶段 1 交付物）               |
| 发布安全网   | 自动化测试完善后才自动发布 | 需要 Playwright + axe-core + 键盘验证（阶段 3） |
| 试点组件     | Tooltip                    | 中等复杂度，覆盖定位/键盘/无障碍/动效           |
| 技术方案     | GitHub Actions + AI Agent  | 复用现有 CI/CD，Issue 标签触发，开源友好        |
| AI 透明度    | 明确标注                   | commit + CHANGELOG 声明 AI 开发                 |
| 当前瓶颈     | 测试编写 + 视觉调优        | AI 恰好在这两项表现最强                         |

---

## 1. 架构总览

```text
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                                                         │
│  Issue (feature request)                                │
│    │                                                    │
│    ▼ 维护者打标签 ai-develop                             │
│  GitHub Actions: agent-dispatch.yml                     │
│    │                                                    │
│    ▼ 读取 Issue → 初始化 Run 目录 → 分配 Agent           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Agent 执行循环                        │  │
│  │                                                   │  │
│  │  Phase 1: 读取规格模板 + 相关组件 → 生成 spec      │  │
│  │  Phase 2: 记录决策                                │  │
│  │  Phase 3: 实现代码 + 样式 + 测试 + 文档            │  │
│  │  Phase 4: 运行验证管道                             │  │
│  │  Phase 5: 生成 Changeset + Draft PR               │  │
│  │                                                   │  │
│  │  验证通过 → 自动合并 + 自动发布                     │  │
│  │  验证失败 → 重试（最多 3 次）→ 超限则通知维护者       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  验证管道（Phase 4 详细展开）:                            │
│    ├── pnpm check (format + lint + typecheck + test)    │
│    ├── Playwright 截图（亮/暗主题 × 视口尺寸）            │
│    ├── axe-core 无障碍扫描                               │
│    ├── 键盘遍历（Tab/Escape/Arrow/Space/Enter）           │
│    └── reduced-motion 快照对比                           │
│                                                         │
│  发布管道（验证通过后）:                                  │
│    ├── Changeset → Version Packages PR → 自动合并        │
│    └── npm Trusted Publishing → seam-react 发布           │
└─────────────────────────────────────────────────────────┘
```

### 1.1 核心设计原则

1. **规格先行**：Agent 不会在没有 spec 的情况下写代码
2. **模式复用**：设计模式由人预先编码进模板，Agent 只做参数填充和组合
3. **验证即信任**：自动化测试的覆盖度就是你对 AI 产出的信任凭证
4. **失败即停止**：同一错误 3 次修复失败 → 通知维护者，不会带着 bug 继续走
5. **透明标注**：所有 AI 生成的 commit 和 CHANGELOG 条目都明确标注

---

## 2. 分阶段实施路线图

### 阶段 1：规格模板系统（1-2 天）

**目标**：定义足够丰富的规格模板，让 Agent 有模式可遵循。

**交付物**：

```
.agent/
├── patterns/
│   ├── overlay.md           # Dialog / Tooltip / Popover / Toast 共享模式
│   ├── form-control.md      # Input / Select / CheckBox / Switch 共享模式
│   ├── navigation.md        # Tabs / Sidebar 共享模式
│   └── inline.md            # Button / Badge / Marquee 共享模式
├── templates/
│   ├── spec.md              # 组件规格模板
│   ├── task.md              # 需求输入模板
│   └── decisions.md         # 决策记录模板
└── docs/
    └── pattern-guide.md     # 如何为新组件选择和扩展模式
```

**每个模式文件包含**：

```markdown
# Overlay Pattern

## 适用组件

Dialog, Tooltip, Popover, Toast

## 键盘行为

- Escape 关闭（可配置）
- Tab 焦点陷阱（Dialog）或不陷阱（Tooltip）
- 聚焦恢复到触发器

## ARIA 模式

- role: dialog | tooltip | alertdialog | status
- aria-modal: true（仅 Dialog）
- aria-describedby / aria-labelledby

## 动效参数

- overlay-enter: 220-260ms, ease-out
- overlay-exit: 160-220ms, ease-out
- 禁止大幅位移动画
- 退出由 Motion 管理

## 边缘情况

- 嵌套 overlay 的 top-layer 处理
- 内容溢出视口的碰撞检测
- 触发器被移除后的清理
```

**验证标准**：用一个新组件（如 Badge）手工填写模板，确认模板覆盖了所有设计决策且没有留空白。

---

### 阶段 2：验证管道基础设施（3-5 天）

**目标**：建立 Agent 产出必须通过的安全网。

**交付物**：

```text
packages/ui/e2e/
├── playwright.config.ts
├── fixtures/
│   ├── docs-page.ts        # 加载文档站页面的 helper
│   └── theme.ts            # 亮/暗主题切换 helper
├── tests/
│   ├── a11y.spec.ts        # axe-core 扫描所有组件 demo 页面
│   ├── keyboard.spec.ts    # 键盘遍历 + 焦点管理
│   ├── visual.spec.ts      # Playwright 截图对比
│   └── reduced-motion.spec.ts
└── screenshots/
    ├── light/
    └── dark/
```

**验证管道包含以下检查**（每个检查失败都阻止发布）：

| 检查               | 工具                                          | 通过标准                         |
| ------------------ | --------------------------------------------- | -------------------------------- |
| 格式 + lint + 类型 | oxfmt + oxlint + tsrs                         | 零错误                           |
| 单元 + 交互测试    | Vitest + Testing Library                      | 全部通过                         |
| axe-core 扫描      | Playwright + @axe-core/playwright             | 零 violation                     |
| 键盘遍历           | Playwright keyboard API                       | 所有可交互元素可达，焦点管理正确 |
| 视觉回归           | Playwright screenshot diff                    | 与基线截图一致                   |
| reduced-motion     | Playwright + `prefers-reduced-motion: reduce` | 无空间位移                       |
| 亮/暗主题          | Playwright + theme fixture                    | 两套主题均无布局断裂             |
| 构建               | `pnpm build`                                  | 零错误                           |

**CI 集成**：在现有 `ci.yml` 中添加 `e2e` job，所有 PR 必须通过。

**验证标准**：对现有 12 个组件（Button 到 Tooltip）运行完整管道，全部通过。

---

### 阶段 3：Agent 工作流搭建（3-4 天）

**目标**：建立从 Issue 到 Draft PR 的自动化工作流。

**GitHub Actions 文件**：

```yaml
# .github/workflows/agent-dispatch.yml
name: AI Component Agent
on:
  issues:
    types: [labeled]

jobs:
  develop:
    if: github.event.label.name == 'ai-develop'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4

      - name: Parse Issue
        id: parse
        run: |
          # 从 Issue body 提取组件名、类型、需求
          # 写入 .agent/runs/<id>/task.md

      - name: Run Agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # 调用 Agent（Codex CLI / Claude Code / 自定义脚本）
          # Agent 按 Phase 1-5 执行
          # 输出代码 + 测试 + 文档 + Changeset

      - name: Run Verification Pipeline
        run: |
          pnpm check
          pnpm --filter seam-react test
          npx playwright test

      - name: Create Draft PR
        if: success()
        run: |
          # 创建分支，提交代码，创建 Draft PR
          # PR body 链接 spec、decisions、evidence

      - name: Notify on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            # 在 Issue 上评论失败原因和日志链接
```

**Agent 运行时选择**：

| 选项                           | 优点                                | 缺点                           |
| ------------------------------ | ----------------------------------- | ------------------------------ |
| Codex CLI (headless)           | 已有 MCP 工具链，AGENTS.md 原生支持 | 需要 OpenAI API key，运行成本  |
| Claude Code (headless)         | 同上，Anthropic 生态                | 需要 Anthropic API key         |
| 自定义脚本 (OpenAI Agents SDK) | 最大控制力，可以精确控制每步        | 开发成本高，需要自己写工具调用 |

**推荐**：先用 Codex CLI headless 模式（`codex --headless`），因为它已经理解 AGENTS.md 和 MCP 工具链。后续如需更精细控制再迁移到自定义 Agent。

**验证标准**：用一个 Issue 触发，Agent 能自动完成从读取模板到创建 Draft PR 的全流程。

---

### 阶段 4：自动合并与发布（2-3 天）

**目标**：验证通过后自动合并和发布，实现 Level C。

**流程**：

```text
Draft PR 创建
  → CI 全部通过（包括 e2e 验证管道）
  → GitHub Actions 自动将 Draft → Ready
  → 自动合并到 main
  → Changesets 自动创建 Version Packages PR
  → 自动合并 Version Packages PR
  → npm Trusted Publishing 自动发布
```

**安全限制**：

| 变更类型                 | 自动发布？ | 条件                                    |
| ------------------------ | ---------- | --------------------------------------- |
| patch（bug fix）         | ✅ 是      | CI + e2e 全通过                         |
| minor（新组件）          | ✅ 是      | CI + e2e 全通过 + axe-core 零 violation |
| major（breaking change） | ❌ 否      | 必须人工 Approve                        |
| 首次发布新组件           | ✅ 是      | 同 minor                                |
| 修改已有组件的公开 API   | ❌ 否      | 必须人工 Approve                        |

**标记 AI 开发**：

```yaml
# Changeset 文件自动生成
---
"seam-react": patch
---

feat(ui): add Tooltip component

🤖 Developed by AI Agent (Codex) under human-defined spec patterns.
Verified: unit tests, axe-core, keyboard, visual regression, reduced-motion.
```

**验证标准**：从 Issue 打标签到 npm 发布，全流程无人工干预完成。

---

### 阶段 5：Tooltip 试点 + 迭代（2-3 天）

**目标**：用真实组件验证整条流水线，暴露问题，迭代改进。

**试点计划**：

1. 创建 Issue：`feat: add Tooltip component`，标签 `ai-develop`
2. Agent 自动执行全流程
3. 人工检查 Draft PR 的 spec 是否合理、代码是否符合 DESIGN.md
4. 观察 npm 发布结果
5. 记录发现的问题，改进模板和工作流

**预期暴露的问题类别**：

| 问题                     | 解决方向               |
| ------------------------ | ---------------------- |
| Agent 选错了键盘模式     | 改进模式模板，明确定义 |
| 测试覆盖不够             | 增强 e2e 管道的断言    |
| 视觉细节不符合预期       | 增加截图基线           |
| Agent 卡在某个错误上循环 | 调整停止条件           |

**验收标准**：Tooltip 在 npm 上可用，所有验证通过，文档站展示正确，无障碍扫描零 violation。

---

## 3. 时间线汇总

| 阶段           | 工作量        | 累计   | 里程碑                  |
| -------------- | ------------- | ------ | ----------------------- |
| 1 规格模板     | 1-2 天        | Day 2  | 模板覆盖所有组件类型    |
| 2 验证管道     | 3-5 天        | Day 7  | 现有 12 组件全部通过    |
| 3 Agent 工作流 | 3-4 天        | Day 11 | Issue → Draft PR 自动化 |
| 4 自动发布     | 2-3 天        | Day 14 | Issue → npm 全自动      |
| 5 Tooltip 试点 | 2-3 天        | Day 17 | 第一个 AI 开发组件上线  |
| **总计**       | **~11-17 天** |        |                         |

**降级方案**：如果阶段 5 的 Tooltip 试点暴露的问题超出预期，可以降级到 Level B（自动 Draft PR → 人工 Approve → 自动合并发布），仍然比当前半天/组件快，因为测试编写（最大瓶颈）已自动化。

---

## 4. 风险清单

| 风险                       | 概率 | 影响 | 缓解措施                                             |
| -------------------------- | ---- | ---- | ---------------------------------------------------- |
| Agent 在复杂组件上失败     | 中   | 高   | 降级到 Level B；模式模板不断迭代                     |
| 自动发布的组件有 bug       | 低   | 高   | 阶段 2 验证管道 = 安全网；npm patch 可快速修复       |
| API key 泄漏（CI secrets） | 低   | 高   | GitHub Actions secrets 已加密；限制仓库权限          |
| 设计模式模板不覆盖新场景   | 中   | 中   | 维护者持续更新模板；Agent 遇到未知模式时停下通知     |
| 开源社区对 AI 开发有疑虑   | 低   | 中   | 透明标注（Q12=A）；完善的测试覆盖是信任凭证          |
| Agent token 成本过高       | 低   | 低   | 单组件开发预估 ~$2-5 API 费用；可在 Issue 关闭后停止 |
| CI 运行时间过长            | 中   | 低   | Playwright 并行化；缓存 node_modules 和浏览器        |

---

## 5. 成本估算

| 项目                   | 单次成本                     | 月成本（假设 10 次组件开发） |
| ---------------------- | ---------------------------- | ---------------------------- |
| AI API（Codex/Claude） | ~$2-5 / 组件                 | ~$20-50                      |
| GitHub Actions runner  | ~$0.5 / 运行（公开仓库免费） | ~$0                          |
| npm 发布               | 免费                         | $0                           |
| **总计**               |                              | **~$20-50 / 月**             |

对比：当前 10 个组件 × 4 小时 = 40 小时人工时间。

---

## 6. 与现有仓库的关系

| 现有资产                        | 在 Agent 系统中的角色            |
| ------------------------------- | -------------------------------- |
| `AGENTS.md`                     | Agent 的系统指令，Agent 必须遵循 |
| `DESIGN.md`                     | Agent 的设计契约，Agent 不能违反 |
| `CONTRIBUTING.md`               | Agent 的发布规则参考             |
| `.github/workflows/ci.yml`      | 复用，增加 e2e job               |
| `.github/workflows/release.yml` | 复用，不修改                     |
| `packages/ui/src/`              | Agent 的读取源和写入目标         |
| `docs/`                         | Agent 写文档 demo 的目标         |
| `component-releases.json`       | Agent 自动更新                   |

---

## 7. 下一步行动

1. **确认本方案** → 维护者审阅并确认方向
2. **开始阶段 1** → 编写规格模板系统（1-2 天）
3. **开始阶段 2** → 搭建 Playwright + axe-core 验证管道（3-5 天）
4. 阶段 1-2 完成后 → 回顾是否继续阶段 3-5
