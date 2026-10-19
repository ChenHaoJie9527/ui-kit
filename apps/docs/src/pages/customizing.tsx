import { useEffect, useState, type CSSProperties } from "react";
import {
  Button,
  Dialog,
  Input,
  Switch,
  Tabs,
  useToast,
} from "@chenhaojie9527/ui-kit";
import {
  BulletList,
  ButtonRow,
  Callout,
  CodeBlock,
  Demo,
  InlineCode,
  Page,
  PropsTable,
  Section,
} from "../components/docs";

/**
 * Portal 组件（Dialog / Toast）不在演示容器里渲染，
 * 所以演示宽度的变量必须挂在 documentElement 上。
 */
function useRootVariable(name: string, value: string, active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const root = document.documentElement;
    const previous = root.style.getPropertyValue(name);
    root.style.setProperty(name, value);

    return () => {
      if (previous) {
        root.style.setProperty(name, previous);
      } else {
        root.style.removeProperty(name);
      }
    };
  }, [active, name, value]);
}

function DecisionTable({
  rows,
}: {
  rows: Array<{ need: string; way: string; detail: string }>;
}) {
  const th =
    "border-b border-line bg-surface-2 px-3.5 py-[11px] text-left text-[11.5px] font-semibold tracking-[0.03em] whitespace-nowrap text-muted";
  const cell = "border-b border-line px-3.5 py-[11px] align-top";

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th scope="col" className={th}>
              你要改什么
            </th>
            <th scope="col" className={th}>
              用哪种方式
            </th>
            <th scope="col" className={th}>
              怎么做
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.need} className="[&:last-child>*]:border-b-0">
              <th
                scope="row"
                className={`${cell} text-left font-medium whitespace-nowrap text-ink`}
              >
                {row.need}
              </th>
              <td className={cell}>
                <code className="rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-xs text-accent-strong">
                  {row.way}
                </code>
              </td>
              <td className={cell}>{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- 1. 全局 token ---------- */

function BrandThemeDemo() {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-brand">
      <ButtonRow>
        <Button>品牌主色</Button>
        <Button variant="secondary">次要</Button>
        <Input aria-label="品牌输入框" placeholder="输入框也会跟着变" />
        <Switch defaultChecked>开关</Switch>
      </ButtonRow>
    </div>
  );
}

/* ---------- 2. 组件级变量 ---------- */

function CompactThemeDemo() {
  return (
    <div className="grid grid-cols-2 gap-3.5 max-phone:grid-cols-1">
      <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">默认</p>
        <ButtonRow>
          <Button size="sm">保存</Button>
          <Button size="md">取消</Button>
          <Input aria-label="默认输入框" placeholder="默认圆角" />
        </ButtonRow>
      </div>
      <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-compact">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">紧凑圆角</p>
        <ButtonRow>
          <Button size="sm">保存</Button>
          <Button size="md">取消</Button>
          <Input aria-label="紧凑输入框" placeholder="圆角 2px" />
        </ButtonRow>
      </div>
    </div>
  );
}

const capsuleStyle = {
  "--uk-button-radius": "999px",
} as CSSProperties;

function ComponentScopeDemo() {
  const [open, setOpen] = useState(false);
  useRootVariable("--uk-dialog-width", "26rem", open);

  return (
    <div className="grid grid-cols-2 gap-3.5 max-phone:grid-cols-1">
      <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4" style={capsuleStyle}>
        <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">只改按钮圆角</p>
        <ButtonRow>
          <Button>胶囊按钮</Button>
          <Input aria-label="未受影响的输入框" placeholder="输入框不受影响" />
        </ButtonRow>
      </div>
      <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">只改对话框宽度</p>
        <ButtonRow>
          <Button variant="outline" onClick={() => setOpen(true)}>
            打开窄对话框
          </Button>
        </ButtonRow>
        <p className="m-0 text-[12.5px] text-muted">--uk-dialog-width: 26rem，仅影响 Dialog。</p>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="窄对话框"
          description="宽度来自 --uk-dialog-width。"
          footer={<Button onClick={() => setOpen(false)}>关闭</Button>}
        >
          <p className="m-0 text-sm leading-[1.65] text-muted">
            Dialog 渲染在 body 下，所以演示时把变量挂到了 documentElement。
          </p>
        </Dialog>
      </div>
    </div>
  );
}

/* ---------- 3. 局部主题 ---------- */

