import { useState } from "react";
import { Button } from "@chenhaojie9527/ui-kit";
import { useStartTyping } from "@chenhaojie9527/ui-kit-hooks";

function Probe() {
  const typing = useStartTyping();

  return (
    <div
      aria-live="polite"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: 150,
        padding: 20,
        border: `1px solid ${
          typing ? "var(--uk-success)" : "var(--uk-border)"
        }`,
        borderRadius: 14,
        background: typing
          ? "color-mix(in srgb, var(--uk-success) 8%, var(--uk-surface))"
          : "var(--uk-surface)",
        textAlign: "center",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: typing ? "var(--uk-success)" : "var(--uk-text-muted)",
          }}
        >
          {typing ? "已开始输入" : "等待输入"}
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12.5,
            color: "var(--uk-text-muted)",
          }}
        >
          点一下空白处后按字母键；输入框里的内容不会触发。
        </p>
      </div>
    </div>
  );
}

export function Demo() {
  const [run, setRun] = useState(0);

  return (
    <div style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      <Probe key={run} />
      <div>
        <Button size="sm" variant="outline" onClick={() => setRun(run + 1)}>
          重新开始
        </Button>
      </div>
    </div>
  );
}
