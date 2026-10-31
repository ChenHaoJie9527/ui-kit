import { useState } from "react";
import { Button, Form, Input } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  InlineCode,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import { Demo as DialogFormDemo } from "../demos/components/form/dialog";
import { Demo as LabelWrapDemo } from "../demos/components/form/label-wrap";
import { Demo as LayoutsDemo } from "../demos/components/form/layouts";
import { Demo as LoginFormDemo } from "../demos/components/form/login";
import { Demo as OrganizationFormDemo } from "../demos/components/form/organization";
import { Demo as RegisterFormDemo } from "../demos/components/form/register";
import { Demo as ValidationTimingDemo } from "../demos/components/form/validation-timing";

const formDemoSources = import.meta.glob<string>(
  "../demos/components/form/*.tsx",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

function getFormDemoSource(name: string): string {
  const source = formDemoSources[`../demos/components/form/${name}.tsx`];

  if (!source) {
    throw new Error(`未找到 Form 示例源码：${name}`);
  }

  return source;
}

function BasicDemo() {
  const [submittedEmail, setSubmittedEmail] = useState("");

  return (
    <div className="flex w-full max-w-[440px] flex-col gap-4">
      <Form.Root
        layout="vertical"
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

const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效邮箱"),
  ),
  password: v.pipe(v.string(), v.minLength(8, "密码至少 8 位")),
});

function ValibotDemo() {
  const [signedIn, setSignedIn] = useState(false);

  return (
    <div className="flex w-full max-w-[440px] flex-col gap-4">
      <Form.Root
        layout="vertical"
        defaultValues={{ email: "", password: "" }}
        validate={valibotResolver(LoginSchema)}
        onSubmit={() => setSignedIn(true)}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <Input type="email" autoComplete="email" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="password">
          <Form.Label>密码</Form.Label>
          <Form.Control>
            <Input type="password" autoComplete="current-password" />
          </Form.Control>
          <Form.Description>至少 8 位字符。</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Actions>
          <Button type="submit">登录</Button>
        </Form.Actions>
      </Form.Root>
      <p className="m-0 min-h-5 text-[12.5px] text-muted" aria-live="polite">
        {signedIn ? "校验通过，已提交登录。" : "填写后提交以验证 schema。"}
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
      tags={[
        "组合式 API",
        "Valibot",
        "业务配方",
        "受控 / 非受控",
        "错误关联",
        "响应式布局",
      ]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Form } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="Field 注册字段与规则，Control 将值、状态和事件接入现有输入组件。默认失焦校验，字段报错后在输入时重新校验。"
      >
        <Demo
          code={`<Form.Root layout="vertical" onSubmit={(values) => console.log(values)}>
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

      <Section
        title="布局"
        description="Root 提供 vertical、horizontal 与 inline 三种布局。horizontal 是新的默认值：桌面端使用稳定标签列，窄屏自动恢复纵向阅读顺序；inline 适合筛选栏并允许换行。"
      >
        <Demo code={getFormDemoSource("layouts")} label="layouts.tsx">
          <LayoutsDemo />
        </Demo>
        <Callout title="默认布局迁移" tone="info">
          本版本将默认布局改为 <InlineCode>horizontal</InlineCode>
          。依赖旧版纵向视觉排列的表单无需调整 DOM，只需在 Root 上显式设置
          <InlineCode>layout="vertical"</InlineCode>。
        </Callout>
      </Section>

      <Section
        title="Valibot 校验"
        description="使用独立的 valibotResolver 子入口，把 Valibot schema 直接接入 Form.Root 的 validate 合约。字段规则与 schema 现在共享同一组交互校验时机。"
      >
        <Demo
          code={`import * as v from "valibot";
import { Form, Input, Button } from "seam-react";
import { valibotResolver } from "seam-react/valibot";

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.nonEmpty("请输入邮箱"), v.email("请输入有效邮箱")),
  password: v.pipe(v.string(), v.minLength(8, "密码至少 8 位")),
});

<Form.Root
  layout="vertical"
  defaultValues={{ email: "", password: "" }}
  validate={valibotResolver(LoginSchema)}
  onSubmit={handleSubmit}
