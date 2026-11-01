import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  extractFailureFiles,
  mergePrefilledOutput,
  parseFileBlocks,
  planFileBatches,
  planGenerationBatches,
  writeValidatedFile,
} from "../implementation-output.mjs";

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

test("generates implementation before tests, docs, and e2e", () => {
  const files = [
    { path: "e2e/tests/form.spec.ts", characters: 100 },
    { path: "apps/docs/src/pages/form.tsx", characters: 100 },
    {
      path: "packages/ui/src/__tests__/FormComponent.test.tsx",
      characters: 100,
    },
    { path: "packages/ui/src/FormComponent.tsx", characters: 100 },
    { path: "packages/ui/src/form-component.css", characters: 100 },
  ];

  assert.deepEqual(planGenerationBatches(files), [
    ["packages/ui/src/FormComponent.tsx", "packages/ui/src/form-component.css"],
    ["packages/ui/src/__tests__/FormComponent.test.tsx"],
    ["apps/docs/src/pages/form.tsx"],
    ["e2e/tests/form.spec.ts"],
  ]);
});

test("restores an existing file when generated content is invalid", () => {
  const dir = mkdtempSync(join(tmpdir(), "ui-kit-output-"));
  const file = join(dir, "existing.tsx");
  writeFileSync(file, "export const existing = true;\n");

  const result = writeValidatedFile(file, "export const broken = (\n", () => {
    throw new Error("invalid syntax");
  });

  assert.equal(result.written, false);
  assert.equal(result.error.message, "invalid syntax");
  assert.equal(readFileSync(file, "utf-8"), "export const existing = true;\n");
});

test("removes a new file when generated content is invalid", () => {
  const dir = mkdtempSync(join(tmpdir(), "ui-kit-output-"));
  const file = join(dir, "new.tsx");

  const result = writeValidatedFile(file, "export const broken = (\n", () => {
    throw new Error("invalid syntax");
  });

  assert.equal(result.written, false);
  assert.equal(existsSync(file), false);
});

test("keeps formatted content when validation succeeds", () => {
  const dir = mkdtempSync(join(tmpdir(), "ui-kit-output-"));
  const file = join(dir, "valid.tsx");

  const result = writeValidatedFile(
    file,
    "export const valid = true;\n",
    () => {},
  );

  assert.equal(result.written, true);
  assert.equal(readFileSync(file, "utf-8"), "export const valid = true;\n");
});

test("prepends a prefilled file marker when the model continues the file", () => {
  const prefill = "=== FILE: packages/ui/src/A.tsx ===\n";

  assert.equal(
    mergePrefilledOutput(prefill, "export const A = 1;\n=== END FILE ==="),
    `${prefill}export const A = 1;\n=== END FILE ===`,
  );
});

test("does not duplicate a file marker returned by the model", () => {
  const prefill = "=== FILE: packages/ui/src/A.tsx ===\n";
  const output = `${prefill}export const A = 1;\n=== END FILE ===`;

  assert.equal(mergePrefilledOutput(prefill, output), output);
});

test("extracts only source files named on failing log lines", () => {
  const log = `::warning file=packages/ui/src/Warning.tsx,line=1::warning message
::error file=apps/docs/src/demos/form.tsx,line=8::error message
packages/ui/src/__tests__/Form.test.tsx:42:3: error TS2322: wrong type
##[error]e2e/tests/form.spec.ts:25:16: unused function
packages/ui typecheck: src/__tests__/FormComponent.test.tsx(684,7): error TS2345: wrong return type
packages/ui test: FAIL src/__tests__/FormComponent.test.tsx > validation`;

  assert.deepEqual(extractFailureFiles(log), [
    "apps/docs/src/demos/form.tsx",
    "packages/ui/src/__tests__/Form.test.tsx",
    "e2e/tests/form.spec.ts",
    "packages/ui/src/__tests__/FormComponent.test.tsx",
  ]);
});
