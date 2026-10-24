import {
  BulletList,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import { Demo as BasicDemo } from "../demos/components/select/basic";
import { Demo as LoadingDemo } from "../demos/components/select/loading";
import { Demo as MultipleDemo } from "../demos/components/select/multiple";
import { Demo as NestedDemo } from "../demos/components/select/nested";
import { Demo as StatesDemo } from "../demos/components/select/states";

export function SelectPage() {
  return (
    <Page
      kind="组件"
      title="Select"
      description="选择器。使用 combobox / listbox 语义，键盘、指针和触屏共享同一套选中状态；弹出层进入视口时会自动翻转。"
      tags={[
        "单选 / 多选",
        "Tag",
        "键盘搜索",
        "Loading",
        "层级选项",
        "空态",
        "Portal 定位",
      ]}
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
        title="层级选项"
        description="children 定义子级；只有叶子选项参与选择。相邻父级切换时复用同一个子面板，面板随指针平滑移动并调整尺寸。"
      >
        <Demo
          code={`const regions = [
  {
    value: "east",
    label: "华东",
    children: [
      { value: "shanghai-v3", label: "上海 V3" },
    ],
  },
];

<Select options={regions} value={region} onValueChange={setRegion} aria-label="部署区域" />`}
        >
          <NestedDemo />
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

      <Section
        title="异步数据"
        description="点击重新加载后，Select 触发器立即进入 loading；请求期间不可打开列表或修改选择。"
      >
        <Demo
          code={`const [requestId, setRequestId] = useState(0);
const { value, loading } = useAsync(() => loadRegions(requestId), [requestId], {
  initialValue: initialRegions,
});

<Button loading={loading} onClick={() => setRequestId((id) => id + 1)}>
  重新加载
</Button>

<Select
  options={value ?? []}
  loading={loading}
  loadingText="加载区域中..."
  aria-label="部署区域"
/>`}
        >
          <LoadingDemo />
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
            "ArrowRight 进入子级，ArrowLeft 返回父级；带子级的父级 Enter / Space 进入首个子级。",
            "Escape 关闭并回焦触发器；Tab 关闭但不改变当前 active option。",
            "loading 时触发器显示 spinner，并阻止打开列表、选择、方向导航和 typeahead。",
          ]}
        />
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "options",
              type: "Array<SelectOption>",
              description:
                "选项列表；value 必须稳定，label 支持 ReactNode。children 可定义子级，但带子级的节点只作为父级。",
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
              name: "loading",
              type: "boolean",
              defaultValue: "false",
              description:
                "由外部请求控制的加载状态；触发器进入禁用态，显示 spinner 并暴露 aria-busy。",
            },
            {
              name: "loadingText",
              type: "string",
              defaultValue: '"加载中..."',
              description: "屏幕阅读器播报的加载提示文本。",
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
            "loading 状态同时暴露 aria-busy 和 aria-disabled；加载提示使用 role=status 并视觉隐藏。",
            "reduced motion 下弹出层只保留 120ms 透明度过渡，移除位移和缩放。",
            "子级列表仍使用 role=listbox；父级子选项通过 aria-owns 建立关系。",
          ]}
        />
      </Section>
    </Page>
  );
}