>
  <Form.Field name="email">
    <Form.Label>邮箱</Form.Label>
    <Form.Control><Input type="email" /></Form.Control>
    <Form.ErrorMessage />
  </Form.Field>
  <Form.Field name="password">
    <Form.Label>密码</Form.Label>
    <Form.Control><Input type="password" /></Form.Control>
    <Form.ErrorMessage />
  </Form.Field>
  <Form.Actions><Button type="submit">登录</Button></Form.Actions>
</Form.Root>`}
        >
          <ValibotDemo />
        </Demo>
        <BulletList
          items={[
            <>
              <InlineCode>valibotResolver(schema)</InlineCode>{" "}
              返回异步校验函数；输入类型取自 <InlineCode>InferInput</InlineCode>
              ，不会误用 schema 输出类型。
            </>,
            <>
              嵌套路径转换为点分隔字段名；同一字段只保留第一条
              issue。无可用路径的根级 issue 写入 <InlineCode>_form</InlineCode>
              ，也可通过
              <InlineCode>onSubmitFailed</InlineCode> 读取。
            </>,
            <>
              schema 输出变换不会回写表单值；需要转换结果时，在
              <InlineCode>onSubmit</InlineCode> 内显式 parse。
            </>,
            <>
              现有 <InlineCode>rules</InlineCode>、异步校验、
              <InlineCode>setError</InlineCode> 与
              <InlineCode>setFormError</InlineCode> 继续可用；合并顺序沿用 Form
              当前行为。
            </>,
          ]}
        />
        <Callout title="可选依赖" tone="info">
          使用 Valibot 校验时安装 <code>valibot</code>。主入口
          <code>seam-react</code> 不会加载 Valibot；只有导入
          <code>seam-react/valibot</code> 时才需要它。
        </Callout>
      </Section>

      <Section
        title="校验时机"
        description="validateOn 支持 focus、change、blur、pointerleave 与 submit；revalidateOn 支持除 submit 外的交互时机。字段 rules 和 Root.validate（包括 Valibot）遵循同一触发决策。"
      >
        <Demo
          code={getFormDemoSource("validation-timing")}
          label="validation-timing.tsx"
        >
          <ValidationTimingDemo />
        </Demo>
        <BulletList
          items={[
            '默认 validateOn="blur"、revalidateOn="change"，保持既有首次校验与纠错节奏。',
            "focus 与 pointerleave 是可选增强，不会替代键盘、触摸和提交反馈。",
            'validateOn="submit" 只关闭交互触发的首次校验；已有错误仍按 revalidateOn 更新，提交始终执行完整校验。',
            "change 的异步校验沿用 validateDebounce；新校验会使旧结果失效，避免覆盖更新后的值或服务端错误。",
          ]}
        />
      </Section>

      <Section
        title="必填标记与长标签"
        description="Label required 与字段 rules 中的 { required: true } 使用同一个视觉星号，星号对辅助技术隐藏。labelWrap 只控制视觉换行，不改变标签文本、控件名称或描述关联。"
      >
        <Demo code={getFormDemoSource("label-wrap")} label="label-wrap.tsx">
          <LabelWrapDemo />
        </Demo>
      </Section>

      <Section
        title="业务配方：登录"
        description="组合 Form、Input、CheckBox 和 Button。异步提交期间按钮进入 loading，成功后由 Form 状态播报结果；邮箱填写 blocked@example.com 可预览服务端失败态。仅用于 UI 示例，不代表真实认证安全实现。"
      >
        <Demo code={getFormDemoSource("login")} label="login.tsx">
          <LoginFormDemo />
        </Demo>
      </Section>

      <Section
        title="业务配方：企业注册"
        description="注册表单演示双列表单布局、确认密码与条款校验。密码同时校验长度、字母和数字；使用 blocked@example.com 可预览服务端字段错误与表单级错误。示例仅用于 UI 演示，不会发送真实账号或密码。"
      >
        <Demo code={getFormDemoSource("register")} label="register.tsx">
          <RegisterFormDemo />
        </Demo>
      </Section>

      <Section
        title="业务配方：企业信息"
        description="企业认证场景组合 Input、Select、RadioGroup 和 Switch，并拆成“企业资料”和“团队与通知”两个 fieldset 语义分区。统一社会信用代码填写 000000 可预览服务端失败态。"
      >
        <Demo code={getFormDemoSource("organization")} label="organization.tsx">
          <OrganizationFormDemo />
        </Demo>
      </Section>

      <Section
        title="业务配方：Dialog 内嵌表单"
        description="表单放在 Dialog.Body 中，提交按钮通过 form 属性与表单关联，因此 Dialog.Footer 仍可使用标准底部操作区。打开后焦点直接进入姓名输入框；服务端失败时保留 Dialog 并聚焦错误字段，成功后关闭并显示结果。"
      >
        <Demo code={getFormDemoSource("dialog")} label="dialog.tsx">
          <DialogFormDemo />
        </Demo>
        <Callout title="接入真实接口" tone="info">
          示例使用延迟函数模拟请求。接入业务接口时保留 onSubmit 的 Promise
          合约，并在请求失败时抛出带可读消息的 Error，Form
          会自动显示表单级错误并恢复提交按钮。
        </Callout>
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
              type: '"submit" | "focus" | "change" | "blur" | "pointerleave"',
              defaultValue: '"blur"',
              description:
                "首次字段与表单级校验时机；submit 仅关闭交互触发的首次校验。",
            },
            {
              name: "revalidateOn",
              type: '"focus" | "change" | "blur" | "pointerleave"',
              defaultValue: '"change"',
              description: "已报错字段及对应表单级错误的重新校验时机。",
            },
            {
              name: "validateDebounce",
              type: "number",
              description: "change 异步校验的防抖时间，沿用现有毫秒合约。",
            },
            {
              name: "validate",
              type: "(values: T) => FormErrors<T> | Promise<FormErrors<T>>",
              description:
                "跨字段或表单级校验；与字段规则共享触发时机和过期结果保护。",
            },
            {
              name: "layout",
              type: '"vertical" | "horizontal" | "inline"',
              defaultValue: '"horizontal"',
              description:
                "字段排列方式；horizontal 在窄屏折叠，inline 在空间不足时换行。",
            },
            {
              name: "noValidate",
              type: "boolean",
              description: "保留原生 noValidate 语义及现有 Form 校验配置行为。",
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
              description:
                "必填、长度、格式、范围、枚举或自定义校验规则；required 规则同时驱动必填标记。",
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

      <Section title="Form.Label API">
        <PropsTable
          rows={[
            {
              name: "required",
              type: "boolean",
              defaultValue: "false",
              description:
                "显示现有视觉必填标记；required 字段规则也会自动显示同一标记。",
            },
            {
              name: "labelWrap",
              type: "boolean",
              defaultValue: "false",
              description:
                "允许长标签与标记自然换行；仅改变视觉样式，不改变可访问名称或关联。",
            },
            {
              name: "htmlFor",
              type: "string",
              description:
                "保留原生 label 关联；通常由 Field/Control 自动提供。",
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
            "必填、无效、禁用、只读和异步校验状态会暴露给辅助技术；视觉星号保持 aria-hidden。",
            "提交失败聚焦第一个错误字段；异步提交失败保留输入并显示表单级错误。",
            "focus 与 blur 校验同时支持键盘和指针；pointerleave 不会成为唯一的报错或清除错误机会。",
            "所有布局保持 DOM 与 Tab 顺序一致；horizontal 在手机宽度折叠，inline 换行而不压缩控件。",
            "labelWrap 不改变 htmlFor、aria-labelledby、aria-describedby 或控件的可访问名称。",
            "错误与校验反馈不依赖颜色，reduced motion 下移除非必要动画。",
          ]}
        />
        <Callout title="服务端校验" tone="info">
          可通过 FormRef 的 setError 映射字段错误，通过 setFormError
          展示无法归属于单个字段的服务端错误。
        </Callout>
      </Section>

      <Section title="迁移说明">
        <BulletList
          items={[
            '需要旧版纵向视觉排列时，为现有 Form.Root 添加 layout="vertical"；Field、Label、Control 等组合无需迁移。',
            "Form.Root.validate 与 Valibot 现在会在配置的交互时机运行。请让校验函数保持纯净；昂贵或带副作用的逻辑应移出 validate。",
            '只希望提交时首次校验的表单可使用 validateOn="submit"，并通过 revalidateOn 单独配置已有错误的更新时机。',
            "不新增 Form.Field required、Form.Grid 或第二套校验状态；服务端与异步流程继续使用现有 API。",
          ]}
        />
      </Section>
    </Page>
  );
}
