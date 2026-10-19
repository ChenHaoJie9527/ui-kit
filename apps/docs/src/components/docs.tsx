import { useState, type ReactNode } from "react";
import { useCopyToClipboard } from "@ui-kit/hooks";

export interface PageProps {
  kind: string;
  title: string;
  description: ReactNode;
  tags?: string[];
  children: ReactNode;
}

export function Page({ kind, title, description, tags, children }: PageProps) {
  return (
    <article className="doc-page">
      <header className="doc-page__header">
        <p className="doc-eyebrow">{kind}</p>
        <h1 className="doc-title">{title}</h1>
        <p className="doc-lede">{description}</p>
        {tags && tags.length > 0 ? (
          <ul className="doc-tags" aria-label="特性">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </header>
      {children}
    </article>
  );
}

export interface SectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="doc-section">
      <h2 className="doc-section__title">{title}</h2>
      {description ? (
        <p className="doc-section__description">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

export interface DemoProps {
  children: ReactNode;
  code: string;
  /** 代码块右上角的文件名或语言标签。 */
  label?: string;
}

export function Demo({ children, code, label }: DemoProps) {
  return (
    <div className="doc-demo">
      <div className="doc-demo__preview">{children}</div>
      <CodeBlock code={code} label={label} />
    </div>
  );
}

export interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label = "tsx" }: CodeBlockProps) {
  const [state, copy] = useCopyToClipboard();
  const copied = state.copied && state.value === code;

  return (
    <div className="doc-code">
      <div className="doc-code__bar">
        <span className="doc-code__label">{label}</span>
        <button
          type="button"
          className="doc-code__copy"
          onClick={() => {
            void copy(code);
          }}
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="doc-code__pre">
        <code>{code}</code>
      </pre>
      <span className="doc-visually-hidden" aria-live="polite">
        {copied ? "代码已复制到剪贴板" : ""}
      </span>
    </div>
  );
}

export interface PropRow {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
  required?: boolean;
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col">属性</th>
            <th scope="col">类型</th>
            <th scope="col">默认值</th>
            <th scope="col">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
                {row.required ? (
                  <span className="doc-table__required" title="必填">
                    必填
                  </span>
                ) : null}
              </th>
              <td>
                <code className="doc-table__type">{row.type}</code>
              </td>
              <td>
                {row.defaultValue ? (
                  <code>{row.defaultValue}</code>
                ) : (
                  <span className="doc-table__empty">—</span>
                )}
              </td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface CalloutProps {
  tone?: "info" | "warning";
  title?: string;
  children: ReactNode;
}

export function Callout({ tone = "info", title, children }: CalloutProps) {
  return (
    <aside className="doc-callout" data-tone={tone}>
      {title ? <p className="doc-callout__title">{title}</p> : null}
      <div className="doc-callout__body">{children}</div>
    </aside>
  );
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="doc-list">
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key -- 静态文案列表，顺序不变
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="doc-inline-code">{children}</code>;
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="doc-button-row">{children}</div>;
}

/** 状态文本，用于演示里展示当前值。 */
export function Readout({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="doc-readout">
      <span>{label}</span>
      <code>{value}</code>
    </p>
  );
}

export function useDemoToggle(
  initial = false,
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initial);
  return [value, () => setValue((prev) => !prev), setValue];
}
