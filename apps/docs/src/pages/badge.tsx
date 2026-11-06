import { useState } from "react";
import { Badge, Button, type BadgeVariant } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

const variants: BadgeVariant[] = [
  "default",
  "primary",
  "success",
  "warning",
  "danger",
  "loading",
];

const releases = [
  {
    name: "seam-react",
    version: "0.13.2",
    variant: "success",
    label: "已发布",
  },
  {
    name: "seam-hooks",
    version: "0.13.0",
    variant: "success",
    label: "已发布",
  },
  { name: "文档站", version: "next", variant: "warning", label: "构建中" },
  { name: "旧版入口", version: "0.8.0", variant: "danger", label: "已下线" },
] as const;

const stages = [
  { variant: "default", label: "排队等待" },
  { variant: "loading", label: "正在同步中" },
  { variant: "success", label: "已发布" },
  { variant: "danger", label: "已回滚到上一版" },
] as const;

function VariantsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  );
}

function SizesDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="primary">
        sm
      </Badge>
      <Badge size="sm" variant="success">
        已发布
      </Badge>
      <Badge variant="primary">md</Badge>
      <Badge variant="success">已发布</Badge>
    </div>
  );
}

function CustomIconDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">自动图标</Badge>
      <Badge
        variant="primary"
        icon={
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M8 2.5 9.7 6l3.8.4-2.9 2.5.9 3.7L8 10.7l-3.5 1.9.9-3.7L2.5 6.4 6.3 6 8 2.5Z" />
          </svg>
        }
      >
        自定义图标
      </Badge>
      <Badge variant="danger" showIcon={false}>
        仅文字
      </Badge>
    </div>
  );
}

function LoadingDemo() {
  const [synced, setSynced] = useState(false);

  return (
    <div className="flex max-w-[460px] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={synced ? "success" : "loading"}>
          {synced ? "同步完成" : "同步中"}
        </Badge>
        <Badge variant="loading" size="sm">
          Indexing
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSynced((v) => !v)}
        >
          {synced ? "重新同步" : "完成同步"}
        </Button>
        <Readout label="aria-busy" value={synced ? "未设置" : "true"} />
      </div>
    </div>
  );
}

function SwapDemo() {
  const [index, setIndex] = useState(0);
  const stage = stages[index] ?? stages[0];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant={stage.variant} contentKey={stage.label}>
        {stage.label}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIndex((current) => (current + 1) % stages.length)}
      >
        切换状态
      </Button>
      <Readout label="当前阶段" value={stage.label} />
    </div>
  );
}

function InlineDemo() {
  return (
    <ul className="m-0 flex max-w-[460px] list-none flex-col gap-3 p-0">
      {releases.map((release) => (
        <li
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]"
          key={release.name}
        >
          <span className="font-[650]">{release.name}</span>
          <code className="text-[12px] text-muted">{release.version}</code>
          <Badge variant={release.variant}>{release.label}</Badge>
        </li>
      ))}
    </ul>
  );
}

const initialTopics = ["表单", "键盘", "动效"];

function DismissDemo() {
  const [topics, setTopics] = useState(initialTopics);
  const [lastDismissed, setLastDismissed] = useState("");

  return (
    <div className="flex max-w-[460px] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {topics.map((topic) => (
          <Badge
            key={topic}
            variant="primary"
            dismissLabel={`移除 ${topic} 标签`}
            onDismiss={() => {
              setTopics((current) => current.filter((item) => item !== topic));
              setLastDismissed(topic);
            }}
          >
            {topic}
          </Badge>
        ))}
        {topics.length === 0 ? (
          <span className="text-[12.5px] text-muted">所有标签都已移除。</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTopics(initialTopics);
            setLastDismissed("");
          }}
        >
          重置标签
        </Button>
        <Readout label="最近移除" value={lastDismissed || "—"} />
      </div>
    </div>
  );
}

function LockedDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">系统标签不可移除</Badge>
      <Badge
        variant="danger"
        dismissLabel="移除受限标签"
        dismissDisabled
        onDismiss={() => {}}
      >
        权限不足
      </Badge>
    </div>
  );
}

