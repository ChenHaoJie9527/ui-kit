import { useCopyToClipboard } from "@ui-kit/hooks";
import { componentMetas } from "../content/components";
import { hookGroups } from "../content/hooks";
import { routeHref } from "../router";

const DESIGN_PRINCIPLES = [
  {
    title: "逻辑与渲染分开",
    body: "hooks 负责状态、副作用与边界条件，组件只负责结构和可访问性。两者都能独立测试。",
  },
  {
    title: "受控与非受控同构",
    body: "所有交互组件共享 useControllableState，传 value 就是受控，传 defaultValue 就是非受控。",
  },
  {
    title: "优先使用平台能力",
    body: "dialog、checkbox、details 这些原生元素已经解决了大量语义问题，不重复造轮子。",
  },
  {
    title: "样式即变量",
    body: "颜色、间距、圆角、阴影全部是 CSS 变量，主题覆盖不需要提高选择器权重。",
  },
];

export function OverviewPage() {
  const [state, copy] = useCopyToClipboard();
  const command = "pnpm add @ui-kit/ui";
  const copied = state.copied && state.value === command;

  return (
    <article className="doc-page doc-overview">
      <header className="doc-hero">
        <p className="doc-eyebrow">React hooks + 组件库</p>
        <h1 className="doc-hero__title">
          把状态语义
          <span>做成基础设施</span>
        </h1>
        <p className="doc-lede">
          ui-kit 把受控状态、异步竞态、焦点管理、虚拟滚动这些通用难题抽成
          可单测的 hooks，再让组件只负责结构与可访问性。
        </p>

        <div className="doc-hero__actions">
          <a className="doc-link-button" href={routeHref("components/button")}>
            浏览组件
          </a>
          <a
            className="doc-link-button doc-link-button--ghost"
            href={routeHref("hooks/use-media")}
          >
            Hooks 参考
          </a>
        </div>

        <button
          type="button"
          className="doc-install"
          onClick={() => {
            void copy(command);
          }}
        >
          <span className="doc-install__prompt">$</span>
          <code>{command}</code>
          <span className="doc-install__action">
            {copied ? "已复制" : "复制"}
          </span>
        </button>
      </header>

      <dl className="doc-stats">
        <div>
          <dt>组件</dt>
          <dd>{componentMetas.length}</dd>
        </div>
        <div>
          <dt>Hooks</dt>
          <dd>
            {hookGroups.reduce((sum, group) => sum + group.items.length, 0)}
          </dd>
        </div>
        <div>
          <dt>测试</dt>
          <dd>132</dd>
        </div>
        <div>
          <dt>运行时依赖</dt>
          <dd>0</dd>
        </div>
      </dl>

      <section className="doc-home-section">
        <div className="doc-home-heading">
          <h2>组件</h2>
          <a href={routeHref("components/button")}>查看全部</a>
        </div>
        <div className="doc-tiles">
          {componentMetas.map((meta) => (
            <a className="doc-tile" href={routeHref(meta.path)} key={meta.path}>
              <span className="doc-tile__name">{meta.name}</span>
              <span className="doc-tile__summary">{meta.summary}</span>
              <span className="doc-tile__arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="doc-home-section">
        <div className="doc-home-heading">
          <h2>Hooks</h2>
          <a href={routeHref("hooks/use-controllable-state")}>查看全部</a>
        </div>
        <div className="doc-hook-groups">
          {hookGroups.map((group) => (
            <div className="doc-hook-group" key={group.title}>
              <p className="doc-hook-group__title">{group.title}</p>
              <ul>
                {group.items.map((doc) => (
                  <li key={doc.path}>
                    <a href={routeHref(doc.path)}>{doc.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-home-section">
        <h2>设计原则</h2>
        <div className="doc-principles">
          {DESIGN_PRINCIPLES.map((principle) => (
            <article key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
