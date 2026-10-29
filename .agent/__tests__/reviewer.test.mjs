import assert from "node:assert/strict";
import test from "node:test";
import {
  getReviewAction,
  parseReviewResponse,
  renderReviewMarkdown,
} from "../reviewer.mjs";

const approvedReview = {
  verdict: "approve",
  summary: "The implementation matches the spec.",
  findings: [],
  risks: [],
};

test("parses an independent approval", () => {
  assert.deepEqual(
    parseReviewResponse(JSON.stringify(approvedReview)),
    approvedReview,
  );
});

test("accepts fenced JSON and normalizes optional fields", () => {
  const review = parseReviewResponse(
    '```json\n{"verdict":"needs_human","summary":"Check the API."}\n```',
  );
  assert.equal(review.verdict, "needs_human");
  assert.deepEqual(review.findings, []);
  assert.deepEqual(review.risks, []);
});

test("rejects approval with blocking findings", () => {
  const response = {
    ...approvedReview,
    findings: [
      {
        severity: "high",
        file: "packages/ui/src/Form.tsx",
        line: 10,
        issue: "The field loses focus.",
        recommendation: "Preserve the registered input focus.",
      },
    ],
  };
  assert.throws(
    () => parseReviewResponse(JSON.stringify(response)),
    /approve cannot contain blocking findings/,
  );
});

test("rejects invalid finding line numbers", () => {
  const response = {
    verdict: "request_changes",
    summary: "Fix the input.",
    findings: [
      {
        severity: "medium",
        file: "packages/ui/src/Input.tsx",
        line: "10",
        issue: "The invalid state is not exposed.",
        recommendation: "Set aria-invalid.",
      },
    ],
  };
  assert.throws(
    () => parseReviewResponse(JSON.stringify(response)),
    /invalid line number/,
  );
});

test("limits automatic revisions to two rounds", () => {
  const review = { verdict: "request_changes" };
  assert.equal(getReviewAction(review, 0), "revise");
  assert.equal(getReviewAction(review, 1), "revise");
  assert.equal(getReviewAction(review, 2), "needs-human");
  assert.equal(
    getReviewAction({ verdict: "approve" }, 2),
    "awaiting-human-review",
  );
});

test("renders a machine-readable PR review and truncation warning", () => {
  const review = parseReviewResponse(
    JSON.stringify({
      verdict: "request_changes",
      summary: "Keyboard behavior needs a correction.",
      findings: [
        {
          severity: "medium",
          file: "packages/ui/src/Form.tsx",
          line: 20,
          issue: "Arrow keys do not reach the field.",
          recommendation: "Remove the keydown cancellation.",
        },
      ],
      risks: ["No keyboard regression test covers this path."],
    }),
  );
  const markdown = renderReviewMarkdown(review, {
    changedFiles: ["packages/ui/src/Form.tsx"],
    revisionRound: 1,
    diffTruncated: true,
  });
  assert.match(markdown, /<!-- ai-reviewer:request_changes -->/);
  assert.match(markdown, /round 2\/2/);
  assert.match(markdown, /packages\/ui\/src\/Form\.tsx:20/);
  assert.match(markdown, /diff was truncated/);
});
