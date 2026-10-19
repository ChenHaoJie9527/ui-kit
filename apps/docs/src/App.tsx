import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router";
import {
  useFocusTrap,
  useLockBodyScroll,
  useMedia,
} from "@chenhaojie9527/ui-kit-hooks";
import { Button } from "@chenhaojie9527/ui-kit";
import {
  navGroups,
  navItems,
  navItemByPath,
  routeKeyFromPathname,
  toRoute,
} from "./nav";
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

/**
 * 文档站外壳：顶栏、可搜索的侧边栏、内容区与上一页/下一页。
 *
 * 路由由 react-router 的 HashRouter 提供，页面内容通过 <Outlet /> 渲染。
 */
export function AppLayout() {
  const location = useLocation();
  const routeKey = routeKeyFromPathname(location.pathname);
  const activeItem = navItemByPath.get(routeKey);
  const { mode, setMode } = useTheme();
  const [query, setQuery] = useState("");
  // 抽屉记录「在哪个路由下打开的」。路由一变，表达式自然为 false，
  // 不需要在 effect 里 setState 去同步。
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const sidebarOpen = drawerPath === location.pathname;
  const isMobile = useMedia("(max-width: 960px)");
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

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
      routeKey === "overview"
        ? "ui-kit · React hooks 与组件库"
        : `${activeItem?.label ?? "页面未找到"} · ui-kit`;
  }, [activeItem, routeKey]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerPath(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const activeIndex = navItems.findIndex((item) => item.path === routeKey);
  const previous = activeIndex > 0 ? navItems[activeIndex - 1] : undefined;
  const next =
    activeIndex >= 0 && activeIndex < navItems.length - 1
      ? navItems[activeIndex + 1]
      : undefined;

  const closeSidebar = () => setDrawerPath(null);

  const nextMode =
    THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length] ??
    "system";

  return (
    <div className="doc-shell">
      <a
        className="doc-skip-link"
        href="#doc-content"
        onClick={(event) => {
          // hash 路由下不能改 hash，否则会跳到一个不存在的路由。
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
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
            onClick={() =>
              setDrawerPath(sidebarOpen ? null : location.pathname)
            }
          >
            <MenuIcon />
          </Button>

          <Link className="doc-brand" to="/" onClick={closeSidebar}>
            <span className="doc-brand__mark" aria-hidden="true">
              uk
            </span>
            <span className="doc-brand__name">ui-kit</span>
            <span className="doc-brand__badge">0.1</span>
          </Link>
        </div>

        <nav className="doc-topnav" aria-label="主导航">
          <Link
            to="/components/button"
            data-active={
              location.pathname.startsWith("/components") ? "true" : undefined
            }
          >
            组件
          </Link>
          <Link
            to="/hooks/use-controllable-state"
            data-active={
              location.pathname.startsWith("/hooks") ? "true" : undefined
            }
          >
            Hooks
          </Link>
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
                      <NavLink
                        className="doc-nav__link"
                        to={toRoute(item.path)}
                        onClick={closeSidebar}
                      >
                        {item.label}
                      </NavLink>
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

      <main ref={mainRef} className="doc-main" id="doc-content" tabIndex={-1}>
        <div className="doc-main__inner" key={location.pathname}>
          <Outlet />

          {previous || next ? (
            <nav className="doc-pagenav" aria-label="上一页与下一页">
              {previous ? (
                <Link className="doc-pagenav__prev" to={toRoute(previous.path)}>
                  <span>上一页</span>
                  <strong>{previous.label}</strong>
                </Link>
              ) : null}
              {next ? (
                <Link className="doc-pagenav__next" to={toRoute(next.path)}>
                  <span>下一页</span>
                  <strong>{next.label}</strong>
                </Link>
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

      <ScrollRestoration />
    </div>
  );
}
