import { useMemo, useState } from "react";
import { Button } from "@seam/ui";
import { useObservable } from "@seam/hooks";

const INITIAL_PRICE = 128.4;

function createPriceStream(interval = 1200) {
  return {
    subscribe(observer = { next(_value = 0) {} }) {
      let price = 128.4;
      const timer = setInterval(() => {
        price = Math.max(80, price + (Math.random() - 0.48) * 4);
        observer.next(Number(price.toFixed(2)));
      }, interval);

      return {
        unsubscribe() {
          clearInterval(timer);
        },
      };
    },
  };
}

export function Demo() {
  const [interval, setInterval] = useState(1200);
  const stream = useMemo(() => createPriceStream(interval), [interval]);
  const price = useObservable(stream, INITIAL_PRICE);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        maxWidth: 360,
        border: "1px solid var(--uk-border)",
        borderRadius: 14,
        padding: 20,
        background:
          "linear-gradient(145deg, var(--uk-surface-raised), var(--uk-surface))",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--uk-text-muted)",
          }}
        >
          实时价格
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 38,
            lineHeight: 1.1,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
          }}
        >
          ¥{price?.toFixed(2) ?? "—"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          variant={interval === 600 ? "primary" : "outline"}
          onClick={() => setInterval(600)}
        >
          600ms
        </Button>
        <Button
          size="sm"
          variant={interval === 1200 ? "primary" : "outline"}
          onClick={() => setInterval(1200)}
        >
          1200ms
        </Button>
        <Button
          size="sm"
          variant={interval === 2400 ? "primary" : "outline"}
          onClick={() => setInterval(2400)}
        >
          2400ms
        </Button>
      </div>
    </div>
  );
}
