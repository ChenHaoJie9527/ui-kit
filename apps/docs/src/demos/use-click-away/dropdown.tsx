import { useRef, useState } from "react";
import { Button } from "@seam/ui";
import { useClickAway } from "@seam/hooks";

export function Demo() {
  const menuRef = useRef(document.createElement("div"));
  const [open, setOpen] = useState(false);
  const [closedByOutside, setClosedByOutside] = useState(0);

  useClickAway(menuRef, () => {
    setOpen(false);
    setClosedByOutside((count) => count + 1);
  });

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
      <div style={{ position: "relative", width: 180 }}>
        <Button
          variant="outline"
          aria-expanded={open}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setOpen((value) => !value)}
        >
          操作 {open ? "▲" : "▼"}
        </Button>

        {open ? (
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: 44,
              left: 0,
              minWidth: 210,
              display: "grid",
              gap: 2,
              padding: 6,
              border: "1px solid var(--uk-border-strong)",
              borderRadius: 10,
              background: "var(--uk-surface-raised)",
              boxShadow: "var(--uk-shadow-md)",
              zIndex: 5,
            }}
          >
            {["复制链接", "重命名", "归档"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  appearance: "none",
                  border: 0,
                  borderRadius: 7,
                  padding: "8px 10px",
                  background: "transparent",
                  color: "var(--uk-text)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        点击菜单外关闭 · 已通过外部点击关闭 {closedByOutside} 次
      </p>
    </div>
  );
}
