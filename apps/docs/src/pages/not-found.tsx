import { Link, useLocation } from "react-router";

export function NotFoundPage() {
  const location = useLocation();

  return (
    <article className="doc-page">
      <header className="doc-page__header">
        <p className="doc-eyebrow">404</p>
        <h1 className="doc-title">没有这个页面</h1>
        <p className="doc-lede">
          找不到 <code className="doc-inline-code">{location.pathname}</code>
          。可能是链接过期，或者这个组件还没写文档。
        </p>
      </header>
      <div className="doc-link-row">
        <Link className="doc-link-button" to="/">
          回到总览
        </Link>
        <Link
          className="doc-link-button doc-link-button--ghost"
          to="/components/button"
        >
          浏览组件
        </Link>
      </div>
    </article>
  );
}
