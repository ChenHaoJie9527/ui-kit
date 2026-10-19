import { Link, useLocation } from "react-router";

export function NotFoundPage() {
  const location = useLocation();

  return (
    <article>
      <header className="border-b border-line pb-[22px]">
        <p className="mb-2.5 font-mono text-[11.5px] font-medium tracking-[0.1em] text-accent uppercase">
          404
        </p>
        <h1 className="m-0 text-[clamp(32px,4vw,42px)] leading-[1.1] font-bold tracking-[-0.035em]">
          没有这个页面
        </h1>
        <p className="mt-3.5 max-w-[70ch] text-base leading-[1.7] text-muted">
          找不到{" "}
          <code className="rounded-[5px] border border-line bg-surface-2 px-[5px] py-px text-[0.88em]">
            {location.pathname}
          </code>
          。可能是链接过期，或者这个组件还没写文档。
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-transparent bg-accent px-[18px] text-sm font-semibold text-white no-underline transition-colors hover:bg-accent-strong hover:no-underline"
          to="/"
        >
          回到总览
        </Link>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-line-strong bg-transparent px-[18px] text-sm font-semibold text-ink no-underline transition-colors hover:bg-surface-2 hover:no-underline"
          to="/components/button"
        >
          浏览组件
        </Link>
      </div>
    </article>
  );
}
