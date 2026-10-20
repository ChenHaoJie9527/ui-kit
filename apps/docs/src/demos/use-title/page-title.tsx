import { useRef, useState } from "react";
import { Button, Input } from "@seam/ui";
import { useTitle } from "@seam/hooks";

export function Demo() {
  const original = useRef(document.title);
  const [title, setTitle] = useState(document.title);
  useTitle(title, { restoreOnUnmount: true });

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          aria-label="页面标题"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button variant="outline" onClick={() => setTitle(original.current)}>
          还原
        </Button>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        当前 document.title：
        <code style={{ fontFamily: "var(--uk-font-mono)", marginLeft: 4 }}>
          {title || "（空）"}
        </code>
      </p>
    </div>
  );
}
