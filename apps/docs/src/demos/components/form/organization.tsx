import {
  useFormContext,
  Button,
  Form,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  Switch,
} from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const industries = [
  { value: "saas", label: "软件与 SaaS" },
  { value: "finance", label: "金融科技" },
  { value: "commerce", label: "零售与电商" },
  { value: "other", label: "其他行业" },
];

const OrganizationSchema = v.object({
  companyName: v.pipe(v.string(), v.nonEmpty("请输入公司名称")),
  creditCode: v.pipe(
    v.string(),
    v.nonEmpty("请输入统一社会信用代码"),
    v.minLength(6, "统一社会信用代码至少 6 位"),
  ),
  industry: v.picklist(
    ["saas", "finance", "commerce", "other"],
    "请选择所属行业",
  ),
  companySize: v.picklist(["small", "medium", "large"], "请选择团队规模"),
  adminEmail: v.pipe(
    v.string(),
    v.nonEmpty("请输入管理员邮箱"),
    v.email("请输入有效邮箱"),
  ),
  securityNotifications: v.boolean(),
});

type OrganizationValues = v.InferInput<typeof OrganizationSchema>;

function SubmitStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 min-h-5 text-[12.5px] text-muted" aria-live="polite">
      {state.submitting
        ? "正在提交企业认证资料…"
        : state.submitSucceeded
          ? "资料已提交，审核结果会发送到管理员邮箱。"
          : "统一社会信用代码填写 000000 可预览服务端失败态。"}
    </output>
  );
}

function SubmitButton() {
  const { state } = useFormContext();

  return (
    <Button type="submit" loading={state.submitting}>
      提交认证
    </Button>
  );
}

export function Demo() {
  return (
    <div className="w-full max-w-[660px]">
      <div className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[19px] leading-tight font-[650]">
              企业认证资料
            </h3>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
              用于开通企业合同、发票与成员席位管理。
            </p>
          </div>
          <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10.5px] font-medium text-muted">
            约 2 分钟
          </span>
        </header>

        <Form.Root<OrganizationValues>
          defaultValues={{
            companyName: "",
            creditCode: "",
            industry: "saas",
            companySize: "small",
            adminEmail: "",
            securityNotifications: true,
          }}
          validate={valibotResolver(OrganizationSchema)}
          onSubmit={async ({ creditCode }) => {
            await new Promise((resolve) => window.setTimeout(resolve, 1000));

            if (creditCode === "000000") {
              throw new Error(
                "企业信息校验未通过，请核对公司名称与统一社会信用代码。",
              );
            }
          }}
        >
          <fieldset className="m-0 min-w-0 rounded-xl border border-line bg-surface-2/40 p-4">
            <legend className="px-1 text-[12px] font-semibold tracking-[0.04em] text-muted">
              企业资料
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Form.Field name="companyName">
                <Form.Label>公司名称</Form.Label>
                <Form.Control>
                  <Input
                    autoComplete="organization"
                    placeholder="与营业执照保持一致"
                  />
                </Form.Control>
                <Form.Description>
                  请使用营业执照上的法定名称，审核通过后需要走变更流程。
                </Form.Description>
                <Form.ErrorMessage />
              </Form.Field>

              <Form.Field name="industry">
                <Form.Label>所属行业</Form.Label>
                <Form.Control>
                  <Select
                    options={industries}
                    placeholder="请选择行业"
                    aria-label="所属行业"
                  />
                </Form.Control>
                <Form.Description>
                  用于匹配合规模板、行业基准与可用集成。
                </Form.Description>
                <Form.ErrorMessage />
              </Form.Field>
            </div>

            <Form.Field name="creditCode">
              <Form.Label>统一社会信用代码</Form.Label>
              <Form.Control>
                <Input
                  autoCapitalize="characters"
                  placeholder="例如 91310000XXXX"
                />
              </Form.Control>
              <Form.Description>
                仅用于企业身份核验，不会公开展示。
              </Form.Description>
              <Form.ErrorMessage />
            </Form.Field>
          </fieldset>

          <fieldset className="m-0 min-w-0 rounded-xl border border-line bg-surface-2/40 p-4">
            <legend className="px-1 text-[12px] font-semibold tracking-[0.04em] text-muted">
              团队与通知
            </legend>
            <Form.Field name="companySize">
              <Form.Label>团队规模</Form.Label>
              <Form.Control>
                <RadioGroup orientation="horizontal">
                  <RadioGroupItem value="small" label="1–50 人" />
                  <RadioGroupItem value="medium" label="51–200 人" />
                  <RadioGroupItem value="large" label="201 人以上" />
                </RadioGroup>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="adminEmail">
              <Form.Label>管理员邮箱</Form.Label>
              <Form.Control>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@company.com"
                />
              </Form.Control>
              <Form.Description>
                审核结果、合同变更与管理员安全通知会发送到这里。
              </Form.Description>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="securityNotifications">
              <Form.Control>
                <Switch>接收安全通知</Switch>
              </Form.Control>
              <Form.Description>
                包括新设备登录、管理员变更与异常访问提醒；关闭后仍会收到无法退订的安全事件。
              </Form.Description>
            </Form.Field>
          </fieldset>

          <Form.Actions>
            <SubmitButton />
          </Form.Actions>
          <SubmitStatus />
        </Form.Root>
      </div>
    </div>
  );
}
