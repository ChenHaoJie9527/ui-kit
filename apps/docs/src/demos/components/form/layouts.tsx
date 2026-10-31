import { useState } from "react";
import { Button, Form, Input, Select } from "seam-react";

const regions = [
  { value: "all", label: "全部区域" },
  { value: "east", label: "华东" },
  { value: "south", label: "华南" },
  { value: "north", label: "华北" },
];

interface LayoutValues {
  workspace: string;
  region: string;
  keyword: string;
}

interface LayoutDemoProps {
  layout: "vertical" | "horizontal" | "inline";
  title: string;
  description: string;
}

function LayoutDemo({ layout, title, description }: LayoutDemoProps) {
  return (
    <section className="min-w-0 rounded-[18px] border border-line bg-surface p-5">
      <header className="mb-4">
        <h3 className="m-0 text-[16px] font-[650]">{title}</h3>
        <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
          {description}
        </p>
      </header>
      <Form.Root<LayoutValues>
        layout={layout}
        defaultValues={{ workspace: "", region: "all", keyword: "" }}
        onSubmit={() => undefined}
      >
        <Form.Field name="workspace">
          <Form.Label>工作空间名称</Form.Label>
          <Form.Control>
            <Input placeholder="例如：增长团队" />
          </Form.Control>
          <Form.Description>
            名称会显示在成员的工作空间列表中。
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field name="region">
          <Form.Label>所属区域</Form.Label>
          <Form.Control>
            <Select options={regions} aria-label="所属区域" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field name="keyword">
          <Form.Label>搜索关键词</Form.Label>
          <Form.Control>
            <Input placeholder="输入成员或项目名称" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <Button type="submit">应用</Button>
          <Button type="reset" variant="ghost">
            重置
          </Button>
        </Form.Actions>
      </Form.Root>
    </section>
  );
}

export function Demo() {
  const [layout, setLayout] = useState<"vertical" | "horizontal" | "inline">(
    "horizontal",
  );

  return (
    <div className="grid w-full max-w-[900px] gap-5">
      <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
        <legend className="sr-only">表单布局</legend>
        {(
          [
            ["vertical", "垂直"],
            ["horizontal", "水平（默认）"],
            ["inline", "行内"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={layout === value ? "primary" : "outline"}
            size="sm"
            aria-pressed={layout === value}
            onClick={() => setLayout(value)}
          >
            {label}
          </Button>
        ))}
      </fieldset>

      <LayoutDemo
        key={layout}
        layout={layout}
        title={
          layout === "vertical"
            ? "垂直布局"
            : layout === "horizontal"
              ? "水平布局"
              : "行内布局"
        }
        description={
          layout === "vertical"
            ? "标签、控件与反馈依次堆叠，适合登录、注册等集中填写的表单。"
            : layout === "horizontal"
              ? "标签占据稳定列宽，控件与反馈位于相邻列；窄屏自动折叠为垂直阅读顺序。"
              : "字段与操作在可用空间内紧凑排列，空间不足时自动换行，适合筛选栏。"
        }
      />
    </div>
  );
}
