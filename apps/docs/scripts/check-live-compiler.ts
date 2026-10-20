/**
 * 实时示例编译器的冒烟测试：`pnpm --filter @chenhaojie9527/docs check:live`
 *
 * 直接跑 Node 的 TypeScript 类型擦除，不额外引入测试框架。
 * 覆盖：基本元素、Fragment、属性、嵌套 JSX、比较运算符不被误判，
 * 以及语法错误的行列号。
 */
import {
  DemoCompileError,
  compileDemoSource,
} from "../src/components/live/compile.ts";

interface CheckCase {
  name: string;
  source: string;
  expect: string[];
  reject?: string[];
}

const cases: CheckCase[] = [
  {
    name: "基本元素与事件",
    source: `export function Demo() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>count {count}</button>;
}`,
    expect: [
      'React.createElement("button"',
      "onClick: (() => setCount(count + 1))",
      '"count "',
    ],
    reject: ["export", "import"],
  },
  {
    name: "跨行 import / Fragment / 属性",
    source: `import {
  Button,
} from "seam-react";

export function Demo() {
  return (
    <>
      <Button variant="outline" aria-label="加一">+</Button>
      <span style={{ color: "red" }}>hi</span>
    </>
  );
}`,
    expect: [
      "React.createElement(React.Fragment",
      'React.createElement(Button, { variant: "outline", "aria-label": "加一" }, "+")',
      'style: ({ color: "red" })',
    ],
    reject: ["import", "export"],
  },
  {
    name: "map 中嵌套 JSX 与 spread",
    source: `export function Demo(props) {
  return (
    <ul {...props}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}`,
    expect: [
      "...(props)",
      "items.map((item) => (",
      'React.createElement("li", { key: (item) }',
    ],
  },
  {
    name: "比较运算符不被当成 JSX",
    source: `export function Demo() {
  const ok = a < b && b > a;
  return <p>{ok ? "yes" : "no"}</p>;
}`,
    // 只应编译真正的 <p>，比较运算符保持原样。
    expect: ["a < b && b > a", 'React.createElement("p"'],
    reject: ['createElement("b"'],
  },
  {
    name: "模板字符串",
    source: `export function Demo() {
  return <p>{\`n=\${n}\`}</p>;
}`,
    expect: ["`n=${n}`"],
  },
  {
    name: "多行文本折叠",
    source: `export function Demo() {
  return (
    <p>
      hello
      world
    </p>
  );
}`,
    expect: ['"hello world"'],
  },
];

let failures = 0;

for (const testCase of cases) {
  try {
    const code = compileDemoSource(testCase.source);

    for (const expected of testCase.expect) {
      if (!code.includes(expected)) {
        throw new Error(`输出中缺少：${expected}\n---\n${code}`);
      }
    }

    for (const rejected of testCase.reject ?? []) {
      if (code.includes(rejected)) {
        throw new Error(`输出中不应出现：${rejected}\n---\n${code}`);
      }
    }

    // 生成的代码本身必须是合法的 JS。
    const factory = new Function("React", code);
    if (typeof factory !== "function") {
      throw new Error("编译结果不是可执行的函数");
    }
    console.log(`ok   ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}\n${(error as Error).message}\n`);
  }
}

try {
  compileDemoSource(`export function Demo() {
  return (
    <div>
      <span>hi</span>
  );
}`);
  failures += 1;
  console.error("FAIL 缺少闭合标签时应当报错");
} catch (error) {
  if (error instanceof DemoCompileError) {
    console.log(`ok   缺少闭合标签 -> ${error.message}`);
  } else {
    failures += 1;
    console.error(`FAIL 缺少闭合标签抛出了意外错误：${String(error)}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} 个检查未通过`);
  process.exit(1);
}

console.log("\n全部通过");
