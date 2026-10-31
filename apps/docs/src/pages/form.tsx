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
      tags={["组合式 API", "Valibot", "业务配方", "受控 / 非受控", "错误关联"]}
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
        description="Root 提供 vertical、horizontal 和 inline 三种布局。horizontal 为默认值，在窄屏自动恢复纵向阅读顺序；inline 用于筛选栏等紧凑场景，空间不足时换行。"
      >
        <Demo code={getFormDemoSource("layouts")} label="layouts.tsx">
          <LayoutsDemo />
        </Demo>
        <Callout title="默认布局变更" tone="info">
          本版本默认布局由纵向堆叠改为 <InlineCode>horizontal</InlineCode>
          。已有表单若需要保留原来的视觉排列，只需显式设置
          <InlineCode>layout="vertical"</InlineCode>，无需调整 Field、Label 或
          Control 的组合结构。
        </Callout>
      </Section>

      <Section
        title="长标签换行"
        description="labelWrap 允许长标签与必填标记自然换行，不改变可访问名称，也不遮挡控件。默认值为 false。"
      >
        <Demo code={getFormDemoSource("label-wrap")} label="label-wrap.tsx">
          <LabelWrapDemo />
        </Demo>
      </Section>

      <Section
        title="校验时机"
        description="validateOn 支持 focus、change、blur、pointerleave 和 submit；字段 rules 与 Root validate（包括 Valibot resolver）遵循同一时机。revalidateOn 控制已报错字段的重新校验。"
      >
        <Demo
          code={getFormDemoSource("validation-timing")}
          label="validation-timing.tsx"
        >
          <ValidationTimingDemo />
        </Demo>
        <BulletList
          items={[
            <>
              默认 <InlineCode>validateOn="blur"</InlineCode>、
              <InlineCode>revalidateOn="change"</InlineCode>
              ，与既有交互时机一致。
            </>,
            <>
              <InlineCode>focus</InlineCode> 同时响应键盘和指针聚焦；
              <InlineCode>pointerleave</InlineCode>{" "}
              只是补充反馈，键盘与触摸用户仍可通过 blur、change 和 submit
              获得等价结果。
            </>,
            <>
              <InlineCode>validateOn="submit"</InlineCode>
              关闭首次交互校验，但提交始终执行完整校验；已存在错误仍按
              revalidateOn 更新。
            </>,
            <>
              异步 change 校验沿用 <InlineCode>validateDebounce</InlineCode>
              ，新结果会取代过期结果，避免旧请求覆盖新错误。
            </>,
          ]}
        />
      </Section>

      <Section
        title="Valibot 校验"
        description="使用独立的 valibotResolver 子入口，把 Valibot schema 直接接入 Form.Root 的 validate 合约。"
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
              返回异步校验函数； 输入类型取自{" "}
              <InlineCode>InferInput</InlineCode>，不会误用 schema 输出类型。
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
              description: "首次字段与表单级校验时机。",
            },
            {
              name: "revalidateOn",
              type: '"focus" | "change" | "blur" | "pointerleave"',
              defaultValue: '"change"',
              description: "已报错字段的重新校验时机。",
            },
            {
              name: "validateDebounce",
              type: "number",
              description: "change 触发的异步校验防抖时间，单位毫秒。",
            },
            {
              name: "validate",
              type: "(values: T) => FormErrors<T> | Promise<FormErrors<T>>",
              description: "跨字段或表单级校验，与字段 rules 使用相同时机。",
            },
            {
              name: "layout",
              type: '"vertical" | "horizontal" | "inline"',
              defaultValue: '"horizontal"',
              description: "字段排列方式；horizontal 在窄屏折叠为纵向。",
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

      <Section title="Form.Label API">
        <PropsTable
          rows={[
            {
              name: "required",
              type: "boolean",
              defaultValue: "false",
              description:
                "显示 aria-hidden 的必填星号；required 规则也会自动显示。",
            },
            {
              name: "labelWrap",
              type: "boolean",
              defaultValue: "false",
              description: "允许长标签与必填标记换行，不改变可访问名称。",
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
            "horizontal 与 inline 只改变视觉布局，Tab 顺序仍遵循 DOM 顺序；窄屏下恢复可读的标签—控件—反馈顺序。",
            "labelWrap 只影响视觉换行，不修改 htmlFor、aria-labelledby 或 aria-describedby。",
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
