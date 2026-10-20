import { Button } from "seam-react";
import { useRef } from "react";
import { useToast } from "seam-react";
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

function VariantsDemo() {
  const { toast } = useToast();

  return (
    <ButtonRow>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "草稿已保存",
            description: "所有改动都已同步到本地。",
            variant: "info",
          })
        }
      >
        信息
      </Button>
      <Button
        onClick={() =>
          toast({
            title: "已发布",
            description: "文档站将在几秒内更新。",
            variant: "success",
          })
        }
      >
        成功
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "配额接近上限",
            description: "本月已使用 82% 的构建分钟数。",
            variant: "warning",
          })
        }
      >
        警告
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          toast({
            title: "部署失败",
            description: "构建日志里有一条未处理的类型错误。",
            variant: "danger",
          })
        }
      >
        错误
      </Button>
    </ButtonRow>
  );
}

function DurationDemo() {
  const { toast, dismissAll } = useToast();

  return (
    <ButtonRow>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "会在 2 秒后消失",
            duration: 2000,
          })
        }
      >
        短提示
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "需要手动关闭",
            description: "duration: 0 表示常驻。",
            duration: 0,
            variant: "warning",
          })
        }
      >
        常驻提示
      </Button>
      <Button variant="ghost" onClick={dismissAll}>
        清空全部
      </Button>
    </ButtonRow>
  );
}

function QueueDemo() {
  const { toast } = useToast();
  const counterRef = useRef(0);

  return (
    <ButtonRow>
      <Button
        variant="secondary"
        onClick={() => {
          counterRef.current += 1;
          toast({
            title: `任务 ${counterRef.current} 已完成`,
            description: "最多同时保留 4 条，超出时最旧的会被移除。",
          });
        }}
      >
        连续弹出
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          for (const name of ["lint", "typecheck", "test", "build"]) {
            toast({
              title: `${name} 通过`,
              variant: "success",
              duration: 3000,
            });
          }
        }}
      >
        一次弹出四条
      </Button>
    </ButtonRow>
  );
}

export function ToastPage() {
  return (
    <Page
      kind="组件"
      title="Toast"
      description="轻量通知。ToastProvider 负责队列、自动关闭、悬停与聚焦暂停、退出动画和 aria-live 区域；任意子组件用 useToast() 触发。"
      tags={["队列", "自动关闭", "悬停暂停", "aria-live"]}
    >
      <Section title="引入">
        <CodeBlock
          code={`import { ToastProvider, useToast } from "seam-react";

// 应用根部
<ToastProvider>
  <App />
</ToastProvider>;`}
        />
      </Section>

      <Section
        title="四种变体"
        description="variant 映射到左侧色条与语义：info、success、warning、danger。"
      >
        <Demo
          code={`const { toast } = useToast();

toast({
  title: "已发布",
  description: "文档站将在几秒内更新。",
  variant: "success",
});`}
        >
          <VariantsDemo />
        </Demo>
      </Section>

      <Section
        title="时长与关闭"
        description="duration 按毫秒设置；传 0 表示常驻。悬停或聚焦时暂停倒计时，移开后继续。"
      >
        <Demo
          code={`toast({ title: "2 秒后消失", duration: 2000 });
toast({ title: "需要手动关闭", duration: 0 });`}
        >
          <DurationDemo />
        </Demo>
      </Section>

      <Section
        title="队列"
        description="默认同屏最多 4 条，超出时最旧的会被移除；也可以一次触发多条。"
      >
        <Demo
          code={`for (const name of ["lint", "typecheck", "test", "build"]) {
  toast({ title: name + " 通过", variant: "success" });
}`}
        >
          <QueueDemo />
        </Demo>
      </Section>

      <Section title="useToast API">
        <PropsTable
          rows={[
            {
              name: "toast(options)",
              type: "(options: ToastOptions) => string",
              description: "弹出一条通知，返回 id。",
            },
            {
              name: "dismiss(id)",
              type: "(id: string) => void",
              description: "关闭指定通知，带退出动画。",
            },
            {
              name: "dismissAll()",
              type: "() => void",
              description: "关闭当前所有通知。",
            },
            {
              name: "options.title",
              type: "ReactNode",
              description: "通知标题。",
            },
            {
              name: "options.description",
              type: "ReactNode",
              description: "补充说明。",
            },
            {
              name: "options.variant",
              type: '"info" | "success" | "warning" | "danger"',
              defaultValue: '"info"',
              description: "视觉与语义变体。",
            },
            {
              name: "options.duration",
              type: "number",
              description: "自动关闭毫秒数，0 为常驻；默认取 Provider 配置。",
            },
          ]}
        />
      </Section>

      <Section title="Provider 配置">
        <PropsTable
          rows={[
            {
              name: "placement",
              type: '"top-right" | "top-center" | "bottom-right" | "bottom-center"',
              defaultValue: '"top-right"',
              description: "通知出现的位置。",
            },
            {
              name: "duration",
              type: "number",
              defaultValue: "4000",
              description: "默认自动关闭时间。",
            },
            {
              name: "maxToasts",
              type: "number",
              defaultValue: "4",
              description: "同屏最多保留的条数。",
            },
            {
              name: "label",
              type: "string",
              defaultValue: '"Notifications"',
              description: "通知区域的屏幕阅读器名称。",
            },
            {
              name: "closeLabel",
              type: "string",
              defaultValue: '"Close"',
              description: "关闭按钮的无障碍名称。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "通知容器是 section + aria-live=polite，新通知会被读屏播报而不打断当前朗读。",
            "每条通知在鼠标悬停或键盘聚焦时暂停自动关闭，避免用户来不及阅读。",
            "关闭按钮是原生 button，带 aria-label。",
            "动画在 prefers-reduced-motion 下自动关闭。",
          ]}
        />
        <Callout title="不要滥用" tone="warning">
          只把 Toast 用于非阻断的反馈。需要用户确认或输入时，用{" "}
          <InlineCode>Dialog</InlineCode>； 需要持续展示状态时，用页面内提示。
        </Callout>
      </Section>
    </Page>
  );
}
