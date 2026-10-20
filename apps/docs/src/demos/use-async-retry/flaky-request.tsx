import { useRef } from "react";
import { Button } from "@seam/ui";
import { useAsyncRetry } from "@seam/hooks";

async function loadReport(attempt = 0) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (attempt <= 2) {
    throw new Error("网络抖动，请重试");
  }

  return {
    orders: 1284,
    revenue: "¥96,420",
  };
}

export function Demo() {
  const attempts = useRef(0);
  const { value, error, loading, retry } = useAsyncRetry(() => {
    attempts.current += 1;
    return loadReport(attempts.current);
  }, []);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
      <div
        style={{
          minHeight: 138,
          display: "grid",
          placeContent: "center",
          gap: 8,
          border: "1px solid var(--uk-border)",
          borderRadius: 12,
          padding: 18,
          textAlign: "center",
          background: "var(--uk-surface-raised)",
        }}
      >
        {loading ? (
          <span style={{ fontSize: 13, color: "var(--uk-text-muted)" }}>
            正在请求…
          </span>
        ) : null}
        {error ? (
          <>
            <strong style={{ color: "var(--uk-danger)", fontSize: 14 }}>
              {error.message}
            </strong>
            <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
              前两次请求会失败，用于演示手动重试。
            </span>
          </>
        ) : null}
        {value ? (
          <>
            <span style={{ fontSize: 12.5, color: "var(--uk-text-muted)" }}>
              今日概览
            </span>
            <strong style={{ fontSize: 28, lineHeight: 1.1 }}>
              {value.orders} 单
            </strong>
            <span style={{ fontSize: 14 }}>{value.revenue}</span>
          </>
        ) : null}
      </div>

      <Button onClick={retry} loading={loading}>
        {error ? "重试" : "再请求一次"}
      </Button>
    </div>
  );
}
