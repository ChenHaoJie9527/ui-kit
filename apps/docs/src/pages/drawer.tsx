import { useRef, useState } from "react";
import { Button, CheckBox, Drawer, type DrawerSize } from "seam-react";
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

const filters = [
  { value: "active", label: "仅显示进行中" },
  { value: "archived", label: "包含已归档" },
  { value: "mine", label: "只看我负责的" },
];

function BasicDemo() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(["active"]);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggle = (value: string) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <ButtonRow>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger>
          <Button>打开筛选</Button>
        </Drawer.Trigger>
        <Drawer.Content initialFocusRef={searchRef}>
          <Drawer.Header>
            <Drawer.Title>筛选条件</Drawer.Title>
            <Drawer.Description>
              打开后焦点落在搜索框，关闭后回到触发按钮。
            </Drawer.Description>
            <Drawer.Close>
              <Button variant="ghost" size="sm" iconOnly aria-label="关闭">
                ×
              </Button>
            </Drawer.Close>
          </Drawer.Header>
          <Drawer.Body>
            <div className="flex flex-col gap-4">
              <input
                ref={searchRef}
                className="h-9 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                placeholder="搜索筛选条件"
                aria-label="搜索筛选条件"
              />
              <div className="flex flex-col gap-3">
                {filters.map((filter) => (
                  <CheckBox
                    key={filter.value}
                    checked={selected.includes(filter.value)}
                    onCheckedChange={() => toggle(filter.value)}
                  >
                    {filter.label}
                  </CheckBox>
                ))}
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close>
              <Button variant="ghost">取消</Button>
            </Drawer.Close>
            <Drawer.Close>
              <Button>应用</Button>
            </Drawer.Close>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Root>
      <Readout label="已选条件" value={selected.length} />
    </ButtonRow>
  );
}

