import { useWindowSize } from "@seam/hooks";

export function Demo() {
  const { width, height } = useWindowSize();
  const ratio = height > 0 ? Math.min(1, width / height) : 0;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      <div style={{ display: "flex", gap: 28 }}>
        <div>
          <p
            style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}
          >
            宽度
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.15,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {width}
            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
              px
            </span>
          </p>
        </div>
        <div>
          <p
            style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}
          >
            高度
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.15,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {height}
            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
              px
            </span>
          </p>
        </div>
      </div>

      <div
        style={{
          height: 130,
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          background: "var(--uk-surface)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(24, ratio * 62)}%`,
            height: "72%",
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--uk-primary)",
            borderRadius: 8,
            background:
              "color-mix(in srgb, var(--uk-primary) 9%, var(--uk-surface-raised))",
            fontFamily: "var(--uk-font-mono)",
            fontSize: 12,
            color: "var(--uk-text-muted)",
            transition: "width 120ms linear",
          }}
        >
          视口比例
        </div>
      </div>
    </div>
  );
}
