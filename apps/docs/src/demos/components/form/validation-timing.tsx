import { useState } from "react";
import { Form, Input } from "seam-react";
import { valibotResolver } from "seam-react/valibot-resolver";
import * as v from "valibot";

const schema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效的邮箱地址"),
  ),
  name: v.pipe(v.string(), v.nonEmpty("请输入姓名")),
});

type FormValues = v.InferOutput<typeof schema>;

export default function ValidationTimingDemo() {
  const [validateOn, setValidateOn] = useState<
    "blur" | "change" | "focus" | "pointerleave" | "submit"
  >("blur");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
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
          style={{ marginLeft: "0.5rem" }}
        >
          <option value="blur">blur（默认）</option>
          <option value="change">change</option>
          <option value="focus">focus</option>
          <option value="pointerleave">pointerleave</option>
          <option value="submit">submit</option>
        </select>
      </div>

      <Form.Root<FormValues>
        layout="vertical"
        validateOn={validateOn}
        revalidateOn="change"
        validate={valibotResolver(schema)}
        onSubmit={(values) => {
          alert(`提交成功：${JSON.stringify(values)}`);
        }}
        onSubmitFailed={(errors) => {
          console.log("验证失败：", errors);
        }}
      >
        <Form.Field name="name">
          <Form.Label>姓名</Form.Label>
          <Form.Control>
            <Input placeholder="请输入姓名" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <Input type="email" placeholder="请输入邮箱" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <button type="submit">提交</button>
        </Form.Actions>
      </Form.Root>
    </div>
  );
}
