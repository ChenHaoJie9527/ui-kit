import { useState } from "react";
import { Button } from "seam-react";
import { useCounter } from "seam-hooks";

const MAX_RETRIES = 3;

export function Demo() {
  const [attempt, setAttempt] = useState(0);
  const [retryCount, { increment, reset }] = useCounter({
    value: attempt,
    defaultValue: 0,
    min: 0,
    max: MAX_RETRIES,
    onChange: setAttempt,
  });

  const canRetry = retryCount < MAX_RETRIES;
  const remaining = MAX_RETRIES - retryCount;

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 500 }}>
      <div
        style={{
          display: "grid",
          gap: 14,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--uk-surface-raised)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: "var(--uk-text-muted)",
              }}
            >
              订单同步
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 16,
                fontWeight: 650,
                color: canRetry ? "var(--uk-danger)" : "var(--uk-text)",
              }}
            >
              {canRetry ? "同步失败，可以重试" : "重试次数已用完"}
            </p>
          </div>
          <code
            style={{
              fontFamily: "var(--uk-font-mono)",
              fontSize: 12,
              color: "var(--uk-text-muted)",
            }}
          >
            最多 {MAX_RETRIES} 次
          </code>
        </div>

        <progress
          aria-label="已使用重试次数"
          value={retryCount}
          max={MAX_RETRIES}
          style={{ width: "100%", accentColor: "var(--uk-accent)" }}
        />

        <p
          aria-live="polite"
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--uk-text-muted)",
          }}
        >
          已重试 {retryCount} 次，剩余 {remaining} 次
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button disabled={!canRetry} onClick={() => increment()}>
            重试一次
          </Button>
          <Button variant="outline" onClick={reset}>
            重新开始
          </Button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        这个示例使用受控模式：业务组件持有尝试次数，hook 通过 onChange
        回写裁剪后的新值。
      </p>
    </div>
  );
}
