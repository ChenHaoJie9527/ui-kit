import { Button } from "@chenhaojie9527/ui-kit";
import { useLocation } from "@chenhaojie9527/ui-kit-hooks";

function writeParam() {
  const url = new URL(window.location.href);
  url.searchParams.set("demo", "location");
  window.history.replaceState(null, "", url.href);
}

function clearParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  window.history.replaceState(null, "", url.href);
}

export function Demo() {
  const location = useLocation();
  const cells = [
    { label: "origin", value: location.origin },
    { label: "pathname", value: location.pathname },
    { label: "search", value: location.search },
    { label: "hash", value: location.hash },
  ];

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 540 }}>
      <div
        style={{
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--uk-surface-raised)",
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.label}
            style={{
              display: "grid",
              gridTemplateColumns: "92px minmax(0, 1fr)",
              gap: 12,
              padding: "9px 12px",
              borderBottom: "1px solid var(--uk-border)",
              fontSize: 12.5,
            }}
          >
            <code style={{ color: "var(--uk-primary)" }}>{cell.label}</code>
            <code
              style={{
                fontFamily: "var(--uk-font-mono)",
                color: "var(--uk-text-muted)",
                overflowWrap: "anywhere",
              }}
            >
              {cell.value || "—"}
            </code>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button size="sm" onClick={writeParam}>
          写入 ?demo=location
        </Button>
        <Button size="sm" variant="outline" onClick={clearParam}>
          移除参数
        </Button>
      </div>
    </div>
  );
}
