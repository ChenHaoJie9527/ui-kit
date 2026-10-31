import assert from "node:assert/strict";
import test from "node:test";
import { parseFileBlocks, planFileBatches } from "../implementation-output.mjs";

test("parses complete file blocks", () => {
  const output = `Analysis that must be ignored.
=== FILE: packages/ui/src/A.tsx ===
export const A = 1;
=== END FILE ===
=== FILE: apps/docs/src/a.tsx ===
export const Page = 2;
=== END FILE ===`;

  assert.deepEqual(parseFileBlocks(output), [
    { path: "packages/ui/src/A.tsx", content: "export const A = 1;" },
    { path: "apps/docs/src/a.tsx", content: "export const Page = 2;" },
  ]);
});

test("parses CRLF output wrapped in a code fence", () => {
  const output = [
    "```tsx",
    "=== FILE: packages/ui/src/A.tsx ===",
    "export const A = 1;",
    "=== END FILE ===",
    "```",
  ].join("\r\n");

  assert.deepEqual(parseFileBlocks(output), [
    { path: "packages/ui/src/A.tsx", content: "export const A = 1;" },
  ]);
});

test("ignores an incomplete file block", () => {
  const output = `=== FILE: packages/ui/src/A.tsx ===
export const A = 1;`;

  assert.deepEqual(parseFileBlocks(output), []);
});

test("rejects duplicate file blocks", () => {
  const output = `=== FILE: packages/ui/src/A.tsx ===
export const A = 1;
=== END FILE ===
=== FILE: packages/ui/src/A.tsx ===
export const A = 2;
=== END FILE ===`;

  assert.throws(() => parseFileBlocks(output), /more than once/);
});

test("batches by file count and estimated output size", () => {
  const batches = planFileBatches(
    [
      { path: "large.tsx", characters: 39_000 },
      { path: "styles.css", characters: 3_000 },
      { path: "index.ts", characters: 2_000 },
      { path: "test.tsx", characters: 11_000 },
      { path: "page.tsx", characters: 14_000 },
      { path: "new.tsx" },
    ],
    { maxFiles: 3, maxCharacters: 30_000, newFileCharacters: 12_000 },
  );

  assert.deepEqual(batches, [
    ["large.tsx"],
    ["styles.css", "index.ts", "test.tsx"],
    ["page.tsx", "new.tsx"],
  ]);
});
