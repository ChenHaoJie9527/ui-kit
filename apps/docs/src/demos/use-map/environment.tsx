import { useState } from "react";
import { Button, Input } from "seam-react";
import { useMap } from "seam-hooks";

export function Demo() {
  const [values, { set, remove, clear, reset }] = useMap(
    new Map([
      ["NODE_ENV", "production"],
      ["API_URL", "https://api.example.com"],
    ]),
  );
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const add = () => {
    if (!key.trim()) {
      return;
    }

    set(key.trim(), value.trim() || "—");
    setKey("");
    setValue("");
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 520 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Input
          aria-label="变量名"
          placeholder="变量名"
          value={key}
          onChange={(event) => setKey(event.target.value)}
        />
        <Input
          aria-label="变量值"
          placeholder="变量值"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button onClick={add}>写入</Button>
      </div>

      <div
        style={{
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {[...values.entries()].map(([entryKey, entryValue]) => (
          <div
            key={entryKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "9px 12px",
              borderBottom: "1px solid var(--uk-border)",
              fontFamily: "var(--uk-font-mono)",
              fontSize: 12.5,
            }}
          >
            <strong style={{ minWidth: 110 }}>{entryKey}</strong>
            <span style={{ flex: 1, color: "var(--uk-text-muted)" }}>
              {entryValue}
            </span>
            <Button size="sm" variant="ghost" onClick={() => remove(entryKey)}>
              删除
            </Button>
          </div>
        ))}
        {values.size === 0 ? (
          <p
            style={{
              margin: 0,
              padding: 16,
              color: "var(--uk-text-muted)",
              fontSize: 13,
            }}
          >
            Map 已清空
          </p>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="outline" size="sm" onClick={clear}>
          清空
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          恢复初始值
        </Button>
        <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
          {values.size} 个变量
        </span>
      </div>
    </div>
  );
}
