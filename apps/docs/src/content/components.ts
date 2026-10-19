export interface ComponentMeta {
  path: string;
  name: string;
  summary: string;
  tags: string[];
}

export const componentMetas: ComponentMeta[] = [
  {
    path: "components/button",
    name: "Button",
    summary: "五种视觉变体、三种尺寸，加载态自动禁用并暴露 aria-busy。",
    tags: ["变体", "尺寸", "加载态"],
  },
  {
    path: "components/input",
    name: "Input",
    summary: "透传原生输入属性，错误态与尺寸由属性驱动。",
    tags: ["表单", "错误态"],
  },
  {
    path: "components/switch",
    name: "Switch",
    summary: "基于原生 checkbox，受控与非受控共享同一套语义。",
    tags: ["表单", "受控"],
  },
  {
    path: "components/tabs",
    name: "Tabs",
    summary: "roving tabindex、方向键循环与完整的 ARIA 关联。",
    tags: ["导航", "键盘"],
  },
  {
    path: "components/dialog",
    name: "Dialog",
    summary: "原生 dialog 承载模态语义，焦点陷阱与焦点恢复由 hooks 补齐。",
    tags: ["模态", "焦点"],
  },
  {
    path: "components/toast",
    name: "Toast",
    summary: "队列、自动关闭、悬停暂停与 aria-live 通知区域。",
    tags: ["通知", "异步"],
  },
];

export const componentMetaByPath = new Map(
  componentMetas.map((meta) => [meta.path, meta]),
);
