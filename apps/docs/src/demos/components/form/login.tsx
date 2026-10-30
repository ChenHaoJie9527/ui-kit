import { useFormContext, Button, CheckBox, Form, Input } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效邮箱"),
  ),
  password: v.pipe(v.string(), v.minLength(8, "密码至少 8 位")),
  remember: v.boolean(),
});

function SubmitStatus() {
  const { state } = useFormContext();

  return (
    <output
      className="m-0 min-h-5 text-center text-[12.5px] text-muted"
      aria-live="polite"
    >
      {state.submitting
        ? "正在验证账号…"
        : state.submitSucceeded
          ? "登录成功，正在进入工作台。"
          : "使用 blocked@example.com 可预览服务端失败态。"}
    </output>
  );
}

function SubmitButton() {
  const { state } = useFormContext();

  return (
    <Button className="w-full" type="submit" loading={state.submitting}>
      登录
    </Button>
  );
}

export function Demo() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <header className="mb-5 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft font-mono text-sm font-bold text-accent">
            S
          </span>
          <div>
            <h3 className="m-0 text-[19px] leading-tight font-[650]">
              登录 Seam Cloud
            </h3>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
              使用团队账号继续管理构建与发布。
            </p>
          </div>
        </header>

        <Form.Root
          defaultValues={{ email: "", password: "", remember: true }}
          validate={valibotResolver(LoginSchema)}
          onSubmit={async ({ email }) => {
            await new Promise((resolve) => window.setTimeout(resolve, 800));

            if (email === "blocked@example.com") {
              throw new Error("账号或密码不正确，请重试。");
            }
          }}
        >
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

          <Form.Field name="password">
            <Form.Label>密码</Form.Label>
            <Form.Control>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="至少 8 位字符"
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="remember">
            <Form.Control>
              <CheckBox>在此设备上保持登录</CheckBox>
            </Form.Control>
          </Form.Field>

          <p className="m-0 rounded-lg bg-surface-2 px-3 py-2 text-[11px] leading-[1.55] text-muted">
            仅用于 UI 示例，不代表真实认证安全实现；示例不会发送真实账号或密码。
          </p>

          <Form.Actions>
            <SubmitButton />
          </Form.Actions>
          <SubmitStatus />
        </Form.Root>
      </div>
    </div>
  );
}
