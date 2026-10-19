import { routeHref } from "../router";

export function NotFoundPage({ route }: { route: string }) {
  return (
    <article className="doc-page">
      <header className="doc-page__header">
        <p className="doc-eyebrow">404</p>
        <h1 className="doc-title">没有这个页面</h1>
        <p className="doc-lede">
          找不到 <code className="doc-inline-code">{route}</code>
          。可能是链接过期，或者这个组件还没写文档。
        </p>
      </header>
      <div className="doc-link-row">
        <a className="doc-link-button" href={routeHref("overview")}>
          回到总览
        </a>
        <a
          className="doc-link-button doc-link-button--ghost"
          href={routeHref("components/button")}
        >
          浏览组件
        </a>
      </div>
    </article>
  );
}
