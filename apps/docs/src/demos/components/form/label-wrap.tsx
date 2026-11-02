import { Form, Input } from "seam-react";

export function Demo() {
  return (
    <Form.Root
      layout="horizontal"
      data-testid="form-label-wrap"
      onSubmit={() => {}}
    >
      <Form.Field
        name="bio"
        rules={[{ required: true, message: "请输入个人简介" }]}
      >
        <Form.Label labelWrap>
          个人简介（这是一个非常长的标签，用于演示 labelWrap
          属性允许文本换行而不截断）
        </Form.Label>
        <Form.Control>
          <Input placeholder="请输入个人简介" />
        </Form.Control>
        <Form.Description>支持 Markdown 格式</Form.Description>
        <Form.ErrorMessage />
      </Form.Field>
      <Form.Field name="nickname">
        <Form.Label labelWrap={false}>昵称（不换行）</Form.Label>
        <Form.Control>
          <Input placeholder="请输入昵称" />
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Field>
      <Form.Actions>
        <button type="submit" className="uk-button" data-variant="primary">
          保存
        </button>
      </Form.Actions>
    </Form.Root>
  );
}
