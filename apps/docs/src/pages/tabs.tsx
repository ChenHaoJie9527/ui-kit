import { useState } from "react";
import { Button, Tabs } from "@chenhaojie9527/ui-kit";
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
        <p className="m-0 text-sm leading-[1.65] text-muted">组合式 API：Tabs、List、Trigger、Content。</p>
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
        <p className="m-0 text-sm leading-[1.65] text-muted">用户名、头像与公开信息。</p>
      </Tabs.Content>
      <Tabs.Content value="security">
        <p className="m-0 text-sm leading-[1.65] text-muted">密码、两步验证与会话管理。</p>
      </Tabs.Content>
      <Tabs.Content value="billing">
        <p className="m-0 text-sm leading-[1.65] text-muted">发票、支付方式与用量。</p>
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
          <p className="m-0 text-sm leading-[1.65] text-muted">只有你能看到这份文档。</p>
        </Tabs.Content>
        <Tabs.Content value="review">
          <p className="m-0 text-sm leading-[1.65] text-muted">等待管理员审核。</p>
        </Tabs.Content>
        <Tabs.Content value="published">
          <p className="m-0 text-sm leading-[1.65] text-muted">所有拥有链接的人都可以访问。</p>
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
        <p className="m-0 text-sm leading-[1.65] text-muted">方向键会跳过禁用项。</p>
      </Tabs.Content>
      <Tabs.Content value="b">
        <p className="m-0 text-sm leading-[1.65] text-muted">不会渲染到这里。</p>
      </Tabs.Content>
      <Tabs.Content value="c">
        <p className="m-0 text-sm leading-[1.65] text-muted">Home / End 可以跳到首尾可用项。</p>
      </Tabs.Content>
    </Tabs>
  );
}

export function TabsPage() {
  return (
    <Page
      kind="组件"
      title="Tabs"
      description="标签页。组合式 API，内置 roving tabindex、方向键循环、Home/End 跳转和完整的 ARIA 关联。"
      tags={["键盘导航", "roving tabindex", "受控 / 非受控", "横向 / 纵向"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Tabs } from "@chenhaojie9527/ui-kit";'} />
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
          ]}
        />
      </Section>
    </Page>
  );
}
