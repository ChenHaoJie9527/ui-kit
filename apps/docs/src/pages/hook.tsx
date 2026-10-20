import {
  ApiTable,
  BulletList,
  Callout,
  CodeBlock,
  Page,
  PropsTable,
  Section,
} from "../components/docs";
import { LiveDemo } from "../components/live/LiveDemo";
import { hookGroupOf, type HookDoc, type HookNote } from "../content/hooks";
import { getDemo } from "../demos";

const SOURCE_BASE = "https://github.com/ChenHaoJie9527/ui-kit/blob/main";

const SUBHEADING = "m-0 text-[15px] font-semibold tracking-[-0.01em]";

function sourcePath(name: string): string {
  return `packages/hooks/src/${name}.ts`;
}

function toNote(note: string | HookNote): HookNote {
  return typeof note === "string" ? { text: note } : note;
}

/** 补齐了新字段的 Hook 使用「何时使用 / 注意事项 / 用法 / API / 源码」。 */
function HookArticle({ doc }: { doc: HookDoc }) {
  const notes = doc.notes.map(toNote);
  // 有标题的写成提示框，其余收成列表，避免整页都是盒子。
  const highlighted = notes.filter((note) => note.title || note.tone);
  const plain = notes.filter((note) => !note.title && !note.tone);

  return (
    <>
      {doc.whenToUse && doc.whenToUse.length > 0 ? (
        <Section title="何时使用" id="when-to-use">
          <ul className="m-0 grid list-none gap-2 p-0">
            {doc.whenToUse.map((item) => (
              <li
                key={item}
                className="flex gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] leading-[1.65]"
              >
                <span
                  aria-hidden="true"
                  className="mt-px text-[12px] font-bold text-accent"
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {doc.notFor && doc.notFor.length > 0 ? (
            <Callout tone="warning" title="不适合">
              <ul className="m-0 list-disc pl-[18px] [&_li]:my-1">
                {doc.notFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Callout>
          ) : null}
        </Section>
      ) : null}

      {notes.length > 0 ? (
        <Section title="注意事项" id="notes">
          {highlighted.length > 0 ? (
            <div className="grid gap-3">
              {highlighted.map((note) => (
                <Callout key={note.text} tone={note.tone} title={note.title}>
                  {note.text}
                </Callout>
              ))}
            </div>
          ) : null}
          {plain.length > 0 ? (
            <BulletList items={plain.map((note) => note.text)} />
          ) : null}
        </Section>
      ) : null}

      {doc.usage && doc.usage.length > 0 ? (
        <Section title="用法" id="usage">
          <div className="grid gap-8">
            {doc.usage.map((usage) => {
              const demo = getDemo(usage.demo);
              const file = usage.demo.split("/").pop() ?? "Demo";

              return (
                <div key={usage.demo}>
                  <h3 className={SUBHEADING}>{usage.title}</h3>
                  {usage.description ? (
                    <p className="mt-1 mb-0 max-w-[70ch] text-[13.5px] leading-[1.7] text-muted">
                      {usage.description}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <LiveDemo
                      Component={demo.Component}
                      source={demo.source}
                      filename={`${file}.tsx`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {doc.api ? (
        <Section title="API" id="api">
          <CodeBlock code={doc.api.signature} label="typescript" />
          <h3 className={SUBHEADING}>参数</h3>
          <PropsTable rows={doc.api.parameters} firstColumnLabel="参数" />
          <h3 className={SUBHEADING}>返回值</h3>
          <ApiTable rows={doc.api.returns} />
        </Section>
      ) : null}

      <Section title="源码" id="source">
        <a
          className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 no-underline transition-colors hover:border-line-strong hover:bg-surface-2"
          href={`${SOURCE_BASE}/${sourcePath(doc.name)}`}
          target="_blank"
          rel="noreferrer"
        >
          <code className="font-mono text-[12.5px] text-ink">
            {sourcePath(doc.name)}
          </code>
          <span className="text-[12.5px] whitespace-nowrap text-muted">
            在 GitHub 查看 ↗
          </span>
        </a>
      </Section>
    </>
  );
}

/** 还没补内容的页面沿用旧结构，批量迁移期间两套并存。 */
function LegacyArticle({ doc }: { doc: HookDoc }) {
  return (
    <>
      <Section title="引入">
        <CodeBlock code={`import { ${doc.name} } from "@seam/hooks";`} />
      </Section>

      <Section title="签名">
        <CodeBlock code={doc.signature} label="typescript" />
      </Section>

      <Section title="用法">
        <CodeBlock code={doc.example} label="tsx" />
      </Section>

      {doc.notes.length > 0 ? (
        <Section title="说明">
          <BulletList items={doc.notes.map((note) => toNote(note).text)} />
        </Section>
      ) : null}

      <Section title="源码">
        <CodeBlock
          code={`// ${sourcePath(doc.name)}
// 实现与测试都在 packages/hooks 内，可单独引入。`}
          label="path"
        />
      </Section>
    </>
  );
}

export function HookPage({ doc }: { doc: HookDoc }) {
  const interactive = Boolean(doc.usage && doc.usage.length > 0);

  return (
    <Page
      kind="Hook"
      title={doc.name}
      description={doc.description}
      tags={[hookGroupOf(doc), interactive ? "可编辑示例" : "无渲染", "可单测"]}
    >
      {doc.whenToUse || doc.api ? (
        <HookArticle doc={doc} />
      ) : (
        <LegacyArticle doc={doc} />
      )}
    </Page>
  );
}
