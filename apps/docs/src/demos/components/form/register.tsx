import { useRef } from "react";
import {
  useFormContext,
  Button,
  CheckBox,
  Form,
  Input,
  type FormRef,
} from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const RegisterSchema = v.object({
  fullName: v.pipe(v.string(), v.nonEmpty("请输入姓名")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入工作邮箱"),
    v.email("请输入有效邮箱"),
  ),
  password: v.pipe(
    v.string(),
    v.minLength(8, "密码至少 8 位"),
    v.regex(/[A-Za-z]/, "密码需包含字母"),
    v.regex(/\d/, "密码需包含数字"),
  ),
  confirmPassword: v.pipe(v.string(), v.nonEmpty("请再次输入密码")),
  acceptedTerms: v.pipe(
    v.boolean(),
    v.check((accepted) => accepted, "请先同意服务条款与隐私政策"),
  ),
});

type RegisterValues = v.InferInput<typeof RegisterSchema>;

const resolveRegister = valibotResolver(RegisterSchema);

async function validateRegister(values: RegisterValues) {
  const errors = await resolveRegister(values);

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "两次输入的密码不一致";
  }

  return errors;
}

function SubmitStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 min-h-5 text-[12.5px] text-muted" aria-live="polite">
      {state.submitting
        ? "正在创建企业空间…"
        : state.submitSucceeded
          ? "企业账号已创建，邀请邮件已发送。"
          : "使用 blocked@example.com 可预览服务端字段错误与表单级错误。"}
    </output>
  );
}

function SubmitButton() {
  const { state } = useFormContext();

  return (
    <Button type="submit" loading={state.submitting}>
      创建企业账号
    </Button>
  );
}

export function Demo() {
  const formRef = useRef<FormRef<RegisterValues>>(null);

  return (
    <div className="w-full max-w-[560px]">
      <div className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <header className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[19px] leading-tight font-[650]">
              创建企业账号
            </h3>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.04em] text-accent">
              14 天试用
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
            创建独立工作空间，成员与账单都由管理员统一管理。
          </p>
        </header>

        <Form.Root<RegisterValues>
          ref={formRef}
          layout="vertical"
          defaultValues={{
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptedTerms: false,
          }}
          validate={validateRegister}
          onSubmit={async ({ email }) => {
            await new Promise((resolve) => window.setTimeout(resolve, 900));

            if (email === "blocked@example.com") {
              formRef.current?.setError("email", "该邮箱已被其他企业空间占用");
              window.requestAnimationFrame(() => {
                formRef.current?.focusFirstError();
              });
              throw new Error("注册失败，请检查标记字段后重试。");
            }
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Form.Field name="fullName">
              <Form.Label>姓名</Form.Label>
              <Form.Control>
                <Input autoComplete="name" placeholder="张明" />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="email">
              <Form.Label>工作邮箱</Form.Label>
              <Form.Control>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Form.Field name="password">
              <Form.Label>设置密码</Form.Label>
              <Form.Control>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="至少 8 位，含字母和数字"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="confirmPassword">
              <Form.Label>确认密码</Form.Label>
              <Form.Control>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="再次输入密码"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>
          </div>

          <p className="m-0 rounded-lg bg-surface-2 px-3 py-2 text-[11.5px] leading-[1.6] text-muted">
            仅用于 UI 示例，不代表真实认证安全实现；示例不会发送真实账号或密码。
          </p>

          <Form.Field name="acceptedTerms">
            <Form.Control>
              <CheckBox>
                我已阅读并同意服务条款与隐私政策，并确认拥有创建企业空间的权限。
              </CheckBox>
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Actions className="flex-col items-stretch sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-[11.5px] leading-[1.5] text-faint">
              不会向你的邮箱发送营销邮件。
            </p>
            <SubmitButton />
          </Form.Actions>
          <SubmitStatus />
        </Form.Root>
      </div>
    </div>
  );
}
