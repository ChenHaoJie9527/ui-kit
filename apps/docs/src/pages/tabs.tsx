import { useRef, useState } from "react";
import { Button, Tabs } from "seam-react";
import {
  BulletList,
  ButtonRow,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

function HorizontalDemo() {
  return (
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="组件文档">
        <Tabs.Trigger value="overview">概览</Tabs.Trigger>
        <Tabs.Trigger value="api">API</Tabs.Trigger>
        <Tabs.Trigger value="a11y">可访问性</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          标签页把相关内容分组展示，同一时间只显示一个面板。
        </p>
      </Tabs.Content>
      <Tabs.Content value="api">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          组合式 API：Tabs、List、Trigger、Content。
        </p>
      </Tabs.Content>
      <Tabs.Content value="a11y">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          自动生成 aria-controls / aria-labelledby，并维护 roving tabindex。
        </p>
      </Tabs.Content>
    </Tabs>
  );
}

function VerticalDemo() {
  return (
    <Tabs
      defaultValue="profile"
      orientation="vertical"
      className="max-w-[560px]"
    >
      <Tabs.List aria-label="账户设置">
        <Tabs.Trigger value="profile">个人资料</Tabs.Trigger>
        <Tabs.Trigger value="security">安全</Tabs.Trigger>
        <Tabs.Trigger value="billing">账单</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          用户名、头像与公开信息。
        </p>
      </Tabs.Content>
      <Tabs.Content value="security">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          密码、两步验证与会话管理。
        </p>
      </Tabs.Content>
      <Tabs.Content value="billing">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          发票、支付方式与用量。
        </p>
      </Tabs.Content>
    </Tabs>
  );
}

function ControlledDemo() {
  const [tab, setTab] = useState("draft");
  const index = ["draft", "review", "published"].indexOf(tab);

  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List aria-label="发布状态">
          <Tabs.Trigger value="draft">草稿</Tabs.Trigger>
          <Tabs.Trigger value="review">审核中</Tabs.Trigger>
          <Tabs.Trigger value="published">已发布</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="draft">
          <p className="m-0 text-sm leading-[1.65] text-muted">
            只有你能看到这份文档。
          </p>
        </Tabs.Content>
        <Tabs.Content value="review">
          <p className="m-0 text-sm leading-[1.65] text-muted">
            等待管理员审核。
          </p>
        </Tabs.Content>
        <Tabs.Content value="published">
          <p className="m-0 text-sm leading-[1.65] text-muted">
            所有拥有链接的人都可以访问。
          </p>
        </Tabs.Content>
      </Tabs>
      <ButtonRow>
        <Button
          variant="outline"
          size="sm"
          disabled={index <= 0}
          onClick={() => setTab(["draft", "review", "published"][index - 1]!)}
        >
          上一步
        </Button>
        <Button
          size="sm"
          disabled={index >= 2}
          onClick={() => setTab(["draft", "review", "published"][index + 1]!)}
        >
          下一步
        </Button>
        <Readout label="当前面板" value={tab} />
      </ButtonRow>
    </div>
  );
}

