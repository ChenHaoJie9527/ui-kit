import { useState } from "react";
import { Button, Tooltip } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

function BasicDemo() {
  return (
    <Tooltip.Root delayDuration={250}>
      <Tooltip.Trigger>
        <Button variant="ghost" iconOnly aria-label="复制链接">
          ↗
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>复制当前页面链接</Tooltip.Content>
    </Tooltip.Root>
  );
}

const placements = [
  { side: "top", align: "center", label: "顶部居中" },
  { side: "right", align: "center", label: "右侧" },
  { side: "bottom", align: "center", label: "底部居中" },
  { side: "left", align: "center", label: "左侧" },
  { side: "top", align: "start", label: "顶部起点对齐" },
  { side: "top", align: "end", label: "顶部终点对齐" },
] as const;

function PlacementDemo() {
  return (
    <div className="grid max-w-[520px] grid-cols-2 gap-3">
      {placements.map((placement) => (
        <Tooltip.Root delayDuration={100} key={placement.label}>
          <Tooltip.Trigger>
            <Button variant="outline">{placement.label}</Button>
          </Tooltip.Trigger>
          <Tooltip.Content
            side={placement.side}
            align={placement.align}
            sideOffset={10}
          >
            空间不足时会自动翻转到相反方向。
          </Tooltip.Content>
        </Tooltip.Root>
      ))}
    </div>
  );
}

const groupedTabs = [
  {
    value: "notes",
    title: "埃米尔·科瓦尔斯基",
    detail: "产品笔记 · 3 分钟前",
    mark: "E",
  },
  {
    value: "components",
    title: "Components - Oat UI",
    detail: "组件文档 · 12 分钟前",
    mark: "O",
  },
  {
    value: "overlay",
    title: "toss/overlay-kit",
    detail: "GitHub pull request · 28 分钟前",
    mark: "T",
  },
] as const;

function GroupDemo() {
  return (
    <Tooltip.Group side="bottom" delayDuration={120} closeDelay={80}>
      <ul
        aria-label="最近打开的标签页"
        className="m-0 flex max-w-[720px] list-none items-stretch overflow-hidden rounded-xl border border-line bg-surface-2 p-1"
      >
        {groupedTabs.map((tab, index) => (
          <li className="flex min-w-0 flex-1 items-stretch" key={tab.value}>
            {index > 0 ? (
              <span
                className="my-2 w-px flex-none bg-line"
                aria-hidden="true"
              />
            ) : null}
            <Tooltip.Item
              value={tab.value}
              content={
                <span>
                  <strong className="font-semibold">{tab.title}</strong>
                  <span className="text-muted"> · {tab.detail}</span>
                </span>
              }
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg bg-transparent px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <span
                  className="grid size-6 flex-none place-items-center rounded-full bg-accent-soft font-mono text-[10px] font-bold text-accent-strong"
                  aria-hidden="true"
                >
                  {tab.mark}
                </span>
                <span className="truncate">{tab.title}</span>
                <span
                  className="ml-auto flex-none text-muted"
                  aria-hidden="true"
                >
                  ×
                </span>
              </button>
            </Tooltip.Item>
          </li>
        ))}
      </ul>
    </Tooltip.Group>
  );
}

function ControlledDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        {open ? "隐藏" : "显示"}受控提示
      </Button>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger>
          <Button>保存草稿</Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">
          草稿会保留在仅你可见的空间里。
        </Tooltip.Content>
      </Tooltip.Root>
      <Readout label="Tooltip 状态" value={open ? "打开" : "关闭"} />
    </div>
  );
}

function LongContentDemo() {
  return (
    <div className="flex items-center gap-3">
      <Tooltip.Root delayDuration={150}>
        <Tooltip.Trigger>
          <Button variant="secondary">查看限制</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          当前方案最多支持 20
          名协作成员。需要更多席位或审计日志时，请升级到团队方案。
        </Tooltip.Content>
      </Tooltip.Root>
      <span className="text-[12.5px] text-muted">
        默认最大宽度 20rem，长文本会换行。
      </span>
    </div>
  );
}

