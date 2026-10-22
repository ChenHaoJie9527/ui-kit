import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router";
import { useThrottle } from "seam-hooks";
import { Dialog } from "seam-react";
import { navItems, toRoute } from "../nav";

const SEARCH_THROTTLE_MS = 180;

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="17"
      height="17"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8.6" cy="8.6" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m12.4 12.4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SearchResult {
  path: string;
  label: string;
  hint?: string;
  group: string;
  isNew?: boolean;
}

interface ScoredResult {
  item: SearchResult;
  index: number;
  score: number;
}

function findSearchResults(normalizedQuery: string): SearchResult[] {
  if (!normalizedQuery) {
    return [];
  }

  const terms = normalizedQuery.split(/\s+/);

  return navItems
    .map((item, index) => ({
      item,
      index,
      score: resultScore(item, terms),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .reduce<ScoredResult[]>((sorted, entry) => {
      const insertAt = sorted.findIndex(
        (current) =>
          entry.score < current.score ||
          (entry.score === current.score &&
            (entry.item.label.length < current.item.label.length ||
              (entry.item.label.length === current.item.label.length &&
                entry.index < current.index))),
      );

      sorted.splice(insertAt === -1 ? sorted.length : insertAt, 0, entry);
      return sorted;
    }, [])
    .map(({ item }) => item);
}

function resultScore(result: SearchResult, terms: string[]): number {
  const label = result.label.toLocaleLowerCase();
  const haystack =
    `${result.label} ${result.hint ?? ""} ${result.group}`.toLocaleLowerCase();

  if (!terms.every((term) => haystack.includes(term))) {
    return Number.POSITIVE_INFINITY;
  }

  if (terms.length === 1 && label === terms[0]) {
    return 0;
  }

  if (terms.length === 1 && label.startsWith(terms[0]!)) {
    return 1;
  }

  if (terms.every((term) => label.includes(term))) {
    return 2;
  }

  return 3;
}

export function DocsSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contentHeight, setContentHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const listboxId = useId();
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const showResults = query.trim().length > 0;
  const updateSearchQuery = useThrottle(
    (value: string) => setSearchQuery(value),
    SEARCH_THROTTLE_MS,
  );

  const results = useMemo(
    () => findSearchResults(normalizedQuery),
    [normalizedQuery],
  );

  useLayoutEffect(() => {
    const body = bodyRef.current;

    if (!open || !body) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setContentHeight(body.getBoundingClientRect().height);
    });

    observer.observe(body);
    return () => observer.disconnect();
  }, [open]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    const activePath = results[activeIndex]?.path;
    const activeResult = list?.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`,
    );

    if (
      !list ||
      !indicator ||
      !activeResult ||
      activeResult.dataset.resultPath !== activePath
    ) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const resultRect = activeResult.getBoundingClientRect();

    indicator.style.transform = `translateY(${resultRect.top - listRect.top}px)`;
    indicator.style.height = `${resultRect.height}px`;
    indicator.style.opacity = "1";
  }, [activeIndex, results]);

  useEffect(() => {
    if (!open || results.length === 0) {
      return;
    }

    const activeOption = listRef.current?.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`,
    );

    activeOption?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, results.length]);

  function openSearch() {
    updateSearchQuery.cancel();
    setQuery("");
    setSearchQuery("");
    setContentHeight(0);
    setActiveIndex(0);
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      updateSearchQuery.cancel();
    }

    setOpen(nextOpen);
  }

  function selectResult(result: SearchResult) {
    updateSearchQuery.cancel();
    setOpen(false);
    navigate(toRoute(result.path));
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(results.length - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const pendingQuery = query.trim().toLocaleLowerCase();
      const result =
        pendingQuery === normalizedQuery
          ? results[activeIndex]
          : pendingQuery
            ? findSearchResults(pendingQuery)[0]
            : undefined;

      if (result) {
        selectResult(result);
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <button
          ref={triggerRef}
          type="button"
          className="doc-search-trigger"
          aria-label="搜索文档"
          onClick={openSearch}
        >
          <SearchIcon />
          <span className="doc-search-trigger__label">搜索组件或 Hook</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Content
        className="doc-search-dialog"
        initialFocusRef={searchInputRef}
        returnFocusRef={triggerRef}
        aria-label="搜索文档"
      >
        <Dialog.Header className="doc-search-dialog__header">
          <SearchIcon />
          <input
            ref={searchInputRef}
            className="doc-search-dialog__input"
            type="text"
            value={query}
            placeholder="搜索文档"
            autoComplete="off"
            spellCheck={false}
            aria-label="搜索组件或 Hook"
            role="searchbox"
            aria-controls={
              showResults && results.length > 0 ? listboxId : undefined
            }
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setActiveIndex(0);

              if (!value.trim()) {
                setContentHeight(0);
              }

              updateSearchQuery(value);
            }}
            onKeyDown={onInputKeyDown}
          />
          <Dialog.Close>
            <button
              type="button"
              className="doc-search-dialog__shortcut"
              aria-label="关闭搜索"
            >
              ESC
            </button>
          </Dialog.Close>
        </Dialog.Header>

        <div
          className="doc-search-dialog__expansion"
          style={{
            height: showResults ? contentHeight : 0,
            opacity: showResults ? 1 : 0,
          }}
          inert={!showResults}
          aria-hidden={!showResults ? true : undefined}
        >
          <Dialog.Body ref={bodyRef} className="doc-search-dialog__body">
            {normalizedQuery ? (
              results.length > 0 ? (
                <>
                  <p className="sr-only" aria-live="polite" aria-atomic="true">
                    找到 {results.length} 个结果。当前：
                    {results[activeIndex]?.label}，{results[activeIndex]?.group}
                  </p>
                  <div
                    ref={listRef}
                    className="doc-search-dialog__results-region"
                  >
                    <span
                      ref={indicatorRef}
                      className="doc-search-dialog__result-indicator"
                      aria-hidden="true"
                    />
                    <ul
                      className="doc-search-dialog__results"
                      id={listboxId}
                      aria-label="搜索结果"
                    >
                      {results.map((result, index) => (
                        <li key={result.path}>
                          <button
                            type="button"
                            className="doc-search-dialog__result"
                            data-result-index={index}
                            data-result-path={result.path}
                            tabIndex={index === activeIndex ? 0 : -1}
                            aria-current={
                              index === activeIndex ? "true" : undefined
                            }
                            onFocus={() => setActiveIndex(index)}
                            onPointerMove={() => setActiveIndex(index)}
                            onClick={() => selectResult(result)}
                          >
                            <span className="doc-search-dialog__result-content">
                              <span className="doc-search-dialog__breadcrumb">
                                <span>文档</span>
                                <span aria-hidden="true">›</span>
                                <span>{result.group}</span>
                              </span>
                              <span className="doc-search-dialog__result-title">
                                <strong>{result.label}</strong>
                                {result.isNew ? (
                                  <span className="doc-search-dialog__new">
                                    New
                                  </span>
                                ) : null}
                              </span>
                              {result.hint ? (
                                <span className="doc-search-dialog__hint">
                                  {result.hint}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="doc-search-dialog__empty" aria-live="polite">
                  <SearchIcon />
                  <div>
                    <strong>没有找到相关内容</strong>
                    <p>试试组件名、Hook 名或“焦点”“表单”等关键词。</p>
                  </div>
                </div>
              )
            ) : null}
          </Dialog.Body>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
