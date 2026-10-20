import { useState } from "react";
import { Button, Input } from "@chenhaojie9527/ui-kit";
import { useAsyncFn } from "@chenhaojie9527/ui-kit-hooks";

async function saveProfile(name = "") {
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (!name.trim()) {
    throw new Error("名称不能为空");
  }

  return { id: "usr_42", name: name.trim() };
}

export function Demo() {
  const [name, setName] = useState("Ada");
  const [state, save] = useAsyncFn(saveProfile);

  const submit = async () => {
    try {
      await save(name);
    } catch {
      // 错误已经写入 state，这里负责消费 rejection。
    }
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          aria-label="保存的名称"
          value={name}
          placeholder="留空可触发错误"
          onChange={(event) => setName(event.target.value)}
        />
        <Button loading={state.loading} onClick={submit}>
          {state.loading ? "保存中" : "保存"}
        </Button>
      </div>

      <div
        style={{
          border: "1px solid var(--uk-border)",
          borderRadius: 10,
          padding: 12,
          fontFamily: "var(--uk-font-mono)",
          fontSize: 12.5,
          color: "var(--uk-text-muted)",
          background: "var(--uk-surface)",
        }}
      >
        {state.loading
          ? "loading: true"
          : state.error
            ? `error: ${state.error.message}`
            : state.value
              ? `saved: ${state.value.id} / ${state.value.name}`
              : "idle：点击保存开始"}
      </div>
    </div>
  );
}
