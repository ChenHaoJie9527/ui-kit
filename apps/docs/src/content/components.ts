import uiPackage from "../../../../packages/ui/package.json";
import componentReleases from "./component-releases.json";

const NEW_BADGE_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ComponentMeta {
  path: string;
  name: string;
  summary: string;
  tags: string[];
  releaseName?: string;
  /** 首次正式发布该组件的 seam-react 版本。 */
  introducedIn?: string;
  /** 首次正式发布时间，使用 UTC ISO 字符串。 */
  releasedAt?: string;
}

const componentDefinitions: Array<
  Omit<ComponentMeta, "introducedIn" | "releasedAt">
> = [
  {
    path: "components/button",
    name: "Button",
    summary: "五种视觉变体、三种尺寸，加载态自动禁用并暴露 aria-busy。",
    tags: ["变体", "尺寸", "加载态"],
  },
  {
    path: "components/badge",
    name: "Badge",
    summary: "内联状态标签，自带状态图标、loading 动效、尺寸与可关闭按钮。",
    tags: ["状态标记", "变体", "可关闭"],
  },
  {
    path: "components/input",
    name: "Input",
    summary: "透传原生输入属性，错误态与尺寸由属性驱动。",
    tags: ["表单", "错误态"],
  },
  {
    path: "components/form",
    name: "Form",
    summary: "组合式字段注册、校验状态、错误关联与提交流程。",
    tags: ["表单", "校验", "组合式 API"],
  },
  {
    path: "components/checkbox",
    name: "CheckBox",
    summary: "SVG 描边对勾与即时按压反馈，保留原生表单与键盘语义。",
    tags: ["表单", "受控", "SVG 描边"],
  },
  {
    path: "components/radio-group",
    name: "Radio Group",
    releaseName: "RadioGroup",
    summary: "原生单选语义、方向键循环选择与单一 Tab 停点。",
    tags: ["表单", "受控", "键盘"],
  },
  {
    path: "components/select",
    name: "Select",
    summary: "单选列表，支持键盘搜索、受控值、空态和弹出层定位。",
    tags: ["表单", "键盘", "浮层"],
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
    path: "components/carousel",
    name: "Carousel",
    summary:
      "基于 Embla 的横向/纵向轮播，受控 snap 索引、可访问控件、RTL 与 reduced-motion 降级。",
    tags: ["Embla", "拖拽", "受控", "可访问性"],
  },
  {
    path: "components/sidebar",
    name: "Sidebar",
    summary: "分组文档导航，当前项与鼠标预览使用独立且连续的共享指示器。",
    tags: ["导航", "分组", "共享游标"],
  },
  {
    path: "components/dialog",
    name: "Dialog",
    summary: "原生 dialog 承载模态语义，焦点陷阱与焦点恢复由 hooks 补齐。",
    tags: ["模态", "焦点"],
  },
  {
    path: "components/drawer",
    name: "Drawer",
    summary: "从视口边缘滑入的模态抽屉，原生 dialog 语义与焦点管理。",
    tags: ["左 / 右", "组合式 API", "焦点"],
  },
  {
    path: "components/image-viewer",
    name: "Image Viewer",
    summary:
      "图片画廊与形态变换灯箱：缩略图形变到全屏，支持滑动、缩放平移与受控选中。",
    tags: ["画廊", "灯箱", "共享布局", "受控"],
  },
  {
    path: "components/toast",
    name: "Toast",
    summary: "非模态通知队列，支持自动关闭、状态图标、操作和拖拽关闭。",
    tags: ["通知", "aria-live", "Motion"],
  },
  {
    path: "components/tooltip",
    name: "Tooltip",
    summary:
      "延迟 hover / focus 显示，支持触屏、视口翻转与 aria-describedby 关联。",
    tags: ["浮层", "定位", "可访问性"],
  },
  {
    path: "components/marquee",
    name: "Marquee",
    summary: "水平或垂直无缝滚动内容，副本轨道不可访问，并支持悬停暂停。",
    tags: ["Motion", "循环", "CSS 动画"],
  },
];

const releases = componentReleases as Record<
  string,
  Pick<ComponentMeta, "introducedIn" | "releasedAt">
>;

export const componentMetas: ComponentMeta[] = componentDefinitions.map(
  (meta) => {
    const release = releases[meta.releaseName ?? meta.name];

    return release ? Object.assign({}, meta, release) : meta;
  },
);

export const componentMetaByPath = new Map(
  componentMetas.map((meta) => [meta.path, meta]),
);

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(/[.-]/).slice(0, 3).map(Number);
  const rightParts = right.split(/[.-]/).slice(0, 3).map(Number);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

/** 新组件标识需要已经发布，并在发布日期后的固定窗口内。 */
export function isNewComponent(
  meta: ComponentMeta,
  {
    now = new Date(),
    currentVersion = uiPackage.version,
    windowDays = NEW_BADGE_WINDOW_DAYS,
  }: {
    now?: Date;
    currentVersion?: string;
    windowDays?: number;
  } = {},
): boolean {
  if (!meta.introducedIn || !meta.releasedAt) {
    return false;
  }

  if (compareVersions(currentVersion, meta.introducedIn) < 0) {
    return false;
  }

  const releasedAt = Date.parse(meta.releasedAt);

  if (!Number.isFinite(releasedAt)) {
    return false;
  }

  const age = now.getTime() - releasedAt;

  return age >= 0 && age < windowDays * DAY_MS;
}
