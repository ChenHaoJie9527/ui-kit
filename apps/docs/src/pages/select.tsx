import {
  BulletList,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import { Demo as BasicDemo } from "../demos/components/select/basic";
import { Demo as StatesDemo } from "../demos/components/select/states";

export function SelectPage() {
  return (
    <Page
      kind="组件"
      title="Select"
      description="选择器。使用 combobox / listbox 语义，键盘、指针和触屏共享同一套选中状态；弹出层进入视口时会自动翻转。"
      tags={["受控 / 非受控", "键盘搜索", "空态", "Portal 定位"]}
    >
      <Section title="引入">
        <Demo
          code={`import { Select } from "seam-react";

<Select options={environments} value={environment} onValueChange={setEnvironment} aria-label="部署环境" />`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="状态与空态"
        description="尺寸、错误、禁用和空数据由属性驱动；屏幕阅读器通过 aria-invalid 和触发器名称理解状态。"
      >
        <Demo
          code={`<Select options={regions} defaultValue="cn-east" />
<Select options={regions} invalid />
<Select options={regions} disabled />
<Select options={[]} emptyText="暂可用区域尚未开放" />`}
        >
          <StatesDemo />
        </Demo>
      </Section>

      <Section title="键盘行为">
        <BulletList
          items={[
            "鼠标 hover 使用共享背景指示器，高亮会在选项之间连续移动。",
            "ArrowDown / ArrowUp / Enter / Space 打开列表并移动 active option。",
            "Home / End 跳到首尾可用项；方向键在可用项之间循环。",
            "输入字符会做 typeahead，关闭时直接提交，打开时移动 active option。",
            "Escape 关闭并回焦触发器；Tab 关闭但不改变当前 active option。",
          ]}
        />
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "options",
              type: "Array<SelectOption>",
              description: "选项列表；value 必须稳定，label 支持 ReactNode。",
            },
            {
              name: "value / defaultValue",
              type: "string | null",
              description: "受控值或非受控初始值；null 表示未选择。",
            },
            {
              name: "onValueChange",
              type: "(value: string) => void",
              description: "提交选中项时触发；不会传 null。",
            },
            {
              name: "placeholder",
              type: "string",
              defaultValue: '"请选择"',
              description: "未选择时的展示文本。",
            },
            {
              name: "size",
              type: '"sm" | "md" | "lg"',
              defaultValue: '"md"',
              description: "触发器高度与字号。",
            },
            {
              name: "invalid",
              type: "boolean",
              defaultValue: "false",
              description: "映射为 aria-invalid 并使用错误态样式。",
            },
            {
              name: "emptyText",
              type: "string",
              defaultValue: '"暂无可选项"',
              description: "options 为空时的提示。",
            },
            {
              name: "...rest",
              type: "ButtonHTMLAttributes<HTMLButtonElement>",
              description:
                "透传到触发按钮；可继续使用 aria-label、aria-labelledby、disabled 和表单关联属性。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "触发器是 role=combobox，aria-expanded、aria-haspopup 和 aria-controls 跟随打开状态。",
            "active option 通过 aria-activedescendant 暴露；焦点始终保留在触发器上。",
            "选中项设置 aria-selected；禁用项设置 aria-disabled 并跳过提交。",
            "reduced motion 下弹出层只保留 120ms 透明度过渡，移除位移和缩放。",
          ]}
        />
      </Section>
    </Page>
  );
}
