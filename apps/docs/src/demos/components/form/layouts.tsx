import { useState } from "react";
import { Button, Form, Input, Select, useFormContext } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const roles = [
  { value: "all", label: "全部角色" },
  { value: "owner", label: "所有者" },
  { value: "admin", label: "管理员" },
  { value: "member", label: "成员" },
];

const statuses = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "正常" },
  { value: "invited", label: "待接受邀请" },
  { value: "suspended", label: "已停用" },
];

const ProfileSchema = v.object({
  displayName: v.pipe(v.string(), v.nonEmpty("请输入显示名称")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入联系邮箱"),
    v.email("请输入有效邮箱"),
  ),
  biography: v.string(),
});

type ProfileValues = v.InferInput<typeof ProfileSchema>;

type FilterValues = {
  keyword: string;
  role: string;
  status: string;
};

function VerticalSubmitButton() {
  const { state } = useFormContext();

  return (
    <Button type="submit" loading={state.submitting}>
      保存个人资料
    </Button>
  );
}

function VerticalSubmitStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 min-h-5 text-[12px] text-muted" aria-live="polite">
      {state.submitSucceeded
        ? "个人资料已保存。"
        : "离开显示名称输入框即可查看默认的 blur 校验。"}
    </output>
  );
}

export function Demo() {
  const [filters, setFilters] = useState<FilterValues>({
    keyword: "",
    role: "all",
    status: "all",
  });

  return (
    <div className="grid w-full max-w-[980px] gap-6">
      <section className="rounded-[18px] border border-line bg-surface p-5 phone:p-6">
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">Vertical · 个人资料</h3>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
            适合长说明与自由宽度的内容。显示名称使用 required
            规则，星号由字段配置自动提供。
          </p>
        </header>

        <Form.Root<ProfileValues>
          layout="vertical"
          defaultValues={{ displayName: "", email: "", biography: "" }}
          validate={valibotResolver(ProfileSchema)}
          onSubmit={async () => {
            await new Promise((resolve) => window.setTimeout(resolve, 500));
          }}
        >
          <Form.Field name="displayName" rules={[{ required: true }]}>
            <Form.Label labelWrap>
              显示名称（会同步到账单、审计日志与成员目录）
            </Form.Label>
            <Form.Control>
              <Input autoComplete="name" placeholder="例如：张明" />
            </Form.Control>
            <Form.Description>
              长标签通过 labelWrap 自然换行，控件的标签关联与输入顺序保持不变。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="email">
            <Form.Label required>联系邮箱</Form.Label>
            <Form.Control>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </Form.Control>
            <Form.Description>
              这里的星号来自 Form.Label required，用于对照两种必填标记来源。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="biography">
            <Form.Label>个人简介</Form.Label>
            <Form.Control>
              <Input placeholder="可选，简要介绍你的职责" />
            </Form.Control>
          </Form.Field>

          <Form.Actions>
            <VerticalSubmitButton />
          </Form.Actions>
          <VerticalSubmitStatus />
        </Form.Root>
      </section>

      <section className="rounded-[18px] border border-line bg-surface p-5 phone:p-6">
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">Horizontal · 默认布局</h3>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
            不传 layout 即为 horizontal；窄屏下恢复标签、控件、反馈的阅读顺序。
          </p>
        </header>

        <Form.Root<ProfileValues>
          defaultValues={{
            displayName: "张明",
            email: "zhang@example.com",
            biography: "",
          }}
          validate={valibotResolver(ProfileSchema)}
          onSubmit={async () => {
            await new Promise((resolve) => window.setTimeout(resolve, 500));
          }}
        >
          <Form.Field name="displayName" rules={[{ required: true }]}>
            <Form.Label labelWrap>显示名称与公开署名</Form.Label>
            <Form.Control>
              <Input autoComplete="name" />
            </Form.Control>
            <Form.Description>
              标签列保持稳定，说明和错误与控件位于同一列。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="email">
            <Form.Label required>联系邮箱</Form.Label>
            <Form.Control>
              <Input type="email" autoComplete="email" />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Actions>
            <Button type="submit">保存设置</Button>
          </Form.Actions>
        </Form.Root>
      </section>

      <section className="rounded-[18px] border border-line bg-surface p-5 phone:p-6">
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">Inline · 成员筛选</h3>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
            字段与操作按空间排列，空间不足时换行；Tab 顺序始终遵循 DOM 顺序。
          </p>
        </header>

        <Form.Root<FilterValues>
          layout="inline"
          defaultValues={filters}
          onValuesChange={(values) => setFilters(values)}
          onSubmit={() => undefined}
        >
          <Form.Field name="keyword">
            <Form.Label>搜索成员</Form.Label>
            <Form.Control>
              <Input placeholder="姓名或邮箱" />
            </Form.Control>
          </Form.Field>

          <Form.Field name="role">
            <Form.Label>角色</Form.Label>
            <Form.Control>
              <Select options={roles} aria-label="角色" />
            </Form.Control>
          </Form.Field>

          <Form.Field name="status">
            <Form.Label>状态</Form.Label>
            <Form.Control>
              <Select options={statuses} aria-label="状态" />
            </Form.Control>
          </Form.Field>

          <Form.Actions>
            <Button type="submit" variant="secondary">
              应用筛选
            </Button>
          </Form.Actions>
        </Form.Root>

        <p className="mb-0 mt-4 text-[12px] leading-[1.6] text-muted">
          当前筛选：{filters.keyword || "全部成员"} ·{" "}
          {roles.find((role) => role.value === filters.role)?.label} ·{" "}
          {statuses.find((status) => status.value === filters.status)?.label}
        </p>
      </section>
    </div>
  );
}
