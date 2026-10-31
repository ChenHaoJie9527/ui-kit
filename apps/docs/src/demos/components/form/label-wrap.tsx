import { Form, Input } from "seam-react";

export default function LabelWrapDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h3>labelWrap=false（默认）</h3>
        <Form.Root layout="horizontal" onSubmit={() => {}}>
          <Form.Field name="username" rules={{ required: true }}>
            <Form.Label>
              这是一个非常长的标签文本用于演示不换行时的显示效果
            </Form.Label>
            <Form.Control>
              <Input placeholder="请输入用户名" />
            </Form.Control>
            <Form.Description>用户名将用于登录系统</Form.Description>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>
      </div>

      <div>
        <h3>labelWrap=true</h3>
        <Form.Root layout="horizontal" onSubmit={() => {}}>
          <Form.Field name="email" rules={{ required: true }}>
            <Form.Label labelWrap>
              这是一个非常长的标签文本用于演示换行时的显示效果，标签和必填标记都会正常换行
            </Form.Label>
            <Form.Control>
              <Input type="email" placeholder="请输入邮箱" />
            </Form.Control>
            <Form.Description>
              我们将向此邮箱发送验证邮件，请确保邮箱地址正确
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>
      </div>

      <div>
        <h3>显式 required 属性</h3>
        <Form.Root layout="vertical" onSubmit={() => {}}>
          <Form.Field name="phone">
            <Form.Label required labelWrap>
              手机号码（通过 Label required 属性显示必填标记）
            </Form.Label>
            <Form.Control>
              <Input type="tel" placeholder="请输入手机号" />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>
      </div>
    </div>
  );
}
