import { useRef, useState } from "react";
import { Button, Input } from "seam-react";
import { useFocusTrap } from "seam-hooks";

export function Demo() {
  const dialogRef = useRef(document.createElement("dialog"));
  const firstFieldRef = useRef(document.createElement("input"));
  const triggerRef = useRef(document.createElement("button"));
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");

  useFocusTrap({
    active: open,
    containerRef: dialogRef,
    initialFocusRef: firstFieldRef,
    returnFocusRef: triggerRef,
  });

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 460 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button ref={triggerRef} onClick={() => setOpen(true)}>
          打开受限对话框
        </Button>
        <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
          {saved ? `已保存：${saved}` : "打开后按 Tab 或 Shift+Tab"}
        </span>
      </div>

      {open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 1000,
          }}
        >
          <dialog
            ref={dialogRef}
            open
            aria-modal="true"
            aria-labelledby="focus-trap-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            style={{
              width: "min(420px, 100%)",
              display: "grid",
              gap: 16,
              padding: 22,
              border: "1px solid var(--uk-border-strong)",
              borderRadius: 14,
              background: "var(--uk-surface-raised)",
              boxShadow: "var(--uk-shadow-lg)",
              color: "var(--uk-text)",
              margin: 0,
            }}
          >
            <div>
              <h3 id="focus-trap-title" style={{ margin: 0, fontSize: 18 }}>
                编辑名称
              </h3>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 13,
                  color: "var(--uk-text-muted)",
                }}
              >
                焦点会在输入框与两个按钮之间循环，关闭后回到触发按钮。
              </p>
            </div>
            <Input
              ref={firstFieldRef}
              value={draft}
              placeholder="输入新名称"
              onChange={(event) => setDraft(event.target.value)}
            />
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <Button variant="ghost" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  setSaved(draft.trim() || "未命名");
                  setOpen(false);
                }}
              >
                保存
              </Button>
            </div>
          </dialog>
        </div>
      ) : null}
    </div>
  );
}
