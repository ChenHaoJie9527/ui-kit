import { useState } from "react";
import { Button, Input } from "@chenhaojie9527/ui-kit";
import { useSetState } from "@chenhaojie9527/ui-kit-hooks";

export function Demo() {
  const [profile, patch] = useSetState({
    name: "Ada Lovelace",
    role: "Engineer",
    city: "London",
  });
  const [updates, setUpdates] = useState(0);

  const changed = () => setUpdates((count) => count + 1);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
      <div
        style={{
          display: "grid",
          gap: 10,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--uk-surface-raised)",
        }}
      >
        <label
          htmlFor="set-state-name"
          style={{ display: "grid", gap: 5, fontSize: 12.5 }}
        >
          名称
          <Input
            id="set-state-name"
            value={profile.name}
            onChange={(event) => {
              patch({ name: event.target.value });
              changed();
            }}
          />
        </label>
        <label
          htmlFor="set-state-role"
          style={{ display: "grid", gap: 5, fontSize: 12.5 }}
        >
          角色
          <Input
            id="set-state-role"
            value={profile.role}
            onChange={(event) => {
              patch({ role: event.target.value });
              changed();
            }}
          />
        </label>
        <label
          htmlFor="set-state-city"
          style={{ display: "grid", gap: 5, fontSize: 12.5 }}
        >
          城市
          <Input
            id="set-state-city"
            value={profile.city}
            onChange={(event) => {
              patch({ city: event.target.value });
              changed();
            }}
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
        }}
      >
        <code
          style={{
            fontFamily: "var(--uk-font-mono)",
            overflowWrap: "anywhere",
          }}
        >
          {JSON.stringify(profile)}
        </code>
        <span style={{ whiteSpace: "nowrap" }}>{updates} 次 patch</span>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          patch((previous) => ({
            city: previous.city === "London" ? "Paris" : "London",
          }))
        }
      >
        函数式补丁切换城市
      </Button>
    </div>
  );
}
