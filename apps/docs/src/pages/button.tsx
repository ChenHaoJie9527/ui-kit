import { useEffect, useRef, useState } from "react";
import { Button } from "@ui-kit/ui";
import {
  BulletList,
  ButtonRow,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";

function VariantsDemo() {
  return (
    <ButtonRow>
      <Button>主要操作</Button>
      <Button variant="secondary">次要操作</Button>
      <Button variant="outline">描边</Button>
      <Button variant="ghost">幽灵</Button>
      <Button variant="danger">删除</Button>
    </ButtonRow>
  );
}

function SizesDemo() {
  return (
    <ButtonRow>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </ButtonRow>
  );
}

function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ButtonRow>
      <Button
        loading={loading}
        onClick={() => {
          if (loading) {
            return;
          }

          setLoading(true);
          timerRef.current = setTimeout(() => setLoading(false), 1400);
        }}
      >
        {loading ? "保存中" : "保存"}
      </Button>
      <Button variant="outline" disabled>
        不可用
      </Button>
      <Button variant="danger" loading>
        删除中
      </Button>
    </ButtonRow>
  );
}

function IconDemo() {
  return (
    <ButtonRow>
      <Button iconOnly aria-label="添加">
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </Button>
      <Button iconOnly variant="outline" aria-label="设置">
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <circle
            cx="10"
            cy="10"
            r="2.6"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d="M10 3v1.6M10 15.4V17M3 10h1.6M15.4 10H17M5.1 5.1l1.1 1.1M13.8 13.8l1.1 1.1M14.9 5.1l-1.1 1.1M6.2 13.8l-1.1 1.1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </Button>
      <Button size="sm" variant="secondary">
        带图标
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path
            d="M5 10h9M10.5 5.5 15 10l-4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </Button>
    </ButtonRow>
  );
}

export function ButtonPage() {
  return (
    <Page
      kind="组件"
      title="Button"
      description="最常用的操作入口。五种视觉变体、三种尺寸，加载态自动禁用并设置 aria-busy，其余原生 button 属性全部透传。"
      tags={["5 种变体", "3 种尺寸", "加载态", "原生属性透传"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Button } from "@ui-kit/ui";'} />
      </Section>

      <Section
        title="变体"
        description="primary 用于页面主操作，每屏尽量只出现一个；secondary 与 outline 用于次级操作；ghost 用于低权重的工具栏；danger 只用于破坏性操作。"
      >
        <Demo
          code={`<Button>主要操作</Button>
<Button variant="secondary">次要操作</Button>
<Button variant="outline">描边</Button>
<Button variant="ghost">幽灵</Button>
<Button variant="danger">删除</Button>`}
        >
          <VariantsDemo />
        </Demo>
      </Section>

      <Section title="尺寸" description="sm / md / lg 三种高度，默认 md。">
        <Demo
          code={`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
        >
          <SizesDemo />
        </Demo>
      </Section>

      <Section
        title="加载与禁用"
        description="loading 会同时设置 disabled 与 aria-busy，点击不会再触发。"
      >
        <Demo
          code={`<Button loading>保存中</Button>

<Button variant="outline" disabled>
  不可用
</Button>`}
        >
          <LoadingDemo />
        </Demo>
      </Section>

      <Section
        title="图标按钮"
        description="iconOnly 会变成正方形。只有图标时必须提供 aria-label，否则屏幕阅读器无法读出用途。"
      >
        <Demo
          code={`<Button iconOnly aria-label="添加">
  <PlusIcon />
</Button>`}
        >
          <IconDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "variant",
              type: '"primary" | "secondary" | "outline" | "ghost" | "danger"',
              defaultValue: '"primary"',
              description: "视觉层级。",
            },
            {
              name: "size",
              type: '"sm" | "md" | "lg"',
              defaultValue: '"md"',
              description: "按钮高度与内边距。",
            },
            {
              name: "loading",
              type: "boolean",
              defaultValue: "false",
              description: "展示加载指示器，并自动禁用按钮。",
            },
            {
              name: "iconOnly",
              type: "boolean",
              defaultValue: "false",
              description: "仅图标时使用正方形布局。",
            },
            {
              name: "type",
              type: '"button" | "submit" | "reset"',
              defaultValue: '"button"',
              description: "原生按钮类型，避免在表单里意外提交。",
            },
            {
              name: "disabled",
              type: "boolean",
              defaultValue: "false",
              description: "禁用按钮；loading 为 true 时同样处于禁用状态。",
            },
            {
              name: "...rest",
              type: "ButtonHTMLAttributes<HTMLButtonElement>",
              description:
                "其余原生属性（onClick、aria-*、data-* 等）直接透传。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "渲染为原生 <button>，键盘 Space / Enter 与焦点环由浏览器保证。",
            "loading 时保留按钮宽度并设置 aria-busy，避免布局跳动。",
            "iconOnly 必须搭配 aria-label；装饰性 SVG 需要 aria-hidden。",
          ]}
        />
        <Callout title="关于 type">
          组件默认 <code>type=&quot;button&quot;</code>
          。放在表单里且确实需要提交时，显式传{" "}
          <code>type=&quot;submit&quot;</code>。
        </Callout>
      </Section>
    </Page>
  );
}
