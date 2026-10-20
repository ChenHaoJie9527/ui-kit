import { Link } from "react-router";
import { useCopyToClipboard } from "@seam/hooks";
import { componentMetas } from "../content/components";
import { hookGroups } from "../content/hooks";

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

const LINK_BUTTON =
  "inline-flex h-10 items-center justify-center rounded-[10px] border border-transparent bg-accent px-[18px] text-sm font-semibold text-white no-underline transition-colors hover:bg-accent-strong hover:no-underline";

const LINK_BUTTON_GHOST =
  "inline-flex h-10 items-center justify-center rounded-[10px] border border-line-strong bg-transparent px-[18px] text-sm font-semibold text-ink no-underline transition-colors hover:bg-surface-2 hover:no-underline";

const SECTION = "mt-[46px]";

const SECTION_HEADING = "m-0 text-[22px] tracking-[-0.02em]";

const HOOK_GROUP_TITLE =
  "mb-1.5 text-[10.5px] font-[650] tracking-[0.09em] text-faint uppercase";

export function OverviewPage() {
  const [state, copy] = useCopyToClipboard();
  const command = "pnpm add jsr:@seam/ui";
  const copied = state.copied && state.value === command;

  return (
    <article>
      <header className="pt-3.5 pb-1.5">
        <p className="mb-2.5 font-mono text-[11.5px] font-medium tracking-[0.1em] text-accent uppercase">
          React hooks + 组件库
        </p>
        <h1 className="mt-3 mb-0 text-[clamp(38px,5.4vw,56px)] leading-[1.04] font-bold tracking-[-0.045em]">
          把状态语义
          <span className="block text-accent">做成基础设施</span>
        </h1>
        <p className="mt-3.5 max-w-[70ch] text-base leading-[1.7] text-muted">
          ui-kit 把受控状态、异步竞态、焦点管理、虚拟滚动这些通用难题抽成
          可单测的 hooks，再让组件只负责结构与可访问性。
        </p>

        <div className="mt-[26px] mb-3.5 flex flex-wrap gap-2.5">
          <Link className={LINK_BUTTON} to="/components/button">
            浏览组件
          </Link>
          <Link className={LINK_BUTTON_GHOST} to="/hooks/use-media">
            Hooks 参考
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 font-mono text-[12.5px] text-ink transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={() => {
            void copy(command);
          }}
        >
          <span className="font-bold text-accent">$</span>
          <code>{command}</code>
          <span className="border-l border-line pl-2.5 text-[11.5px] text-muted">
            {copied ? "已复制" : "复制"}
          </span>
        </button>
      </header>

      <dl className="mt-10 grid grid-cols-4 border-t border-b border-line py-5 max-phone:grid-cols-2 max-phone:gap-y-[18px] [&>div]:border-l [&>div]:border-line [&>div]:px-5 [&>div:first-child]:border-l-0 [&>div:first-child]:pl-0 max-phone:[&>div:nth-child(3)]:border-l-0 max-phone:[&>div:nth-child(3)]:pl-0">
        <div>
          <dt className="text-xs text-muted">组件</dt>
          <dd className="mt-[3px] text-[26px] leading-[1.2] font-bold tracking-[-0.03em]">
            {componentMetas.length}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Hooks</dt>
          <dd className="mt-[3px] text-[26px] leading-[1.2] font-bold tracking-[-0.03em]">
            {hookGroups.reduce((sum, group) => sum + group.items.length, 0)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">测试</dt>
          <dd className="mt-[3px] text-[26px] leading-[1.2] font-bold tracking-[-0.03em]">
            139
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">运行时依赖</dt>
          <dd className="mt-[3px] text-[26px] leading-[1.2] font-bold tracking-[-0.03em]">
            0
          </dd>
        </div>
      </dl>

      <section className={SECTION}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={SECTION_HEADING}>组件</h2>
          <Link
            className="text-[13px] no-underline hover:underline"
            to="/components/button"
          >
            查看全部
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 max-phone:grid-cols-1">
          {componentMetas.map((meta) => (
            <Link
              className="relative flex flex-col gap-[5px] rounded-[13px] border border-line bg-surface px-[18px] py-[17px] text-ink no-underline transition-[border-color,transform] hover:-translate-y-px hover:border-accent hover:no-underline"
              to={`/${meta.path}`}
              key={meta.path}
            >
              <span className="font-[650]">{meta.name}</span>
              <span className="pr-5 text-[13px] leading-[1.55] text-muted">
                {meta.summary}
              </span>
              <span
                className="absolute top-4 right-4 text-faint"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={SECTION}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={SECTION_HEADING}>Hooks</h2>
          <Link
            className="text-[13px] no-underline hover:underline"
            to="/hooks/use-controllable-state"
          >
            查看全部
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-7 gap-y-[22px] max-phone:grid-cols-1">
          {hookGroups.map((group) => (
            <div key={group.title}>
              <p className={HOOK_GROUP_TITLE}>{group.title}</p>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {group.items.map((doc) => (
                  <li key={doc.path}>
                    <Link
                      className="font-mono text-[12.5px] text-muted no-underline hover:text-accent"
                      to={`/${doc.path}`}
                    >
                      {doc.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION}>
        <h2 className={SECTION_HEADING}>设计原则</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 max-phone:grid-cols-1">
          {DESIGN_PRINCIPLES.map((principle) => (
            <article
              className="rounded-[13px] border border-line bg-surface px-[18px] py-[17px]"
              key={principle.title}
            >
              <h3 className="mt-0 mb-[5px] text-[14.5px] tracking-[-0.01em]">
                {principle.title}
              </h3>
              <p className="m-0 text-[13px] leading-[1.6] text-muted">
                {principle.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
