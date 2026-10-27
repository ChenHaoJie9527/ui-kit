import { RadioGroup, useRadioGroup } from "seam-react";
import {
  BulletList,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

function ControlledDemo() {
  const radioGroup = useRadioGroup({ defaultValue: "starter" });

  return (
    <div className="flex max-w-[460px] flex-col gap-4">
      <RadioGroup aria-label="选择套餐" {...radioGroup}>
        <RadioGroup.Item
          value="starter"
          label="入门版"
          description="适合个人项目与原型验证。"
        />
        <RadioGroup.Item
          value="team"
          label="团队版"
          description="包含协作能力与更高的使用额度。"
        />
        <RadioGroup.Item
          value="enterprise"
          label="企业版"
          description="提供高级安全与管理员控制。"
        />
      </RadioGroup>
      <Readout label="当前套餐" value={radioGroup.value ?? ""} />
    </div>
  );
}

function LayoutDemo() {
  return (
    <RadioGroup
      aria-label="界面密度"
      defaultValue="comfortable"
      orientation="horizontal"
    >
      <RadioGroup.Item value="compact" label="紧凑" />
      <RadioGroup.Item value="comfortable" label="舒适" />
      <RadioGroup.Item value="spacious" label="宽松" disabled />
    </RadioGroup>
  );
}

export function RadioGroupPage() {
  return (
    <Page
      kind="组件"
      title="Radio Group"
      description="单选组。保留原生 radio 的表单和读屏语义，支持受控状态、方向布局、键盘循环选择与共享选中指示器。"
      tags={["原生 radio", "受控 / 非受控", "roving tabindex", "Motion"]}
    >
      <Section title="引入">
        <CodeBlock
          code={'import { RadioGroup, useRadioGroup } from "seam-react";'}
        />
      </Section>

      <Section
        title="useRadioGroup"
        description="管理受控或非受控选中状态，返回 value 与 onValueChange，可直接展开到 RadioGroup。"
      >
        <Demo
          code={`const radioGroup = useRadioGroup({ defaultValue: "starter" });

<RadioGroup aria-label="选择套餐" {...radioGroup}>
  <RadioGroup.Item value="starter" label="入门版" />
  <RadioGroup.Item value="team" label="团队版" />
  <RadioGroup.Item value="enterprise" label="企业版" />
</RadioGroup>`}
        >
          <ControlledDemo />
        </Demo>
      </Section>

      <Section
        title="水平布局与禁用"
        description="horizontal 会自动换行；禁用项不可选择，也不会进入 Tab 顺序。"
      >
        <Demo
          code={`<RadioGroup aria-label="界面密度" defaultValue="comfortable" orientation="horizontal">
  <RadioGroup.Item value="compact" label="紧凑" />
  <RadioGroup.Item value="comfortable" label="舒适" />
  <RadioGroup.Item value="spacious" label="宽松" disabled />
</RadioGroup>`}
        >
          <LayoutDemo />
        </Demo>
      </Section>

      <Section title="RadioGroup API">
        <PropsTable
          rows={[
            {
              name: "value",
              type: "string",
              description: "受控选中值。",
            },
            {
              name: "defaultValue",
              type: "string",
              description: "非受控模式的初始选中值。",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              description: "选中值变化时触发。",
            },
            {
              name: "orientation",
              type: '"vertical" | "horizontal"',
              defaultValue: '"vertical"',
              description: "控制布局方向与对应方向键。",
            },
            {
              name: "children",
              type: "ReactNode",
              description: "一个或多个 RadioGroup.Item。",
            },
          ]}
        />
      </Section>

      <Section title="useRadioGroup API">
        <PropsTable
          rows={[
            {
              name: "value",
              type: "string",
              description: "可选的受控值；传入后由调用方负责更新。",
            },
            {
              name: "defaultValue",
              type: "string",
              description: "非受控模式的初始值。",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              description: "状态变化回调；返回值中的同名属性用于更新选择。",
            },
          ]}
        />
      </Section>

      <Section title="RadioGroup.Item API">
        <PropsTable
          rows={[
            {
              name: "value",
              type: "string",
              required: true,
              description: "选项值，组内必须唯一。",
            },
            {
              name: "label",
              type: "ReactNode",
              required: true,
              description: "与原生 input 关联的可访问标签。",
            },
            {
              name: "description",
              type: "ReactNode",
              description: "通过 aria-describedby 关联的补充说明。",
            },
            {
              name: "disabled",
              type: "boolean",
              defaultValue: "false",
              description: "禁用该选项并移出 Tab 顺序。",
            },
            {
              name: "name",
              type: "string",
              description: "原生表单字段名；同一表单的选项应使用相同名称。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性与键盘">
        <BulletList
          items={[
            "组容器使用 radiogroup，每个选项保留原生 input[type=radio]。",
            "垂直布局使用 Up / Down，水平布局使用 Left / Right；选择循环并跳过禁用项。",
            "只有当前选中项进入 Tab 顺序；无选中项时使用第一个可用选项。",
            "reduced motion 移除指示器位移和按压缩放，保留清晰的静态选中状态。",
          ]}
        />
      </Section>
    </Page>
  );
}