function LeftDemo() {
  const [open, setOpen] = useState(false);

  return (
    <ButtonRow>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger>
          <Button variant="outline">打开导航</Button>
        </Drawer.Trigger>
        <Drawer.Content side="left" size="sm">
          <Drawer.Header>
            <Drawer.Title>文档导航</Drawer.Title>
            <Drawer.Close>
              <Button variant="ghost" size="sm" iconOnly aria-label="关闭导航">
                ×
              </Button>
            </Drawer.Close>
          </Drawer.Header>
          <Drawer.Body>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {["总览", "使用指南", "自定义样式", "组件", "Hooks"].map(
                (item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className="w-full rounded-[10px] border-0 bg-transparent px-3 py-2 text-left text-[13px] text-ink hover:bg-surface-2"
                      onClick={() => setOpen(false)}
                    >
                      {item}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </ButtonRow>
  );
}

const sizes = ["sm", "md", "lg"] as const satisfies readonly DrawerSize[];

function SizesDemo() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<DrawerSize>("md");

  return (
    <ButtonRow>
      {sizes.map((value) => (
        <Button
          key={value}
          variant="outline"
          onClick={() => {
            setSize(value);
            setOpen(true);
          }}
        >
          {value}
        </Button>
      ))}
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Content size={size}>
          <Drawer.Header>
            <Drawer.Title>{size} 抽屉</Drawer.Title>
            <Drawer.Description>
              面板宽度分别是 18 / 24 / 32rem，窄屏下不会超过 100vw。
            </Drawer.Description>
            <Drawer.Close>
              <Button variant="ghost" size="sm" iconOnly aria-label="关闭">
                ×
              </Button>
            </Drawer.Close>
          </Drawer.Header>
          <Drawer.Body>
            <p className="m-0 text-sm leading-[1.65] text-muted">
              给面板加类名并覆盖 --uk-drawer-width，就能在组件外调整宽度。
            </p>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </ButtonRow>
  );
}

function ProtectedDemo() {
  const [open, setOpen] = useState(false);

  return (
    <ButtonRow>
      <Button variant="danger" onClick={() => setOpen(true)}>
        删除前确认
      </Button>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Content
          closeOnEscape={false}
          closeOnBackdropClick={false}
          size="sm"
        >
          <Drawer.Header>
            <Drawer.Title>删除项目？</Drawer.Title>
            <Drawer.Description>
              这个抽屉不会响应 Esc 或点击遮罩，必须选择下面的操作。
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>
            <p className="m-0 text-sm leading-[1.65] text-muted">
              删除后无法恢复，相关部署与日志会一并清理。
            </p>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close>
              <Button variant="ghost">取消</Button>
            </Drawer.Close>
            <Drawer.Close>
              <Button variant="danger">确认删除</Button>
            </Drawer.Close>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Root>
    </ButtonRow>
  );
}

export function DrawerPage() {
  return (
    <Page
      kind="组件"
      title="Drawer"
      description="从视口边缘滑入的模态抽屉。原生 dialog 承载模态语义，面板从指定一侧弹入，打开时锁定页面滚动并在关闭后把焦点还给触发元素。"
      tags={["左 / 右滑入", "组合式 API", "焦点管理", "Motion"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Drawer } from "seam-react";'} />
      </Section>

      <Section
        title="基础用法"
        description="Root / Trigger / Content 与 Dialog 同名同语义；Content 默认从右侧滑入。打开后优先聚焦 initialFocusRef。"
      >
        <Demo
          code={`<Drawer.Root open={open} onOpenChange={setOpen}>
  <Drawer.Trigger>
    <Button>打开筛选</Button>
  </Drawer.Trigger>
  <Drawer.Content initialFocusRef={searchRef}>
    <Drawer.Header>
      <Drawer.Title>筛选条件</Drawer.Title>
      <Drawer.Description>选择要应用的过滤条件。</Drawer.Description>
      <Drawer.Close>
        <Button variant="ghost" size="sm" iconOnly aria-label="关闭">
          ×
        </Button>
      </Drawer.Close>
    </Drawer.Header>
    <Drawer.Body>{/* 搜索框与选项 */}</Drawer.Body>
    <Drawer.Footer>
      <Drawer.Close>
        <Button variant="ghost">取消</Button>
      </Drawer.Close>
      <Drawer.Close>
        <Button>应用</Button>
      </Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="从左滑入"
        description="side 控制面板贴住视口哪一侧，滑入与滑出使用同一条路径。"
      >
        <Demo
          code={`<Drawer.Content side="left" size="sm">
  <Drawer.Header>
    <Drawer.Title>文档导航</Drawer.Title>
    <Drawer.Close>
      <Button variant="ghost" size="sm" iconOnly aria-label="关闭导航">
        ×
      </Button>
    </Drawer.Close>
  </Drawer.Header>
  <Drawer.Body>{/* 导航项 */}</Drawer.Body>
</Drawer.Content>`}
        >
          <LeftDemo />
        </Demo>
      </Section>

      <Section
        title="尺寸"
        description="sm / md / lg 对应 18 / 24 / 32rem；面板宽度始终不超过 100vw，内容区独立滚动。"
      >
        <Demo
          code={`<Drawer.Content size={size}>
  <Drawer.Header>
    <Drawer.Title>抽屉宽度</Drawer.Title>
  </Drawer.Header>
  <Drawer.Body>…</Drawer.Body>
</Drawer.Content>`}
        >
          <SizesDemo />
        </Demo>
      </Section>

      <Section
        title="受保护的关闭"
        description="需要确认的操作可以关闭 Esc 与遮罩关闭，此时必须保留一个显式的关闭控件。"
      >
        <Demo
          code={`<Drawer.Content
  closeOnEscape={false}
  closeOnBackdropClick={false}
  size="sm"
>
  <Drawer.Header>
    <Drawer.Title>删除项目？</Drawer.Title>
    <Drawer.Description>必须选择下面的操作才能继续。</Drawer.Description>
  </Drawer.Header>
  <Drawer.Body>删除后无法恢复。</Drawer.Body>
  <Drawer.Footer>
    <Drawer.Close>
      <Button variant="ghost">取消</Button>
    </Drawer.Close>
    <Drawer.Close>
      <Button variant="danger">确认删除</Button>
    </Drawer.Close>
  </Drawer.Footer>
</Drawer.Content>`}
        >
          <ProtectedDemo />
        </Demo>
        <Callout tone="warning" title="受保护关闭必须提供显式出口">
          closeOnEscape 与 closeOnBackdropClick 同时关闭时，用户只能通过你提供的
          Drawer.Close 或按钮离开，别忘了保留一个清楚的取消/关闭入口。
        </Callout>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "open",
              type: "boolean",
              description:
                "Drawer.Root 的受控打开状态，配合 onOpenChange 使用。",
            },
            {
              name: "defaultOpen",
              type: "boolean",
              defaultValue: "false",
              description: "Drawer.Root 非受控模式下的初始状态。",
            },
            {
              name: "side",
              type: '"left" | "right"',
              defaultValue: '"right"',
              description: "面板贴住视口的一侧，也决定滑入/滑出方向。",
            },
            {
              name: "size",
              type: '"sm" | "md" | "lg"',
              defaultValue: '"md"',
              description: "面板宽度 18 / 24 / 32rem，窄屏下自动收敛到 100vw。",
            },
            {
              name: "closeOnBackdropClick",
              type: "boolean",
              defaultValue: "true",
              description: "点击面板以外的遮罩区域是否关闭。",
            },
            {
              name: "closeOnEscape",
              type: "boolean",
              defaultValue: "true",
              description:
                "按 Esc 是否关闭；关闭时会阻止原生 dialog 自行退出。",
            },
            {
              name: "initialFocusRef",
              type: "RefObject<HTMLElement | null>",
              description: "打开后优先聚焦的元素；不传则聚焦第一个可聚焦元素。",
            },
            {
              name: "returnFocusRef",
              type: "RefObject<HTMLElement | null>",
              description: "关闭后恢复焦点的元素；默认恢复到打开前的活动元素。",
            },
            {
              name: "aria-label",
              type: "string",
              description:
                "没有 Drawer.Title 时提供可访问名称；有标题时自动关联 aria-labelledby。",
            },
            {
              name: "className",
              type: "string",
              description: "面板的额外类名。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "使用原生 dialog + showModal()，进入浏览器 top layer，带 aria-modal 语义与原生 ::backdrop。",
            "Drawer.Title 与 Drawer.Description 自动生成 aria-labelledby / aria-describedby；没有标题时用 aria-label。",
            "打开后焦点进入面板，Tab 在面板内循环；关闭后回到触发元素，退出动画期间面板 inert，不能误操作。",
            "打开时锁定 body 滚动，内容区独立滚动并包含 overscroll；小屏上面板宽度不超过 100vw。",
            "closeOnEscape=false 会阻止原生 Esc 关闭并保持 dialog 打开；只关闭 closeOnBackdropClick 时，原生 light dismiss 也同步退化为仅响应 Esc。",
            "prefers-reduced-motion 下只做透明度切换，没有位移；prefers-reduced-transparency 下关闭遮罩模糊。",
          ]}
        />
      </Section>
    </Page>
  );
}
