/**
 * 文档里的实时示例需要一小段「JSX → React.createElement」编译器。
 *
 * 为什么不引入 Babel / sucrase：文档站要能离线构建，示例又是我们自己
 * 写的、风格可控。这里实现的是 JSX 的常用子集：
 *
 * - 元素、自闭合标签、Fragment、嵌套组件
 * - 字符串属性、表达式属性、`{...spread}`、布尔属性
 * - 表达式子节点（含 `map` 里返回 JSX）
 * - 顶层 `import` / `export` 会被移除，符号由运行时统一注入
 *
 * 不支持 TypeScript 类型标注。遇到无法解析的语法时抛出 DemoCompileError，
 * 编辑器会显示带行列号的提示。
 */

export class DemoCompileError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, source: string, offset: number) {
    const head = source.slice(0, Math.max(0, offset));
    const line = head.split("\n").length;
    const column = offset - head.lastIndexOf("\n");
    super(`第 ${line} 行第 ${column} 列：${message}`);
    this.name = "DemoCompileError";
    this.line = line;
    this.column = column;
  }
}

/** 这些字符出现在 `<` 前面时，`<` 更可能开启一个 JSX 元素。 */
const JSX_PREV_CHARS = "([{,=:?;!&|>+-*/%^~";

/** `return <div />` 这类关键字后面也允许直接跟 JSX。 */
const JSX_PREV_WORDS = new Set([
  "return",
  "yield",
  "await",
  "else",
  "case",
  "default",
  "do",
  "in",
  "of",
  "throw",
]);

const IDENTIFIER_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

interface ParsedElement {
  code: string;
  next: number;
}

interface BracedExpression {
  inner: string;
  next: number;
}

/**
 * 把示例源码编译成可执行的函数体。
 *
 * 输出里仍然保留用户写的其他语句，只做了两件事：
 * 1. 去掉 import / export；
 * 2. 把 JSX 换成 `React.createElement(...)`。
 */
export function compileDemoSource(source: string): string {
  return transformRange(source, 0, source.length);
}

function transformRange(source: string, start: number, end: number): string {
  let out = "";
  let index = start;
  let previousSignificant = "";
  let previousWord = "";
  let afterExport = false;

  while (index < end) {
    const char = source.charAt(index);

    if (char === '"' || char === "'") {
      const next = skipQuoted(source, index, end);
      out += source.slice(index, next);
      index = next;
      previousSignificant = char;
      previousWord = "";
      continue;
    }

    if (char === "`") {
      const next = skipTemplate(source, index, end);
      out += source.slice(index, next);
      index = next;
      previousSignificant = "`";
      previousWord = "";
      continue;
    }

    if (char === "/" && source.charAt(index + 1) === "/") {
      const next = skipLineComment(source, index, end);
      out += source.slice(index, next);
      index = next;
      continue;
    }

    if (char === "/" && source.charAt(index + 1) === "*") {
      const next = skipBlockComment(source, index, end);
      out += source.slice(index, next);
      index = next;
      continue;
    }

    if (
      char === "<" &&
      isJsxStart(source, index, previousSignificant, previousWord)
    ) {
      const element = parseElement(source, index, end);
      out += element.code;
      index = element.next;
      previousSignificant = ">";
      previousWord = "";
      afterExport = false;
      continue;
    }

    if (isIdentifierStart(char)) {
      let next = index + 1;
      while (next < end && isIdentifierPart(source.charAt(next))) {
        next += 1;
      }
      const word = source.slice(index, next);

      // import ... from "x"：整条语句移除，符号由运行时注入。
      if (
        word === "import" &&
        isStatementStart(previousSignificant) &&
        source.charAt(next) !== "(" &&
        source.charAt(next) !== "."
      ) {
        index = skipImport(source, next, end);
        out += "\n";
        previousSignificant = ";";
        previousWord = "";
        continue;
      }

      // export：只去掉关键字，保留后面的声明。
      if (word === "export" && isStatementStart(previousSignificant)) {
        index = next;
        afterExport = true;
        previousSignificant = ";";
        previousWord = "export";
        continue;
      }

      if (word === "default" && afterExport) {
        index = next;
        afterExport = false;
        previousSignificant = ";";
        previousWord = "default";
        continue;
      }

      out += word;
      index = next;
      previousSignificant = source.charAt(next - 1);
      previousWord = word;
      afterExport = false;
      continue;
    }

    out += char;
    index += 1;

    if (!isWhitespace(char)) {
      previousSignificant = char;
      previousWord = "";
      afterExport = false;
    }
  }

  return out;
}

