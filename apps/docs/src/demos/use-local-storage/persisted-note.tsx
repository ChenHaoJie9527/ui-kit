import { useLocalStorage } from "@seam/hooks";

export function Demo() {
  const [note, setNote, remove] = useLocalStorage(
    "ui-kit-docs:demo-note",
    "刷新页面后我还在。",
  );

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <label style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
        会持久化的笔记
        <textarea
          value={note}
          rows={4}
          onChange={(event) => setNote(event.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            padding: "9px 11px",
            border: "1px solid var(--uk-border-strong)",
            borderRadius: 8,
            background: "var(--uk-surface-raised)",
            color: "var(--uk-text)",
            font: "inherit",
          }}
        />
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
        }}
      >
        <span>{note.length} 个字符 · 已自动写入 localStorage</span>
        <button
          type="button"
          onClick={remove}
          style={{
            appearance: "none",
            border: "1px solid var(--uk-border-strong)",
            borderRadius: 7,
            padding: "5px 10px",
            background: "transparent",
            color: "var(--uk-text)",
            cursor: "pointer",
            fontSize: 12.5,
          }}
        >
          恢复初始值
        </button>
      </div>
    </div>
  );
}
