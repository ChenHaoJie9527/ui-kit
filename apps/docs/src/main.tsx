import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  useControllableState,
  useDebouncedValue,
  useEventCallback,
  useVirtualList,
} from "@ui-kit/hooks";
import {
  Button,
  Dialog,
  Input,
  Switch,
  Tabs,
  ToastProvider,
  useToast,
} from "@ui-kit/ui";

function CounterDemo() {
  const [count, setCount] = useControllableState({ defaultValue: 0 });

  return (
    <div className="demo">
      <div className="counter-value">{count}</div>
      <div className="row">
        <button className="btn" onClick={() => setCount((n) => n - 1)}>
          − 1
        </button>
        <button className="btn" onClick={() => setCount((n) => n + 1)}>
          + 1
        </button>
        <button className="btn ghost" onClick={() => setCount(0)}>
          重置
        </button>
      </div>
    </div>
  );
}

function DebounceDemo() {
  const [value, setValue] = useState("");
  const debounced = useDebouncedValue(value, 400);

  return (
    <div className="demo">
      <input
        className="input"
        value={value}
        placeholder="试试快速输入…"
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="kv">
        <span>即时值</span>
        <code>{value || "—"}</code>
      </div>
      <div className="kv">
        <span>防抖后（400ms）</span>
        <code>{debounced || "—"}</code>
      </div>
    </div>
  );
}

const ROW_HEIGHT = 36;
const VIEWPORT = 288;
const TOTAL = 10000;

