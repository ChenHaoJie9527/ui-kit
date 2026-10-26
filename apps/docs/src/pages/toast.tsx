import { useState } from "react";
import { Button, ToastStack, useToast, type ToastStatus } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Section,
} from "../components/docs";

function BasicDemo() {
  const { toasts, showToast, dismissToast } = useToast();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={() =>
          showToast({
            id: "publish",
            title: "发布成功",
            description: "文档站已在 3 秒内更新完成。",
            status: "success",
          })
        }
      >
        显示发布通知
      </Button>
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        placement="fixed"
        maxVisible={3}
      />
    </div>
  );
}

const statusOptions = [
  { status: "info", label: "Info" },
  { status: "loading", label: "Loading" },
  { status: "success", label: "Success" },
  { status: "error", label: "Error" },
] as const;

function StatusDemo() {
  const { toasts, showToast, dismissToast, clearToasts } = useToast();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statusOptions.map((option) => (
        <Button
          key={option.status}
          variant="outline"
          size="sm"
          onClick={() =>
            showToast({
              id: option.status,
              title: `示例 ${option.label}`,
              description: "相同 id 会更新现有通知并重置计时。",
              status: option.status as ToastStatus,
            })
          }
        >
          {option.label}
        </Button>
      ))}
      <Button variant="ghost" size="sm" onClick={clearToasts}>
        清空
      </Button>
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="top-right"
        placement="fixed"
        maxVisible={4}
      />
    </div>
  );
}

function InlineDemo() {
  const [toasts] = useState([
    {
      id: "inline",
      title: "局部挂载",
      description: "不遮挡页面其他内容，适合嵌入式面板。",
      status: "info" as ToastStatus,
      duration: 0,
    },
  ]);

  return (
    <ToastStack
      toasts={toasts}
      position="top-right"
      placement="static"
      portal={false}
    />
  );
}

const basicCode = [
  "const { toasts, showToast, dismissToast } = useToast();",
  "",
  '<Button onClick={() => showToast({ id: "publish", title: "发布成功" })}>',
  "  显示发布通知",
  "</Button>",
  "<ToastStack toasts={toasts} onDismiss={dismissToast} maxVisible={3} />",
].join("\n");

const statusCode = [
  "const { toasts, showToast, dismissToast, clearToasts } = useToast({ limit: 4 });",
  "",
  "<ToastStack",
  "  toasts={toasts}",
  "  onDismiss={dismissToast}",
  '  position="top-right"',
  "  maxVisible={4}",
  "/>",
].join("\n");

const inlineCode = [
  "<ToastStack",
  "  toasts={toasts}",
  '  position="top-right"',
  '  placement="static"',
  "  portal={false}",
  "/>",
].join("\n");

export function ToastPage() {
  return (
    <Page
      kind="组件"
      title="Toast"
      description="非模态通知队列。用状态 hook 管理生命周期，用 Stack 负责定位、进出场与辅助技术语义。"
      tags={["通知", "aria-live", "自动关闭", "Motion"]}
    >
      <Section title="引入">
        <CodeBlock
          code={'import { ToastStack, useToast } from "seam-react";'}
        />
      </Section>

      <Section
        title="基础用法"
        description="showToast 会把通知加入队列；相同 id 会更新现有项并重置自动关闭计时。"
      >
        <Demo code={basicCode}>
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="状态与队列"
        description="状态影响图标和强调色。limit 保留最新通知，避免长时间任务堆积成遮挡页面的列表。"
      >
        <Demo code={statusCode}>
          <StatusDemo />
        </Demo>
      </Section>

      <Section
        title="局部挂载"
        description="默认 fixed 定位并挂到 body；切换 placement=static 可保留在当前布局上下文中。"
      >
        <Demo code={inlineCode}>
          <InlineDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "useToast.initialToasts",
              type: "ToastInput[]",
              defaultValue: "[]",
              description:
                "初始化通知队列；输入会补齐 duration、createdAt 等字段。",
            },
            {
              name: "useToast.defaultDuration",
              type: "number",
              defaultValue: "4200",
              description:
                "未指定 duration 时的自动关闭毫秒数；0 或负数表示常驻。",
            },
            {
              name: "useToast.limit",
              type: "number",
              description: "队列最大数量，超限时保留最新通知。",
            },
            {
              name: "useToast 返回值",
              type: "toasts / showToast / updateToast / dismissToast / clearToasts",
              description: "状态队列与生命周期操作；showToast 返回通知 id。",
            },
            {
              name: "ToastStack.toasts",
              type: "Toast[]",
              description: "由 useToast 或调用方维护的通知数据。",
            },
            {
              name: "position",
              type: '六向位置，如 "bottom-right"',
              defaultValue: '"bottom-right"',
              description: "控制栈的固定定位角或局部布局方向。",
            },
            {
              name: "placement",
              type: '"fixed" | "absolute" | "static"',
              defaultValue: '"fixed"',
              description: "fixed 默认挂载到 body，static 则留在当前位置。",
            },
            {
              name: "portalRoot",
              type: "Element | null",
              description: "覆盖 fixed placement 的 Portal 宿主节点。",
            },
            {
              name: "maxVisible",
              type: "number",
              defaultValue: "4",
              description: "同时可见的通知数量；超过时只显示最新项。",
            },
            {
              name: "toast.duration",
              type: "number",
              description: "自动关闭毫秒数；0 或负数表示常驻。",
            },
            {
              name: "toast.dismissible",
              type: "boolean",
              defaultValue: "true",
              description: "是否显示关闭按钮并启用拖拽关闭。",
            },
            {
              name: "toast.action",
              type: "label / onClick",
              description: "在通知中提供键盘可达的操作按钮。",
            },
            {
              name: "renderToast",
              type: "(toast: Toast) => ReactNode",
              description: "完全替换默认内容；关闭按钮仍由 Stack 提供。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "Stack 是 aria-live=polite 的列表；状态变化和新增内容会按队列顺序播报。",
            "关闭和操作都是真实 button，并保留可见 focus-visible 样式。",
            "拖拽关闭是增强能力；键盘用户通过关闭按钮获得等价操作。",
            "reduced-motion 移除位移、缩放和加载旋转，只保留短暂透明度反馈。",
            "长标题和描述会换行；重要状态不应只靠颜色区分，应保留可读文本。",
          ]}
        />
        <Callout title="保持非模态" tone="warning">
          Toast
          不接管焦点，也不锁定滚动。需要用户确认、填写表单或阻止误触的流程应使用
          Dialog；Toast 只适合结果反馈和低风险提示。
        </Callout>
      </Section>
    </Page>
  );
}
