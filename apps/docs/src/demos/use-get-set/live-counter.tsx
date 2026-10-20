import { useEffect, useState } from "react";
import { Button } from "seam-react";
import { useGetSet } from "seam-hooks";

export function Demo() {
  const [getCount, setCount] = useGetSet(0);
  const [sampled, setSampled] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSampled(getCount()), 500);
    return () => clearInterval(timer);
  }, [getCount]);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 420 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: "16px 18px",
          background: "var(--uk-surface-raised)",
        }}
      >
        <div>
          <p
            style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}
          >
            实时计数
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 34,
              lineHeight: 1.1,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sampled}
          </p>
        </div>
        <code
          style={{
            fontFamily: "var(--uk-font-mono)",
            fontSize: 12,
            color: "var(--uk-text-muted)",
          }}
        >
          每 500ms 采样 get()
        </code>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button onClick={() => setCount((value) => value + 1)}>+1</Button>
        <Button
          variant="outline"
          onClick={() => setCount((value) => value + 10)}
        >
          +10
        </Button>
        <Button variant="ghost" onClick={() => setCount(0)}>
          清零
        </Button>
      </div>
    </div>
  );
}