function ThemeIslandDemo() {
  return (
    <div className="grid grid-cols-2 gap-3.5 max-phone:grid-cols-1">
      <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-brand">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">同一页面 · 品牌主题</p>
        <Switch defaultChecked>跟随品牌色</Switch>
      </div>
      <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-contrast">
        <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">同一页面 · 高对比度</p>
        <Switch defaultChecked>高对比度</Switch>
      </div>
    </div>
  );
}

/* ---------- 4. 定向覆盖 ---------- */

function TargetDemo() {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4">
      <ButtonRow>
        <Button>默认主按钮</Button>
        <Button className="demo-outline-primary">仅这个按钮</Button>
        <Button variant="danger" className="demo-square" aria-label="删除">
          删除
        </Button>
      </ButtonRow>
    </div>
  );
}

function StateTargetDemo() {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4">
      <Tabs defaultValue="a" className="demo-dashed-tabs">
        <Tabs.List aria-label="定向覆盖示例">
          <Tabs.Trigger value="a">选中项用虚线</Tabs.Trigger>
          <Tabs.Trigger value="b">第二项</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">
          <p className="m-0 text-sm leading-[1.65] text-muted">
            通过{" "}
            <InlineCode>
              .uk-tabs__trigger[data-state=&quot;active&quot;]
            </InlineCode>{" "}
            命中选中状态，不需要额外的类名。
          </p>
        </Tabs.Content>
        <Tabs.Content value="b">
          <p className="m-0 text-sm leading-[1.65] text-muted">面板切换时 data-state 会同步更新。</p>
        </Tabs.Content>
      </Tabs>
    </div>
  );
}

/* ---------- 5. 一次性样式 ---------- */

function InlineDemo() {
  return (
    <ButtonRow>
      <Button style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
        inline style
      </Button>
      <Button className="demo-wide">className</Button>
    </ButtonRow>
  );
}

/* ---------- 6. 完全自定义 ---------- */

function ToastWidthDemo() {
  const { toast } = useToast();
  const [narrow, setNarrow] = useState(false);
  useRootVariable("--uk-toast-width", "16rem", narrow);

  return (
    <ButtonRow>
      <Switch checked={narrow} onCheckedChange={setNarrow}>
        窄通知
      </Switch>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "自定义通知",
            description: "宽度由 --uk-toast-width 决定。",
          })
        }
      >
        弹一条通知
      </Button>
    </ButtonRow>
  );
}

