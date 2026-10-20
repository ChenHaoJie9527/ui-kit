import { useEffect, useState } from "react";
import { Button } from "seam-react";
import { useEventCallback } from "seam-hooks";

export function Demo() {
  const [value, setValue] = useState(0);
  const [ticks, setTicks] = useState(0);
  const [observed, setObserved] = useState(0);

  const tick = useEventCallback(() => {
    setTicks((count) => count + 1);
    setObserved(value);
  });

  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 440 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "var(--uk-surface)",
            border: "1px solid var(--uk-border)",
          }}
        >
          <p
            style={{ margin: 0, fontSize: 11.5, color: "var(--uk-text-muted)" }}
          >
            当前值
          </p>
          <strong style={{ display: "block", marginTop: 3, fontSize: 24 }}>
            {value}
          </strong>
        </div>
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "var(--uk-surface)",
            border: "1px solid var(--uk-border)",
          }}
        >
          <p
            style={{ margin: 0, fontSize: 11.5, color: "var(--uk-text-muted)" }}
          >
            定时器每秒读到
          </p>
          <strong style={{ display: "block", marginTop: 3, fontSize: 24 }}>
            {observed}
          </strong>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button onClick={() => setValue((current) => current + 1)}>
          值 +1
        </Button>
        <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
          已触发 {ticks} 次，effect 不会因 value 变化重新绑定时器
        </span>
      </div>
    </div>
  );
}