export function TooltipPage() {
  return (
    <Page
      kind="组件"
      title="Tooltip"
      description="简短说明性浮层。支持单个触发器，也支持相邻触发器共享一个会连续移动的浮动表面。"
      tags={["hover / focus", "触屏", "组合切换", "aria-describedby"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Button, Tooltip } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="鼠标停留或键盘聚焦触发器后显示。Content 始终只承担 role=tooltip，不接管焦点。"
      >
        <Demo
          code={`<Tooltip.Root delayDuration={250}>
  <Tooltip.Trigger>
    <Button variant="ghost" iconOnly aria-label="复制链接">↗</Button>
  </Tooltip.Trigger>
  <Tooltip.Content>复制当前页面链接</Tooltip.Content>
</Tooltip.Root>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="方向与对齐"
        description="side 指定首选方向，align 控制沿触发器边缘的对齐。默认会在主轴上翻转，并沿交叉轴平移以留在视口内。"
      >
        <Demo
          code={`<Tooltip.Root>
  <Tooltip.Trigger><Button>右侧</Button></Tooltip.Trigger>
  <Tooltip.Content side="right" align="center">
    空间不足时会自动翻转。
  </Tooltip.Content>
</Tooltip.Root>`}
        >
          <PlacementDemo />
        </Demo>
      </Section>

      <Section
        title="标签栏组合"
        description="多个相邻触发器共用一个浮动表面。第一次进入仍延迟显示；组已经打开后，在项目之间移动会立即切换内容，并让表面连续移动到新位置。"
      >
        <Demo
          code={`<Tooltip.Group side="bottom" delayDuration={120}>
  <Tooltip.Item value="notes" content="产品笔记 · 3 分钟前">
    <button>埃米尔·科瓦尔斯基</button>
  </Tooltip.Item>
  <Tooltip.Item value="components" content="组件文档 · 12 分钟前">
    <button>Components - Oat UI</button>
  </Tooltip.Item>
  <Tooltip.Item value="overlay" content="GitHub pull request · 28 分钟前">
    <button>toss/overlay-kit</button>
  </Tooltip.Item>
</Tooltip.Group>`}
        >
          <GroupDemo />
        </Demo>
      </Section>

      <Section
        title="受控状态"
        description="open / onOpenChange 与其他浮层保持一致；非受控模式可配合 defaultOpen。"
      >
        <Demo
          code={`const [open, setOpen] = useState(false);

<Button onClick={() => setOpen((value) => !value)}>
  切换提示
</Button>
<Tooltip.Root open={open} onOpenChange={setOpen}>
  <Tooltip.Trigger><Button>保存草稿</Button></Tooltip.Trigger>
  <Tooltip.Content>草稿会保留在仅你可见的空间里。</Tooltip.Content>
</Tooltip.Root>`}
        >
          <ControlledDemo />
        </Demo>
      </Section>

      <Section
        title="长内容"
        description="Tooltip 适合一句话说明。内容会换行并限制最大宽度；关键说明、错误信息和需要操作的内容应直接显示在页面中。"
      >
        <Demo
          code={`<Tooltip.Content>
  当前方案最多支持 20 名协作成员。需要更多席位时，请升级到团队方案。
</Tooltip.Content>`}
        >
          <LongContentDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "Tooltip.Root",
              type: "open / defaultOpen / onOpenChange",
              description:
                "管理受控或非受控状态，并创建触发器与内容的语义关联。",
            },
            {
              name: "delayDuration",
              type: "number",
              defaultValue: "300 / 180",
              description:
                "hover 或 focus 后延迟多少毫秒显示。Root 默认 300，Group 默认 180。",
            },
            {
              name: "closeDelay",
              type: "number",
              defaultValue: "80",
              description: "离开触发器后延迟多少毫秒关闭。",
            },
            {
              name: "Tooltip.Trigger",
              type: "ReactElement",
              description:
                "包装单个可聚焦交互元素；保留原有事件、ref 和描述关联。",
            },
            {
              name: "Tooltip.Group",
              type: "side / align / offset / delay",
              description:
                "为多个 Item 提供同一个浮动表面。不生成额外 DOM，父容器负责工具栏或标签栏的布局与语义。",
            },
            {
              name: "Tooltip.Item",
              type: "value / content / ReactElement",
              description:
                "注册组内唯一值、激活时内容与单个触发元素；组打开后切换不重复等待打开延迟。",
            },
            {
              name: "side",
              type: '"top" | "right" | "bottom" | "left"',
              defaultValue: '"top"',
              description: "首选显示方向，空间不足时自动翻转。",
            },
            {
              name: "align",
              type: '"start" | "center" | "end"',
              defaultValue: '"center"',
              description: "沿触发器边缘的对齐方式。",
            },
            {
              name: "sideOffset",
              type: "number",
              defaultValue: "8",
              description: "浮层与触发器之间的像素间距。",
            },
            {
              name: "collisionPadding",
              type: "number",
              defaultValue: "8",
              description: "浮层与视口边缘保留的最小距离。",
            },
            {
              name: "avoidCollisions",
              type: "boolean",
              defaultValue: "true",
              description: "是否启用视口翻转和避让。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "Trigger 必须是单个原生可聚焦元素；浮层不会被加入 Tab 顺序。",
            "显示期间自动把 Content 的 ID 合并到触发器的 aria-describedby，并保留调用方已有的描述。",
            "键盘聚焦会显示提示，Escape 只关闭 Tooltip 并保留触发器焦点。",
            "触屏点按会立即显示；点按外部、失焦或页面隐藏时关闭。",
            "Tooltip.Group 只协调浮层，不替代父容器的 role；标签页仍应使用 tablist / tab 并维护 selected 状态。",
            "reduced-motion 下去除缩放，只保留短暂透明度反馈；触发器本身必须有可见焦点样式。",
          ]}
        />
        <Callout title="不要放交互内容" tone="warning">
          Tooltip
          不接收焦点，也不拦截指针。按钮、链接、表单或必须可复制的重要文本应使用可见区域或
          Popover，而不是塞进 Tooltip。
        </Callout>
      </Section>
    </Page>
  );
}
