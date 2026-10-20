import { useState } from "react";
import { Link } from "react-router";
import {
  BulletList,
  Callout,
  CodeBlock,
  InlineCode,
  Page,
  Section,
} from "../components/docs";

const NEXT_DIRECTIVES = `"use client";

import { Button, useToast } from "seam-react";

export function SaveButton() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() =>
        toast({
          title: "设置已保存",
          variant: "success",
        })
      }
    >
      保存设置
    </Button>
  );
}`;

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;

type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  pnpm: "pnpm add seam-react",
  npm: "npm install seam-react",
  yarn: "yarn add seam-react",
  bun: "bun add seam-react",
};

const REACT_ENTRY = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "seam-react";
import { SeamStyles } from "seam-react/styles";

import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SeamStyles />
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);`;

const REACT_APP = `import { useState } from "react";
import {
  Button,
  Switch,
  useToast,
} from "seam-react";

export function App() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);

  return (
    <main>
      <Switch
        checked={notifications}
        onCheckedChange={setNotifications}
      >
        接收通知
      </Switch>

      <Button
        onClick={() =>
          toast({
            title: "设置已保存",
            description: \`通知：\${notifications ? "开启" : "关闭"}\`,
            variant: "success",
          })
        }
      >
        保存设置
      </Button>
    </main>
  );
}`;

const NEXT_PROVIDER = `"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "seam-react";

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}`;

const NEXT_LAYOUT = `import type { ReactNode } from "react";
import { Providers } from "./providers";
import { SeamStyles } from "seam-react/styles";

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <SeamStyles />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`;

const NEXT_HOOKS = `"use client";

import { useState } from "react";
import { useMedia } from "seam-hooks";

export function ResponsiveSummary() {
  const narrow = useMedia("(max-width: 720px)");
  const [expanded, setExpanded] = useState(false);

  return (
    <button onClick={() => setExpanded((value) => !value)}>
      {narrow ? "紧凑布局" : "宽屏布局"}
      {expanded ? " · 已展开" : ""}
    </button>
  );
}`;

const REQUIREMENTS = [
  {
    label: "React",
    value: ">= 18",
    detail: "React 与 ReactDOM 版本需匹配",
  },
  {
    label: "Node.js",
    value: ">= 18",
    detail: "用于安装和运行构建工具",
  },
  {
    label: "样式",
    value: "1×",
    detail: "在应用根部渲染一次 SeamStyles",
  },
];

const NOTES = [
  {
    number: "01",
    title: "Next.js 客户端边界",
    body: "在 App Router 中，把导入 UI 组件或 hooks 的业务文件标记为客户端组件；“use client”必须写在文件顶部、所有 import 之前。",
  },
  {
    number: "02",
    title: "样式只渲染一次",
    body: "在 React 入口或 Next.js 根布局中渲染一次 <SeamStyles />，它会输出组件库需要的完整样式。自定义 CSS 放在它后面即可覆盖 token。",
  },
  {
    number: "03",
    title: "Provider 靠近根节点",
    body: "使用 Toast 时，在整个应用外层包一次 ToastProvider；任何调用 useToast() 的组件都必须位于它内部。",
  },
  {
    number: "04",
    title: "公共包无需认证",
    body: "seam-react 与 seam-hooks 发布在 npm，也提供 @seam/ui 与 @seam/hooks 的 JSR 版本。两种渠道都不需要消费者配置令牌。",
  },
];

const NEXT_STEPS_LINK =
  "inline-flex h-10 items-center justify-center rounded-[10px] border border-line bg-surface px-4 text-[13.5px] font-semibold text-ink no-underline transition-colors hover:border-accent hover:no-underline";

const MANAGER_BUTTON =
  "cursor-pointer rounded-[5px] border-0 bg-transparent px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-code-muted transition-colors hover:bg-white/[0.07] hover:text-code-ink data-[active=true]:bg-white/[0.11] data-[active=true]:text-code-ink";

function InstallCommand() {
  const [manager, setManager] = useState<PackageManager>("pnpm");

  return (
    <CodeBlock
      code={INSTALL_COMMANDS[manager]}
      label="bash"
      headerStart={
        <fieldset className="m-0 flex items-center gap-0.5 border-0 p-0">
          <legend className="sr-only">选择包管理器</legend>
          {PACKAGE_MANAGERS.map((item) => (
            <button
              type="button"
              className={MANAGER_BUTTON}
              data-active={manager === item ? "true" : undefined}
              aria-pressed={manager === item}
              key={item}
              onClick={() => setManager(item)}
            >
              {item}
            </button>
          ))}
        </fieldset>
      }
    />
  );
}

function Requirements() {
  return (
    <dl className="grid grid-cols-3 gap-3 max-phone:grid-cols-1">
      {REQUIREMENTS.map((item) => (
        <div
          className="rounded-[12px] border border-line bg-surface px-4 py-3.5"
          key={item.label}
        >
          <dt className="text-[11.5px] text-muted">{item.label}</dt>
          <dd className="mt-1 font-mono text-[18px] font-semibold tracking-[-0.02em] text-ink">
            {item.value}
          </dd>
          <dd className="mt-1 text-[12.5px] leading-[1.55] text-faint">
            {item.detail}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Notes() {
  return (
    <ol className="m-0 grid list-none grid-cols-2 gap-3 p-0 max-phone:grid-cols-1">
      {NOTES.map((note) => (
        <li
          className="rounded-[12px] border border-line bg-surface px-4 py-4"
          key={note.number}
        >
          <div className="mb-2 font-mono text-[10.5px] font-semibold tracking-[0.08em] text-accent">
            {note.number}
          </div>
          <h3 className="m-0 text-[14px] font-[650] tracking-[-0.01em]">
            {note.title}
          </h3>
          <p className="mt-1.5 mb-0 text-[13px] leading-[1.65] text-muted">
            {note.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function UsagePage() {
  return (
    <Page
      kind="指南"
      title="使用指南"
      description="从安装到渲染，用一份最短路径把 ui-kit 接入 React 或 Next.js 应用。下面的示例适用于 React 18+，并包含 Next.js App Router 的客户端边界与全局样式配置。"
      tags={["React 18+", "Next.js App Router", "TypeScript", "npm", "JSR"]}
    >
      <Section
        title="开始之前"
        description="组件包依赖 React 和 ReactDOM。组件发布为 seam-react，Hooks 发布为 seam-hooks；也可以从 JSR 使用 @seam/ui 与 @seam/hooks。"
      >
        <Requirements />

        <Callout title="npm 与 JSR 使用同一套 API">
          <p>
            npm 安装后直接导入 <InlineCode>seam-react</InlineCode> 和{" "}
            <InlineCode>seam-hooks</InlineCode>。JSR 安装后则导入{" "}
            <InlineCode>@seam/ui</InlineCode> 和{" "}
            <InlineCode>@seam/hooks</InlineCode>，组件和 Hooks 的 API 完全一致。
          </p>
        </Callout>
      </Section>

      <Section
        title="安装"
        description="选择项目正在使用的包管理器。安装组件包会自动安装 seam-hooks；React 与 ReactDOM 由你的应用提供，不会被重复打包。"
      >
        <InstallCommand />

        <BulletList
          items={[
            <>
              <InlineCode>seam-react</InlineCode>：Button、Input、
              Switch、Tabs、Dialog、Toast 与样式。
            </>,
            <>
              只使用无渲染逻辑时，可以单独安装{" "}
              <InlineCode>seam-hooks</InlineCode>
              ，它包含状态、异步、性能与浏览器能力 hooks。
            </>,
          ]}
        />
      </Section>

      <Section
        title="React 应用"
        description="在应用根部渲染 SeamStyles，并用 ToastProvider 包裹应用。应用自己的 CSS 放在入口之后，即可在不提高选择器权重的情况下覆盖主题 token。"
      >
        <CodeBlock code={REACT_ENTRY} label="src/main.tsx" />
        <CodeBlock code={REACT_APP} label="src/App.tsx" />

        <Callout title="Vite 与 Create React App 都适用">
          <p>
            示例使用 Vite 的入口写法；其他 React
            构建工具只需保留同样的导入顺序和 Provider 层级。组件库不要求配置
            PostCSS 或 Tailwind。
          </p>
        </Callout>
      </Section>

      <Section
        title="Next.js 应用"
        description="App Router 下，根布局渲染 SeamStyles 和 Provider，交互组件放在带“use client”的文件中。服务端组件仍可渲染客户端组件，但不能直接调用 React hooks。"
      >
        <CodeBlock code={NEXT_LAYOUT} label="app/layout.tsx" />
        <CodeBlock code={NEXT_PROVIDER} label="app/providers.tsx" />
        <CodeBlock
          code={NEXT_DIRECTIVES}
          label="app/components/save-button.tsx"
        />
        <CodeBlock
          code={NEXT_HOOKS}
          label="app/components/responsive-summary.tsx"
        />

        <Callout tone="warning" title="不要忘记客户端指令">
          <p>
            <InlineCode>&quot;use client&quot;</InlineCode>{" "}
            作用于当前文件和它导入的客户端依赖图。若把使用 state、effect 或
            ui-kit hooks 的代码写在不加指令的文件里，Next.js
            会按服务端组件处理并报错。
          </p>
        </Callout>
      </Section>

      <Section
        title="注意事项"
        description="接入通常只需要处理下面四类边界；其他样式细节可以直接查看自定义样式指南。"
      >
        <Notes />

        <Callout title="服务端渲染不是问题">
          <p>
            Next.js 的客户端组件仍会在服务端预渲染，然后于浏览器完成
            hydration。需要浏览器 API 的 hooks 应照常放在客户端组件中，并通过
            effect 或 hook 已提供的状态保护访问环境能力。
          </p>
        </Callout>

        <Callout tone="warning" title="严格 CSP 使用 nonce">
          <p>
            如果 Content Security Policy 禁止内联样式，把与请求关联的{" "}
            <InlineCode>nonce</InlineCode> 传给{" "}
            <InlineCode>
              &lt;SeamStyles nonce=&#123;nonce&#125; /&gt;
            </InlineCode>
            。
          </p>
        </Callout>
      </Section>

      <Section
        title="验证接入"
        description="构建和类型检查通过后，建议再确认下面几项。"
      >
        <CodeBlock
          code={`# 以 Next.js 项目为例
pnpm next build

# React + Vite 项目可运行
pnpm build
pnpm tsc --noEmit`}
          label="bash"
        />

        <BulletList
          items={[
            "页面已出现组件库样式，而不是只有无样式 HTML。",
            "点击 Toast 示例能出现提示，同时控制台没有 Provider 缺失错误。",
            "Next.js 构建没有 server/client component 边界错误。",
            "浅色和深色模式下文字、边框与焦点环仍然清晰可见。",
          ]}
        />

        <div className="flex flex-wrap gap-2.5 pt-1">
          <Link className={NEXT_STEPS_LINK} to="/components/button">
            浏览组件
          </Link>
          <Link className={NEXT_STEPS_LINK} to="/customizing">
            自定义样式
          </Link>
        </div>
      </Section>
    </Page>
  );
}
