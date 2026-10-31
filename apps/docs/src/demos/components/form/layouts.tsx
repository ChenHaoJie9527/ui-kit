import { useState } from "react";
import { Button, Form, Input, Select, useFormContext } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

type DemoLayout = "vertical" | "horizontal" | "inline";

const layouts: Array<{ value: DemoLayout; label: string }> = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "inline", label: "Inline" },
];

const regions = [
  { value: "all", label: "全部区域" },
  { value: "shanghai", label: "上海" },
  { value: "beijing", label: "北京" },
  { value: "shenzhen", label: "深圳" },
];

const statuses = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "进行中" },
  { value: "paused", label: "已暂停" },
];

const ProjectSchema = v.object({
  projectName: v.pipe(v.string(), v.nonEmpty("请输入项目名称")),
  owner: v.pipe(
    v.string(),
    v.nonEmpty("请输入负责人邮箱"),
    v.email("请输入有效邮箱"),
  ),
  region: v.picklist(["all", "shanghai", "beijing", "shenzhen"], "请选择区域"),
});

type ProjectValues = v.InferInput<typeof ProjectSchema>;

const FilterSchema = v.object({
  keyword: v.string(),
  region: v.picklist(["all", "shanghai", "beijing", "shenzhen"]),
  status: v.picklist(["all", "active", "paused"]),
});

type FilterValues = v.InferInput<typeof FilterSchema>;

function ProjectStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 min-h-5 text-[12px] text-muted" aria-live="polite">
      {state.submitSucceeded
        ? "项目设置已保存。"
        : "留空项目名称并提交，可查看错误与说明的排列。"}
    </output>
  );
}

function ProjectSubmitButton() {
  const { state } = useFormContext();

  return (
    <Button type="submit" loading={state.submitting}>
      保存设置
    </Button>
  );
}

function FilterStatus() {
  const { state } = useFormContext();

  return (
    <output className="m-0 text-[12px] text-muted" aria-live="polite">
      {state.submitSucceeded
        ? "筛选条件已应用。"
        : "按 Enter 或点击按钮应用筛选。"}
    </output>
  );
}

export function Demo() {
  const [layout, setLayout] = useState<DemoLayout>("vertical");

  return (
    <div className="grid w-full max-w-[760px] gap-5">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="表单布局"
      >
        {layouts.map((item) => (
          <Button
            key={item.value}
            variant={layout === item.value ? "primary" : "outline"}
            size="sm"
            aria-pressed={layout === item.value}
            onClick={() => setLayout(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <section className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <header className="mb-5">
          <h3 className="m-0 text-[18px] leading-tight font-[650]">
            {layout === "inline" ? "项目筛选" : "项目设置"}
          </h3>
          <p className="mb-0 mt-1 text-[12.5px] leading-[1.6] text-muted">
            {layout === "horizontal"
              ? "Horizontal 是默认布局；窄屏下会恢复为纵向阅读顺序。"
              : layout === "inline"
                ? "Inline 适合筛选栏，空间不足时字段与操作会自然换行。"
                : "Vertical 保留标签、控件、说明与错误的纵向堆叠。"}
          </p>
        </header>

        {layout === "inline" ? (
          <Form.Root<FilterValues>
            layout="inline"
            defaultValues={{ keyword: "", region: "all", status: "all" }}
            validate={valibotResolver(FilterSchema)}
            onSubmit={() => {}}
          >
            <Form.Field name="keyword">
              <Form.Label>关键词</Form.Label>
              <Form.Control>
                <Input
                  type="search"
                  placeholder="项目名称或负责人"
                  autoComplete="off"
                />
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

            <Form.Field name="status">
              <Form.Label>状态</Form.Label>
              <Form.Control>
                <Select options={statuses} aria-label="状态" />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Actions>
              <Button type="submit">应用筛选</Button>
              <Button type="reset" variant="ghost">
                重置
              </Button>
            </Form.Actions>
            <FilterStatus />
          </Form.Root>
        ) : (
          <Form.Root<ProjectValues>
            key={layout}
            layout={layout}
            defaultValues={{ projectName: "", owner: "", region: "shanghai" }}
            validate={valibotResolver(ProjectSchema)}
            onSubmit={async () => {
              await new Promise((resolve) => window.setTimeout(resolve, 500));
            }}
          >
            <Form.Field name="projectName">
              <Form.Label required>项目名称</Form.Label>
              <Form.Control>
                <Input placeholder="例如：官网改版" autoComplete="off" />
              </Form.Control>
              <Form.Description>
                名称会显示在项目列表与成员通知中。
              </Form.Description>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="owner">
              <Form.Label required>负责人邮箱</Form.Label>
              <Form.Control>
                <Input
                  type="email"
                  placeholder="owner@company.com"
                  autoComplete="email"
                />
              </Form.Control>
              <Form.Description>用于接收审批与异常提醒。</Form.Description>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Field name="region">
              <Form.Label>所属区域</Form.Label>
              <Form.Control>
                <Select options={regions} aria-label="所属区域" />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Field>

            <Form.Actions>
              <ProjectSubmitButton />
              <Button type="reset" variant="ghost">
                重置
              </Button>
            </Form.Actions>
            <ProjectStatus />
          </Form.Root>
        )}
      </section>
    </div>
  );
}
