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
  legalName: v.pipe(v.string(), v.nonEmpty("请输入企业全称")),
  creditCode: v.pipe(
    v.string(),
    v.nonEmpty("请输入统一社会信用代码"),
    v.minLength(6, "统一社会信用代码至少 6 位"),
  ),
  industry: v.picklist(
    ["saas", "finance", "commerce", "other"],
    "请选择所属行业",
  ),
  companySize: v.picklist(["small", "medium", "large"], "请选择公司规模"),
  contactEmail: v.pipe(
    v.string(),
    v.nonEmpty("请输入联系人邮箱"),
    v.email("请输入有效邮箱"),
  ),
  productUpdates: v.boolean(),
});

type OrganizationValues = v.InferInput<typeof OrganizationSchema>;

function SubmitStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 min-h-5 text-[12.5px] text-muted" aria-live="polite">
      {state.submitting
        ? "正在提交企业认证资料…"
        : state.submitSucceeded
          ? "资料已提交，审核结果会发送到联系人邮箱。"
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
    <div className="w-full max-w-[640px]">
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
            legalName: "",
            creditCode: "",
            industry: "saas",
            companySize: "small",
            contactEmail: "",
            productUpdates: true,
          }}
          validate={valibotResolver(OrganizationSchema)}
          onSubmit={async ({ creditCode }) => {
            await new Promise((resolve) => window.setTimeout(resolve, 1000));

            if (creditCode === "000000") {
              throw new Error(
                "企业信息校验未通过，请核对名称与统一社会信用代码。",
              );
            }
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Form.Field name="legalName">
              <Form.Label>企业全称</Form.Label>
              <Form.Control>
                <Input
                  autoComplete="organization"
                  placeholder="与营业执照保持一致"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="creditCode">
              <Form.Label>统一社会信用代码</Form.Label>
              <Form.Control>
                <Input
                  autoCapitalize="characters"
                  placeholder="例如 91310000XXXX"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Form.Field name="industry">
              <Form.Label>所属行业</Form.Label>
              <Form.Control>
                <Select
                  options={industries}
                  placeholder="请选择行业"
                  aria-label="所属行业"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="contactEmail">
              <Form.Label>联系人邮箱</Form.Label>
              <Form.Control>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="finance@company.com"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>
          </div>

          <Form.Field name="companySize">
            <Form.Label>公司规模</Form.Label>
            <Form.Control>
              <RadioGroup orientation="horizontal">
                <RadioGroupItem value="small" label="1–50 人" />
                <RadioGroupItem value="medium" label="51–200 人" />
                <RadioGroupItem value="large" label="201 人以上" />
              </RadioGroup>
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="productUpdates">
            <Form.Control>
              <Switch>接收产品更新与合规通知</Switch>
            </Form.Control>
            <Form.Description>
              安全事件、合同变更与账单通知不受此选项影响。
            </Form.Description>
          </Form.Field>

          <Form.Actions>
            <SubmitButton />
          </Form.Actions>
          <SubmitStatus />
        </Form.Root>
      </div>
    </div>
  );
}