function VirtualDemo() {
  const [scrollTop, setScrollTop] = useState(0);
  const { start, end, totalHeight, offsetTop } = useVirtualList({
    count: TOTAL,
    itemHeight: ROW_HEIGHT,
    viewportHeight: VIEWPORT,
    scrollTop,
  });

  return (
    <div className="demo">
      <div
        className="viewport"
        style={{ height: VIEWPORT }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetTop}px)` }}>
            {Array.from({ length: end - start }, (_, i) => (
              <div key={start + i} className="row-item">
                第 {start + i + 1} 行 · 可滚动查看
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="kv">
        <span>实际渲染</span>
        <code>
          {end - start} / {TOTAL} 行
        </code>
      </div>
    </div>
  );
}

function EventCallbackDemo() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState("等待读取…");

  // 引用稳定，但 1 秒后读到的仍是最新 count。
  const report = useEventCallback(() => {
    setTimeout(() => setLog(`1 秒后读到：${count}`), 1000);
  });

  return (
    <div className="demo">
      <div className="row">
        <button className="btn" onClick={() => setCount((n) => n + 1)}>
          点击 +1
        </button>
        <button className="btn ghost" onClick={report}>
          1 秒后读取
        </button>
      </div>
      <div className="kv">
        <span>结果</span>
        <code>{log}</code>
      </div>
    </div>
  );
}

function ButtonDemo() {
  return (
    <div className="demo">
      <div className="component-row">
        <Button>主要操作</Button>
        <Button variant="secondary">次要</Button>
        <Button variant="outline">描边</Button>
        <Button variant="ghost">幽灵</Button>
        <Button variant="danger">删除</Button>
      </div>
      <div className="component-row">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button loading>保存中</Button>
      </div>
    </div>
  );
}

function InputDemo() {
  const [name, setName] = useState("ui-kit");

  return (
    <div className="demo">
      <label className="field" htmlFor="demo-project-name">
        <span>项目名称</span>
        <Input
          id="demo-project-name"
          value={name}
          placeholder="输入名称"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="field" htmlFor="demo-project-email">
        <span>邮箱（错误态）</span>
        <Input id="demo-project-email" defaultValue="not-an-email" invalid />
      </label>
      <div className="kv">
        <span>当前值</span>
        <code>{name || "—"}</code>
      </div>
    </div>
  );
}

function SwitchDemo() {
  const [enabled, setEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  return (
    <div className="demo">
      <Switch checked={enabled} onCheckedChange={setEnabled}>
        启用实验特性
      </Switch>
      <Switch checked={autoSave} onCheckedChange={setAutoSave}>
        自动保存
      </Switch>
      <div className="kv">
        <span>实验特性</span>
        <code>{enabled ? "开" : "关"}</code>
      </div>
    </div>
  );
}

function TabsDemo() {
  return (
    <Tabs defaultValue="overview" className="tabs-demo">
      <Tabs.List aria-label="组件说明">
        <Tabs.Trigger value="overview">概览</Tabs.Trigger>
        <Tabs.Trigger value="api">API</Tabs.Trigger>
        <Tabs.Trigger value="a11y">可访问性</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <p>受控与非受控共用一套 API，方向键可以循环切换。</p>
      </Tabs.Content>
      <Tabs.Content value="api">
        <p>组合式组件：Tabs、List、Trigger、Content。</p>
      </Tabs.Content>
      <Tabs.Content value="a11y">
        <p>
          自动生成 aria-controls / aria-labelledby，并维护 roving tabindex。
        </p>
      </Tabs.Content>
    </Tabs>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo">
      <div className="component-row">
        <Button onClick={() => setOpen(true)}>打开对话框</Button>
      </div>
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
        <p className="dialog-copy">
          对话框基于原生 &lt;dialog&gt;，焦点陷阱、Esc
          关闭和遮罩都由浏览器处理。
        </p>
      </Dialog>
    </div>
  );
}

function ToastDemo() {
  const { toast, dismissAll } = useToast();

  return (
    <div className="demo">
      <div className="component-row">
        <Button
          onClick={() =>
            toast({
              title: "已保存",
              description: "改动已同步到本地。",
              variant: "success",
            })
          }
        >
          成功提示
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({
              title: "部署进行中",
              description: "预计 2 分钟完成。",
              variant: "info",
            })
          }
        >
          信息提示
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            toast({
              title: "部署失败",
              description: "请检查构建日志。",
              variant: "danger",
              duration: 0,
            })
          }
        >
          常驻错误
        </Button>
      </div>
      <div className="component-row">
        <Button variant="ghost" size="sm" onClick={dismissAll}>
          清空提示
        </Button>
        <span className="hint">错误提示默认常驻，悬停可暂停倒计时。</span>
      </div>
    </div>
  );
}

const hooks = [
  {
    name: "useControllableState",
    desc: "统一受控与非受控状态，组件库的基础积木。",
    demo: <CounterDemo />,
    code: `const [count, setCount] = useControllableState({
  defaultValue: 0,
  onChange: (v) => console.log(v),
});

setCount((n) => n + 1);`,
  },
  {
    name: "useDebouncedValue",
    desc: "高频输入延迟更新，避免每敲一个字就发请求。",
    demo: <DebounceDemo />,
    code: `const [value, setValue] = useState("");
const debounced = useDebouncedValue(value, 400);

useEffect(() => {
  if (debounced) search(debounced);
}, [debounced]);`,
  },
  {
    name: "useVirtualList",
    desc: "一万行只渲染可视区域，滚动时按区间计算。",
    demo: <VirtualDemo />,
    code: `const { start, end, totalHeight, offsetTop } = useVirtualList({
  count: 10000,
  itemHeight: 36,
  viewportHeight: 288,
  scrollTop,
});`,
  },
  {
    name: "useEventCallback",
    desc: "回调引用恒定，但内部始终拿到最新的 props 与 state。",
    demo: <EventCallbackDemo />,
    code: `const report = useEventCallback(() => {
  setTimeout(() => reportLatest(count), 1000);
});`,
  },
];

const components = [
  {
    name: "Button",
    desc: "5 种变体、3 种尺寸；loading 时自动禁用并标记 aria-busy。",
    demo: <ButtonDemo />,
    code: `<Button variant="primary" size="md">保存</Button>
<Button variant="danger" loading>删除中</Button>`,
  },
  {
    name: "Input",
    desc: "透传原生输入属性，invalid 映射到 aria-invalid。",
    demo: <InputDemo />,
    code: `<Input value={name} onChange={(e) => setName(e.target.value)} />
<Input invalid defaultValue="not-an-email" />`,
  },
  {
    name: "Switch",
    desc: "原生 checkbox 承载语义，受控与非受控写法一致。",
    demo: <SwitchDemo />,
    code: `<Switch checked={enabled} onCheckedChange={setEnabled}>
  启用实验特性
</Switch>`,
  },
  {
    name: "Tabs",
    desc: "roving tabindex、方向键循环与完整的 ARIA 关联。",
    demo: <TabsDemo />,
    code: `<Tabs defaultValue="overview">
  <Tabs.List aria-label="说明">
    <Tabs.Trigger value="overview">概览</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
</Tabs>`,
  },
  {
    name: "Dialog",
    desc: "基于原生 <dialog>，自带焦点陷阱、Esc 与遮罩关闭。",
    demo: <DialogDemo />,
    code: `<Dialog
  open={open}
  onOpenChange={setOpen}
  title="确认发布"
  footer={<Button onClick={close}>确认</Button>}
>
  内容
</Dialog>`,
  },
  {
    name: "Toast",
    desc: "队列、自动关闭、悬停暂停与 aria-live 通知区域。",
    demo: <ToastDemo />,
    code: `const { toast } = useToast();

toast({
  title: "已保存",
  description: "改动已同步到本地。",
  variant: "success",
});`,
  },
];

function AppContent() {
  return (
    <main>
      <header className="hero">
        <div className="badge">React 19 · TypeScript 7 · Vite 7</div>
        <h1>ui-kit</h1>
        <p className="tagline">
          hooks 内核 + 组件库。逻辑可单测，组件只负责渲染与可访问性。
        </p>
        <div className="install">
          <span className="prompt">$</span> pnpm add @ui-kit/ui
        </div>
        <div className="links">
          <a href="https://github.com/ChenHaoJie9527/ui-kit">GitHub</a>
          <span>·</span>
          <a href="https://github.com/ChenHaoJie9527/ui-kit#readme">README</a>
        </div>
      </header>

      <section className="grid">
        {hooks.map((h) => (
          <article className="card" key={h.name}>
            <h2>{h.name}</h2>
            <p className="desc">{h.desc}</p>
            {h.demo}
            <pre>
              <code>{h.code}</code>
            </pre>
          </article>
        ))}
      </section>

      <h2 className="section-title">组件</h2>
      <section className="grid">
        {components.map((component) => (
          <article className="card" key={component.name}>
            <h2>{component.name}</h2>
            <p className="desc">{component.desc}</p>
            {component.demo}
            <pre>
              <code>{component.code}</code>
            </pre>
          </article>
        ))}
      </section>

      <section className="notes">
        <h2>设计原则</h2>
        <ul>
          <li>逻辑与渲染分离：hooks 可单测，组件只关心结构与可访问性。</li>
          <li>受控/非受控统一：所有交互组件共享同一套状态语义。</li>
          <li>性能可验证：虚拟滚动与防抖都有对应的测试与基准。</li>
          <li>可发布：ESM + CJS 双产物、类型声明、tree-shaking 友好。</li>
        </ul>
      </section>

      <footer>
        Built by <a href="https://github.com/ChenHaoJie9527">ChenHaoJie9527</a>{" "}
        · ui-kit
      </footer>
    </main>
  );
}

function App() {
  return (
    <ToastProvider placement="top-right">
      <AppContent />
    </ToastProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
