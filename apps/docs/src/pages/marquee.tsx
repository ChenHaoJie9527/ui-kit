import { Marquee } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";

const customers = [
  "Nordwind",
  "Halcyon",
  "Northstar",
  "Cobalt",
  "Orbital",
  "Larkspur",
] as const;

const announcements = [
  "v0.6 发布：新增 Marquee",
  "文档站已支持实时编辑示例",
  "所有组件遵循统一的 Motion 契约",
] as const;

const loopCustomers = [...customers, ...customers, ...customers];
const loopAnnouncements = [
  ...announcements,
  ...announcements,
  ...announcements,
];

function BasicDemo() {
  return (
    <div className="w-full">
      <Marquee>
        {loopCustomers.map((customer, index) => (
          <div
            className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground"
            key={`${customer}-${index}`}
          >
            {customer}
          </div>
        ))}
      </Marquee>
    </div>
  );
}

function DirectionDemo() {
  return (
    <div className="h-[220px] w-full max-w-[520px]">
      <Marquee direction="up" speed={12}>
        {loopAnnouncements.map((announcement, index) => (
          <div
            className="rounded-lg border border-border bg-surface px-5 py-3 text-sm text-foreground"
            key={`${announcement}-${index}`}
          >
            {announcement}
          </div>
        ))}
      </Marquee>
    </div>
  );
}

function HoverDemo() {
  return (
    <div className="w-full">
      <Marquee pauseOnHover gap="1.5rem" speed={18}>
        {loopCustomers.map((customer, index) => (
          <div
            className="rounded-full border border-border bg-surface px-5 py-2 text-sm text-foreground"
            key={`${customer}-${index}`}
          >
            {customer}
          </div>
        ))}
      </Marquee>
    </div>
  );
}

export function MarqueePage() {
  return (
    <Page
      kind="组件"
      title="Marquee"
      description="水平或垂直无缝跑马灯。使用 CSS 线性动画，内容会复制为不可访问的副本来形成循环。"
      tags={["CSS 动画", "循环", "悬停暂停"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Marquee } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="把一组静态内容作为 children 传入。方向默认向左，speed 是完成一个循环的秒数。"
      >
        <Demo
          code={`const loopCustomers = [...customers, ...customers, ...customers];

<Marquee speed={25}>
  {loopCustomers.map((customer, index) => (
    <div key={\`\${customer}-\${index}\`}>{customer}</div>
  ))}
</Marquee>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Callout tone="warning" title="内容需要填满容器">
        Marquee
        按参考实现只渲染两条固定轨道。传入的一组内容宽/高应至少等于容器，否则轨道连接处会出现空白；示例中先重复了基础数据。
      </Callout>

      <Section
        title="垂直方向"
        description="direction=up 时内容整列向上循环；height 由容器决定，适合公告栏、推荐列表或数据大屏的表格行。"
      >
        <Demo
          code={`const loopAnnouncements = [...announcements, ...announcements, ...announcements];

<div className="h-[220px]">
  <Marquee direction="up" speed={12}>
    {loopAnnouncements.map((announcement, index) => (
      <div key={\`\${announcement}-\${index}\`}>{announcement}</div>
    ))}
  </Marquee>
</div>`}
        >
          <DirectionDemo />
        </Demo>
      </Section>

      <Section
        title="悬停与间距"
        description="pauseOnHover 默认开启，只在支持 hover 的精确指针设备上生效；gap 会同步应用到轨道连接处。"
      >
        <Demo
          code={`<Marquee pauseOnHover gap="1.5rem" speed={18}>
  {loopCustomers.map((customer, index) => (
    <div key={\`\${customer}-\${index}\`}>{customer}</div>
  ))}
</Marquee>`}
        >
          <HoverDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "direction",
              type: '"left" | "right" | "up" | "down"',
              defaultValue: '"left"',
              description: "滚动方向。",
            },
            {
              name: "speed",
              type: "number",
              defaultValue: "30",
              description: "一个循环的秒数；数值越小滚动越快。",
            },
            {
              name: "pauseOnHover",
              type: "boolean",
              defaultValue: "true",
              description: "鼠标悬停时暂停动画。",
            },
            {
              name: "gap",
              type: "string",
              defaultValue: '"1rem"',
              description: "项目间距，也用于无缝连接两个轨道。",
            },
            {
              name: "fade",
              type: "boolean",
              defaultValue: "true",
              description: "使用渐变遮罩淡化两侧或上下边缘。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "每个内容序列只复制一份；第二份轨道设置 aria-hidden 和 inert，屏幕阅读器不会重复读取。",
            "轨道内部包含可聚焦元素时会因 :focus-within 暂停，避免焦点跟随不可控位置移动。",
            "prefers-reduced-motion: reduce 会停止滚动，保留一份完整内容用于阅读。",
            "内容总量需要足够填满容器；组件只复制两条固定轨道，不做动态测量和扩容。",
            "悬停暂停只在支持 hover 的精确指针设备上启用；触屏用户不会被不确定的 hover 状态打断。",
          ]}
        />
      </Section>
    </Page>
  );
}
