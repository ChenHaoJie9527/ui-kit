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

function SidebarDemo({ hoverPreview = true }: { hoverPreview?: boolean }) {
  const [active, setActive] = useState("button");

  return (
    <div className="w-full max-w-[310px] rounded-[14px] border border-line bg-surface p-3.5">
      <Sidebar
        aria-label={hoverPreview ? "示例文档导航" : "无预览的文档导航"}
        hoverPreview={hoverPreview}
      >
        {groups.map((group) => (
          <Sidebar.Group
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

export function SidebarPage() {
  return (
    <Page
      kind="组件"
      title="Sidebar"
      description="带分组轨道的文档导航。当前项与鼠标预览使用各自的共享指示器，移动时不闪烁，也不改变原生链接的键盘顺序。"
      tags={["分组导航", "共享游标", "键盘", "reduced motion"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Sidebar } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="Group 负责分类与标题图标，Item 包装单个原生链接或路由链接。点击条目会更新受控的 active 状态。"
      >
        <Demo
          code={`const [active, setActive] = useState("button");

<Sidebar aria-label="文档导航">
  <Sidebar.Group
    title="组件"
    icon={<ComponentsIcon />}
  >
    <Sidebar.Item active={active === "button"}>
      <a href="/components/button" onClick={…}>Button</a>
    </Sidebar.Item>
    <Sidebar.Item active={active === "sidebar"}>
      <a href="/components/sidebar" onClick={…}>
        Sidebar
      </a>
    </Sidebar.Item>
  </Sidebar.Group>
</Sidebar>`}
        >
          <SidebarDemo />
        </Demo>
      </Section>

      <Section
        title="移动指示器"
        description="当前项保留黑色指示器；hover 另一个条目时，灰色预览指示器连续移动到新位置。两者是独立状态，鼠标离开后当前项不会消失。"
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
          <SidebarDemo />
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
                "鼠标在条目间移动时显示灰色预览指示器；触屏和键盘焦点不会触发预览。",
            },
            {
              name: "Sidebar.Group",
              type: "title / icon",
              description:
                "生成带可访问名称的分组和列表。icon 只承担视觉分类，不会进入可访问名称。",
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
            "所有链接按 DOM 顺序进入 Tab 顺序；方向键不会被拦截，也不承担 Tabs 的 roving tabindex。",
            "当前项同时获得 aria-current=page、文字强调和静态指示器，表达不依赖动画。",
            "指针预览只在 pointerType=mouse 时启用；触屏点按只会改变链接自身状态。",
            "焦点使用独立的 focus-visible 焦点环。减少动态时指示器立即换位，状态和事件不受影响。",
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