function CardDemo() {
  return (
    <Tabs defaultValue="overview" variant="card">
      <Tabs.List aria-label="项目视图">
        <Tabs.Trigger value="overview">概览</Tabs.Trigger>
        <Tabs.Trigger value="activity">活动</Tabs.Trigger>
        <Tabs.Trigger value="settings">设置</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <div className="flex flex-col gap-3">
          <div>
            <strong className="block text-sm font-semibold">发布工作台</strong>
            <p className="m-0 mt-1 text-sm leading-[1.65] text-muted">
              4 位协作者正在推进本周的发布计划。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["进行中", "3"],
              ["待审核", "2"],
              ["已完成", "12"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-line bg-surface px-3 py-2"
              >
                <span className="block text-xs text-muted">{label}</span>
                <strong className="mt-1 block text-lg font-semibold tabular-nums">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </Tabs.Content>
      <Tabs.Content value="activity">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          杨澜更新了发布说明，陈浩完成了构建检查。
        </p>
      </Tabs.Content>
      <Tabs.Content value="settings">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          管理通知、权限和默认发布分支。
        </p>
      </Tabs.Content>
    </Tabs>
  );
}

const INITIAL_EDITABLE_TABS = [
  { id: "tab-1", label: "标签 1", content: "第一个页签的内容。" },
  { id: "tab-2", label: "标签 2", content: "第二个页签的内容。" },
  { id: "tab-3", label: "标签 3", content: "第三个页签的内容。" },
];

function EditableTabsDemo({ externalAdd = false }: { externalAdd?: boolean }) {
  const [tabs, setTabs] = useState(INITIAL_EDITABLE_TABS);
  const [value, setValue] = useState("tab-1");
  const nextTab = useRef(4);

  const addTab = () => {
    const index = nextTab.current++;
    const id = `tab-${index}`;

    setTabs((current) => [
      ...current,
      { id, label: `标签 ${index}`, content: `新页签 ${index} 的内容。` },
    ]);
    setValue(id);
  };

  const addButton = (
    <Button
      variant={externalAdd ? "outline" : "secondary"}
      size={externalAdd ? "sm" : "md"}
      iconOnly={!externalAdd}
      aria-label={externalAdd ? undefined : "新增页签"}
      onClick={addTab}
    >
      {externalAdd ? (
        "ADD"
      ) : (
        <span className="text-lg leading-none" aria-hidden="true">
          +
        </span>
      )}
    </Button>
  );

  return (
    <Tabs value={value} onValueChange={setValue} variant="card">
      {externalAdd ? <div className="mb-3">{addButton}</div> : null}
      <Tabs.List
        aria-label="可编辑页签"
        action={externalAdd ? undefined : addButton}
      >
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.id}
            value={tab.id}
            onClose={() =>
              setTabs((current) => current.filter(({ id }) => id !== tab.id))
            }
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id}>
          <p className="m-0 text-sm leading-[1.65] text-muted">{tab.content}</p>
        </Tabs.Content>
      ))}
      {tabs.length === 0 ? (
        <p className="m-0 text-sm leading-[1.65] text-muted">
          没有打开的页签，使用新增按钮继续。
        </p>
      ) : null}
    </Tabs>
  );
}

function SegmentedDemo() {
  return (
    <Tabs defaultValue="7d" variant="segmented" className="max-w-[560px]">
      <Tabs.List aria-label="统计范围">
        <Tabs.Trigger value="7d">7 天</Tabs.Trigger>
        <Tabs.Trigger value="30d">30 天</Tabs.Trigger>
        <Tabs.Trigger value="90d">90 天</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="7d">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          过去 7 天有 1,284 次访问，较上一周期增长 8%。
        </p>
      </Tabs.Content>
      <Tabs.Content value="30d">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          过去 30 天有 5,603 次访问，转化率保持稳定。
        </p>
      </Tabs.Content>
      <Tabs.Content value="90d">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          过去 90 天有 17,420 次访问，移动端占比 62%。
        </p>
      </Tabs.Content>
    </Tabs>
  );
}

function DisabledDemo() {
  return (
    <Tabs defaultValue="a">
      <Tabs.List aria-label="含禁用项">
        <Tabs.Trigger value="a">可用</Tabs.Trigger>
        <Tabs.Trigger value="b" disabled>
          禁用
        </Tabs.Trigger>
        <Tabs.Trigger value="c">也可用</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          方向键会跳过禁用项。
        </p>
      </Tabs.Content>
      <Tabs.Content value="b">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          不会渲染到这里。
        </p>
      </Tabs.Content>
      <Tabs.Content value="c">
        <p className="m-0 text-sm leading-[1.65] text-muted">
          Home / End 可以跳到首尾可用项。
        </p>
      </Tabs.Content>
    </Tabs>
  );
}

