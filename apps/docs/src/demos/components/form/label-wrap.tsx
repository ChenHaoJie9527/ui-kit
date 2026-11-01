import { Form, Input } from "seam-react";

export default function LabelWrapDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h4 style={{ margin: "0 0 0.75rem", color: "var(--uk-text)" }}>
          labelWrap=false（默认）
        </h4>
        <Form.Root
          layout="horizontal"
          onSubmit={() => {}}
          style={{ maxWidth: 480 }}
        >
          <Form.Field name="org" rules={[{ required: true }]}>
            <Form.Label>
              这是一个非常长的组织名称标签用于演示不换行时的表现效果
            </Form.Label>
            <Form.Control>
              <Input placeholder="请输入组织名称" />
            </Form.Control>
            <Form.Description>组织的完整法定名称</Form.Description>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>
      </div>

      <div>
        <h4 style={{ margin: "0 0 0.75rem", color: "var(--uk-text)" }}>
          labelWrap=true
        </h4>
        <Form.Root
          layout="horizontal"
          onSubmit={() => {}}
          style={{ maxWidth: 480 }}
        >
          <Form.Field name="org2" rules={[{ required: true }]}>
            <Form.Label labelWrap>
              这是一个非常长的组织名称标签用于演示开启换行后的表现效果
            </Form.Label>
            <Form.Control>
              <Input placeholder="请输入组织名称" />
            </Form.Control>
            <Form.Description>组织的完整法定名称</Form.Description>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>
      </div>
    </div>
  );
}
