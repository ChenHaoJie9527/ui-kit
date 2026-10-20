import { useState } from "react";
import { useVirtualList } from "seam-hooks";

const ITEM_HEIGHT = 34;
const VIEWPORT_HEIGHT = 272;
const ROWS = Array.from({ length: 10000 }, (_, index) => ({
  id: index + 1,
  name: `task-${String(index + 1).padStart(5, "0")}`,
  status: index % 3 === 0 ? "done" : index % 3 === 1 ? "running" : "queued",
}));

export function Demo() {
  const [scrollTop, setScrollTop] = useState(0);
  const { start, end, totalHeight, offsetTop } = useVirtualList({
    count: ROWS.length,
    itemHeight: ITEM_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
    scrollTop,
    overscan: 4,
  });
  const visible = ROWS.slice(start, end);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
        }}
      >
        <span>共 {ROWS.length.toLocaleString()} 行</span>
        <code style={{ fontFamily: "var(--uk-font-mono)" }}>
          渲染 [{start}, {end}) · {visible.length} 行
        </code>
      </div>

      <div
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{
          height: VIEWPORT_HEIGHT,
          overflowY: "auto",
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          background: "var(--uk-surface-raised)",
        }}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetTop}px)` }}>
            {visible.map((row) => (
              <div
                key={row.id}
                style={{
                  height: ITEM_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 14px",
                  borderBottom: "1px solid var(--uk-border)",
                  boxSizing: "border-box",
                  fontFamily: "var(--uk-font-mono)",
                  fontSize: 12.5,
                }}
              >
                <span
                  style={{
                    width: 74,
                    color: "var(--uk-text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  #{row.id}
                </span>
                <span style={{ flex: 1 }}>{row.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    color:
                      row.status === "done"
                        ? "var(--uk-success)"
                        : row.status === "running"
                          ? "var(--uk-warning)"
                          : "var(--uk-text-muted)",
                  }}
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
