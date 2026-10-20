import { useState } from "react";
import { useDropArea } from "seam-hooks";

export function Demo() {
  const [messages, setMessages] = useState(["等待拖入文件、链接或文本"]);
  const add = (message = "") => {
    setMessages((previous) => [message, ...previous].slice(0, 4));
  };

  const { over, bind } = useDropArea({
    onFiles: (files) =>
      add(`文件：${files.map((file) => file.name).join("、")}`),
    onUri: (uri) => add(`链接：${uri}`),
    onText: (text) => add(`文本：${text.slice(0, 42)}`),
    onDrop: (payload) =>
      add(
        `完成：${payload.files.length} 个文件 / ${payload.uris.length} 个链接`,
      ),
  });

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
      <div
        {...bind}
        style={{
          minHeight: 150,
          display: "grid",
          placeItems: "center",
          padding: 20,
          border: `2px dashed ${
            over ? "var(--uk-primary)" : "var(--uk-border-strong)"
          }`,
          borderRadius: 14,
          background: over
            ? "color-mix(in srgb, var(--uk-primary) 9%, var(--uk-surface))"
            : "var(--uk-surface)",
          transition: "border-color 140ms ease, background 140ms ease",
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
            {over ? "松手放置" : "把内容拖到这里"}
          </p>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: 12.5,
              color: "var(--uk-text-muted)",
            }}
          >
            支持文件、链接和纯文本
          </p>
        </div>
      </div>

      <ul
        style={{
          margin: 0,
          padding: "0 0 0 18px",
          display: "grid",
          gap: 4,
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
        }}
      >
        {messages.map((message, index) => (
          // eslint-disable-next-line react/no-array-index-key -- 同一条拖放结果可能重复出现
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
