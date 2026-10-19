import { useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap, useLockBodyScroll, useMedia } from "@ui-kit/hooks";
import { Button } from "@ui-kit/ui";
import { navGroups, navItems, pageTitle } from "./nav";
import { NotFoundPage } from "./pages/not-found";
import { routeRenderers } from "./pages/registry";
import { routeHref, useRoute } from "./router";
import { THEME_MODES, useTheme, type ThemeMode } from "./theme";

const THEME_LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

const REPO_URL = "https://github.com/ChenHaoJie9527/ui-kit";

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M3.5 5.5h13M3.5 10h13M3.5 14.5h9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
        <circle cx="10" cy="10" r="3.4" fill="currentColor" />
        <path
          d="M10 2.4v1.7M10 15.9v1.7M2.4 10h1.7M15.9 10h1.7M4.6 4.6l1.2 1.2M14.2 14.2l1.2 1.2M15.4 4.6l-1.2 1.2M5.8 14.2l-1.2 1.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (mode === "dark") {
    return (
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
        <path
          d="M16.2 12.3A6.8 6.8 0 0 1 7.7 3.8a6.8 6.8 0 1 0 8.5 8.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10 3.6a6.4 6.4 0 0 1 0 12.8Z" fill="currentColor" />
    </svg>
  );
}

function matches(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

export function App() {
  const route = useRoute();
  const { mode, setMode } = useTheme();
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMedia("(max-width: 960px)");
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useLockBodyScroll(sidebarOpen && isMobile);

  useFocusTrap({
    active: sidebarOpen && isMobile,
    containerRef: sidebarRef,
    returnFocusRef: menuButtonRef,
  });

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return navGroups;
    }

    return navGroups.flatMap((group) => {
      const items = group.items.filter((item) =>
        matches(`${item.label} ${item.hint ?? ""} ${group.title}`, needle),
      );

      return items.length > 0 ? [{ title: group.title, items }] : [];
    });
  }, [query]);

  useEffect(() => {
    document.title =
      route === "overview"
        ? "ui-kit · React hooks 与组件库"
        : `${pageTitle(route)} · ui-kit`;
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const renderPage = routeRenderers[route];
  const activeIndex = navItems.findIndex((item) => item.path === route);
  const previous = activeIndex > 0 ? navItems[activeIndex - 1] : undefined;
  const next =
    activeIndex >= 0 && activeIndex < navItems.length - 1
      ? navItems[activeIndex + 1]
      : undefined;

  const closeSidebar = () => setSidebarOpen(false);

  const nextMode =
    THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length] ??
    "system";

  return (
    <div className="doc-shell">
      <a className="doc-skip-link" href="#doc-content">
        跳到正文
      </a>

      <header className="doc-topbar">
        <div className="doc-topbar__left">
          <Button
            ref={menuButtonRef}
            className="doc-menu-button"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={sidebarOpen ? "关闭导航" : "打开导航"}
            aria-expanded={sidebarOpen}
            aria-controls="doc-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <MenuIcon />
          </Button>

          <a
            className="doc-brand"
            href={routeHref("overview")}
            onClick={closeSidebar}
          >
            <span className="doc-brand__mark" aria-hidden="true">
              uk
            </span>
            <span className="doc-brand__name">ui-kit</span>
            <span className="doc-brand__badge">0.1</span>
          </a>
        </div>

        <nav className="doc-topnav" aria-label="主导航">
          <a
            href={routeHref("components/button")}
            data-active={route.startsWith("components/") ? "true" : undefined}
          >
            组件
          </a>
          <a
            href={routeHref("hooks/use-controllable-state")}
            data-active={route.startsWith("hooks/") ? "true" : undefined}
          >
            Hooks
          </a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>

        <div className="doc-topbar__right">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`切换主题，当前：${THEME_LABELS[mode]}`}
            onClick={() => setMode(nextMode)}
          >
            <ThemeIcon mode={mode} />
            <span className="doc-theme-text">{THEME_LABELS[mode]}</span>
          </Button>
        </div>
      </header>

      <aside
        ref={sidebarRef}
        id="doc-sidebar"
        className="doc-sidebar"
        data-open={sidebarOpen ? "true" : "false"}
        inert={isMobile && !sidebarOpen}
        aria-hidden={isMobile && !sidebarOpen ? true : undefined}
      >
        <div className="doc-sidebar__inner">
          <div className="doc-search">
            <svg
              className="doc-search__icon"
              viewBox="0 0 20 20"
              width="15"
              height="15"
              aria-hidden="true"
            >
              <circle
                cx="8.6"
                cy="8.6"
                r="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="m12.4 12.4 4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="doc-search__input"
              type="search"
              value={query}
              placeholder="搜索组件或 Hook"
              aria-label="搜索文档"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="doc-search__clear"
                aria-label="清空搜索"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            ) : null}
          </div>

          <nav className="doc-nav" aria-label="文档导航">
            {filteredGroups.map((group) => (
              <div className="doc-nav__group" key={group.title}>
                <p className="doc-nav__title">{group.title}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <a
                        className="doc-nav__link"
                        href={routeHref(item.path)}
                        aria-current={route === item.path ? "page" : undefined}
                        onClick={closeSidebar}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {filteredGroups.length === 0 ? (
              <p className="doc-nav__empty">没有匹配的条目。</p>
            ) : null}
          </nav>

          <div className="doc-sidebar__footer">
            <span>MIT License</span>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="doc-scrim"
          aria-label="关闭导航"
          onClick={closeSidebar}
        />
      ) : null}

      <main className="doc-main" id="doc-content" tabIndex={-1}>
        <div className="doc-main__inner" key={route}>
          {renderPage ? renderPage() : <NotFoundPage route={route} />}

          {previous || next ? (
            <nav className="doc-pagenav" aria-label="上一页与下一页">
              {previous ? (
                <a
                  className="doc-pagenav__prev"
                  href={routeHref(previous.path)}
                >
                  <span>上一页</span>
                  <strong>{previous.label}</strong>
                </a>
              ) : null}
              {next ? (
                <a className="doc-pagenav__next" href={routeHref(next.path)}>
                  <span>下一页</span>
                  <strong>{next.label}</strong>
                </a>
              ) : null}
            </nav>
          ) : null}
        </div>

        <footer className="doc-footer">
          <span>MIT License © ChenHaoJie9527</span>
          <span>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>{" "}
            · React 19 · TypeScript 7
          </span>
        </footer>
      </main>
    </div>
  );
}
