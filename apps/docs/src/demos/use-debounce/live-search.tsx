import { useState } from "react";
import { Button, Input } from "@seam/ui";
import { useDebounce } from "@seam/hooks";

export function Demo() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("—");
  const [calls, setCalls] = useState(0);
  const [waiting, setWaiting] = useState(false);

  const search = useDebounce(() => {
    setCommitted(query.trim() || "—");
    setCalls((count) => count + 1);
    setWaiting(false);
  }, 600);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 480 }}>
      <Input
        value={query}
        placeholder="输入关键词，停手 600ms 后执行"
        onChange={(event) => {
          setQuery(event.target.value);
          setWaiting(true);
          search();
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "var(--uk-surface)",
            border: "1px solid var(--uk-border)",
          }}
        >
          <p
            style={{ margin: 0, fontSize: 11.5, color: "var(--uk-text-muted)" }}
          >
            已提交查询
          </p>
          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontFamily: "var(--uk-font-mono)",
              fontSize: 14,
            }}
          >
            {committed}
          </strong>
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "var(--uk-surface)",
            border: "1px solid var(--uk-border)",
          }}
        >
          <p
            style={{ margin: 0, fontSize: 11.5, color: "var(--uk-text-muted)" }}
          >
            执行次数
          </p>
          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 14,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {calls}
          </strong>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button
          size="sm"
          variant="outline"
          disabled={!waiting}
          onClick={() => {
            search.flush();
            setWaiting(false);
          }}
        >
          flush 立即执行
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!waiting}
          onClick={() => {
            search.cancel();
            setWaiting(false);
          }}
        >
          cancel
        </Button>
        <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
          {waiting ? "等待中…" : "空闲"}
        </span>
      </div>
    </div>
  );
}