function isStatementStart(previousSignificant: string): boolean {
  return (
    previousSignificant === "" ||
    previousSignificant === ";" ||
    previousSignificant === "}"
  );
}

function isJsxStart(
  source: string,
  index: number,
  previousSignificant: string,
  previousWord: string,
): boolean {
  const next = source.charAt(index + 1);

  if (next === "") {
    return false;
  }

  if (!isIdentifierStart(next) && next !== ">") {
    return false;
  }

  if (JSX_PREV_WORDS.has(previousWord)) {
    return true;
  }

  return (
    previousSignificant === "" || JSX_PREV_CHARS.includes(previousSignificant)
  );
}

/**
 * import 语句可能跨行（具名导入），所以按「顶层分号」判断结束。
 * 没有写分号时退回到行尾。
 */
function skipImport(source: string, start: number, end: number): number {
  let index = start;
  let depth = 0;

  while (index < end) {
    const char = source.charAt(index);

    if (char === '"' || char === "'") {
      index = skipQuoted(source, index, end);
      continue;
    }
    if (char === "`") {
      index = skipTemplate(source, index, end);
      continue;
    }
    if (char === "/" && source.charAt(index + 1) === "/") {
      index = skipLineComment(source, index, end);
      continue;
    }
    if (char === "/" && source.charAt(index + 1) === "*") {
      index = skipBlockComment(source, index, end);
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    } else if (char === ";" && depth <= 0) {
      return index + 1;
    } else if (char === "\n" && depth <= 0) {
      return index + 1;
    }

    index += 1;
  }

  return index;
}

function parseElement(
  source: string,
  start: number,
  end: number,
): ParsedElement {
  let index = start + 1;

  // Fragment：<> ... </>
  if (source.charAt(index) === ">") {
    const children = parseChildren(source, index + 1, end, null, start);
    return {
      code: createElementCode("React.Fragment", [], children.codes),
      next: children.next,
    };
  }

  const tag = readTagName(source, index, end);
  index = tag.next;

  const props: string[] = [];
  let selfClosing = false;

  for (;;) {
    index = skipWhitespace(source, index, end);

    if (index >= end) {
      throw new DemoCompileError(`<${tag.name}> 没有闭合`, source, start);
    }

    if (source.charAt(index) === "/" && source.charAt(index + 1) === ">") {
      selfClosing = true;
      index += 2;
      break;
    }

    if (source.charAt(index) === ">") {
      index += 1;
      break;
    }

    if (source.charAt(index) === "{") {
      const expression = readBracedExpression(source, index, end);
      const inner = expression.inner.trim();

      if (!inner.startsWith("...")) {
        throw new DemoCompileError(
          "标签内只支持 `{...spread}`，其他写法请写成 name={value}",
          source,
          index,
        );
      }

      props.push(`...(${inner.slice(3).trim()})`);
      index = expression.next;
      continue;
    }

    const attribute = readAttributeName(source, index, end);
    index = skipWhitespace(source, attribute.next, end);

    if (source.charAt(index) !== "=") {
      props.push(`${formatPropKey(attribute.name)}: true`);
      continue;
    }

    index = skipWhitespace(source, index + 1, end);
    const value = readAttributeValue(source, index, end);
    props.push(`${formatPropKey(attribute.name)}: ${value.code}`);
    index = value.next;
  }

  if (selfClosing) {
    return {
      code: createElementCode(tagExpression(tag.name), props, []),
      next: index,
    };
  }

  const children = parseChildren(source, index, end, tag.name, start);

  return {
    code: createElementCode(tagExpression(tag.name), props, children.codes),
    next: children.next,
  };
}

