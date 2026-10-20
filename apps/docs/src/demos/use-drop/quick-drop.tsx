import { useDrop } from "@chenhaojie9527/ui-kit-hooks";

export function Demo() {
  const { over, files, uris, text, bind } = useDrop();

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
      <p
        style={{
          margin: 0,
          padding: "10px 12px",
          border: "1px solid var(--uk-border)",
          borderRadius: 8,
          background: "var(--uk-surface-raised)",
          fontSize: 13,
          userSelect: "text",
        }}
      >
        选中这句话并拖到下面的区域，就能看到 text 结果。
      </p>

      <div
        {...bind}
        style={{
          minHeight: 150,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          padding: 12,
          border: `2px dashed ${
            over ? "var(--uk-primary)" : "var(--uk-border-strong)"
          }`,
          borderRadius: 14,
          background: over
            ? "color-mix(in srgb, var(--uk-primary) 9%, var(--uk-surface))"
            : "var(--uk-surface)",
        }}
      >
        {[
          [
            "files",
            files.length ? files.map((file) => file.name).join("、") : "—",
          ],
          ["uris", uris.length ? uris.join("、") : "—"],
          ["text", text || "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              minWidth: 0,
              display: "grid",
              alignContent: "start",
              gap: 5,
              padding: 10,
              borderRadius: 8,
              background: "var(--uk-surface-raised)",
              fontSize: 11.5,
            }}
          >
            <code style={{ color: "var(--uk-primary)" }}>{label}</code>
            <span
              style={{
                color: "var(--uk-text-muted)",
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
