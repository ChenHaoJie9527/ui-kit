import { useRef, useState } from "react";
import { Button } from "@chenhaojie9527/ui-kit";
import { useFullscreen } from "@chenhaojie9527/ui-kit-hooks";

export function Demo() {
  const panelRef = useRef(document.createElement("div"));
  const [error, setError] = useState("");
  const { isFullscreen, supported, toggle } = useFullscreen(panelRef);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <div
        ref={panelRef}
        style={{
          minHeight: isFullscreen ? "100vh" : 170,
          display: "grid",
          placeItems: "center",
          padding: 24,
          boxSizing: "border-box",
          borderRadius: isFullscreen ? 0 : 14,
          color: "#f8fafc",
          background:
            "radial-gradient(circle at 20% 10%, #6366f1 0, transparent 40%), linear-gradient(135deg, #0f172a, #312e81)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12.5, opacity: 0.72 }}>
            {isFullscreen ? "全屏中" : "预览面板"}
          </p>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            让内容占满屏幕
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button
          size="sm"
          variant="outline"
          disabled={!supported}
          onClick={() => {
            setError("");
            void toggle().catch(() => {
              setError("浏览器或嵌入环境拒绝了全屏请求");
            });
          }}
        >
          {isFullscreen ? "退出全屏" : "进入全屏"}
        </Button>
        <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
          {supported ? "Fullscreen API 可用" : "当前环境不支持全屏"}
        </span>
      </div>

      {error ? (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-danger)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
