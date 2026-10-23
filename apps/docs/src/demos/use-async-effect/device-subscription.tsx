import { useState } from "react";
import { Button } from "seam-react";
import { useAsyncEffect } from "seam-hooks";

async function connectDevice(device: string) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (device === "thermometer") {
    throw new Error("温度计暂时离线");
  }

  return { device, level: 72 };
}

export function Demo() {
  const [device, setDevice] = useState("sensor-a");
  const [enabled, setEnabled] = useState(true);
  const { status, value, error, cancel } = useAsyncEffect(
    () => connectDevice(device),
    [device, enabled],
    { enabled },
  );

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {["sensor-a", "sensor-b", "thermometer"].map((item) => (
          <Button
            key={item}
            size="sm"
            variant={item === device ? "primary" : "outline"}
            onClick={() => setDevice(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          variant={enabled ? "outline" : "primary"}
          onClick={() => setEnabled((current) => !current)}
        >
          {enabled ? "暂停订阅" : "继续订阅"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => cancel()}>
          忽略结果
        </Button>
      </div>

      <div
        style={{
          minHeight: 108,
          display: "grid",
          alignContent: "center",
          gap: 5,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 18,
          background: "var(--uk-surface-raised)",
        }}
      >
        <span style={{ color: "var(--uk-text-muted)", fontSize: 13 }}>
          status: {status}
        </span>
        {error ? (
          <span style={{ color: "var(--uk-danger)", fontSize: 13 }}>
            {error.message}
          </span>
        ) : null}
        {value ? (
          <strong style={{ fontSize: 16 }}>
            {value.device} · {value.level}%
          </strong>
        ) : null}
      </div>
    </div>
  );
}
