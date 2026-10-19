import { componentMetas } from "./content/components";
import { hookGroups } from "./content/hooks";

export interface NavItem {
  path: string;
  label: string;
  hint?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "开始",
    items: [
      {
        path: "overview",
        label: "总览",
        hint: "安装、特性与设计取向",
      },
      {
        path: "customizing",
        label: "自定义样式",
        hint: "CSS 变量、组件级变量与定向覆盖",
      },
    ],
  },
  {
    title: "组件",
    items: componentMetas.map((meta) => ({
      path: meta.path,
      label: meta.name,
      hint: meta.summary,
    })),
  },
  ...hookGroups.map((group) => ({
    title: `Hooks · ${group.title}`,
    items: group.items.map((doc) => ({
      path: doc.path,
      label: doc.name,
      hint: doc.description,
    })),
  })),
];

export const navItems = navGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.title })),
);

export const navItemByPath = new Map(navItems.map((item) => [item.path, item]));

export function pageTitle(path: string): string {
  const item = navItemByPath.get(path);
  return item ? item.label : "未找到页面";
}
