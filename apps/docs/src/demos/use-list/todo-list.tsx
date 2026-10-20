import { useState } from "react";
import { Button, Input } from "@seam/ui";
import { useList } from "@seam/hooks";

const initialTodos = [
  { id: 1, text: "补齐 Hook API", done: false },
  { id: 2, text: "检查移动端", done: true },
  { id: 3, text: "发布文档站", done: false },
];

export function Demo() {
  const [todos, { push, update, remove, sort, filter, reset }] =
    useList(initialTodos);
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();

    if (!text) {
      return;
    }

    push({ id: Date.now(), text, done: false });
    setDraft("");
  };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 500 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          aria-label="新任务"
          placeholder="输入一项任务"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              add();
            }
          }}
        />
        <Button onClick={add}>添加</Button>
      </div>

      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "grid",
          gap: 6,
        }}
      >
        {todos.map((todo, index) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              border: "1px solid var(--uk-border)",
              borderRadius: 9,
              background: "var(--uk-surface-raised)",
            }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              aria-label={`完成 ${todo.text}`}
              onChange={() =>
                update(index, (item) => ({ ...item, done: !item.done }))
              }
            />
            <span
              style={{
                flex: 1,
                fontSize: 13.5,
                textDecoration: todo.done ? "line-through" : "none",
                color: todo.done ? "var(--uk-text-muted)" : "var(--uk-text)",
              }}
            >
              {todo.text}
            </span>
            <Button size="sm" variant="ghost" onClick={() => remove(index)}>
              删除
            </Button>
          </li>
        ))}
      </ul>

      {todos.length === 0 ? (
        <p
          style={{
            margin: 0,
            padding: 14,
            textAlign: "center",
            border: "1px dashed var(--uk-border-strong)",
            borderRadius: 10,
            color: "var(--uk-text-muted)",
            fontSize: 13,
          }}
        >
          列表为空，添加一项试试
        </p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => sort((a, b) => a.text.localeCompare(b.text))}
        >
          按名称排序
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => filter((item) => !item.done)}
        >
          只看未完成
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          重置
        </Button>
      </div>
    </div>
  );
}
