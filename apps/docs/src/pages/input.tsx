import { useId, useState } from "react";
import { Input } from "@chenhaojie9527/ui-kit";
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
  const [name, setName] = useState("ui-kit");
  const inputId = useId();
  const hintId = useId();

  return (
    <div className="flex max-w-[380px] flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-ink" htmlFor={inputId}>
        项目名称
      </label>
      <Input
        id={inputId}
        value={name}
        aria-describedby={hintId}
        placeholder="例如 ui-kit"
        onChange={(event) => setName(event.target.value)}
      />
      <p className="m-0 text-[12.5px] text-muted" id={hintId}>
        会显示在 npm 与文档标题里。
      </p>
      <Readout label="当前值" value={name || "—"} />
    </div>
  );
}

function SizesDemo() {
  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <Input inputSize="sm" aria-label="小号输入框" placeholder="sm" />
      <Input inputSize="md" aria-label="中号输入框" placeholder="md" />
      <Input inputSize="lg" aria-label="大号输入框" placeholder="lg" />
    </div>
  );
}

function StatesDemo() {
  const emailId = useId();
  const errorId = useId();

  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <div className="flex max-w-[380px] flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-ink" htmlFor={emailId}>
          邮箱
        </label>
        <Input
          id={emailId}
          defaultValue="not-an-email"
          invalid
          aria-describedby={errorId}
        />
        <p className="m-0 text-[12.5px] text-danger" id={errorId}>
          请输入有效的邮箱地址。
        </p>
      </div>
      <Input aria-label="禁用示例" defaultValue="不可编辑" disabled />
    </div>
  );
}

export function InputPage() {
  return (
    <Page
      kind="组件"
      title="Input"
      description="文本输入框。组件只负责样式与校验状态，label、提示和错误信息由你组合，因此可以适配任意表单结构。"
      tags={["原生输入", "3 种尺寸", "错误态", "受控"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Input } from "@chenhaojie9527/ui-kit";'} />
      </Section>

      <Section
        title="基础用法"
        description="受控用法和原生 input 完全一致，value / onChange 直接透传。"
      >
        <Demo
          code={`const [name, setName] = useState("ui-kit");

<label htmlFor="name">项目名称</label>
<Input
  id="name"
  value={name}
  onChange={(event) => setName(event.target.value)}
/>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="尺寸"
        description="通过 inputSize 控制，原生 size 属性仍然可用。"
      >
        <Demo
          code={`<Input inputSize="sm" placeholder="sm" />
<Input inputSize="md" placeholder="md" />
<Input inputSize="lg" placeholder="lg" />`}
        >
          <SizesDemo />
        </Demo>
      </Section>

      <Section
        title="错误与禁用"
        description="invalid 会映射为 aria-invalid，便于屏幕阅读器识别；错误文案通过 aria-describedby 关联。"
      >
        <Demo
          code={`<Input invalid aria-describedby="email-error" />
<p id="email-error">请输入有效的邮箱地址。</p>

<Input disabled defaultValue="不可编辑" />`}
        >
          <StatesDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "inputSize",
              type: '"sm" | "md" | "lg"',
              defaultValue: '"md"',
              description: "输入框高度与内边距。",
            },
            {
              name: "invalid",
              type: "boolean",
              defaultValue: "false",
              description: "错误态，等价于 aria-invalid=true。",
            },
            {
              name: "aria-invalid",
              type: 'boolean | "grammar" | "spelling"',
              description: "未传 invalid 时保留调用方给出的 aria-invalid。",
            },
            {
              name: "...rest",
              type: "InputHTMLAttributes<HTMLInputElement>",
              description:
                "原生输入属性，包含 value、onChange、disabled、placeholder 等。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "始终给输入框关联可见的 <label>，占位符不能代替标签。",
            "错误信息用 aria-describedby 指向具体文本，而不是只靠红色边框。",
            "invalid 只改变样式与 aria-invalid，不会阻止表单提交。",
          ]}
        />
        <Callout title="无 size 冲突" tone="warning">
          为避免和原生 <code>size</code> 属性冲突，尺寸使用{" "}
          <code>inputSize</code>；原生 <code>size</code> 仍然可用。
        </Callout>
      </Section>
    </Page>
  );
}
