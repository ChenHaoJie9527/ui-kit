import { useState } from "react";
import { Button, Form, Input, Select } from "seam-react";

const teams = [
  { value: "all", label: "全部团队" },
  { value: "design", label: "设计团队" },
  { value: "engineering", label: "工程团队" },
];

export function Demo() {
  const [layout, setLayout] = useState<"vertical" | "horizontal" | "inline">(
    "horizontal",
  );
  const [submitted, setSubmitted] = useState("");

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-5">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="选择表单布局"
      >
        {(["vertical", "horizontal", "inline"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={layout === value ? "primary" : "outline"}
            aria-pressed={layout === value}
            onClick={() => {
              setLayout(value);
              setSubmitted("");
            }}
          >
            {value}
          </Button>
        ))}
      </div>

      <div className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <Form.Root
          layout={layout}
          defaultValues={{ keyword: "", team: "all" }}
          onSubmit={(values) =>
            setSubmitted(
              `关键词：${String(values.keyword || "（空）")}；团队：${String(values.team)}`,
            )
          }
        >
          <Form.Field
            name="keyword"
            rules={[{ required: true, message: "请输入搜索关键词。" }]}
          >
            <Form.Label labelWrap>项目或成员关键词</Form.Label>
            <Form.Control>
              <Input placeholder="例如：design-system" />
            </Form.Control>
            <Form.Description>
              horizontal 在桌面端使用稳定标签列，窄屏自动恢复纵向排列。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="team">
            <Form.Label>所属团队</Form.Label>
            <Form.Control>
              <Select options={teams} aria-label="所属团队" />
            </Form.Control>
            <Form.Description>
              inline 在空间不足时换行，不改变 DOM 与 Tab 顺序。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Actions>
            <Button type="submit">应用筛选</Button>
          </Form.Actions>
        </Form.Root>
      </div>

      <output
        className="m-0 min-h-5 text-[12.5px] text-muted"
        aria-live="polite"
      >
        {submitted || "切换布局并提交，观察字段排列与校验反馈。"}
      </output>
    </div>
  );
}
