import { useState } from "react";
import { Button } from "seam-react";
import { useCounter } from "seam-hooks";

export function Demo() {
  const [totalPages, setTotalPages] = useState(12);
  const [page, { increment, decrement, set, reset }] = useCounter({
    defaultValue: 1,
    min: 1,
    max: totalPages,
  });

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 500 }}>
      <div
        style={{
          display: "grid",
          gap: 14,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--uk-surface-raised)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: "var(--uk-text-muted)",
              }}
            >
              订单列表
            </p>
            <p
              aria-live="polite"
              style={{
                margin: "4px 0 0",
                fontSize: 17,
                fontWeight: 650,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              第 {page} / {totalPages} 页
            </p>
          </div>
          <code
            style={{
              fontFamily: "var(--uk-font-mono)",
              fontSize: 12,
              color: "var(--uk-text-muted)",
            }}
          >
            max: totalPages
          </code>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => decrement()}
          >
            上一页
          </Button>
          <Button disabled={page === totalPages} onClick={() => increment()}>
            下一页
          </Button>
          <Button variant="ghost" onClick={reset}>
            回到第 1 页
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button size="sm" variant="outline" onClick={() => set(10)}>
          跳到第 10 页
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTotalPages(5)}>
          筛选后仅剩 5 页
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setTotalPages(12)}>
          恢复 12 页
        </Button>
      </div>
    </div>
  );
}