function parseChildren(
  source: string,
  start: number,
  end: number,
  tagName: string | null,
  elementStart: number,
): { codes: string[]; next: number } {
  const codes: string[] = [];
  let index = start;
  let textStart = start;

  const flushText = (until: number) => {
    if (until <= textStart) {
      return;
    }

    const text = normalizeText(source.slice(textStart, until));
    if (text.length > 0) {
      codes.push(JSON.stringify(text));
    }
  };

  while (index < end) {
    const char = source.charAt(index);

    if (char === "{") {
      flushText(index);
      const expression = readBracedExpression(source, index, end);
      const inner = expression.inner.trim();

      // {/* 注释 */} 在 JSX 里是合法子节点，但不产生内容。
      if (inner.length > 0 && !isCommentOnly(inner)) {
        codes.push(
          `(${transformRange(source, index + 1, expression.next - 1)})`,
        );
      }

      index = expression.next;
      textStart = index;
      continue;
    }

    if (char === "<") {
      if (source.charAt(index + 1) === "/") {
        flushText(index);
        return finishClosingTag(
          source,
          index,
          end,
          tagName,
          elementStart,
          codes,
        );
      }

      flushText(index);
      const child = parseElement(source, index, end);
      codes.push(child.code);
      index = child.next;
      textStart = index;
      continue;
    }

    index += 1;
  }

  throw new DemoCompileError(
    tagName === null
      ? "Fragment 缺少闭合标签 </>"
      : `<${tagName}> 缺少闭合标签 </${tagName}>`,
    source,
    elementStart,
  );
}

function finishClosingTag(
  source: string,
  start: number,
  end: number,
  tagName: string | null,
  elementStart: number,
  codes: string[],
): { codes: string[]; next: number } {
  let index = skipWhitespace(source, start + 2, end);

  if (tagName === null) {
    if (source.charAt(index) !== ">") {
      throw new DemoCompileError("Fragment 的闭合标签应为 </>", source, start);
    }

    return { codes, next: index + 1 };
  }

  const closing = readTagName(source, index, end);

  if (closing.name !== tagName) {
    throw new DemoCompileError(
      `闭合标签 </${closing.name}> 与 <${tagName}> 不匹配`,
      source,
      start,
    );
  }

  index = skipWhitespace(source, closing.next, end);

  if (source.charAt(index) !== ">") {
    throw new DemoCompileError(`闭合标签 </${tagName}> 缺少 >`, source, start);
  }

  return { codes, next: index + 1 };
}

function createElementCode(
  tag: string,
  props: string[],
  children: string[],
): string {
  const propsCode = props.length > 0 ? `{ ${props.join(", ")} }` : "null";
  const childrenCode = children.map((child) => `, ${child}`).join("");

  return `React.createElement(${tag}, ${propsCode}${childrenCode})`;
}

function tagExpression(name: string): string {
  const intrinsic = /^[a-z]/.test(name) || name.includes("-");
  return intrinsic ? JSON.stringify(name) : name;
}

function formatPropKey(name: string): string {
  return IDENTIFIER_NAME.test(name) ? name : JSON.stringify(name);
}

function readTagName(
  source: string,
  start: number,
  end: number,
): { name: string; next: number } {
  let index = start;

  while (index < end) {
    const char = source.charAt(index);
    if (/[A-Za-z0-9_$.-]/.test(char)) {
      index += 1;
      continue;
    }
    break;
  }

  const name = source.slice(start, index);

  if (name.length === 0) {
    throw new DemoCompileError("无法识别的标签名", source, start);
  }

  return { name, next: index };
}

function readAttributeName(
  source: string,
  start: number,
  end: number,
): { name: string; next: number } {
  let index = start;

  while (index < end) {
    const char = source.charAt(index);
    if (/[A-Za-z0-9_$:-]/.test(char)) {
      index += 1;
      continue;
    }
    break;
  }

  const name = source.slice(start, index);

  if (name.length === 0) {
    throw new DemoCompileError("属性名不合法", source, start);
  }

  return { name, next: index };
}

