import { useRef, useState } from "react";
import * as v from "valibot";
import {
  Button,
  Form,
  Input,
  type FormRef,
  type FormValidationTrigger,
} from "seam-react";
import { valibotResolver } from "seam-react/valibot";

interface AccountValues extends Record<string, unknown> {
  username: string;
  email: string;
}

const accountSchema = v.object({
  username: v.pipe(
    v.string(),
    v.nonEmpty("请输入用户名"),
    v.minLength(3, "用户名至少需要 3 个字符"),
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效的邮箱地址"),
  ),
});

const triggers: Array<{
  value: FormValidationTrigger;
  label: string;
  description: string;
}> = [
  { value: "blur", label: "Blur", description: "离开控件时验证（默认）" },
  { value: "focus", label: "Focus", description: "获得焦点时验证" },
  { value: "change", label: "Change", description: "值变化后验证" },
  {
    value: "pointerleave",
    label: "Pointer leave",
    description: "指针离开字段区域时验证",
  },
  { value: "submit", label: "Submit", description: "仅提交时进行首次验证" },
];

const defaultValues: AccountValues = {
  username: "",
  email: "",
};

export default function ValidationTimingDemo() {
  const formRef = useRef<FormRef<AccountValues>>(null);
  const [trigger, setTrigger] = useState<FormValidationTrigger>("blur");
  const [message, setMessage] = useState(
    "修改字段，观察 Valibot 错误出现和清除的时机。",
  );

  return (
    <div className="demo-stack">
      <div className="demo-row" aria-label="验证时机">
        {triggers.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={trigger === item.value ? "primary" : "outline"}
            aria-pressed={trigger === item.value}
            onClick={() => {
              setTrigger(item.value);
              setMessage(`${item.label}：${item.description}`);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <p className="demo-description">{message}</p>

      <Form.Root<AccountValues>
        key={trigger}
        ref={formRef}
        layout="vertical"
        defaultValues={defaultValues}
        validateOn={trigger}
        revalidateOn="change"
        validateDebounce={200}
        validate={valibotResolver(accountSchema)}
        onSubmit={async () => {
          await new Promise((resolve) => setTimeout(resolve, 250));
          setMessage("验证通过，账号信息已提交。");
        }}
        onSubmitFailed={() => {
          setMessage("请修正字段错误；提交失败会聚焦第一个无效字段。");
        }}
      >
        <Form.Field name="username">
          <Form.Label>用户名</Form.Label>
          <Form.Control>
            <Input placeholder="至少 3 个字符" autoComplete="username" />
          </Form.Control>
          <Form.Description>
            字段规则与 Valibot schema 共用同一验证时机。
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <Input
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </Form.Control>
          <Form.Description>
            已出现的错误会在值变化时重新验证。
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <Button type="submit">提交</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              formRef.current?.reset();
              setMessage("已重置；再次交互以观察当前验证时机。");
            }}
          >
            重置
          </Button>
        </Form.Actions>
      </Form.Root>
    </div>
  );
}
