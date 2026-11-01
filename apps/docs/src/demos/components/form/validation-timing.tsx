import { useState } from "react";
import { Form, Input } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const schema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效的邮箱地址"),
  ),
  username: v.pipe(
    v.string(),
    v.nonEmpty("请输入用户名"),
    v.minLength(3, "用户名至少 3 个字符"),
  ),
});

type ValidationValues = v.InferInput<typeof schema>;

export default function ValidationTimingDemo() {
  const [validateOn, setValidateOn] = useState<
    "blur" | "change" | "focus" | "pointerleave" | "submit"
  >("blur");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label htmlFor="validate-on-select">验证时机：</label>
        <select
          id="validate-on-select"
          value={validateOn}
          onChange={(e) =>
            setValidateOn(
              e.target.value as
                | "blur"
                | "change"
                | "focus"
                | "pointerleave"
                | "submit",
            )
          }
          style={{
            padding: "0.375rem 0.5rem",
            borderRadius: "var(--uk-radius-sm)",
            border: "1px solid var(--uk-border)",
            background: "var(--uk-surface)",
            color: "var(--uk-text)",
          }}
        >
          <option value="blur">blur（默认）</option>
          <option value="change">change</option>
          <option value="focus">focus</option>
          <option value="pointerleave">pointerleave</option>
          <option value="submit">submit</option>
        </select>
      </div>

      <Form.Root<ValidationValues>
        key={validateOn}
        layout="vertical"
        validateOn={validateOn}
        revalidateOn="change"
        validate={valibotResolver(schema)}
        onSubmit={(values) => {
          alert(JSON.stringify(values, null, 2));
        }}
        style={{ maxWidth: 400 }}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <Input placeholder="you@example.com" />
          </Form.Control>
          <Form.Description>用于接收通知的邮箱地址</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field name="username">
          <Form.Label>用户名</Form.Label>
          <Form.Control>
            <Input placeholder="至少 3 个字符" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--uk-radius-sm)",
              border: "none",
              background: "var(--uk-primary-solid)",
              color: "var(--uk-primary-contrast)",
              cursor: "pointer",
            }}
          >
            提交
          </button>
        </Form.Actions>
      </Form.Root>
    </div>
  );
}
