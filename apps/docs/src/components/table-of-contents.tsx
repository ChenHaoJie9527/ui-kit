import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useActiveSection } from "@chenhaojie9527/ui-kit-hooks";
import { useTocEntries, type TocEntry } from "./docs";

/** 吸顶头部高度 + 一点呼吸空间。 */
const SCROLL_OFFSET = 88;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToSection(id: string, behavior: ScrollBehavior) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  const top =
    window.scrollY + element.getBoundingClientRect().top - SCROLL_OFFSET;

  window.scrollTo({ top: Math.max(0, top), behavior });
}

function TocList({
  entries,
  activeId,
  onSelect,
}: {
  entries: TocEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="doc-toc__list">
      {entries.map((entry) => {
        const current = entry.id === activeId;

        return (
          <li key={entry.id}>
            <button
              type="button"
              className="doc-toc__link"
              data-current={current ? "true" : undefined}
              aria-current={current ? "location" : undefined}
              onClick={() => onSelect(entry.id)}
            >
              {entry.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 本页目录。
 *
 * 因为站点使用 hash 路由，`href="#section"` 会覆盖路由本身，所以这里
 * 用按钮 + `scrollTo`，当前章节通过 `?section=` 写回地址栏（replace，
 * 不产生历史记录），链接可以直接分享。
 *
 * 宽屏显示为右侧吸附栏，窄屏折叠成一个 `<details>`。
 */
export function TableOfContents() {
  const entries = useTocEntries();
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const activeId = useActiveSection(ids, { offset: SCROLL_OFFSET });
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const handledRef = useRef<string | null>(null);
  const mobileDetailsRef = useRef<HTMLDetailsElement>(null);

  const select = useCallback(
    (id: string) => {
      // 记录这次跳转，避免下面的深链接 effect 再滚一次。
      handledRef.current = `${location.pathname}::${id}`;

      const behavior: ScrollBehavior = prefersReducedMotion()
        ? "auto"
        : "smooth";
      const mobileDetails = mobileDetailsRef.current;
      const collapse = Boolean(mobileDetails?.open);

      // 窄屏的目录是折叠面板。先收起再滚：收起会让文档变短，
      // 若先滚再收，目标段落会被顶出视口。
      if (collapse && mobileDetails) {
        mobileDetails.open = false;
        requestAnimationFrame(() => scrollToSection(id, behavior));
      } else {
        scrollToSection(id, behavior);
      }

      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set("section", id);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [location.pathname, setSearchParams],
  );

  // 带 ?section= 打开链接时，等目录收集完成再定位。
  useEffect(() => {
    const section = searchParams.get("section");

    if (!section || entries.length === 0) {
      return;
    }

    const token = `${location.pathname}::${section}`;

    if (handledRef.current === token) {
      return;
    }

    handledRef.current = token;

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(section, "auto");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [entries.length, location.pathname, searchParams]);

  if (entries.length < 2) {
    return null;
  }

  return (
    <div className="doc-toc-slot">
      <details className="doc-toc-mobile" ref={mobileDetailsRef}>
        <summary className="doc-toc-mobile__summary">
          本页目录
          <span className="doc-toc-mobile__count">{entries.length}</span>
        </summary>
        <TocList entries={entries} activeId={activeId} onSelect={select} />
      </details>

      <nav className="doc-toc" aria-labelledby="doc-toc-title">
        <p className="doc-toc__title" id="doc-toc-title">
          本页目录
        </p>
        <TocList entries={entries} activeId={activeId} onSelect={select} />
      </nav>
    </div>
  );
}