export function CustomizingPage() {
  return (
    <Page
      kind="指南"
      title="自定义样式"
      description="组件库不提供 theme 配置对象，所有样式都是 CSS 变量与稳定的类名。下面按「影响范围」从大到小列出全部改法：可以只换一个颜色，也可以完全接管某个组件。"
      tags={["CSS 变量", "@layer", "light-dark()", "data 属性"]}
    >
      <Section
        title="先选一种方式"
        description="按需求查表。范围越小越好维护，大多数需求不需要写选择器。"
      >
        <DecisionTable
          rows={[
            {
              need: "换品牌色 / 圆角 / 字体",
              way: "全局 token",
              detail:
                "在 :root 覆盖 --uk-primary-solid、--uk-radius-md 等，全站生效。",
            },
            {
              need: "只改某个组件",
              way: "组件级变量",
              detail:
                "例如 --uk-button-radius、--uk-dialog-width，只影响该组件。",
            },
            {
              need: "某个区域用另一套主题",
              way: "作用域变量",
              detail: "把变量设在任意容器上，自定义属性会向下继承。",
            },
            {
              need: "改结构 / 间距 / 某个状态",
              way: "定向选择器",
              detail:
                "用 .uk-* 类名和 data-variant / data-size / data-state 属性。",
            },
            {
              need: "一次性微调",
              way: "className / style",
              detail: "单个实例传 className 或内联样式，最直接也最难复用。",
            },
            {
              need: "完全不同的视觉",
              way: "只用 hooks",
              detail:
                "不用组件，拿 useControllableState 等自建，样式完全自己写。",
            },
          ]}
        />
      </Section>

      <Section
        title="1. 全局 token"
        description="所有颜色、间距、圆角、字号、阴影都是 :root 上的 CSS 变量。覆盖它们就得到一套新主题，不需要碰任何选择器。"
      >
        <Demo
          code={`:root {
  /* 品牌色：浅色 / 深色分别取值 */
  --uk-primary: light-dark(#0f766e, #5eead4);
  --uk-primary-solid: light-dark(#0f766e, #0d9488);
  --uk-primary-solid-hover: light-dark(#115e59, #14b8a6);

  /* 形状与密度 */
  --uk-radius-md: 0.375rem;
  --uk-space-4: 0.875rem;

  /* 字体 */
  --uk-font-sans: "Inter", system-ui, sans-serif;
}`}
        >
          <BrandThemeDemo />
        </Demo>

        <Callout title="放在库的样式之后">
          用{" "}
          <InlineCode>@import "@chenhaojie9527/ui-kit/styles.css"</InlineCode>{" "}
          或打包器引入后， 在同一个入口文件里追加自己的覆盖规则即可。
        </Callout>

        <p className="mt-3.5 max-w-[72ch] text-sm leading-[1.7] text-muted">
          主要 token 分四组：颜色（<InlineCode>--uk-primary*</InlineCode>、
          <InlineCode>--uk-surface*</InlineCode>、
          <InlineCode>--uk-text*</InlineCode>、
          <InlineCode>--uk-border*</InlineCode>、
          <InlineCode>--uk-danger*</InlineCode>）、 间距（
          <InlineCode>--uk-space-1</InlineCode> 到{" "}
          <InlineCode>--uk-space-8</InlineCode>）、圆角（
          <InlineCode>--uk-radius-sm/md/lg/full</InlineCode>）、字号与阴影（
          <InlineCode>--uk-text-*</InlineCode>、
          <InlineCode>--uk-shadow-*</InlineCode>）。
        </p>
      </Section>

      <Section
        title="2. 组件级变量"
        description="只想动一个组件时用这层。它们不预设默认值，而是在组件内部写成 var(--x, fallback)，所以设在哪里都能生效，也不会和全局 token 打架。"
      >
        <Demo
          code={`/* 只把按钮改成胶囊形 */
:root {
  --uk-button-radius: 999px;
}

/* 只加宽对话框 */
:root {
  --uk-dialog-width: 48rem;
}`}
        >
          <CompactThemeDemo />
        </Demo>

        <PropsTable
          rows={[
            {
              name: "--uk-button-radius",
              type: "length",
              defaultValue: "var(--uk-radius-md)",
              description: "按钮圆角。",
            },
            {
              name: "--uk-button-height-sm/md/lg",
              type: "length",
              defaultValue: "2rem / 2.5rem / 3rem",
              description: "三档按钮高度。",
            },
            {
              name: "--uk-button-font-weight",
              type: "number",
              defaultValue: "600",
              description: "按钮字重。",
            },
            {
              name: "--uk-input-radius",
              type: "length",
              defaultValue: "var(--uk-radius-md)",
              description: "输入框圆角。",
            },
            {
              name: "--uk-switch-track / -checked / --uk-switch-thumb",
              type: "color",
              defaultValue: "border-strong / primary-solid / #ffffff",
              description: "开关轨道与滑块颜色。",
            },
            {
              name: "--uk-tabs-indicator / -size",
              type: "color / length",
              defaultValue: "var(--uk-primary) / 2px",
              description: "选中项下划线的颜色与粗细。",
            },
            {
              name: "--uk-dialog-width / -radius",
              type: "length",
              defaultValue: "32rem / var(--uk-radius-lg)",
              description: "对话框宽度与圆角。",
            },
            {
              name: "--uk-toast-width / -radius",
              type: "length",
              defaultValue: "22rem / var(--uk-radius-md)",
              description: "通知宽度与圆角。",
            },
          ]}
        />

        <Demo
          code={`.capsule-buttons {
  --uk-button-radius: 999px;
}

/* 局部范围同样有效 */
.sidebar-zone {
  --uk-input-radius: 0.25rem;
}`}
        >
          <ComponentScopeDemo />
        </Demo>
      </Section>

      <Section
        title="3. 作用域主题"
        description="CSS 自定义属性会向下继承，所以把变量设在任意容器上就能做出局部的主题岛：同一个页面里，不同区域可以是不同的品牌色或装饰风格。"
      >
        <Demo
          code={`<section class="brand-zone">
  <Button>跟随品牌色</Button>
</section>

<style>
  .brand-zone {
    --uk-primary-solid: light-dark(#0f766e, #0d9488);
    --uk-button-radius: 999px;
  }
</style>`}
        >
          <ThemeIslandDemo />
        </Demo>

        <Callout tone="warning" title="Portal 组件不受作用域约束">
          <InlineCode>Dialog</InlineCode> 与 <InlineCode>Toast</InlineCode>{" "}
          渲染在 <InlineCode>document.body</InlineCode>{" "}
          下，不在你的容器里。要让它们也换主题， 变量必须设在{" "}
          <InlineCode>body</InlineCode> 或 <InlineCode>:root</InlineCode>{" "}
          上，或者用组件级变量。
        </Callout>
      </Section>

      <Section
        title="4. 定向选择器"
        description="结构、间距、状态这类无法用变量表达的改动，用类名与 data 属性覆盖。所有状态都是数据属性，不是动态拼出来的类名。"
      >
        <Demo
          code={`/* 只改这一个主按钮 */
.demo-outline-primary[data-variant="primary"] {
  background: transparent;
  border-color: var(--uk-primary-solid);
  color: var(--uk-primary-solid);
}

/* 方形删除按钮 */
.demo-square {
  --uk-button-radius: 0;
  aspect-ratio: 1;
  padding: 0;
}`}
        >
          <TargetDemo />
        </Demo>

        <p className="mt-3.5 max-w-[72ch] text-sm leading-[1.7] text-muted">
          稳定可用的选择器只有三类，其余内部类名可能随版本调整：
        </p>
        <BulletList
          items={[
            <>
              组件根类名：<InlineCode>.uk-button</InlineCode>、
              <InlineCode>.uk-input</InlineCode>、
              <InlineCode>.uk-dialog</InlineCode> 等。
            </>,
            <>
              变体与尺寸：<InlineCode>[data-variant]</InlineCode>、
              <InlineCode>[data-size]</InlineCode>、
              <InlineCode>[data-orientation]</InlineCode>。
            </>,
            <>
              运行状态：<InlineCode>[data-state]</InlineCode>、
              <InlineCode>[data-loading]</InlineCode>、
              <InlineCode>[aria-invalid=&quot;true&quot;]</InlineCode>、
              <InlineCode>[data-disabled]</InlineCode>。
            </>,
          ]}
        />

        <Demo
          code={`.demo-dashed-tabs .uk-tabs__trigger[data-state="active"]::after {
  background: repeating-linear-gradient(
    90deg,
    currentColor 0 6px,
    transparent 6px 10px
  );
}`}
        >
          <StateTargetDemo />
        </Demo>

        <Callout tone="warning" title="Portal 演示的写法">
          下面这个 Dialog 演示把 <InlineCode>--uk-dialog-width</InlineCode> 挂在{" "}
          <InlineCode>documentElement</InlineCode>{" "}
          上，正是因为弹层不在演示容器的 DOM
          树里。真实项目里通常是全局设置一次。
        </Callout>
      </Section>

      <Section
        title="5. 一次性样式"
        description="只需要改某一个实例时，className 与内联 style 都可以直接用，组件会把它们合并进根元素。"
      >
        <Demo
          code={`<Button style={{ letterSpacing: "0.08em" }}>
  inline style
</Button>

<Button className="demo-wide">className</Button>`}
        >
          <InlineDemo />
        </Demo>
      </Section>

      <Section
        title="6. 完全自定义"
        description="如果视觉和交互都要重写，不必和组件较劲。组件内部用的就是公开的 hooks，直接拿这套逻辑写自己的结构。"
      >
        <CodeBlock
          code={`import { useControllableState } from "@chenhaojie9527/ui-kit-hooks";

function MySwitch({ value, defaultValue, onChange }) {
  const [on, setOn] = useControllableState({
    value,
    defaultValue: defaultValue ?? false,
    onChange,
  });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className="my-switch"
    >
      {on ? "开" : "关"}
    </button>
  );
}`}
        />
        <p className="mt-3.5 max-w-[72ch] text-sm leading-[1.7] text-muted">
          同理，<InlineCode>useFocusTrap</InlineCode>{" "}
          可以给任意自绘弹层补焦点管理，
          <InlineCode>useAsync</InlineCode> 可以给任意异步 UI 补加载状态。
        </p>
      </Section>

      <Section
        title="深色模式的坑"
        description="所有颜色都用 light-dark() 定义，覆盖时也要给两个值，否则深色模式会沿用浅色值。这是最容易出错的地方。"
      >
        <Demo
          code={`/* 正确：两种模式各有取值 */
:root {
  --uk-primary-solid: light-dark(#0f766e, #0d9488);
}

/* 错误：深色模式也会变成 #0f766e */
:root {
  --uk-primary-solid: #0f766e;
}`}
        >
          <div className="grid grid-cols-2 gap-3.5 max-phone:grid-cols-1">
            <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-broken-dark">
              <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">只给一个值</p>
              <Button>深色下对比度偏低</Button>
            </div>
            <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-brand">
              <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">light-dark() 两个值</p>
              <Button>深色下仍然清晰</Button>
            </div>
          </div>
        </Demo>

        <p className="mt-3.5 max-w-[72ch] text-sm leading-[1.7] text-muted">
          强制主题只需改变 <InlineCode>color-scheme</InlineCode>，所有{" "}
          <InlineCode>light-dark()</InlineCode> 会整体切换：
        </p>
        <CodeBlock
          code={`// 跟随系统（默认）
document.documentElement.style.colorScheme = "";

// 强制深色
document.documentElement.style.colorScheme = "dark";

// 或者只作用于某个区域
.sidebar { color-scheme: dark; }`}
        />
      </Section>

      <Section
        title="三套可复制的配方"
        description="直接粘进自己的样式入口即可，已经处理了深浅两种模式。"
      >
        <CodeBlock
          label="css"
          code={`/* ① 品牌青绿 */
:root {
  --uk-primary: light-dark(#0f766e, #5eead4);
  --uk-primary-solid: light-dark(#0f766e, #0d9488);
  --uk-primary-solid-hover: light-dark(#115e59, #14b8a6);
  --uk-focus-ring: light-dark(#0d9488, #5eead4);
}

/* ② 紧凑型：更小的圆角与间距 */
:root {
  --uk-radius-sm: 0.125rem;
  --uk-radius-md: 0.25rem;
  --uk-radius-lg: 0.375rem;
  --uk-button-radius: 0.25rem;
  --uk-input-radius: 0.25rem;
}

/* ③ 高对比度：更深的边框与文字 */
:root {
  --uk-border: light-dark(#94a3b8, #475569);
  --uk-border-strong: light-dark(#334155, #64748b);
  --uk-text-muted: light-dark(#334155, #cbd5e1);
  --uk-focus-ring: light-dark(#1d4ed8, #93c5fd);
}`}
        />
        <Demo
          code={`<div class="theme-compact">
  <Button>紧凑按钮</Button>
</div>`}
        >
          <div className="grid grid-cols-2 gap-3.5 max-phone:grid-cols-1">
            <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-compact">
              <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">② 紧凑型</p>
              <ButtonRow>
                <Button>保存</Button>
                <Input aria-label="紧凑输入框" placeholder="0.25rem 圆角" />
              </ButtonRow>
            </div>
            <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4 theme-contrast">
              <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">③ 高对比度</p>
              <ButtonRow>
                <Button variant="secondary">次要按钮</Button>
                <Input aria-label="高对比输入框" placeholder="更深的边框" />
              </ButtonRow>
            </div>
          </div>
        </Demo>
      </Section>

      <Section
        title="为什么不用 !important"
        description="库的所有规则都在 @layer 里，而未分层的普通 CSS 天生优先于任何 layer。所以你写的覆盖规则总是赢，和选择器权重无关。"
      >
        <CodeBlock
          label="css"
          code={`/* 库内部 */
@layer uk.tokens { :root { --uk-primary-solid: ... } }
@layer uk.components { .uk-button { ... } }

/* 你的代码（未分层） */
.uk-button { border-radius: 2px; }  /* 一定生效 */`}
        />

        <BulletList
          items={[
            "不要用 !important，它会断掉后续覆盖的可能。",
            "不需要堆叠选择器提高权重，直接写目标类名即可。",
            "如果你的项目也用 @layer，请把自己的层声明在 uk.* 之后。",
            "组件级变量用 var(--x, fallback) 形式，设在 :root、容器或元素上都有效。",
          ]}
        />
      </Section>

      <Section
        title="Portal 组件的宽度示例"
        description="Toast 与 Dialog 都在 body 下渲染，演示时把变量挂在 documentElement 上，真实项目里也可以只设置一次。"
      >
        <div className="grid grid-cols-2 gap-3.5 max-phone:grid-cols-1">
          <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4">
            <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">Toast</p>
            <ToastWidthDemo />
          </div>
          <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-strong p-4">
            <p className="m-0 font-mono text-[10.5px] tracking-[0.07em] text-faint uppercase">Dialog</p>
            <p className="m-0 text-[12.5px] text-muted">
              打开「只改对话框宽度」里的按钮即可看到 26rem 的窄弹窗。
            </p>
          </div>
        </div>
      </Section>
    </Page>
  );
}
