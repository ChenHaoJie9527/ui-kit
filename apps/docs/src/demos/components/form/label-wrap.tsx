import { useState } from "react";
import { Button, Form, Input } from "seam-react";

export function Demo() {
  const [submitted, setSubmitted] = useState("");

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-5">
      <div className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <Form.Root
          layout="horizontal"
          defaultValues={{ legalName: "", contact: "" }}
          onSubmit={(values) =>
            setSubmitted(`已提交联系人：${String(values.contact || "（空）")}`)
          }
        >
          <Form.Field
            name="legalName"
            rules={[
              { required: true, message: "请输入营业执照上的完整名称。" },
            ]}
          >
            <Form.Label labelWrap>
              企业法定全称（必须与营业执照及合同主体保持完全一致）
            </Form.Label>
            <Form.Control>
              <Input
                autoComplete="organization"
                placeholder="请输入完整企业名称"
              />
            </Form.Control>
            <Form.Description>
              required 规则自动显示星号；长标签、说明和错误都在各自区域内换行。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="contact">
            <Form.Label required labelWrap={false}>
              管理员联系邮箱
            </Form.Label>
            <Form.Control>
              <Input
                type="email"
                autoComplete="email"
                aria-required="true"
                placeholder="admin@company.com"
              />
            </Form.Control>
            <Form.Description>
              此标签显式使用 required，并保留 labelWrap=false 的非换行设置。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Actions>
            <Button type="submit">保存企业资料</Button>
          </Form.Actions>
        </Form.Root>
      </div>

      <p className="m-0 text-[12px] leading-[1.65] text-muted">
        星号仅为视觉提示并保持 aria-hidden；labelWrap
        不会改变标签文本、控件名称、htmlFor 或 aria-describedby。缩窄视口可观察
        horizontal 布局恢复纵向阅读顺序。
      </p>
      <output
        className="m-0 min-h-5 text-[12.5px] text-muted"
        aria-live="polite"
      >
        {submitted || "留空提交第一个字段，检查长错误文本与控件的关联。"}
      </output>
    </div>
  );
}
