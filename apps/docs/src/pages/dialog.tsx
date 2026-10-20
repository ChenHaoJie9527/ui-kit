import { useId, useRef, useState } from "react";
import { Button, Dialog, Input } from "@chenhaojie9527/ui-kit";
import {
  BulletList,
  ButtonRow,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

function BasicDemo() {
  const [open, setOpen] = useState(false);

  return (
    <ButtonRow>
      <Button onClick={() => setOpen(true)}>打开对话框</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="确认发布"
        description="发布后文档站会立即更新，旧版本仍保留在历史记录里。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setOpen(false)}>确认发布</Button>
          </>
        }
      >
        <p className="m-0 text-sm leading-[1.65] text-muted">
          按 Tab 在对话框内循环，按 Esc 或点击遮罩关闭。
        </p>
      </Dialog>
    </ButtonRow>
  );
}

function FormDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailId = useId();

  return (
    <ButtonRow>
      <Button variant="outline" onClick={() => setOpen(true)}>
        编辑资料
      </Button>
      <Readout label="保存的名称" value={name || "—"} />
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="编辑资料"
        initialFocusRef={nameRef}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setOpen(false)}>保存</Button>
          </>
        }
      >
        <div className="flex max-w-[420px] flex-col gap-4">
          <div className="flex max-w-[380px] flex-col gap-1.5">
            <label
              className="text-[13px] font-semibold text-ink"
              htmlFor="dialog-name"
            >
              显示名称
            </label>
            <Input
              id="dialog-name"
              ref={nameRef}
              value={name}
              placeholder="输入名称"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex max-w-[380px] flex-col gap-1.5">
            <label
              className="text-[13px] font-semibold text-ink"
              htmlFor={emailId}
            >
              邮箱
            </label>
            <Input id={emailId} type="email" placeholder="you@example.com" />
          </div>
        </div>
      </Dialog>
    </ButtonRow>
  );
}

function PersistentDemo() {
  const [open, setOpen] = useState(false);

  return (
    <ButtonRow>
      <Button variant="danger" onClick={() => setOpen(true)}>
        删除项目
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="删除后无法恢复"
        description="该操作会移除所有构建产物与部署记录。"
        closeOnBackdropClick={false}
        closeOnEscape={false}
        showCloseButton={false}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              我再想想
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              确认删除
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm leading-[1.65] text-muted">
          这个对话框必须通过按钮明确选择，遮罩点击和 Esc 都被禁用。
        </p>
      </Dialog>
    </ButtonRow>
  );
}

export function DialogPage() {
  return (
    <Page
      kind="组件"
      title="Dialog"
      description="模态对话框。基于原生 dialog 与 showModal()，Esc、遮罩和顶层渲染交给浏览器；焦点陷阱、初始焦点与关闭后的焦点恢复由 useFocusTrap 补齐。"
      tags={["原生 dialog", "焦点陷阱", "焦点恢复", "body 滚动锁定"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Dialog } from "@chenhaojie9527/ui-kit";'} />
      </Section>

      <Section
        title="基础用法"
        description="open 与 onOpenChange 是完全受控的；标题、描述和底部操作区都是可选插槽。"
      >
        <Demo
          code={`const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="确认发布"
  description="发布后文档站会立即更新。"
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        取消
      </Button>
      <Button onClick={() => setOpen(false)}>确认发布</Button>
    </>
  }
>
  内容
</Dialog>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="表单对话框"
        description="initialFocusRef 让打开后的焦点落在第一个输入框，而不是关闭按钮。"
      >
        <Demo
          code={`const nameRef = useRef<HTMLInputElement>(null);

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="编辑资料"
  initialFocusRef={nameRef}
>
  <Input ref={nameRef} />
</Dialog>`}
        >
          <FormDemo />
        </Demo>
      </Section>

      <Section
        title="不可轻易关闭"
        description="破坏性操作可以关闭遮罩点击、Esc 和右上角关闭按钮，强制用户做出明确选择。"
      >
        <Demo
          code={`<Dialog
  open={open}
  onOpenChange={setOpen}
  closeOnBackdropClick={false}
  closeOnEscape={false}
  showCloseButton={false}
  title="删除后无法恢复"
>
  ...
</Dialog>`}
        >
          <PersistentDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "open",
              type: "boolean",
              required: true,
              description: "是否打开，完全受控。",
            },
            {
              name: "onOpenChange",
              type: "(open: boolean) => void",
              required: true,
              description: "请求打开 / 关闭时触发。",
            },
            {
              name: "title",
              type: "ReactNode",
              description: "标题，同时作为 aria-labelledby 的目标。",
            },
            {
              name: "description",
              type: "ReactNode",
              description: "副标题，关联到 aria-describedby。",
            },
            {
              name: "footer",
              type: "ReactNode",
              description: "底部操作区，通常放取消与确认按钮。",
            },
            {
              name: "initialFocusRef",
              type: "RefObject<HTMLElement | null>",
              description: "打开后优先聚焦的元素；默认聚焦第一个可聚焦元素。",
            },
            {
              name: "returnFocusRef",
              type: "RefObject<HTMLElement | null>",
              description: "关闭后恢复焦点的元素；默认恢复到打开前的活动元素。",
            },
            {
              name: "showCloseButton",
              type: "boolean",
              defaultValue: "true",
              description: "是否显示右上角关闭按钮。",
            },
            {
              name: "closeOnBackdropClick",
              type: "boolean",
              defaultValue: "true",
              description: "点击遮罩是否关闭。",
            },
            {
              name: "closeOnEscape",
              type: "boolean",
              defaultValue: "true",
              description: "按 Esc 是否关闭。",
            },
            {
              name: "closeLabel",
              type: "string",
              defaultValue: '"Close"',
              description: "关闭按钮的无障碍名称。",
            },
            {
              name: "aria-label",
              type: "string",
              description: "没有 title 时用于命名对话框。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "showModal() 让内容进入浏览器顶层，背景内容对读屏不可见。",
            "useFocusTrap 补上反向 Tab 循环、外部聚焦回收与关闭后的焦点恢复。",
            "嵌套对话框按栈处理，只有最上层响应键盘与 focusin。",
            "打开期间锁定 body 滚动，关闭后恢复原值；多个弹窗同时打开用引用计数。",
          ]}
        />
        <Callout title="为什么不用 focus-trap 库">
          原生 dialog 已经处理了大部分模态语义。缺少的只有反向循环与程序化聚焦，
          这两点用约 150 行代码就能补齐，不值得为此引入运行时依赖。
        </Callout>
      </Section>
    </Page>
  );
}
