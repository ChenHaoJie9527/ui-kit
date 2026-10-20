import { useEffect, useState } from "react";
import { Input } from "@chenhaojie9527/ui-kit";
import { useDebouncedValue } from "@chenhaojie9527/ui-kit-hooks";

const HOOKS = [
  "useControllableState",
  "useEventCallback",
  "useMap",
  "useList",
  "useAsync",
  "useMedia",
  "useWindowSize",
  "useClickAway",
  "useFocusTrap",
  "useVirtualList",
  "useDebouncedValue",
  "useDebounce",
];

const chip = {
  border: "1px solid var(--uk-border)",
  borderRadius: 5,
  background: "var(--uk-surface)",
  padding: "0 5px",
  fontFamily: "var(--uk-font-mono)",
  fontSize: 11.5,
};

export function Demo() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);
  const [lookups, setLookups] = useState(0);

  // 模拟下游请求：防抖值稳定后再过 120ms 才“返回结果”。
  useEffect(() => {
    if (debounced.trim().length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setLookups((count) => count + 1);
    }, 120);

    return () => clearTimeout(timer);
  }, [debounced]);

  const keyword = debounced.trim().toLowerCase();
  const results =
    keyword.length === 0
      ? HOOKS
      : HOOKS.filter((name) => name.toLowerCase().includes(keyword));
  const waiting = query !== debounced;

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
      <label style={{ display: "grid", gap: 6 }} htmlFor="demo-hook-search">
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>搜索 hook</span>
        <Input
          id="demo-hook-search"
          value={query}
          placeholder="试试输入 async 或 virtual"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
        }}
      >
        <span>
          输入 <code style={chip}>{query || "—"}</code>
        </span>
        <span>
          防抖后 <code style={chip}>{debounced || "—"}</code>
        </span>
        <span>
          下游查询 <code style={chip}>{lookups} 次</code>
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--uk-border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "8px 12px",
            background: "var(--uk-surface)",
            fontSize: 12,
            color: "var(--uk-text-muted)",
          }}
        >
          <span>{results.length} 个结果</span>
          <span
            style={{
              color: waiting ? "var(--uk-warning)" : "var(--uk-success)",
            }}
          >
            {waiting ? "等待输入停止…" : "已同步"}
          </span>
        </div>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            maxHeight: 156,
            overflowY: "auto",
          }}
        >
          {results.map((name) => (
            <li
              key={name}
              style={{
                padding: "6px 12px",
                borderTop: "1px solid var(--uk-border)",
                fontFamily: "var(--uk-font-mono)",
                fontSize: 12.5,
              }}
            >
              {name}
            </li>
          ))}
          {results.length === 0 ? (
            <li
              style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--uk-border)",
                fontSize: 12.5,
                color: "var(--uk-text-muted)",
              }}
            >
              没有匹配的 hook
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
