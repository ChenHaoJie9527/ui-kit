import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  Switch,
  useFormContext,
} from "seam-react";

const teams = [
  { value: "all", label: "全部团队" },
  { value: "design", label: "产品设计" },
  { value: "engineering", label: "工程研发" },
  { value: "operations", label: "客户运营" },
];

type LayoutValues = {
  displayName: string;
  email: string;
  keyword: string;
  team: string;
  activeOnly: boolean;
};

function HorizontalSubmitButton() {
  const { state } = useFormContext();

  return (
    <Button type="submit" loading={state.submitting}>
      保存偏好
    </Button>
  );
}

function HorizontalForm() {
  return (
    <Form.Root<LayoutValues>
      layout="horizontal"
      defaultValues={{ displayName: "", email: "" }}
      onSubmit={async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }}
    >
      <Form.Field name="displayName" rules={{ required: "请输入显示名称" }}>
        <Form.Label>显示名称</Form.Label>
        <Form.Control>
          <Input placeholder="例如：张明" />
        </Form.Control>
        <Form.Description>
          默认 horizontal 使用稳定标签列；窄屏自动恢复纵向阅读顺序。
        </Form.Description>
        <Form.ErrorMessage />
      </Form.Field>

      <Form.Field
        name="email"
        rules={{
          required: "请输入联系邮箱",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "请输入有效邮箱",
          },
        }}
      >
        <Form.Label>联系邮箱</Form.Label>
        <Form.Control>
          <Input type="email" placeholder="you@company.com" />
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Field>

      <Form.Actions>
        <HorizontalSubmitButton />
      </Form.Actions>
    </Form.Root>
  );
}

function VerticalForm() {
  return (
    <Form.Root<LayoutValues>
      layout="vertical"
      defaultValues={{ displayName: "" }}
      onSubmit={() => undefined}
    >
      <Form.Field name="displayName" rules={{ required: "请输入项目名称" }}>
        <Form.Label>项目名称</Form.Label>
        <Form.Control>
          <Input placeholder="例如：企业工作台改版" />
        </Form.Control>
        <Form.Description>
          vertical 保留标签、控件、说明与错误依次堆叠的原始展示方式。
        </Form.Description>
        <Form.ErrorMessage />
      </Form.Field>
      <Form.Actions>
        <Button type="submit" variant="secondary">
          创建项目
        </Button>
      </Form.Actions>
    </Form.Root>
  );
}

function InlineForm() {
  return (
    <Form.Root<LayoutValues>
      layout="inline"
      defaultValues={{ keyword: "", team: "all", activeOnly: true }}
      onSubmit={() => undefined}
    >
      <Form.Field name="keyword">
        <Form.Label>搜索成员</Form.Label>
        <Form.Control>
          <Input placeholder="姓名或邮箱" />
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Field>

      <Form.Field name="team">
        <Form.Label>所属团队</Form.Label>
        <Form.Control>
          <Select options={teams} aria-label="所属团队" />
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Field>

      <Form.Field name="activeOnly">
        <Form.Control>
          <Switch>仅显示活跃成员</Switch>
        </Form.Control>
      </Form.Field>

      <Form.Actions>
        <Button type="submit" size="sm">
          应用筛选
        </Button>
      </Form.Actions>
    </Form.Root>
  );
}

export function Demo() {
  const [submittedName, setSubmittedName] = useState("");

  return (
    <div className="grid w-full max-w-[900px] gap-5">
      <section className="rounded-[18px] border border-line bg-surface p-5 phone:p-6">
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">Horizontal（默认）</h3>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
            标签与控件分列，说明和错误跟随控件列；适合设置页与资料表单。
          </p>
        </header>
        <div onSubmitCapture={() => setSubmittedName("偏好已保存")}>
          <HorizontalForm />
        </div>
        <output
          className="mt-3 block min-h-5 text-[12px] text-muted"
          aria-live="polite"
        >
          {submittedName}
        </output>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="min-w-0 rounded-[18px] border border-line bg-surface p-5">
          <header className="mb-5">
            <h3 className="m-0 text-[17px] font-[650]">Vertical</h3>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
              需要旧版纵向布局时显式设置 layout=&quot;vertical&quot;。
            </p>
          </header>
          <VerticalForm />
        </section>

        <section className="min-w-0 rounded-[18px] border border-line bg-surface p-5">
          <header className="mb-5">
            <h3 className="m-0 text-[17px] font-[650]">Inline</h3>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
              筛选字段与操作紧凑排列，空间不足时换行并保留 DOM 焦点顺序。
            </p>
          </header>
          <InlineForm />
        </section>
      </div>
    </div>
  );
}
