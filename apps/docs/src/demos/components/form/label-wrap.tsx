import { useRef, useState } from "react";
import { Button, Form, Input, type FormRef } from "seam-react";

interface ProfileValues extends Record<string, unknown> {
  displayName: string;
  contactEmail: string;
}

const defaultValues: ProfileValues = {
  displayName: "",
  contactEmail: "",
};

export default function LabelWrapDemo() {
  const formRef = useRef<FormRef<ProfileValues>>(null);
  const [labelWrap, setLabelWrap] = useState(true);
  const [message, setMessage] = useState(
    "长标签可以换行，必填标记仍对辅助技术隐藏。",
  );

  return (
    <div className="demo-stack">
      <div className="demo-row">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={labelWrap}
          onClick={() => setLabelWrap((current) => !current)}
        >
          labelWrap：{labelWrap ? "开启" : "关闭"}
        </Button>
      </div>

      <Form.Root<ProfileValues>
        ref={formRef}
        layout="vertical"
        defaultValues={defaultValues}
        onSubmit={() => {
          setMessage("资料已保存；标签换行不会改变字段的可访问名称。");
        }}
        onSubmitFailed={() => {
          setMessage("请填写必填字段并修正邮箱格式。");
        }}
      >
        <Form.Field
          name="displayName"
          rules={{
            required: true,
            minLength: {
              value: 2,
              message: "显示名称至少需要 2 个字符",
            },
          }}
        >
          <Form.Label labelWrap={labelWrap}>
            在团队成员、客户以及外部合作方界面中展示的完整显示名称
          </Form.Label>
          <Form.Control>
            <Input placeholder="例如：林晓雨" autoComplete="name" />
          </Form.Control>
          <Form.Description>
            必填星号由 required 规则自动显示，控件保留 aria-required。
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field
          name="contactEmail"
          rules={{
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "请输入有效的联系邮箱",
            },
          }}
        >
          <Form.Label required labelWrap={labelWrap}>
            用于接收安全通知、账单信息和账户恢复消息的长期有效联系邮箱
          </Form.Label>
          <Form.Control>
            <Input
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </Form.Control>
          <Form.Description>
            标签、说明和错误信息保持各自的可访问关联。
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <Button type="submit">保存资料</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              formRef.current?.reset();
              setMessage("已重置表单。");
            }}
          >
            重置
          </Button>
        </Form.Actions>
      </Form.Root>

      <output className="demo-description">{message}</output>
    </div>
  );
}
