import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  useControllableState,
  useDebouncedValue,
  useEventCallback,
  useVirtualList,
} from "../../packages/hooks/src";

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

function App() {
  return (
    <main>
      <header className="hero">
        <div className="badge">React 18 · TypeScript · 零依赖</div>
        <h1>ui-kit</h1>
        <p className="tagline">
          hooks 内核 + 组件库。逻辑可单测，组件只负责渲染与可访问性。
        </p>
        <div className="install">
          <span className="prompt">$</span> pnpm add @ui-kit/hooks
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
        Built by{" "}
        <a href="https://github.com/ChenHaoJie9527">ChenHaoJie9527</a> · ui-kit
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