export function TabsPage() {
  return (
    <Page
      kind="组件"
      title="Tabs"
      description="标签页。提供线性、卡片式和按钮组合式三种视觉，支持可关闭页签与新增入口，共享 roving tabindex、方向键循环和完整 ARIA 关联。"
      tags={[
        "键盘导航",
        "fluid 指示器",
        "受控 / 非受控",
        "横向 / 纵向",
        "三种样式",
        "可关闭 / 新增",
      ]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Tabs } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="defaultValue 指定初始面板；每个 Trigger 与 Content 通过 value 配对。"
      >
        <Demo
          code={`<Tabs defaultValue="overview">
  <Tabs.List aria-label="组件文档">
    <Tabs.Trigger value="overview">概览</Tabs.Trigger>
    <Tabs.Trigger value="api">API</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
  <Tabs.Content value="api">...</Tabs.Content>
</Tabs>`}
        >
          <HorizontalDemo />
        </Demo>
      </Section>

      <Section
        title="纵向布局"
        description="orientation=vertical 时改用上下方向键，并切换为左侧导航样式。"
      >
        <Demo
          code={`<Tabs defaultValue="profile" orientation="vertical">
  <Tabs.List aria-label="账户设置">
    <Tabs.Trigger value="profile">个人资料</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">...</Tabs.Content>
</Tabs>`}
        >
          <VerticalDemo />
        </Demo>
      </Section>

      <Section
        title="卡片式"
        description="variant=card 让选中标签与内容面板连成一体，适合页面内的并列视图；横向和纵向布局都可使用。"
      >
        <Demo
          code={`<Tabs defaultValue="overview" variant="card">
  <Tabs.List aria-label="项目视图">
    <Tabs.Trigger value="overview">概览</Tabs.Trigger>
    <Tabs.Trigger value="activity">活动</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
  <Tabs.Content value="activity">...</Tabs.Content>
</Tabs>`}
        >
          <CardDemo />
        </Demo>
      </Section>

      <Section
        title="可关闭与新增"
        description="Trigger 的 onClose 会渲染关闭控件；点击、Delete 或 Backspace 都会请求关闭。Tabs.List 的 action 位于 tablist 外部，可放新增按钮；选中项超出可视范围时只滚动页签栏自身。"
      >
        <Demo
          code={`const [tabs, setTabs] = useState(initialTabs);
const [value, setValue] = useState("tab-1");

<Tabs value={value} onValueChange={setValue} variant="card">
  <Tabs.List
    aria-label="可编辑页签"
    action={
      <Button variant="secondary" iconOnly aria-label="新增页签" onClick={addTab}>
        <span aria-hidden="true">+</span>
      </Button>
    }
  >
    {tabs.map((tab) => (
      <Tabs.Trigger
        key={tab.id}
        value={tab.id}
        onClose={() => setTabs((current) => current.filter(({ id }) => id !== tab.id))}
      >
        {tab.label}
      </Tabs.Trigger>
    ))}
  </Tabs.List>
  {tabs.map((tab) => (
    <Tabs.Content key={tab.id} value={tab.id}>...</Tabs.Content>
  ))}
</Tabs>`}
        >
          <EditableTabsDemo />
        </Demo>
      </Section>

      <Section
        title="外部新增"
        description="新增入口不必放进 List。把普通 Button 放在 Tabs 上方即可复用同一套受控状态；关闭行为与行内新增完全一致。"
      >
        <Demo
          code={`<Button onClick={addTab}>ADD</Button>

<Tabs value={value} onValueChange={setValue} variant="card">
  <Tabs.List aria-label="可编辑页签">
    {tabs.map((tab) => (
      <Tabs.Trigger key={tab.id} value={tab.id} onClose={closeTab}>
        {tab.label}
      </Tabs.Trigger>
    ))}
  </Tabs.List>
  ...
</Tabs>`}
        >
          <EditableTabsDemo externalAdd />
        </Demo>
      </Section>

      <Section
        title="按钮组合式"
        description="variant=segmented 使用内嵌轨道和共享滑块，适合 2–5 个短标签的视图切换；语义仍是 Tabs，也支持纵向布局。"
      >
        <Demo
          code={`<Tabs defaultValue="7d" variant="segmented">
  <Tabs.List aria-label="统计范围">
    <Tabs.Trigger value="7d">7 天</Tabs.Trigger>
    <Tabs.Trigger value="30d">30 天</Tabs.Trigger>
    <Tabs.Trigger value="90d">90 天</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="7d">...</Tabs.Content>
  <Tabs.Content value="30d">...</Tabs.Content>
  <Tabs.Content value="90d">...</Tabs.Content>
</Tabs>`}
        >
          <SegmentedDemo />
        </Demo>
      </Section>

      <Section
        title="受控用法"
        description="传入 value + onValueChange 后，外部按钮也能驱动面板切换。"
      >
        <Demo
          code={`const [tab, setTab] = useState("draft");

<Tabs value={tab} onValueChange={setTab}>
  ...
</Tabs>`}
        >
          <ControlledDemo />
        </Demo>
      </Section>

      <Section
        title="禁用项"
        description="方向键和 Home/End 都会跳过 disabled 的 Trigger。"
      >
        <Demo
          code={`<Tabs.Trigger value="b" disabled>
  禁用
</Tabs.Trigger>`}
        >
          <DisabledDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "value",
              type: "string",
              description: "受控的当前面板值。",
            },
            {
              name: "defaultValue",
              type: "string",
              description: "非受控模式的初始面板值。",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              description: "面板变化回调。",
            },
            {
              name: "orientation",
              type: '"horizontal" | "vertical"',
              defaultValue: '"horizontal"',
              description: "布局方向，同时决定使用左右还是上下方向键。",
            },
            {
              name: "variant",
              type: '"line" | "card" | "segmented"',
              defaultValue: '"line"',
              description: "视觉样式；三种变体共享标签语义、状态与键盘行为。",
            },
            {
              name: "Tabs.Trigger.value",
              type: "string",
              description: "与 Content 配对的值，必填。",
            },
            {
              name: "Tabs.Trigger.disabled",
              type: "boolean",
              defaultValue: "false",
              description: "禁用该标签，键盘导航会跳过。",
            },
            {
              name: "Tabs.Trigger.onClose",
              type: "() => void",
              description:
                "提供时渲染关闭控件。点击或按 Delete / Backspace 触发；关闭选中项后自动选择相邻可用页签并保持焦点在 tablist 内，没有剩余项时 value 变为空字符串。",
            },
            {
              name: "Tabs.List.action",
              type: "ReactNode",
              description:
                "位于 tablist 外侧的行尾操作区，适合新增页签等独立操作。",
            },
            {
              name: "Tabs.Content.value",
              type: "string",
              description: "与 Trigger 配对的值，必填。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "List 渲染 role=tablist，Trigger 渲染 role=tab，Content 渲染 role=tabpanel。",
            "只有选中项 tabIndex=0，其余为 -1，Tab 键进入一次即可，方向键在标签间移动。",
            "自动生成 aria-controls 与 aria-labelledby，面板切换时同步 hidden。",
            "左右键在首尾循环；纵向模式改用上下键；Home / End 跳到首尾可用项。",
            "variant 只改变视觉呈现；三种样式都保留 tablist / tab / tabpanel 语义和键盘行为。",
            "关闭控件的指针热区为 24×24px；键盘可用 Delete / Backspace，并通过 aria-keyshortcuts 暴露快捷键。",
            "新增按钮放在 tablist 外，不会混入页签的 roving tabindex 或方向键顺序。",
          ]}
        />
      </Section>
    </Page>
  );
}
