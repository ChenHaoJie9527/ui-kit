import { useRef, useState } from "react";
import { Button } from "seam-react";
import { useThrottle } from "seam-hooks";

export function Demo() {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [raw, setRaw] = useState(0);
  const [processed, setProcessed] = useState(0);
  const latestPoint = useRef({ x: 0, y: 0 });

  const sample = useThrottle(() => {
    setPoint(latestPoint.current);
    setProcessed((count) => count + 1);
  }, 250);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
      <div
        onMouseMove={(event) => {
          latestPoint.current = { x: event.clientX, y: event.clientY };
          setRaw((count) => count + 1);
          sample();
        }}
        style={{
          height: 180,
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--uk-border)",
          borderRadius: 14,
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--uk-primary) 8%, transparent), transparent 62%), var(--uk-surface)",
          overflow: "hidden",
          cursor: "crosshair",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            在区域内快速移动鼠标
          </p>
          <code
            style={{
              display: "block",
              marginTop: 6,
              fontFamily: "var(--uk-font-mono)",
              fontSize: 12,
              color: "var(--uk-text-muted)",
            }}
          >
            x: {point.x} · y: {point.y}
          </code>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "6px 16px",
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
        }}
      >
        <span>原始事件 {raw}</span>
        <span>实际执行 {processed}</span>
        <span>每 250ms 最多一次</span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" variant="outline" onClick={() => sample.flush()}>
          flush
        </Button>
        <Button size="sm" variant="ghost" onClick={() => sample.cancel()}>
          cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRaw(0);
            setProcessed(0);
          }}
        >
          清零
        </Button>
      </div>
    </div>
  );
}
