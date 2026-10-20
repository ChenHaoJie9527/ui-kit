import { useState } from "react";
import { Button, Input } from "@seam/ui";
import { useCopyToClipboard } from "@seam/hooks";

export function Demo() {
  const [text, setText] = useState("pnpm add jsr:@seam/hooks");
  const [state, copy] = useCopyToClipboard();

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          aria-label="要复制的文本"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button
          variant={state.copied ? "secondary" : "primary"}
          onClick={() => {
            void copy(text);
          }}
        >
          {state.copied ? "已复制" : "复制"}
        </Button>
      </div>

      <div
        aria-live="polite"
        style={{
          minHeight: 44,
          padding: "10px 12px",
          border: "1px solid var(--uk-border)",
          borderRadius: 9,
          background: "var(--uk-surface)",
          fontSize: 12.5,
          color: state.error ? "var(--uk-danger)" : "var(--uk-text-muted)",
        }}
      >
        {state.error
          ? state.error.message
          : state.copied
            ? `成功写入剪贴板：${state.value}`
            : "等待复制"}
      </div>
    </div>
  );
}
