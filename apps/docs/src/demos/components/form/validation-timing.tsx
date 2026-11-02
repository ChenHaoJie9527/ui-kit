import { useState } from "react";
import { Form, Input } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const schema = v.object({
  email: v.pipe(v.string(), v.email("请输入有效邮箱")),
  password: v.pipe(v.string(), v.minLength(8, "至少 8 个字符")),
});

export default function ValidationTimingDemo() {
  const [trigger, setTrigger] = useState<"focus" | "change" | "blur">("blur");

  return (
    <div style={{ display: "grid", gap: "var(--uk-space-4)" }}>
      <label>
        验证时机：{" "}
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as typeof trigger)}
        >
          <option value="focus">focus</option>
          <option value="change">change</option>
          <option value="blur">blur</option>
        </select>
      </label>
      <Form.Root
        layout="vertical"
        validateOn={trigger}
        revalidateOn="change"
        validate={valibotResolver(schema)}
        onSubmit={() => {}}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <Input type="email" placeholder="you@example.com" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="password">
          <Form.Label>密码</Form.Label>
          <Form.Control>
            <Input type="password" placeholder="至少 8 个字符" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Actions>
          <button type="submit" className="uk-button" data-variant="primary">
            提交
          </button>
        </Form.Actions>
      </Form.Root>
    </div>
  );
}
