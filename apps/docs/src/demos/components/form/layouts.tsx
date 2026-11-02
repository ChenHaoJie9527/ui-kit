import { Button, Form, Input, Select, useFormContext } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const regions = [
  { value: "all", label: "全部区域" },
  { value: "east", label: "华东" },
  { value: "south", label: "华南" },
  { value: "north", label: "华北" },
];

const ProfileSchema = v.object({
  displayName: v.pipe(v.string(), v.nonEmpty("请输入显示名称")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入联系邮箱"),
    v.email("请输入有效邮箱"),
  ),
});

type ProfileValues = v.InferInput<typeof ProfileSchema>;

const FilterSchema = v.object({
  keyword: v.string(),
  region: v.picklist(["all", "east", "south", "north"]),
});

type FilterValues = v.InferInput<typeof FilterSchema>;

function ProfileStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 min-h-5 text-[12.5px] text-muted" aria-live="polite">
      {state.submitSucceeded
        ? "资料已保存。"
        : "留空后提交可查看字段错误与说明的排列。"}
    </output>
  );
}

function ProfileSubmitButton() {
  const { state } = useFormContext();

  return (
    <Button type="submit" loading={state.submitting}>
      保存资料
    </Button>
  );
}

function ProfileFields() {
  return (
    <>
      <Form.Field name="displayName">
        <Form.Label>显示名称</Form.Label>
        <Form.Control>
          <Input autoComplete="name" placeholder="例如：张明" />
        </Form.Control>
        <Form.Description>名称会显示在成员列表与操作记录中。</Form.Description>
        <Form.ErrorMessage />
      </Form.Field>

      <Form.Field name="email">
        <Form.Label>联系邮箱</Form.Label>
        <Form.Control>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Form.Control>
        <Form.Description>仅用于工作通知，不会公开展示。</Form.Description>
        <Form.ErrorMessage />
      </Form.Field>

      <Form.Actions>
        <ProfileSubmitButton />
      </Form.Actions>
      <ProfileStatus />
    </>
  );
}

export function Demo() {
  return (
    <div className="grid w-full max-w-[920px] gap-6">
      <section
        className="rounded-[18px] border border-line bg-surface p-5 phone:p-6"
        data-testid="form-layout-vertical"
      >
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">垂直布局</h3>
          <p className="mb-0 mt-1 text-[12.5px] leading-[1.6] text-muted">
            使用 layout=&quot;vertical&quot;
            保留标签、控件与反馈的纵向阅读顺序。
          </p>
        </header>
        <Form.Root<ProfileValues>
          layout="vertical"
          defaultValues={{ displayName: "", email: "" }}
          validate={valibotResolver(ProfileSchema)}
          onSubmit={() => {}}
        >
          <ProfileFields />
        </Form.Root>
      </section>

      <section
        className="rounded-[18px] border border-line bg-surface p-5 phone:p-6"
        data-testid="form-layout-horizontal"
      >
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">水平布局（默认）</h3>
          <p className="mb-0 mt-1 text-[12.5px] leading-[1.6] text-muted">
            标签占据稳定列宽，控件与反馈位于相邻列；窄屏下自动恢复纵向排列。
          </p>
        </header>
        <Form.Root<ProfileValues>
          layout="horizontal"
          defaultValues={{ displayName: "", email: "" }}
          validate={valibotResolver(ProfileSchema)}
          onSubmit={() => {}}
        >
          <ProfileFields />
        </Form.Root>
      </section>

      <section
        className="rounded-[18px] border border-line bg-surface p-5 phone:p-6"
        data-testid="form-layout-inline"
      >
        <header className="mb-5">
          <h3 className="m-0 text-[17px] font-[650]">行内布局</h3>
          <p className="mb-0 mt-1 text-[12.5px] leading-[1.6] text-muted">
            适合筛选栏；空间不足时字段与操作会换行，不改变 DOM 与键盘顺序。
          </p>
        </header>
        <Form.Root<FilterValues>
          layout="inline"
          defaultValues={{ keyword: "", region: "all" }}
          validate={valibotResolver(FilterSchema)}
          onSubmit={() => {}}
        >
          <Form.Field name="keyword">
            <Form.Label>关键词</Form.Label>
            <Form.Control>
              <Input placeholder="搜索名称或编号" />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="region">
            <Form.Label>区域</Form.Label>
            <Form.Control>
              <Select options={regions} aria-label="区域" />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Actions>
            <Button type="submit">应用筛选</Button>
            <Button type="reset" variant="ghost">
              重置
            </Button>
          </Form.Actions>
        </Form.Root>
      </section>
    </div>
  );
}
