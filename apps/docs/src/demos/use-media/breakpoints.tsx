import { useMedia } from "@chenhaojie9527/ui-kit-hooks";

const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "9px 0",
  borderBottom: "1px solid var(--uk-border)",
  fontSize: 13,
};

export function Demo() {
  const tablet = useMedia("(min-width: 720px)");
  const desktop = useMedia("(min-width: 1024px)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--uk-surface-raised)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 46,
            height: 30,
            border: "2px solid var(--uk-primary)",
            borderRadius: desktop ? 7 : 5,
            transform: desktop ? "scale(1.08)" : "scale(0.88)",
            transition: "transform 180ms ease, border-radius 180ms ease",
          }}
        />
        <div>
          <strong style={{ display: "block", fontSize: 14 }}>
            {desktop ? "桌面布局" : tablet ? "平板布局" : "窄屏布局"}
          </strong>
          <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
            调整浏览器窗口宽度观察变化
          </span>
        </div>
      </div>

      <div>
        <div style={row}>
          <code style={{ fontFamily: "var(--uk-font-mono)", fontSize: 12 }}>
            (min-width: 720px)
          </code>
          <strong
            style={{
              color: tablet ? "var(--uk-success)" : "var(--uk-text-muted)",
            }}
          >
            {tablet ? "命中" : "未命中"}
          </strong>
        </div>
        <div style={row}>
          <code style={{ fontFamily: "var(--uk-font-mono)", fontSize: 12 }}>
            (min-width: 1024px)
          </code>
          <strong
            style={{
              color: desktop ? "var(--uk-success)" : "var(--uk-text-muted)",
            }}
          >
            {desktop ? "命中" : "未命中"}
          </strong>
        </div>
        <div style={{ ...row, borderBottom: 0 }}>
          <code style={{ fontFamily: "var(--uk-font-mono)", fontSize: 12 }}>
            (prefers-reduced-motion: reduce)
          </code>
          <strong
            style={{
              color: reducedMotion
                ? "var(--uk-success)"
                : "var(--uk-text-muted)",
            }}
          >
            {reducedMotion ? "是" : "否"}
          </strong>
        </div>
      </div>
    </div>
  );
}
