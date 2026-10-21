import { componentMetas, isNewComponent } from "./content/components";
import { hookGroups } from "./content/hooks";

export interface NavItem {
  path: string;
  label: string;
  hint?: string;
  isNew?: boolean;
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
        path: "usage",
        label: "使用指南",
        hint: "React 与 Next.js 安装、接入和注意事项",
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
      isNew: isNewComponent(meta),
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

/** 把导航里的相对 path 转成路由绝对路径。 */
export function toRoute(path: string): string {
  return path === "overview" ? "/" : `/${path}`;
}

/** 把 location.pathname 转回导航用的 key。 */
export function routeKeyFromPathname(pathname: string): string {
  const key = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return key.length > 0 ? key : "overview";
}

export function pageTitle(path: string): string {
  const item = navItemByPath.get(path);
  return item ? item.label : "未找到页面";
}
