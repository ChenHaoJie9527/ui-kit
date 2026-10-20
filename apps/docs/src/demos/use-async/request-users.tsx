import { useState } from "react";
import { Button } from "@seam/ui";
import { useAsync } from "@seam/hooks";

const USERS = [
  null,
  { name: "Ada Lovelace", role: "Engineer" },
  { name: "Grace Hopper", role: "Admiral" },
  { name: "Alan Turing", role: "Researcher" },
];

async function fetchUser(id = 1) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (id === 3) {
    throw new Error("用户详情服务暂时不可用");
  }

  return USERS[id];
}

export function Demo() {
  const [userId, setUserId] = useState(1);
  const { value, loading, error } = useAsync(
    () => fetchUser(userId),
    [userId],
    { initialValue: null },
  );

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map((id) => (
          <Button
            key={id}
            size="sm"
            variant={id === userId ? "primary" : "outline"}
            onClick={() => setUserId(id)}
          >
            用户 {id}
          </Button>
        ))}
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
        {loading ? (
          <span style={{ color: "var(--uk-text-muted)", fontSize: 13 }}>
            正在加载用户 {userId}…
          </span>
        ) : null}
        {error ? (
          <span style={{ color: "var(--uk-danger)", fontSize: 13 }}>
            {error.message}
          </span>
        ) : null}
        {!loading && !error && value ? (
          <>
            <strong style={{ fontSize: 16 }}>{value.name}</strong>
            <span style={{ fontSize: 13, color: "var(--uk-text-muted)" }}>
              {value.role}
            </span>
          </>
        ) : null}
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-text-muted)" }}>
        快速切换 1 → 2 → 3，只有最后一次请求的结果会显示。
      </p>
    </div>
  );
}
