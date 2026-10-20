import { Highlight, type PrismTheme } from "prism-react-renderer";

/*
 * 代码 token 没有稳定 id：行号与 token 序号在同一次渲染里就是唯一标识，
 * 用索引作 key 反而是正确选择（内容会变，拿内容当 key 会整行重挂）。
 */
/* eslint-disable react/no-array-index-key */

/** 颜色全部指向 CSS 变量，换配色只改 CSS。 */
export const demoTheme: PrismTheme = {
  plain: {
    color: "var(--demo-code-ink)",
    backgroundColor: "transparent",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "var(--demo-code-comment)", fontStyle: "italic" },
    },
    {
      types: ["punctuation"],
      style: { color: "var(--demo-code-punctuation)" },
    },
    {
      types: ["tag", "class-name", "namespace"],
      style: { color: "var(--demo-code-tag)" },
    },
    {
      types: ["attr-name", "property"],
      style: { color: "var(--demo-code-attr)" },
    },
    {
      types: ["attr-value", "string", "char", "inserted"],
      style: { color: "var(--demo-code-string)" },
    },
    {
      types: ["keyword", "atrule", "important"],
      style: { color: "var(--demo-code-keyword)" },
    },
    {
      types: ["function"],
      style: { color: "var(--demo-code-function)" },
    },
    {
      types: ["number", "boolean", "constant", "symbol"],
      style: { color: "var(--demo-code-number)" },
    },
    {
      types: ["operator", "entity", "url"],
      style: { color: "var(--demo-code-operator)" },
    },
    {
      types: ["variable", "regex"],
      style: { color: "var(--demo-code-string)" },
    },
  ],
};

export function CodeHighlight({
  code,
  language = "tsx",
}: {
  code: string;
  language?: string;
}) {
  return (
    <Highlight theme={demoTheme} code={code} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, index) => {
            const lineProps = getLineProps({ line });

            return (
              // 空行如果没有高度，光标放到最后一行时整块会跳一下
              <span
                key={index}
                {...lineProps}
                style={{
                  ...lineProps.style,
                  display: "block",
                  minHeight: "1.75em",
                }}
              >
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            );
          })}
        </>
      )}
    </Highlight>
  );
}
