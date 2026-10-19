import { BulletList, CodeBlock, Page, Section } from "../components/docs";
import { hookGroupOf, type HookDoc } from "../content/hooks";

function sourcePath(name: string): string {
  return `packages/hooks/src/${name}.ts`;
}

export function HookPage({ doc }: { doc: HookDoc }) {
  return (
    <Page
      kind="Hook"
      title={doc.name}
      description={doc.description}
      tags={[hookGroupOf(doc), "无渲染", "可单测"]}
    >
      <Section title="引入">
        <CodeBlock
          code={`import { ${doc.name} } from "@chenhaojie9527/ui-kit-hooks";`}
        />
      </Section>

      <Section title="签名">
        <CodeBlock code={doc.signature} label="typescript" />
      </Section>

      <Section title="用法">
        <CodeBlock code={doc.example} label="tsx" />
      </Section>

      {doc.notes.length > 0 ? (
        <Section title="说明">
          <BulletList items={doc.notes} />
        </Section>
      ) : null}

      <Section title="源码">
        <CodeBlock
          code={`// ${sourcePath(doc.name)}
// 实现与测试都在 packages/hooks 内，可单独引入。`}
          label="path"
        />
      </Section>
    </Page>
  );
}
