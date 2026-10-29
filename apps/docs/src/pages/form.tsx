import { useState } from "react";
import { Button, Form, Input } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";

function BasicDemo() {
  const [submittedEmail, setSubmittedEmail] = useState("");

  return (
    <div className="flex w-full max-w-[440px] flex-col gap-4">
      <Form.Root
        onSubmit={(values) => setSubmittedEmail(String(values.email ?? ""))}
      >
        <Form.Field
          name="email"
          defaultValue=""
          rules={[
            { required: true, message: "请输入邮箱地址。" },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "请输入有效的邮箱地址。",
            },
          ]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <Input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
            />
          </Form.Control>
          <Form.Description>用于接收产品更新与账号通知。</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Actions>
          <Button type="submit">订阅通知</Button>
        </Form.Actions>
      </Form.Root>
      <p className="m-0 min-h-5 text-[12.5px] text-muted" aria-live="polite">
        {submittedEmail ? `已提交：${submittedEmail}` : "尚未提交"}
      </p>
    </div>
  );
}

export function FormPage() {
  return (
    <Page
      kind="组件"
      title="Form"
      description="组合式表单状态与校验层。保留原生 form、label 和控件语义，并统一字段状态、错误关联和提交流程。"
      tags={["组合式 API", "同步 / 异步校验", "受控 / 非受控", "错误关联"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Form } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="Field 注册字段与规则，Control 将值、状态和事件接入现有输入组件。默认失焦校验，字段报错后在输入时重新校验。"
      >
        <Demo
          code={`<Form.Root onSubmit={(values) => console.log(values)}>
  <Form.Field
    name="email"
    defaultValue=""
    rules={[{ required: true, message: "请输入邮箱地址。" }]}
  >
    <Form.Label>邮箱</Form.Label>
    <Form.Control>
      <Input type="email" />
    </Form.Control>
    <Form.Description>用于接收账号通知。</Form.Description>
    <Form.ErrorMessage />
  </Form.Field>
  <Form.Actions>
    <Button type="submit">提交</Button>
  </Form.Actions>
</Form.Root>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section title="Form.Root API">
        <PropsTable
          rows={[
            {
              name: "values",
              type: "T",
              description: "受控表单值；传入后由调用方更新 values。",
            },
            {
              name: "defaultValues",
              type: "Partial<T>",
              description: "非受控表单及 reset 的初始值。",
            },
            {
              name: "onValuesChange",
              type: "(values: T, changedField?: keyof T) => void",
              description: "字段值变化时触发。",
            },
            {
              name: "onSubmit",
              type: "(values: T) => void | Promise<void>",
              description: "校验通过后执行；异步期间标记 submitting。",
            },
            {
              name: "onSubmitFailed",
              type: "(errors: FormErrors<T>) => void",
              description: "提交校验失败后接收最新错误。",
            },
            {
              name: "validateOn",
              type: '"submit" | "blur" | "change"',
              defaultValue: '"blur"',
              description: "首次字段校验时机。",
            },
            {
              name: "revalidateOn",
              type: '"change" | "blur"',
              defaultValue: '"change"',
              description: "已报错字段的重新校验时机。",
            },
            {
              name: "validate",
              type: "(values: T) => FormErrors<T> | Promise<FormErrors<T>>",
              description: "跨字段或表单级校验。",
            },
          ]}
        />
      </Section>

      <Section title="Form.Field API">
        <PropsTable
          rows={[
            {
              name: "name",
              type: "string",
              description: "字段名称，支持点分隔的嵌套路径。",
            },
            {
              name: "defaultValue",
              type: "T",
              description: "字段未在 Root 初始值中定义时使用的默认值。",
            },
            {
              name: "rules",
              type: "FieldRule<T>[]",
              description: "必填、长度、格式、范围、枚举或自定义校验规则。",
            },
            {
              name: "transform",
              type: "(value: T) => T",
              description: "写入表单状态前转换字段值。",
            },
            {
              name: "dependencies",
              type: "string[]",
              description: "依赖字段变化时重新校验当前字段。",
            },
            {
              name: "disabled / readOnly / hidden",
              type: "boolean",
              defaultValue: "false",
              description: "控制字段交互与可见状态。",
            },
            {
              name: "preserveOnUnmount",
              type: "boolean",
              defaultValue: "false",
              description: "卸载后保留字段元状态与错误。",
            },
          ]}
        />
      </Section>

      <Section
        title="与现有控件集成"
        description="Form.Control 会保留控件原有的公开事件契约，同时把值接入表单状态。"
      >
        <BulletList
          items={[
            "原生 input、textarea、select 与 Input：绑定 value / checked、onChange、disabled 和 ARIA 属性。",
            "CheckBox 与 Switch：绑定 checked / onCheckedChange，并将布尔值写入字段状态。",
            "Select 与 RadioGroup：绑定 value / onValueChange，并让 Form.Label 通过 aria-labelledby 提供可访问名称。",
            "所有控件原有的 onChange、onCheckedChange 或 onValueChange 回调都会继续执行。",
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "Label 自动关联 Control；Description 与 ErrorMessage 通过 aria-describedby 关联。",
            "必填、无效、禁用、只读和异步校验状态会暴露给辅助技术。",
            "提交失败聚焦第一个错误字段；异步提交失败保留输入并显示表单级错误。",
            "错误与校验反馈不依赖颜色，reduced motion 下移除非必要动画。",
          ]}
        />
        <Callout title="服务端校验" tone="info">
          可通过 FormRef 的 setError 映射字段错误，通过 setFormError
          展示无法归属于单个字段的服务端错误。
        </Callout>
      </Section>
    </Page>
  );
}
