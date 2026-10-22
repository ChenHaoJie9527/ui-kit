import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  ScrollRestoration,
  useLocation,
  useOutlet,
} from "react-router";
import { useFocusTrap, useLockBodyScroll, useMedia } from "seam-hooks";
import { Button, Sidebar } from "seam-react";
import uiPackage from "../../../packages/ui/package.json";
import { DocsSearch } from "./components/docs-search";
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
const TOP_NAV_LINK =
  "rounded-lg px-[11px] py-1.5 text-[13.5px] text-muted no-underline transition-colors hover:bg-surface-2 hover:text-ink data-[active=true]:bg-accent-soft data-[active=true]:font-semibold data-[active=true]:text-accent-strong";

const SIDEBAR_NEW_BADGE =
  "inline-block flex-none rounded-full bg-accent-soft px-1.5 py-px align-[1px] text-[9.5px] font-bold tracking-[0.06em] text-accent-strong uppercase";

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

function SidebarGroupIcon({ title }: { title: string }) {
  if (title === "开始") {
    return (
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.3 2.8h9.4v10.4H3.3zM5.5 5.5h4.9M5.5 8h4.9M5.5 10.5h3.1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (title === "组件") {
    return (
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="2.4"
          y="2.4"
          width="4.5"
          height="4.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <rect
          x="9.1"
          y="2.4"
          width="4.5"
          height="4.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <rect
          x="2.4"
          y="9.1"
          width="4.5"
          height="4.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <rect
          x="9.1"
          y="9.1"
          width="4.5"
          height="4.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.1 3.6 2.5 8l2.6 4.4M10.9 3.6 13.5 8l-2.6 4.4M9.1 2.8 6.9 13.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
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

interface PageCardProps {
  active: boolean;
  children: ReactNode;
  entering: boolean;
  onEnterComplete?: () => void;
  pageKind: "base" | "current";
  routeKey: string;
}

function PageCard({
  active,
  children,
  entering,
  onEnterComplete,
  pageKind,
  routeKey,
}: PageCardProps) {
  return (
    <div
      className="doc-page-card px-12 pt-[46px] pb-[72px] max-tablet:px-8 max-tablet:pt-[38px] max-tablet:pb-16 max-phone:px-5 max-phone:pt-[30px] max-phone:pb-14"
      style={{ gridArea: "page" }}
      data-page-kind={pageKind}
      data-page-route={routeKey}
      data-transitioning={entering ? "true" : "false"}
      aria-hidden={!active ? true : undefined}
      inert={!active}
      onAnimationEnd={
        entering
          ? (event) => {
              if (event.target === event.currentTarget) {
                onEnterComplete?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

interface PageContentsProps {
  children: ReactNode;
  routeKey: string;
}

function PageContents({ children, routeKey }: PageContentsProps) {
  const activeIndex = navItems.findIndex((item) => item.path === routeKey);
  const previous = activeIndex > 0 ? navItems[activeIndex - 1] : undefined;
  const next =
    activeIndex >= 0 && activeIndex < navItems.length - 1
      ? navItems[activeIndex + 1]
      : undefined;

  return (
    <>
      {children}

      {previous || next ? (
        <div className="doc-bottom-column">
          <nav
            className="mt-16 grid grid-cols-2 gap-3 border-t border-line pt-6 max-phone:grid-cols-1"
            aria-label="上一页与下一页"
          >
            {previous ? (
              <Link
                className="flex flex-col gap-[3px] rounded-[11px] border border-line bg-surface px-4 py-[13px] text-ink no-underline transition-colors hover:border-accent hover:no-underline [&_span]:text-[11.5px] [&_span]:text-muted [&_strong]:text-sm [&_strong]:font-semibold"
                to={toRoute(previous.path)}
              >
                <span>上一页</span>
                <strong>{previous.label}</strong>
              </Link>
            ) : null}
            {next ? (
              <Link
                className="col-start-2 flex flex-col gap-[3px] rounded-[11px] border border-line bg-surface px-4 py-[13px] text-end text-ink no-underline transition-colors hover:border-accent hover:no-underline max-phone:col-start-1 [&_span]:text-[11.5px] [&_span]:text-muted [&_strong]:text-sm [&_strong]:font-semibold"
                to={toRoute(next.path)}
              >
                <span>下一页</span>
                <strong>{next.label}</strong>
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}

/**
 * 文档站外壳：顶栏、侧边栏、内容区与上一页/下一页。
 *
 * 路由由 react-router 的 HashRouter 提供，页面内容通过 <Outlet /> 渲染。
 */
export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const routeKey = routeKeyFromPathname(location.pathname);
  const [settledPage, setSettledPage] = useState(() => ({
    locationKey: location.key,
    routeKey,
    outlet,
  }));
  const pageTransitioning = settledPage.locationKey !== location.key;
  const currentLocationKeyRef = useRef(location.key);
  const activeItem = navItemByPath.get(routeKey);
  const { mode, setMode } = useTheme();
  // 抽屉记录「在哪个路由下打开的」。路由一变，表达式自然为 false，
  // 不需要在 effect 里 setState 去同步。
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const sidebarOpen = drawerPath === location.pathname;
  const isMobile = useMedia("(max-width: 960px)");
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    currentLocationKeyRef.current = location.key;
  }, [location.key]);

  useLockBodyScroll(sidebarOpen && isMobile);

  useFocusTrap({
    active: sidebarOpen && isMobile,
    containerRef: sidebarRef,
    returnFocusRef: menuButtonRef,
  });

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

  const closeSidebar = () => setDrawerPath(null);

  const nextMode =
    THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length] ??
    "system";

  return (
    <div>
      <a
        className="fixed top-2.5 left-2.5 z-[100] -translate-y-[150%] rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-white no-underline transition-transform focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        href="#doc-content"
        onClick={(event) => {
          // hash 路由下不能改 hash，否则会跳到一个不存在的路由。
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        跳到正文
      </a>

      <header className="sticky top-0 z-[60] flex h-[var(--doc-topbar-height)] items-center gap-[18px] border-b border-line bg-[color-mix(in_srgb,var(--doc-bg)_88%,transparent)] px-[22px] backdrop-blur-[14px] max-phone:px-3.5">
        <div className="flex items-center gap-2.5">
          <Button
            ref={menuButtonRef}
            className="hidden max-drawer:inline-flex"
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

          <Link
            className="inline-flex items-center gap-[9px] text-ink no-underline hover:no-underline"
            to="/"
            onClick={closeSidebar}
          >
            <span
              className="grid size-7 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--doc-accent),color-mix(in_srgb,var(--doc-accent)_55%,#0ea5e9))] font-mono text-[11px] font-bold tracking-[-0.02em] text-white"
              aria-hidden="true"
            >
              uk
            </span>
            <span className="text-[15px] font-[650] tracking-[-0.015em]">
              ui-kit
            </span>
            <span className="rounded-full border border-line bg-surface-2 px-[7px] py-px font-mono text-[10.5px] text-muted max-phone:hidden">
              {uiPackage.version}
            </span>
          </Link>
        </div>

        <nav
          className="ml-auto flex items-center gap-0.5 max-drawer:hidden"
          aria-label="主导航"
        >
          <Link
            className={TOP_NAV_LINK}
            to="/components/button"
            data-active={
              location.pathname.startsWith("/components") ? "true" : undefined
            }
          >
            组件
          </Link>
          <Link
            className={TOP_NAV_LINK}
            to="/hooks/use-controllable-state"
            data-active={
              location.pathname.startsWith("/hooks") ? "true" : undefined
            }
          >
            Hooks
          </Link>
          <a
            className={TOP_NAV_LINK}
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <DocsSearch />
          <Button
            variant="ghost"
            size="sm"
            aria-label={`切换主题，当前：${THEME_LABELS[mode]}`}
            onClick={() => setMode(nextMode)}
          >
            <ThemeIcon mode={mode} />
            <span className="text-[12.5px] font-medium max-phone:hidden">
              {THEME_LABELS[mode]}
            </span>
          </Button>
        </div>
      </header>

      <aside
        ref={sidebarRef}
        id="doc-sidebar"
        className="fixed top-[var(--doc-topbar-height)] bottom-0 left-0 z-50 w-[var(--doc-sidebar-width)] border-r border-line bg-canvas max-drawer:w-[min(320px,86vw)] max-drawer:-translate-x-full max-drawer:transition-transform max-drawer:duration-200 max-drawer:ease-[cubic-bezier(0.2,0.8,0.2,1)] max-drawer:data-[open=true]:translate-x-0 max-drawer:data-[open=true]:shadow-[0_24px_60px_rgb(0_0_0/0.28)]"
        data-open={sidebarOpen ? "true" : "false"}
        inert={isMobile && !sidebarOpen}
        aria-hidden={isMobile && !sidebarOpen ? true : undefined}
      >
        <div className="sidebar-scroll flex h-full flex-col overflow-y-auto overscroll-contain px-3.5 pt-[18px] pb-5">
          <Sidebar className="flex-1" aria-label="文档导航">
            {navGroups.map((group) => (
              <Sidebar.Group
                collapsible
                icon={<SidebarGroupIcon title={group.title} />}
                key={group.title}
                title={group.title}
              >
                {group.items.map((item) => (
                  <Sidebar.Item active={routeKey === item.path} key={item.path}>
                    <NavLink to={toRoute(item.path)} onClick={closeSidebar}>
                      {item.label}
                      {item.isNew ? (
                        <span
                          className={SIDEBAR_NEW_BADGE}
                          aria-label="近期新增组件"
                        >
                          New
                        </span>
                      ) : null}
                    </NavLink>
                  </Sidebar.Item>
                ))}
              </Sidebar.Group>
            ))}
          </Sidebar>

          <div className="mt-5 flex justify-between gap-2 border-t border-line px-2.5 pt-3.5 text-[11.5px] text-faint [&_a]:text-muted [&_a]:no-underline [&_a:hover]:text-accent">
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
          className="fixed inset-x-0 top-[var(--doc-topbar-height)] bottom-0 z-[45] m-0 border-0 bg-[rgb(8_10_15/0.42)] p-0 backdrop-blur-[2px] drawer:hidden"
          aria-label="关闭导航"
          onClick={closeSidebar}
        />
      ) : null}

      <main
        ref={mainRef}
        className="outline-none drawer:ml-[var(--doc-sidebar-width)]"
        id="doc-content"
        tabIndex={-1}
      >
        {/*
         * 页面切换是低频的空间事件。最后稳定的页面留在底层，最新目标页
         * 从视口底边上升。快速连点时只重新挂载前景卡，尚未完成的中间页
         * 会立即退场，避免两张卡片同时移动、交错露出内容。
         */}
        <div
          className="isolate grid grid-cols-[minmax(0,1fr)]"
          style={{ gridTemplateAreas: '"page"' }}
        >
          {pageTransitioning ? (
            <PageCard
              key={`base-${settledPage.locationKey}`}
              active={false}
              entering={false}
              pageKind="base"
              routeKey={settledPage.routeKey}
            >
              <PageContents routeKey={settledPage.routeKey}>
                {settledPage.outlet}
              </PageContents>
            </PageCard>
          ) : null}

          <PageCard
            key={`current-${routeKey}-${location.key}`}
            active
            entering={pageTransitioning}
            onEnterComplete={() => {
              if (currentLocationKeyRef.current !== location.key) {
                return;
              }

              setSettledPage({ locationKey: location.key, routeKey, outlet });
            }}
            pageKind="current"
            routeKey={routeKey}
          >
            <PageContents routeKey={routeKey}>{outlet}</PageContents>
          </PageCard>
        </div>

        <div className="mx-auto max-w-[1180px] px-12 max-tablet:px-8 max-phone:px-5">
          <div className="doc-bottom-column">
            <footer className="flex justify-between gap-4 pb-11 text-xs text-faint max-tablet:pb-10 max-phone:flex-col max-phone:pb-9 [&_a]:text-muted [&_a]:no-underline [&_a:hover]:text-accent">
              <span>MIT License © ChenHaoJie9527</span>
              <span>
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  GitHub
                </a>{" "}
                · React 19 · TypeScript 7
              </span>
            </footer>
          </div>
        </div>
      </main>

      <ScrollRestoration />
    </div>
  );
}
