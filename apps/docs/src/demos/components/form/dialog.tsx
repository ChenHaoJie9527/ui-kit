import { useId, useRef, useState } from "react";
import {
  Button,
  Dialog,
  Form,
  Input,
  Select,
  Switch,
  type FormRef,
} from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const roles = [
  { value: "developer", label: "开发者" },
  { value: "designer", label: "设计师" },
  { value: "admin", label: "管理员" },
];

const InviteSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("请输入成员姓名")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入成员邮箱"),
    v.email("请输入有效邮箱"),
  ),
  role: v.picklist(["developer", "designer", "admin"], "请选择成员角色"),
  notify: v.boolean(),
});

type InviteValues = v.InferInput<typeof InviteSchema>;

export function Demo() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [lastInvite, setLastInvite] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<FormRef<InviteValues>>(null);
  const formId = useId();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="w-full max-w-[560px] rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 font-mono text-[10.5px] tracking-[0.08em] text-faint uppercase">
              Team settings
            </p>
            <h3 className="mt-1 text-[19px] leading-tight font-[650]">
              邀请团队成员
            </h3>
            <p className="mt-1 max-w-[38ch] text-[12.5px] leading-[1.65] text-muted">
              成员会收到邮件邀请，并在首次登录后加入当前企业空间。
            </p>
          </div>
          <Dialog.Trigger>
            <Button>邀请成员</Button>
          </Dialog.Trigger>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-2 px-4 py-3">
          <p className="m-0 text-[11.5px] text-faint">最近发送</p>
          <output
            className="mt-1 block min-h-5 text-[13px] font-medium text-ink"
            aria-live="polite"
          >
            {lastInvite || "尚未发送邀请"}
          </output>
        </div>
      </div>

      <Dialog.Content initialFocusRef={nameRef}>
        <Dialog.Header>
          <Dialog.Title>邀请成员加入 Seam Labs</Dialog.Title>
          <Dialog.Description>
            选择角色后发送邀请；管理员角色可管理和发布全部项目。
          </Dialog.Description>
          <Dialog.Close>
            <Button variant="ghost" size="sm" iconOnly aria-label="关闭">
              ×
            </Button>
          </Dialog.Close>
        </Dialog.Header>

        <Dialog.Body>
          <Form.Root<InviteValues>
            ref={formRef}
            id={formId}
            defaultValues={{
              name: "",
              email: "",
              role: "developer",
              notify: true,
            }}
            validate={valibotResolver(InviteSchema)}
            onSubmit={async (values) => {
              const email = String(values.email ?? "");
              setPending(true);

              try {
                await new Promise((resolve) => window.setTimeout(resolve, 900));

                if (email === "blocked@example.com") {
                  formRef.current?.setError(
                    "email",
                    "该用户已属于其他企业空间",
                  );
                  window.requestAnimationFrame(() => {
                    formRef.current?.focusFirstError();
                  });
                  throw new Error("邀请发送失败，请检查标记字段后重试。");
                }

                setLastInvite(email);
                setOpen(false);
              } finally {
                setPending(false);
              }
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Form.Field name="name">
                <Form.Label>姓名</Form.Label>
                <Form.Control>
                  <Input
                    ref={nameRef}
                    autoComplete="name"
                    placeholder="成员姓名"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Field>

              <Form.Field name="email">
                <Form.Label>邮箱</Form.Label>
                <Form.Control>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="member@company.com"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Field>
            </div>

            <Form.Field name="role">
              <Form.Label>成员角色</Form.Label>
              <Form.Control>
                <Select
                  options={roles}
                  placeholder="请选择角色"
                  aria-label="成员角色"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="notify">
              <Form.Control>
                <Switch>邀请发送后通知项目维护者</Switch>
              </Form.Control>
            </Form.Field>

            <p className="m-0 text-[11.5px] leading-[1.6] text-muted">
              使用 blocked@example.com 可预览服务端失败态。
            </p>
          </Form.Root>
        </Dialog.Body>

        <Dialog.Footer>
          <Dialog.Close>
            <Button type="button" variant="outline">
              取消
            </Button>
          </Dialog.Close>
          <Button type="submit" form={formId} loading={pending}>
            发送邀请
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