export function BadgePage() {
  return (
    <Page
      kind="组件"
      title="Badge"
      description="紧凑的内联状态或元数据标签。按 variant 自动配状态图标，loading 使用 spinner 与轻脉冲；状态变化时图标和文字滚动替换，宽度连续过渡。"
      tags={["状态图标", "loading", "sm / md", "Motion"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Badge } from "seam-react";'} />
      </Section>

      <Section
        title="变体"
        description="variant 决定颜色语义和默认图标。default 用于中性标签，loading 会显示 spinner 并默认开启脉冲。"
      >
        <Demo
          code={`<Badge>default</Badge>
<Badge variant="primary">primary</Badge>
<Badge variant="success">success</Badge>
<Badge variant="warning">warning</Badge>
<Badge variant="danger">danger</Badge>
<Badge variant="loading">loading</Badge>`}
        >
          <VariantsDemo />
        </Demo>
      </Section>

      <Section
        title="尺寸"
        description="sm 用于密集列表或表格行，md 是默认尺寸，保持和其他组件的既有比例。"
      >
        <Demo
          code={`<Badge size="sm" variant="primary">sm</Badge>
<Badge variant="primary">md</Badge>`}
        >
          <SizesDemo />
        </Demo>
      </Section>

      <Section
        title="状态图标"
        description="图标默认显示并随 variant 切换，屏幕阅读器只读取文字。需要业务图标时用 icon 覆盖；图标应控制在 1em 见方内。"
      >
        <Demo
          code={`<Badge variant="success">自动图标</Badge>
<Badge variant="primary" icon={<StarIcon />}>自定义图标</Badge>
<Badge variant="danger" showIcon={false}>仅文字</Badge>`}
        >
          <CustomIconDemo />
        </Demo>
      </Section>

      <Section
        title="加载中"
        description="variant=loading 会渲染 spinner、设置 aria-busy 并隐藏关闭按钮；状态播报交给外层容器。"
      >
        <Demo
          code={`<Badge variant="loading">同步中</Badge>
<Badge variant="loading" size="sm">Indexing</Badge>

// 完成后切换 variant，即可复用同一段状态切换动画
<Badge variant={synced ? "success" : "loading"}>
  {synced ? "同步完成" : "同步中"}
</Badge>`}
        >
          <LoadingDemo />
        </Demo>
        <Callout tone="info" title="不要在大列表里成排脉动">
          pulse 默认只在 loading 出现，并且只改
          opacity。表格、列表等密集区域成排 使用 loading Badge 时，建议传
          pulse=&#123;false&#125; 保留 spinner 即可。
        </Callout>
      </Section>

      <Section
        title="状态切换"
        description="variant 或文案变化时，图标和文字用一段短程滚动替换，宽度通过共享 layout 连续过渡，不会让周边内容跳动。contentKey 用于区分文案切换。"
      >
        <Demo
          code={`const stages = [
  { variant: "default", label: "排队等待" },
  { variant: "loading", label: "正在同步中" },
  { variant: "success", label: "已发布" },
  { variant: "danger", label: "已回滚到上一版" },
];

<Badge variant={stage.variant} contentKey={stage.label}>
  {stage.label}
</Badge>`}
        >
          <SwapDemo />
        </Demo>
      </Section>

      <Section
        title="内联状态"
        description="Badge 适合跟在名称、版本号或表格字段后面，补充一小段状态信息。它不会换行，也不做截断，长内容由容器负责处理。"
      >
        <Demo
          code={`<li>
  <span>seam-react</span>
  <code>0.13.2</code>
  <Badge variant="success">已发布</Badge>
</li>`}
        >
          <InlineDemo />
        </Demo>
      </Section>

      <Section
        title="可关闭"
        description="提供 onDismiss 后渲染原生 button 关闭按钮；Badge 只通知事件，是否移除由调用方维护。dismissLabel 用于说明被移除的对象。"
      >
        <Demo
          code={`const [topics, setTopics] = useState(["表单", "键盘", "动效"]);

{topics.map((topic) => (
  <Badge
    key={topic}
    variant="primary"
    dismissLabel={\`移除 \${topic} 标签\`}
    onDismiss={() =>
      setTopics((current) => current.filter((item) => item !== topic))
    }
  >
    {topic}
  </Badge>
))}`}
        >
          <DismissDemo />
        </Demo>
      </Section>

      <Section
        title="关闭状态"
        description="dismissDisabled 只禁用关闭操作，内容仍然完整可读；也可以传 dismissible={false} 在保留 onDismiss 的同时隐藏关闭按钮。"
      >
        <Demo
          code={`<Badge variant="success">系统标签不可移除</Badge>
<Badge
  variant="danger"
  dismissLabel="移除受限标签"
  dismissDisabled
  onDismiss={() => {}}
>
  权限不足
</Badge>`}
        >
          <LockedDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "variant",
              type: '"default" | "primary" | "success" | "warning" | "danger" | "loading"',
              defaultValue: '"default"',
              description:
                "视觉与语义颜色，同时决定默认图标；loading 显示 spinner、默认开启脉冲并隐藏关闭按钮。",
            },
            {
              name: "size",
              type: '"sm" | "md"',
              defaultValue: '"md"',
              description: "尺寸。sm 更紧凑，用于密集列表或表格行。",
            },
            {
              name: "children",
              type: "ReactNode",
              description:
                "简短的状态或元数据内容；不自动截断，也不作为 live region。",
            },
            {
              name: "icon",
              type: "ReactNode",
              description:
                "覆盖当前 variant 的默认图标。图标应控制在 1em 见方内，并自带 aria-hidden。",
            },
            {
              name: "showIcon",
              type: "boolean",
              defaultValue: "true",
              description:
                "是否显示状态图标；设为 false 时 loading 的 spinner 也一并隐藏。",
            },
            {
              name: "pulse",
              type: "boolean",
              defaultValue: 'variant === "loading"',
              description:
                "是否显示脉冲。只改变 opacity，prefers-reduced-motion 下完全关闭。",
            },
            {
              name: "contentKey",
              type: "string | number",
              description:
                "状态切换动画的稳定 key；默认取 children（文本）或 variant。",
            },
            {
              name: "onDismiss",
              type: "(event: MouseEvent | KeyboardEvent) => void",
              description:
                "激活关闭按钮时调用。不会自动移除 Badge，状态始终由调用方维护。",
            },
            {
              name: "dismissible",
              type: "boolean",
              defaultValue: "Boolean(onDismiss)",
              description:
                "是否显示关闭按钮；loading 时始终不渲染。显式传 true 但没有 onDismiss 时不会渲染按钮，并在开发环境给出提示。",
            },
            {
              name: "dismissLabel",
              type: "string",
              defaultValue: '"Dismiss badge"',
              description: "关闭按钮的无障碍名称，建议说明被移除的具体对象。",
            },
            {
              name: "dismissDisabled",
              type: "boolean",
              defaultValue: "false",
              description: "仅禁用关闭操作，不影响 Badge 内容显示。",
            },
            {
              name: "dismissButtonClassName",
              type: "string",
              description: "仅应用于关闭按钮的额外类名。",
            },
            {
              name: "...rest",
              type: "HTMLAttributes<HTMLSpanElement>",
              description: "其余属性透传到根 span。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "根节点是普通 span，不添加 role 或 live region；图标与 spinner 全部 aria-hidden，可读文本只有 children。",
            'variant=loading 时根节点带 aria-busy="true"，读屏能知道内容仍在更新。',
            '状态变化需要播报时，把 Badge 放进带 aria-live="polite" 的外层容器，而不是给每个 Badge 单独加 live region。',
            "关闭按钮是原生 button，支持指针、Enter 与 Space 触发，并带可见的 focus-visible 焦点环；loading 时不渲染关闭按钮。",
            "dismissLabel 为关闭按钮提供无障碍名称，避免读屏只听到“按钮”。",
            "prefers-reduced-motion: reduce 下关闭 layout 投影与 pulse，图标和文字原地瞬切；spinner 减速到 1.6s 而不是停转。",
            "状态切换只使用 transform、opacity 与 filter，并且退出比进入快（140ms / 300ms spring），不会阻塞下一次状态变化。",
            "关闭按钮的点击区域为 16px 见方，落在 Badge 内部，触屏点击会命中同一个按钮。",
          ]}
        />
      </Section>
    </Page>
  );
}
