import { useState } from "react";
import { Button } from "@chenhaojie9527/ui-kit";
import { usePageLeave } from "@chenhaojie9527/ui-kit-hooks";

export function Demo() {
  const [leaves, setLeaves] = useState(0);
  const left = usePageLeave(() => setLeaves((count) => count + 1));

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--uk-surface-raised)",
        }}
      >
        <div>
          <p
            style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}
          >
            页面状态
          </p>
          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 18,
              color: left ? "var(--uk-warning)" : "var(--uk-success)",
            }}
          >
            {left ? "鼠标已离开页面" : "鼠标在页面内"}
          </strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}
          >
            触发次数
          </p>
          <strong style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>
            {leaves}
          </strong>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        把鼠标移出浏览器窗口再回来，状态会先变为离开，再自动重置。
      </p>
      <div>
        <Button size="sm" variant="ghost" onClick={() => setLeaves(0)}>
          清零计数
        </Button>
      </div>
    </div>
  );
}
