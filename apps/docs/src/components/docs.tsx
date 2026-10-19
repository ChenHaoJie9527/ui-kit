import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCopyToClipboard } from "@chenhaojie9527/ui-kit-hooks";
import { TableOfContents } from "./table-of-contents";

export interface TocEntry {
  id: string;
  label: string;
}

type TocRegister = (entry: TocEntry) => () => void;

// 拆成两个 context：注册函数保持稳定，条目变化只让目录重新渲染，
// 不会让每个 Section 都跟着重跑 effect。
const TocEntriesContext = createContext<TocEntry[]>([]);
const TocRegisterContext = createContext<TocRegister | null>(null);

/**
 * 把标题转成 URL 安全的锚点 id。
 *
 * 保留中日韩文字与数字，其余标点去掉，空白折叠成连字符。
 */
export function slugifyHeading(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug.length > 0 ? slug : "section";
}

export interface PageProps {
  kind: string;
  title: string;
  description: ReactNode;
  tags?: string[];
  children: ReactNode;
}

/**
 * 文档页外壳。
 *
 * 负责页面标题区、章节收集（供右侧目录使用）以及目录/正文的双栏布局。
 * 窄屏时目录降到正文上方。
 */
export function Page({ kind, title, description, tags, children }: PageProps) {
  const [entries, setEntries] = useState<TocEntry[]>([]);

  const register = useCallback<TocRegister>((entry) => {
    setEntries((previous) =>
      previous.some((item) => item.id === entry.id)
        ? previous
        : [...previous, entry],
    );

    return () => {
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
    };
  }, []);

  return (
    <TocRegisterContext.Provider value={register}>
      <TocEntriesContext.Provider value={entries}>
        <div className="grid items-start gap-12 max-desk:gap-0 desk:grid-cols-[minmax(0,1fr)_200px]">
          <TableOfContents />
          <article className="row-start-2 min-w-0 desk:col-start-1 desk:row-start-1">
            <header className="border-b border-line pb-[22px]">
              <p className="mb-2.5 font-mono text-[11.5px] font-medium tracking-[0.1em] text-accent uppercase">
                {kind}
              </p>
              <h1 className="m-0 text-[clamp(32px,4vw,42px)] leading-[1.1] font-bold tracking-[-0.035em] phone:text-[32px]">
                {title}
              </h1>
              <p className="mt-3.5 max-w-[70ch] text-base leading-[1.7] text-muted phone:text-[15px]">
                {description}
              </p>
              {tags && tags.length > 0 ? (
                <ul
                  className="mt-[18px] flex list-none flex-wrap gap-[7px] p-0"
                  aria-label="特性"
                >
                  {tags.map((tag) => (
                    <li
                      className="rounded-full border border-line bg-surface-2 px-[9px] py-0.5 text-[11.5px] text-muted"
                      key={tag}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </header>
            {children}
          </article>
        </div>
      </TocEntriesContext.Provider>
    </TocRegisterContext.Provider>
  );
}

export interface SectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** 自定义锚点 id；默认由标题生成。 */
  id?: string;
}

/**
 * 正文里的一个章节，会带一个稳定的锚点 id，并自动登记到页面目录。
 *
 * 直接子元素统一 16px 上边距，免去每个原语各自声明间距。
 */
export function Section({ title, description, children, id }: SectionProps) {
  const register = useContext(TocRegisterContext);
  const sectionId = id ?? slugifyHeading(title);

  useEffect(() => {
    if (!register) {
      return;
    }

    return register({ id: sectionId, label: title });
  }, [register, sectionId, title]);

  return (
    <section
      className="mt-[46px] scroll-mt-[calc(var(--doc-topbar-height)+24px)]"
      id={sectionId}
    >
      <h2 className="m-0 text-[21px] font-[650] tracking-[-0.02em]">
        {title}
      </h2>
      {description ? (
        <p className="mt-[7px] max-w-[70ch] text-[14.5px] text-muted">
          {description}
        </p>
      ) : null}
      <div className="[&>*]:mt-4">{children}</div>
    </section>
  );
}

export function useTocEntries(): TocEntry[] {
  return useContext(TocEntriesContext);
}

export interface DemoProps {
  children: ReactNode;
  code: string;
  /** 代码块右上角的文件名或语言标签。 */
  label?: string;
}

export function Demo({ children, code, label }: DemoProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="demo-grid p-[26px] phone:p-[18px]">{children}</div>
      <CodeBlock flush code={code} label={label} />
    </div>
  );
}

export interface CodeBlockProps {
  code: string;
  label?: string;
  /** 嵌在 Demo 里时只保留顶部分隔线，不再叠一层外框。 */
  flush?: boolean;
}

export function CodeBlock({ code, label = "tsx", flush = false }: CodeBlockProps) {
  const [state, copy] = useCopyToClipboard();
  const copied = state.copied && state.value === code;

  const shell = flush
    ? "overflow-hidden rounded-none border-t border-line bg-code"
    : "overflow-hidden rounded-xl border border-line bg-code";

  return (
    <div className={shell}>
      <div className="flex h-[38px] items-center justify-between border-b border-white/[0.07] bg-white/[0.025] pr-3 pl-4">
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-code-muted uppercase">
          {label}
        </span>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-white/[0.14] bg-transparent px-[9px] py-[3px] font-mono text-[11px] text-code-ink transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          onClick={() => {
            void copy(code);
          }}
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto px-[18px] py-4 text-[12.5px] leading-[1.75] break-words whitespace-pre-wrap text-code-ink [tab-size:2]">
        <code>{code}</code>
      </pre>
      <span className="sr-only" aria-live="polite">
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

const thClass =
  "border-b border-line bg-surface-2 px-3.5 py-[11px] text-left text-[11.5px] font-semibold tracking-[0.03em] whitespace-nowrap text-muted";

const cellClass = "border-b border-line px-3.5 py-[11px] align-top";

const codeChip = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-xs";

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th scope="col" className={thClass}>
              属性
            </th>
            <th scope="col" className={thClass}>
              类型
            </th>
            <th scope="col" className={thClass}>
              默认值
            </th>
            <th scope="col" className={thClass}>
              说明
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="[&:last-child>*]:border-b-0">
              <th
                scope="row"
                className={`${cellClass} text-left font-medium whitespace-nowrap text-ink`}
              >
                <code className={`${codeChip} text-accent-strong`}>
                  {row.name}
                </code>
                {row.required ? (
                  <span
                    className="ml-1.5 rounded-full bg-accent/15 px-[5px] py-0 text-[10px] font-semibold text-accent-strong"
                    title="必填"
                  >
                    必填
                  </span>
                ) : null}
              </th>
              <td className={cellClass}>
                <code className={`${codeChip} text-ink`}>{row.type}</code>
              </td>
              <td className={cellClass}>
                {row.defaultValue ? (
                  <code className={`${codeChip} text-accent-strong`}>
                    {row.defaultValue}
                  </code>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </td>
              <td className={cellClass}>{row.description}</td>
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
  const warning = tone === "warning";

  return (
    <aside
      className={
        warning
          ? "rounded-[10px] border border-warning/30 bg-[color-mix(in_srgb,var(--doc-warning)_9%,var(--doc-surface))] px-4 py-3.5 text-[13.5px]"
          : "rounded-[10px] border border-accent/25 bg-accent-soft px-4 py-3.5 text-[13.5px]"
      }
    >
      {title ? (
        <p className="mt-0 mb-[3px] font-[650] text-ink">{title}</p>
      ) : null}
      <div className="[&_p]:m-0">{children}</div>
    </aside>
  );
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 list-disc pl-[19px] [&_li]:my-[7px] [&_li::marker]:text-accent">
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key -- 静态文案列表，顺序不变
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] border border-line bg-surface-2 px-[5px] py-px text-[0.88em]">
      {children}
    </code>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  );
}

/** 状态文本，用于演示里展示当前值。 */
export function Readout({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="m-0 flex items-baseline gap-2 text-[12.5px] text-muted">
      <span>{label}</span>
      <code className="rounded-md bg-surface px-[7px] py-px text-xs text-ink">
        {value}
      </code>
    </p>
  );
}

export function useDemoToggle(
  initial = false,
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initial);
  return [value, () => setValue((prev) => !prev), setValue];
}
