import assert from "node:assert/strict";
import test from "node:test";
import { parseIssuePlan } from "../issue-plan.mjs";

test("parses a new component issue", () => {
  assert.deepEqual(parseIssuePlan("feat(ui): Tooltip", 11), {
    component: "Tooltip",
    slug: "tooltip",
    type: "new-component",
    runId: "tooltip-issue-11",
    branch: "codex/tooltip",
    requiresSpec: true,
  });
});

test("parses a bug fix issue without requiring a spec", () => {
  assert.deepEqual(parseIssuePlan("fix(ui): Radio focus", 12), {
    component: "Radio focus",
    slug: "radio-focus",
    type: "bugfix",
    runId: "radio-focus-issue-12",
    branch: "codex/radio-focus",
    requiresSpec: false,
  });
});

test("parses an existing component enhancement from the title scope", () => {
  assert.deepEqual(
    parseIssuePlan(
      "enhance(Form): validation timing, layout and label wrapping",
      42,
    ),
    {
      component: "Form",
      slug: "form",
      type: "enhancement",
      runId: "form-enhancement-issue-42",
      branch: "codex/form-enhancement-42",
      requiresSpec: true,
    },
  );
});

test("rejects enhancement titles without a component scope", () => {
  assert.throws(
    () => parseIssuePlan("enhance(ui): improve Form", 42),
    /must name the target component/,
  );
  assert.throws(
    () => parseIssuePlan("enhance: improve Form", 42),
    /must name the target component/,
  );
});

test("supports Chinese bug fix titles", () => {
  const plan = parseIssuePlan("修复 Form 布局", 13);
  assert.equal(plan.type, "bugfix");
  assert.equal(plan.component, "Form 布局");
});