function readAttributeValue(
  source: string,
  start: number,
  end: number,
): { code: string; next: number } {
  const char = source.charAt(start);

  if (char === '"' || char === "'") {
    const next = skipQuoted(source, start, end);
    return { code: source.slice(start, next), next };
  }

  if (char === "{") {
    const expression = readBracedExpression(source, start, end);
    const inner = expression.inner.trim();

    if (inner.length === 0) {
      throw new DemoCompileError("属性值为空", source, start);
    }

    return {
      code: `(${transformRange(source, start + 1, expression.next - 1)})`,
      next: expression.next,
    };
  }

  if (char === "<") {
    const element = parseElement(source, start, end);
    return { code: element.code, next: element.next };
  }

  throw new DemoCompileError(
    "属性值需要是字符串、{表达式} 或 JSX 元素",
    source,
    start,
  );
}

/** 从 `{` 开始找到配对的 `}`，跳过字符串、模板字面量与注释。 */
function readBracedExpression(
  source: string,
  start: number,
  end: number,
): BracedExpression {
  let depth = 1;
  let index = start + 1;

  while (index < end) {
    const char = source.charAt(index);

    if (char === '"' || char === "'") {
      index = skipQuoted(source, index, end);
      continue;
    }
    if (char === "`") {
      index = skipTemplate(source, index, end);
      continue;
    }
    if (char === "/" && source.charAt(index + 1) === "/") {
      index = skipLineComment(source, index, end);
      continue;
    }
    if (char === "/" && source.charAt(index + 1) === "*") {
      index = skipBlockComment(source, index, end);
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          inner: source.slice(start + 1, index),
          next: index + 1,
        };
      }
    }

    index += 1;
  }

  throw new DemoCompileError("花括号没有闭合", source, start);
}

function skipQuoted(source: string, start: number, end: number): number {
  const quote = source.charAt(start);
  let index = start + 1;

  while (index < end) {
    const char = source.charAt(index);

    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === quote) {
      return index + 1;
    }

    index += 1;
  }

  throw new DemoCompileError("字符串没有闭合", source, start);
}

function skipTemplate(source: string, start: number, end: number): number {
  let index = start + 1;

  while (index < end) {
    const char = source.charAt(index);

    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "`") {
      return index + 1;
    }
    if (char === "$" && source.charAt(index + 1) === "{") {
      index = readBracedExpression(source, index + 1, end).next;
      continue;
    }

    index += 1;
  }

  throw new DemoCompileError("模板字符串没有闭合", source, start);
}

function skipLineComment(source: string, start: number, end: number): number {
  let index = start + 2;

  while (index < end && source.charAt(index) !== "\n") {
    index += 1;
  }

  return index;
}

function skipBlockComment(source: string, start: number, end: number): number {
  let index = start + 2;

  while (index < end) {
    if (source.charAt(index) === "*" && source.charAt(index + 1) === "/") {
      return index + 2;
    }
    index += 1;
  }

  throw new DemoCompileError("块注释没有闭合", source, start);
}

function skipWhitespace(source: string, start: number, end: number): number {
  let index = start;

  while (index < end && isWhitespace(source.charAt(index))) {
    index += 1;
  }

  return index;
}

function isWhitespace(char: string): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}

function isCommentOnly(value: string): boolean {
  return value.startsWith("/*") && value.endsWith("*/");
}

/**
 * 按 JSX 的规则处理子节点里的空白：
 * 含换行的空白折叠成一个空格，纯空白行丢弃，首尾换行处的空格去掉。
 */
function normalizeText(raw: string): string {
  if (!raw.includes("\n")) {
    return raw;
  }

  let text = raw.replace(/[ \t]*\n[ \t]*/g, " ");

  if (text.trim().length === 0) {
    return "";
  }
  if (/^\s*\n/.test(raw)) {
    text = text.replace(/^ +/, "");
  }
  if (/\n\s*$/.test(raw)) {
    text = text.replace(/ +$/, "");
  }

  return text;
}
