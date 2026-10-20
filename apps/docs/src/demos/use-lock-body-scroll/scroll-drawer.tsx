import { useState } from "react";
import { Button } from "seam-react";
import { useLockBodyScroll } from "seam-hooks";

export function Demo() {
  const [open, setOpen] = useState(false);
  useLockBodyScroll(open);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 460 }}>
      <Button onClick={() => setOpen(true)}>打开抽屉并锁定滚动</Button>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        打开后尝试滚动页面背景，抽屉内容仍可独立滚动。
      </p>

      {open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "flex-end",
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 1100,
          }}
        >
          <aside
            aria-label="设置抽屉"
            style={{
              width: "min(360px, 90vw)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              padding: 24,
              boxSizing: "border-box",
              background: "var(--uk-bg)",
              borderLeft: "1px solid var(--uk-border-strong)",
              boxShadow: "var(--uk-shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>页面设置</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                关闭
              </Button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--uk-text-muted)",
              }}
            >
              抽屉打开期间 body 被设置为 overflow:
              hidden，同时补偿滚动条宽度，避免页面横向跳动。
            </p>
            <div style={{ flex: 1 }} />
            <Button onClick={() => setOpen(false)}>完成</Button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
