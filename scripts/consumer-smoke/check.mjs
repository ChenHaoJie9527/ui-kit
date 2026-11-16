/**
 * 用 node16/nodenext 消费方检查构建产物：类型必须能解析（零库级错误），
 * 且 4 个预期类型错误照常报出（issue #83 的回归防线）。
 *
 * 前置：pnpm install + pnpm -r build 已执行（本包通过 workspace 协议链接
 * packages/ui 与 packages/hooks 的 dist 产物）。
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("node_modules/.bin/tsc", ["-p", "tsconfig.json"], {
  encoding: "utf8",
});
const output = `${result.stdout}\n${result.stderr}`;

// 库级解析错误：出现任一条都说明声明产物又退化，直接失败。
const resolutionErrors = output.match(/TS2834|TS2307|TS2305|TS2306|TS1479/g);
if (resolutionErrors) {
  console.error(
    `✗ nodenext 消费方出现库级解析错误：${resolutionErrors.join("、")}\n${output}`,
  );
  process.exit(1);
}

// 预期类型错误：类型系统正常时必须全部出现。
const expectedSignatures = [
  "TS2322", // variant="not-a-valid-variant"
  "TS2559", // badProps: ButtonProps = 123
  "TS2322", // hookProbe: symbol = useCounter
  "TS2322", // errProbe: symbol = errors（FormErrors）
];
const missing = expectedSignatures.filter(
  (signature) => !output.includes(signature),
);
if (missing.length > 0) {
  console.error(
    `✗ 期望的类型错误没有报出（${missing.join("、")}），类型可能退化为 any。\n${output}`,
  );
  process.exit(1);
}

console.log("✓ nodenext 消费方类型检查通过：零库级错误，4 个预期错误全部报出");
