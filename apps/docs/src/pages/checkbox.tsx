import { useState } from "react";
import {
  BulletList,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import { CheckBox } from "seam-react";

function BasicDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <CheckBox checked={checked} onCheckedChange={setChecked}>
        启用自动保存
      </CheckBox>
      <p className="m-0 text-[12.5px] text-muted">
        当前状态：{checked ? "已勾选" : "未勾选"}
      </p>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <CheckBox defaultChecked>默认勾选</CheckBox>
      <CheckBox defaultChecked disabled>
        默认勾选并禁用
      </CheckBox>
    </div>
  );
}

export function CheckBoxPage() {
  return (
    <Page
      kind="组件"
      title="CheckBox"
      description="复选框。底层是原生 checkbox，点击时提供轻微按压反馈，对勾通过 SVG 描边展示状态轨迹。"
      tags={["原生 checkbox", "SVG 描边", "受控 / 非受控", "表单集成"]}
    >
      <Section title="引入">
        <code>{`import { CheckBox } from "seam-react";`}</code>
      </Section>

      <Section
        title="受控用法"
        description="传入 checked 即为受控；状态变化通过 onCheckedChange 通知。"
      >
        <Demo
          code={`const [checked, setChecked] = useState(false);

<CheckBox checked={checked} onCheckedChange={setChecked}>
  启用自动保存
</CheckBox>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section title="状态与禁用">
        <Demo
          code={`<CheckBox defaultChecked>默认勾选</CheckBox>
<CheckBox defaultChecked disabled>默认勾选并禁用</CheckBox>`}
        >
          <StatesDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "checked",
              type: "boolean",
              description: "受控状态。传入即进入受控模式。",
            },
            {
              name: "defaultChecked",
              type: "boolean",
              defaultValue: "false",
              description: "非受控模式的初始状态。",
            },
            {
              name: "onCheckedChange",
              type: "(checked: boolean) => void",
              description: "状态变化回调，受控与非受控都会触发。",
            },
            {
              name: "disabled",
              type: "boolean",
              defaultValue: "false",
              description: "禁用复选框。",
            },
            {
              name: "children",
              type: "ReactNode",
              description: "显示在复选框右侧的标签文本。",
            },
            {
              name: "...rest",
              type: 'Omit<InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange">',
              description: "其余原生属性透传到内部 input。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "原生 checkbox 自带 Space 切换、label 关联与表单提交。",
            "焦点环绘制在视觉方框上，不遮挡对勾轨迹。",
            "禁用时降低透明度，且状态和动效均不会触发。",
            "reduced motion 保留勾选与未勾选的静态状态，移除按压缩放和描边动画。",
          ]}
        />
      </Section>
    </Page>
  );
}
