import { Button } from "seam-react";
import { useCounter } from "seam-hooks";

export function Demo() {
  const [quantity, { increment, decrement, set, reset }] = useCounter({
    defaultValue: 2,
    min: 1,
    max: 5,
  });

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      <div
        style={{
          display: "grid",
          gap: 12,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--uk-surface-raised)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
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
              购买数量
            </p>
            <p
              aria-live="polite"
              style={{
                margin: "4px 0 0",
                fontSize: 32,
                lineHeight: 1.1,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {quantity}
            </p>
          </div>
          <code
            style={{
              fontFamily: "var(--uk-font-mono)",
              fontSize: 12,
              color: "var(--uk-text-muted)",
            }}
          >
            min 1 · max 5 · step 1
          </code>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button
            aria-label="减少数量"
            disabled={quantity === 1}
            onClick={() => decrement()}
            variant="outline"
          >
            −
          </Button>
          <Button
            aria-label="增加数量"
            disabled={quantity === 5}
            onClick={() => increment()}
          >
            +
          </Button>
          <Button variant="ghost" onClick={reset}>
            重置
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button size="sm" variant="outline" onClick={() => set(0)}>
          set(0) → 1
        </Button>
        <Button size="sm" variant="outline" onClick={() => set(9)}>
          set(9) → 5
        </Button>
        <Button size="sm" variant="ghost" onClick={() => increment(2)}>
          increment(2)
        </Button>
      </div>
    </div>
  );
}
