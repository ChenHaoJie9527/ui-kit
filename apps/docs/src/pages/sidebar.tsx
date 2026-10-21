import { useState } from "react";
import { Sidebar } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import "./sidebar-showcase.css";

const groups = [
  {
    title: "开始",
    icon: "guide",
    items: [
      { value: "overview", label: "总览" },
      { value: "usage", label: "使用指南" },
      { value: "customizing", label: "自定义样式" },
    ],
  },
  {
    title: "组件",
    icon: "components",
    items: [
      { value: "button", label: "Button" },
      { value: "tabs", label: "Tabs" },
      { value: "sidebar", label: "Sidebar", isNew: true },
      { value: "dialog", label: "Dialog" },
    ],
  },
] as const;

type ShowcaseIconName =
  | "playground"
  | "models"
  | "documentation"
  | "settings"
  | "frame"
  | "chart"
  | "map";

interface ShowcaseGroup {
  title: string;
  icon: ShowcaseIconName;
  defaultOpen: boolean;
  items: readonly { value: string; label: string }[];
}

interface ShowcaseProject {
  value: string;
  label: string;
  icon: ShowcaseIconName;
}

const showcaseGroups: readonly ShowcaseGroup[] = [
  {
    title: "Playground",
    icon: "playground",
    defaultOpen: true,
    items: [
      { value: "history", label: "History" },
      { value: "starred", label: "Starred" },
      { value: "playground-settings", label: "Settings" },
    ],
  },
  {
    title: "Models",
    icon: "models",
    defaultOpen: false,
    items: [
      { value: "genesis", label: "Genesis" },
      { value: "explorer", label: "Explorer" },
      { value: "quantum", label: "Quantum" },
    ],
  },
  {
    title: "Documentation",
    icon: "documentation",
    defaultOpen: true,
    items: [
      { value: "introduction", label: "Introduction" },
      { value: "get-started", label: "Get Started" },
      { value: "tutorials", label: "Tutorials" },
      { value: "changelog", label: "Changelog" },
    ],
  },
  {
    title: "Settings",
    icon: "settings",
    defaultOpen: false,
    items: [
      { value: "general", label: "General" },
      { value: "team", label: "Team" },
      { value: "billing", label: "Billing" },
      { value: "limits", label: "Limits" },
    ],
  },
] as const;

const showcaseProjects: readonly ShowcaseProject[] = [
  { value: "design-engineering", label: "Design Engineering", icon: "frame" },
  { value: "sales-marketing", label: "Sales & Marketing", icon: "chart" },
  { value: "travel", label: "Travel", icon: "map" },
] as const;

function ShowcaseIcon({ kind }: { kind: ShowcaseIconName }) {
  if (kind === "playground") {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect
          x="2.1"
          y="3.1"
          width="13.8"
          height="11.8"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.35"
        />
        <path
          d="m5.4 7.3 2.3 1.7-2.3 1.7M9.7 10.8h3"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "models") {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M5.2 5.1h7.6M6.8 9h.1M11.1 9h.1M6.2 12.1c1.7 1 3.9 1 5.6 0"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M4 5.2c.3-1.7 1.8-2.8 3.5-2.8h3c1.7 0 3.2 1.1 3.5 2.8.4 2.2.4 5.2 0 7.4-.3 1.7-1.8 2.8-3.5 2.8h-3c-1.7 0-3.2-1.1-3.5-2.8-.4-2.2-.4-5.2 0-7.4Z"
          stroke="currentColor"
          strokeWidth="1.35"
        />
        <path
          d="M9 2.4V1M7.5 1h3"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "documentation") {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M9 4.1C7.7 2.9 5.8 2.4 2.4 2.4v11.1c3.4 0 5.3.5 6.6 1.7 1.3-1.2 3.2-1.7 6.6-1.7V2.4C12.2 2.4 10.3 2.9 9 4.1Zm0 0v11.1"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "settings") {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle
          cx="9"
          cy="9"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.35"
        />
        <path
          d="M9 1.8v2M9 14.2v2M1.8 9h2M14.2 9h2M3.9 3.9l1.4 1.4M12.7 12.7l1.4 1.4M14.1 3.9l-1.4 1.4M5.3 12.7l-1.4 1.4"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "frame") {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M5 2.5v13M13 2.5v13M2.5 5h13M2.5 13h13"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "chart") {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6.6" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M9 2.4v6.6l4.7 4.7"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 5.1c2.6 0 4.1 1.5 4.1 4.1v3.4c0 1.3-1 2.3-2.3 2.3S2.5 13.9 2.5 12.6c0-1.3 1-2.3 2.3-2.3H5M15 5.1c-2.6 0-4.1 1.5-4.1 4.1v3.4c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3c0-1.3-1-2.3-2.3-2.3H13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompactSidebarNav({
  onExpand,
  inert,
}: {
  onExpand: (group: string) => void;
  inert: boolean;
}) {
  return (
    <nav
      className="sidebar-showcase__compact"
      aria-label="应用侧边栏图标导航"
      inert={inert}
      aria-hidden={inert ? true : undefined}
    >
      {showcaseGroups.map((group) => (
        <button
          type="button"
          className="sidebar-showcase__compact-item"
          key={group.title}
          aria-label={`展开 ${group.title}`}
          onClick={() => onExpand(group.title)}
        >
          <span className="relative z-[1] size-5">
            <ShowcaseIcon kind={group.icon} />
          </span>
        </button>
      ))}
    </nav>
  );
}

function ChevronUnfoldIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 6 3-2.6L11 6M5 10l3 2.6 3-2.6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GroupIcon({ kind }: { kind: "guide" | "components" }) {
  if (kind === "guide") {
    return (
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.3 2.8h9.4v10.4H3.3zM5.5 5.5h4.9M5.5 8h4.9M5.5 10.5h3.1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.4"
        y="2.4"
        width="4.5"
        height="4.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="9.1"
        y="2.4"
        width="4.5"
        height="4.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="2.4"
        y="9.1"
        width="4.5"
        height="4.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="9.1"
        y="9.1"
        width="4.5"
        height="4.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SidebarDemo({
  hoverPreview = true,
  hoverIndicator = "rail",
  collapsible = true,
  groupGap,
}: {
  hoverPreview?: boolean;
  hoverIndicator?: "rail" | "background";
  collapsible?: boolean;
  groupGap?: number | string;
}) {
  const [active, setActive] = useState("button");

  return (
    <div className="w-full max-w-[310px] rounded-[14px] border border-line bg-surface p-3.5">
      <Sidebar
        aria-label={hoverPreview ? "示例文档导航" : "无预览的文档导航"}
        hoverPreview={hoverPreview}
        hoverIndicator={hoverIndicator}
        groupGap={groupGap}
      >
        {groups.map((group) => (
          <Sidebar.Group
            collapsible={collapsible}
            icon={<GroupIcon kind={group.icon} />}
            key={group.title}
            title={group.title}
          >
            {group.items.map((item) => (
              <Sidebar.Item active={active === item.value} key={item.value}>
                <a
                  href={`#sidebar-${item.value}`}
                  onClick={(event) => {
                    event.preventDefault();
                    setActive(item.value);
                  }}
                >
                  {item.label}
                  {"isNew" in item && item.isNew ? (
                    <span className="rounded-full bg-accent-soft px-1.5 py-px text-[9px] font-bold tracking-[0.06em] text-accent-strong uppercase">
                      New
                    </span>
                  ) : null}
                </a>
              </Sidebar.Item>
            ))}
          </Sidebar.Group>
        ))}
      </Sidebar>
    </div>
  );
}

function ShowcaseSidebarDemo() {
  const [active, setActive] = useState("history");
  const [collapsed, setCollapsed] = useState(false);
  const activeItem = showcaseGroups
    .flatMap((group) => group.items)
    .find((item) => item.value === active) ??
    showcaseProjects.find((item) => item.value === active) ??
    showcaseGroups[2]!.items[0] ?? { label: "Overview" };

  return (
    <div
      className="sidebar-showcase mx-auto min-h-[600px] w-full max-w-[880px] overflow-hidden rounded-[18px] border border-line bg-surface"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <aside className="sidebar-showcase__aside">
        <div className="sidebar-showcase__header">
          <span
            className="grid size-9 flex-none place-items-center rounded-lg bg-[linear-gradient(135deg,var(--doc-accent),color-mix(in_srgb,var(--doc-accent)_55%,#0ea5e9))] font-mono text-[11px] font-bold tracking-[-0.02em] text-white shadow-sm"
            aria-hidden="true"
          >
            uk
          </span>
          <span className="sidebar-showcase__header-copy">
            <strong className="block truncate text-[13px] font-[680] text-ink">
              ui-kit
            </strong>
            <span className="block truncate text-[10.5px] text-muted">
              seam-react
            </span>
          </span>
          <span className="sidebar-showcase__header-chevron">
            <ChevronUnfoldIcon />
          </span>
        </div>

        <div className="sidebar-showcase__body">
          <div
            className="sidebar-showcase__expanded"
            inert={collapsed}
            aria-hidden={collapsed ? true : undefined}
          >
            <Sidebar
              aria-label="应用侧边栏示例"
              className="sidebar-showcase__sidebar"
              hoverIndicator="background"
              groupGap={6}
            >
              <p className="sidebar-showcase__platform">Platform</p>
              {showcaseGroups.map((group) => (
                <Sidebar.Group
                  collapsible
                  defaultOpen={group.defaultOpen}
                  icon={<ShowcaseIcon kind={group.icon} />}
                  key={group.title}
                  title={group.title}
                >
                  {group.items.map((item) => (
                    <Sidebar.Item
                      active={active === item.value}
                      key={item.value}
                    >
                      <a
                        href={`#showcase-${item.value}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActive(item.value);
                        }}
                      >
                        {item.label}
                      </a>
                    </Sidebar.Item>
                  ))}
                </Sidebar.Group>
              ))}

              <Sidebar.Group
                className="sidebar-showcase__projects"
                title="Projects"
              >
                {showcaseProjects.map((item) => (
                  <Sidebar.Item active={active === item.value} key={item.value}>
                    <a
                      href={`#showcase-${item.value}`}
                      aria-label={item.label}
                      onClick={(event) => {
                        event.preventDefault();
                        setActive(item.value);
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-4 flex-none text-muted">
                          <ShowcaseIcon kind={item.icon} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                    </a>
                  </Sidebar.Item>
                ))}
              </Sidebar.Group>
            </Sidebar>
          </div>

          <CompactSidebarNav
            inert={!collapsed}
            onExpand={() => setCollapsed(false)}
          />
        </div>

        <div className="sidebar-showcase__footer">
          <span
            className="grid size-8 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,var(--doc-accent),color-mix(in_srgb,var(--doc-accent)_55%,#0ea5e9))] font-mono text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            uk
          </span>
          <span className="sidebar-showcase__footer-copy">
            <strong className="block truncate text-[12px] font-semibold text-ink">
              ui-kit
            </strong>
            <span className="block truncate text-[10px] text-muted">
              MIT License
            </span>
          </span>
          <span className="sidebar-showcase__footer-chevron">
            <ChevronUnfoldIcon />
          </span>
        </div>
      </aside>

      <section className="min-h-0 bg-canvas p-5 max-phone:min-h-[260px]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <button
            type="button"
            className="grid size-8 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
              <rect
                x="2.5"
                y="3"
                width="13"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.25"
              />
              <path
                d="M6.2 3v12M8.5 6.5h4.2M8.5 9h3"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="font-mono text-[9.5px] tracking-[0.08em] text-faint uppercase">
            Preview
          </span>
        </div>
        <div className="flex h-[calc(100%-53px)] flex-col items-center justify-center text-center">
          <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
            <ShowcaseIcon kind="playground" />
          </span>
          <strong className="text-[18px] font-[680] tracking-[-0.025em]">
            {activeItem.label}
          </strong>
          <p className="mt-2 max-w-[32ch] text-[12.5px] leading-6 text-muted">
            侧边栏保持清晰的层级、可折叠分组和会移动的背景表面。
          </p>
        </div>
      </section>
    </div>
  );
}

export function SidebarPage() {
  return (
    <Page
      kind="组件"
      title="Sidebar"
      description="带分组轨道的文档导航。Hover 可互斥选择轨道游标或整行背景，分组可展开收起，同时保持原生链接语义与键盘焦点。"
      tags={["分组导航", "轨道游标", "移动背景", "折叠分组"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Sidebar } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="Group 负责分类与标题图标，Item 包装单个原生链接或路由链接。点击条目会更新受控的 active 状态。"
      >
        <Demo
          code={`const [active, setActive] = useState("history");

<Sidebar
  aria-label="文档导航"
  hoverIndicator="background"
  groupGap={6}
>
  <Sidebar.Group
    title="Playground"
    icon={<PlaygroundIcon />}
    collapsible
    defaultOpen
  >
    <Sidebar.Item active={active === "history"}>
      <Link to="/history">History</Link>
    </Sidebar.Item>
    <Sidebar.Item active={active === "starred"}>
      <Link to="/starred">Starred</Link>
    </Sidebar.Item>
  </Sidebar.Group>
  {/* 更多可折叠 Group 与 Projects 分组 */}
</Sidebar>`}
        >
          <ShowcaseSidebarDemo />
        </Demo>
      </Section>

      <Section
        title="轨道 Hover"
        description="默认模式。hover 时只显示灰色轨道游标；当前项只显示黑色轨道游标。两种状态都不出现整行背景。"
      >
        <Demo
          code={`<Sidebar aria-label="文档导航">
  <Sidebar.Group title="组件" icon={<ComponentsIcon />}>
    <Sidebar.Item active={current === "button"}>
      <NavLink to="/components/button">Button</NavLink>
    </Sidebar.Item>
    <Sidebar.Item active={current === "tabs"}>
      <NavLink to="/components/tabs">Tabs</NavLink>
    </Sidebar.Item>
  </Sidebar.Group>
</Sidebar>`}
        >
          <SidebarDemo hoverIndicator="rail" />
        </Demo>
      </Section>

      <Section
        title="背景 Hover"
        description="将 hoverIndicator 设为 background 后，hover 与当前项都只使用整行背景。从 Group 标题进入 Item 时，同一块表面会连续缩短，而不是消失后重新出现。"
      >
        <Demo
          code={`<Sidebar aria-label="文档导航" hoverIndicator="background">
  {/* Group 与 Item 的结构不变 */}
</Sidebar>`}
        >
          <SidebarDemo hoverIndicator="background" />
        </Demo>
      </Section>

      <Section
        title="折叠分组"
        description="给 Group 设置 collapsible 后会生成带 aria-expanded 的标题按钮。收起时内容立即转为 inert，动画只负责高度和透明度。"
      >
        <Demo
          code={`<Sidebar.Group
  title="组件"
  icon={<ComponentsIcon />}
  collapsible
  defaultOpen
>
  <Sidebar.Item active={current === "button"}>
    <NavLink to="/components/button">Button</NavLink>
  </Sidebar.Item>
</Sidebar.Group>`}
        >
          <SidebarDemo />
        </Demo>
      </Section>

      <Section
        title="分组间距"
        description="groupGap 统一控制 Group 之间的垂直距离。数字按 px 处理，也可以直接传入 rem、em 等 CSS 长度。"
      >
        <Demo
          code={`<Sidebar aria-label="文档导航" groupGap={12}>
  {/* Group 与 Item 的结构不变 */}
</Sidebar>`}
        >
          <SidebarDemo groupGap={12} />
        </Demo>
      </Section>

      <Section
        title="关闭悬停预览"
        description="hoverPreview 只关闭鼠标预览，不影响当前项、点击、焦点或触屏。"
      >
        <Demo
          code={`<Sidebar aria-label="文档导航" hoverPreview={false}>
  {/* Group 与 Item 的结构不变 */}
</Sidebar>`}
        >
          <SidebarDemo hoverPreview={false} />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "Sidebar",
              type: "nav attributes",
              description:
                "根节点是原生 nav。传入 aria-label 命名导航区域，className 用于宽度、滚动或布局。",
            },
            {
              name: "hoverPreview",
              type: "boolean",
              defaultValue: "true",
              description:
                "是否启用 hoverIndicator 选择的鼠标反馈；触屏和键盘焦点不会触发预览。",
            },
            {
              name: "hoverIndicator",
              type: '"rail" | "background"',
              defaultValue: '"rail"',
              description:
                "选择互斥的轨道游标或整行背景；hover 与当前项都遵循该模式，不会叠加。",
            },
            {
              name: "groupGap",
              type: "number | string",
              defaultValue: '"1.5rem"',
              description:
                "控制 Group 之间的垂直间距。数字按 px 处理，字符串原样作为 CSS 长度使用。",
            },
            {
              name: "Sidebar.Group",
              type: "title / icon / collapsible",
              description:
                "生成带可访问名称的分组和列表。collapsible 开启时渲染标题按钮与折叠内容。",
            },
            {
              name: "open / defaultOpen / onOpenChange",
              type: "boolean / boolean / (open) => void",
              defaultValue: "— / true / —",
              description:
                "控制或观察可折叠分组的展开状态；非折叠分组始终展开。",
            },
            {
              name: "Sidebar.Item",
              type: "active / className / ReactElement",
              description:
                "包装单个链接元素并合并样式与指针事件；active 为 true 时设置 aria-current=page。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "Sidebar 使用原生 nav，每个 Group 通过 aria-labelledby 获得可访问名称，Item 保持普通链接语义。",
            "可折叠 Group 使用原生 button，暴露 aria-expanded 与 aria-controls；收起内容通过 inert 立即退出键盘和辅助技术顺序。",
            "所有链接按 DOM 顺序进入 Tab 顺序；方向键不会被拦截，也不承担 Tabs 的 roving tabindex。",
            "当前项获得 aria-current=page 和文字强调，并按 hoverIndicator 使用轨道游标或静态背景；两种选中视觉不会叠加。",
            "指针预览只在 pointerType=mouse 时启用；触屏点按只会改变链接自身状态。",
            "焦点使用独立的 focus-visible 焦点环。减少动态时背景和分组内容立即换位，状态和事件不受影响。",
            "粗指针设备把条目最小高度提高到 44px；桌面仍保持紧凑的 32px 行高。",
          ]}
        />
        <Callout title="由调用方提供导航状态" tone="info">
          Sidebar 不猜测当前路由。请根据路由或外部状态传入
          active，并保留链接原有的导航行为。
        </Callout>
      </Section>
    </Page>
  );
}
