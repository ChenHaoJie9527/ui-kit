import {
  BulletList,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import { Demo as BasicDemo } from "../demos/components/select/basic";
import { Demo as MultipleDemo } from "../demos/components/select/multiple";
import { Demo as StatesDemo } from "../demos/components/select/states";

export function SelectPage() {
  return (
    <Page
      kind="组件"
      title="Select"
      description="选择器。使用 combobox / listbox 语义，键盘、指针和触屏共享同一套选中状态；弹出层进入视口时会自动翻转。"
      tags={["单选 / 多选", "Tag", "键盘搜索", "空态", "Portal 定位"]}
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

      <Section
        title="多选"
        description="multiple 开启数组值；选择后 Tag 从右向左滑入，弹层保持打开，Tag 按钮和 Backspace 都可以移除，clear 提供一键清空。"
      >
        <Demo
          code={`const [capabilities, setCapabilities] = useState(["docs"]);

<Select
  multiple
  options={capabilityOptions}
  value={capabilities}
  onValueChange={setCapabilities}
  aria-label="能力"
/>`}
        >
          <MultipleDemo />
        </Demo>
      </Section>

      <Section title="键盘行为">
        <BulletList
          items={[
            "鼠标 hover 使用共享背景指示器，高亮会在选项之间连续移动。",
            "ArrowDown / ArrowUp / Enter / Space 打开列表并移动 active option。",
            "Home / End 跳到首尾可用项；方向键在可用项之间循环。",
            "输入字符会做 typeahead，关闭时直接提交，打开时移动 active option。",
            "多选模式下 Enter / Space 切换当前项并保持弹层打开；Backspace 移除最后一个 Tag。",
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
              type: "string | null | Array<string>",
              description:
                "单选使用 string | null；multiple 开启时使用 string[]。",
            },
            {
              name: "onValueChange",
              type: "(value: string) | (value: Array<string>)",
              description:
                "选中项变化时触发；单选提交 string，多选提交有序 string[]。",
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
              name: "clear",
              type: "boolean",
              defaultValue: "false",
              description:
                "已选择时在触发器右侧显示清空按钮；鼠标 hover 或键盘 focus 时展示，触屏保持可操作。单选清空为空字符串，多选清空为空数组。",
            },
            {
              name: "...rest",
              type: "HTMLAttributes<HTMLDivElement>",
              description:
                "透传到 combobox 容器；可继续使用 aria-label、aria-labelledby、disabled 和表单关联属性。",
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
            "多选 Tag 提供具名移除按钮；disabled 时按钮不可操作。",
            "clear 清空按钮提供具名操作；清空后焦点返回触发器。",
            "reduced motion 下弹出层只保留 120ms 透明度过渡，移除位移和缩放。",
          ]}
        />
      </Section>
    </Page>
  );
}
