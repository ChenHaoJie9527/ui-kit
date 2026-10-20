import { useState } from "react";
import { Switch } from "seam-react";
import { useControllableState } from "seam-hooks";

export function Demo() {
  const [controlled, setControlled] = useState(true);
  const [events, setEvents] = useState(["还没有变化"]);

  const log = (mode = "", next = false) => {
    setEvents((previous) =>
      [`${mode} → ${next ? "开启" : "关闭"}`, ...previous].slice(0, 5),
    );
  };

  const [controlledValue, setControlledValue] = useControllableState({
    value: controlled,
    defaultValue: true,
    onChange: (next) => {
      setControlled(next);
      log("受控", next);
    },
  });

  const [uncontrolledValue, setUncontrolledValue] = useControllableState({
    defaultValue: true,
    onChange: (next) => log("非受控", next),
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
        <Switch checked={controlledValue} onCheckedChange={setControlledValue}>
          受控：{controlledValue ? "开启" : "关闭"}
        </Switch>
        <Switch
          checked={uncontrolledValue}
          onCheckedChange={setUncontrolledValue}
        >
          非受控：{uncontrolledValue ? "开启" : "关闭"}
        </Switch>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>onChange 记录</p>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: 4,
            fontFamily: "var(--uk-font-mono)",
          }}
        >
          {events.map((event, index) => (
            // eslint-disable-next-line react/no-array-index-key -- 记录可能重复，索引只用于当前快照
            <li key={`${event}-${index}`}>{event}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
