import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildEnhancementContext,
  extractImplementationFilePlan,
  normalizePlannedPath,
  readGenerationDependencyContext,
  readPlannedFileContext,
} from "../enhancement-plan.mjs";
import { resolveDependencyContext } from "../context-files.mjs";

const plan = [
  "packages/ui/src/FormComponent.tsx",
  "packages/ui/src/__tests__/FormComponent.test.tsx",
  "apps/docs/src/pages/form.tsx",
];

test("extracts a deduplicated implementation file plan", () => {
  const spec = `# Spec\n\n<!-- agent-files\n- \`${plan[0]}\`\n${plan[1]}\n${plan[2]}\n${plan[0]}\n-->`;
  assert.deepEqual(extractImplementationFilePlan(spec), plan);
});

test("rejects a spec without a file plan", () => {
  assert.throws(
    () => extractImplementationFilePlan("# Spec without a plan"),
    /must include.*agent-files/,
  );
});

test("requires implementation, test, and documentation files", () => {
  assert.throws(
    () => extractImplementationFilePlan(`<!-- agent-files\n${plan[0]}\n-->`),
    /must include a test file/,
  );
});

test("rejects unsafe or unsupported paths", () => {
  assert.throws(
    () => normalizePlannedPath("../.github/workflows/agent.yml"),
    /unsafe/,
  );
  assert.throws(
    () => normalizePlannedPath("packages/ui/src/index.json"),
    /unsupported extension/,
  );
  assert.throws(
    () => normalizePlannedPath(".agent/agent.mjs"),
    /outside allowed roots/,
  );
});

test("marks missing files as new and includes existing source", () => {
  const repoDir = mkdtempSync(join(tmpdir(), "agent-enhancement-plan-"));
  const sourceDir = join(repoDir, "packages", "ui", "src");
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(
    join(sourceDir, "existing.tsx"),
    "export const Existing = 1;\n",
  );

  const context = readPlannedFileContext(repoDir, [
    "packages/ui/src/existing.tsx",
    "apps/docs/src/pages/new.tsx",
  ]);

  assert.match(context, /EXISTING FILE: packages\/ui\/src\/existing\.tsx/);
  assert.match(context, /export const Existing = 1/);
  assert.match(context, /NEW FILE: apps\/docs\/src\/pages\/new\.tsx/);
});

test("discovers Form implementation, tests, styles, and docs", () => {
  const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const context = buildEnhancementContext(repoDir, "Form", "form");

  assert.match(context, /packages\/ui\/src\/FormComponent\.tsx/);
  assert.match(
    context,
    /packages\/ui\/src\/__tests__\/FormComponent\.test\.tsx/,
  );
  assert.match(context, /packages\/ui\/src\/form-component\.css/);
  assert.match(context, /apps\/docs\/src\/pages\/form\.tsx/);
});

test("expands a failing test with its imported implementation", () => {
  const repoDir = mkdtempSync(join(tmpdir(), "agent-context-"));
  const sourceDir = join(repoDir, "packages", "ui", "src");
  const testDir = join(sourceDir, "__tests__");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    join(sourceDir, "FormComponent.tsx"),
    "export const Form = { Root: () => null };\n",
  );
  writeFileSync(
    join(testDir, "FormComponent.test.tsx"),
    'import { Form } from "../FormComponent";\n',
  );

  assert.deepEqual(
    resolveDependencyContext(
      repoDir,
      ["packages/ui/src/__tests__/FormComponent.test.tsx"],
      [
        "packages/ui/src/__tests__/FormComponent.test.tsx",
        "packages/ui/src/FormComponent.tsx",
      ],
    ),
    [
      "packages/ui/src/__tests__/FormComponent.test.tsx",
      "packages/ui/src/FormComponent.tsx",
    ],
  );
});

test("injects generated implementation source into a test batch", () => {
  const repoDir = mkdtempSync(join(tmpdir(), "agent-generation-context-"));
  const sourceDir = join(repoDir, "packages", "ui", "src");
  const testDir = join(sourceDir, "__tests__");
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    join(sourceDir, "FormComponent.tsx"),
    "export const Form = { Root: () => null };\n",
  );
  writeFileSync(
    join(testDir, "FormComponent.test.tsx"),
    'import { Form } from "../FormComponent";\n',
  );

  const context = readGenerationDependencyContext(
    repoDir,
    ["packages/ui/src/__tests__/FormComponent.test.tsx"],
    [
      "packages/ui/src/FormComponent.tsx",
      "packages/ui/src/__tests__/FormComponent.test.tsx",
    ],
  );

  assert.match(context, /EXISTING FILE: packages\/ui\/src\/FormComponent\.tsx/);
  assert.match(context, /export const Form/);
  assert.doesNotMatch(context, /FormComponent\.test\.tsx/);
});
