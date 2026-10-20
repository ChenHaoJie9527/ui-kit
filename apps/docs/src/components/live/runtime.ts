import type { ComponentType } from "react";
import * as React from "react";
import * as hooks from "@seam/hooks";
import * as ui from "@seam/ui";
import { compileDemoSource } from "./compile";

/** React 自带、示例里不需要 import 的符号。 */
const REACT_BINDINGS = [
  "Fragment",
  "StrictMode",
  "createContext",
  "forwardRef",
  "memo",
  "startTransition",
  "use",
  "useActionState",
  "useCallback",
  "useContext",
  "useDebugValue",
  "useDeferredValue",
  "useEffect",
  "useId",
  "useImperativeHandle",
  "useInsertionEffect",
  "useLayoutEffect",
  "useMemo",
  "useOptimistic",
  "useReducer",
  "useRef",
  "useState",
  "useSyncExternalStore",
  "useTransition",
];

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** 保留原始错误链，又不用把 lib 提到 ES2022。 */
function withCause(message: string, cause: unknown): Error {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
}

function bindingsOf(module: Record<string, unknown>): string[] {
  return Object.keys(module).filter((name) => IDENTIFIER.test(name));
}

/**
 * 把一段示例源码变成可渲染的组件。
 *
 * 所有符号在运行时注入，示例里的 import 只用于「复制到项目里」时保持完整：
 * React、React 的 hooks、ui-kit 的全部 hooks 与组件都直接在作用域里。
 */
export function createDemoComponent(source: string): ComponentType {
  const body = compileDemoSource(source);
  const prelude = [
    `const { ${REACT_BINDINGS.join(", ")} } = React;`,
    `const { ${bindingsOf(hooks).join(", ")} } = hooks;`,
    `const { ${bindingsOf(ui).join(", ")} } = ui;`,
  ].join("\n");

  // 语法错误会在 new Function 构造阶段抛出，调用阶段也可能抛，两个都要包住。
  let component: ComponentType | null;

  try {
    const factory = new Function(
      "React",
      "hooks",
      "ui",
      `${prelude}\n${body}\n;return typeof Demo === "function" ? Demo : null;`,
    );

    component = factory(React, hooks, ui) as ComponentType | null;
  } catch (caught) {
    // 语法错误发生在 JSX 之外时，V8 不会给行列号，只能把它包成可读的消息。
    throw withCause(
      `语法错误：${caught instanceof Error ? caught.message : String(caught)}`,
      caught,
    );
  }

  if (!component) {
    throw new Error(
      "示例需要声明一个名为 Demo 的组件：export function Demo() { ... }",
    );
  }

  return component;
}
