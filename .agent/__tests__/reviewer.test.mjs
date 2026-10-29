import assert from "node:assert/strict";
import test from "node:test";
import {
  applyVerification,
  buildReviewLedger,
  buildVerifierSystemPrompt,
  buildVerifierUserPrompt,
  finalizeReview,
  getReviewAction,
  parseReviewResponse,
  parseVerificationResponse,
  renderRepairMarkdown,
  renderReviewMarkdown,
} from "../reviewer.mjs";

const approvedReview = {
  verdict: "approve",
  summary: "The implementation matches the spec.",
  findings: [],
  risks: [],
};

const blockingFinding = {
  id: "F1",
  severity: "high",
  confidence: "high",
  introducedByPr: true,
  category: "accessibility",
  file: "packages/ui/src/Form.tsx",
  line: 10,
  evidence: "The keydown handler calls preventDefault before forwarding focus.",
  issue: "The field loses focus.",
  recommendation: "Preserve the registered input focus.",
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
    findings: [blockingFinding],
  };
  assert.throws(
    () => parseReviewResponse(JSON.stringify(response)),
    /approve cannot contain blocking findings/,
  );
});

test("allows approval with a clearly pre-existing finding", () => {
  const review = parseReviewResponse(
    JSON.stringify({
      verdict: "approve",
      summary:
        "The change is safe, with an unrelated pre-existing issue noted.",
      findings: [{ ...blockingFinding, introducedByPr: false }],
      risks: [],
    }),
  );
  assert.equal(review.findings[0].introducedByPr, false);
});

test("requires evidence and verification metadata for findings", () => {
  const withoutEvidence = { ...blockingFinding };
  delete withoutEvidence.evidence;
  assert.throws(
    () =>
      parseReviewResponse(
        JSON.stringify({
          verdict: "request_changes",
          summary: "Fix the input.",
          findings: [withoutEvidence],
          risks: [],
        }),
      ),
    /evidence must be a non-empty string/,
  );
});

test("rejects invalid finding line numbers", () => {
  const response = {
    verdict: "request_changes",
    summary: "Fix the input.",
    findings: [{ ...blockingFinding, line: "10" }],
    risks: [],
  };
  assert.throws(
    () => parseReviewResponse(JSON.stringify(response)),
    /invalid line number/,
  );
});

test("parses one verification result for every finding", () => {
  const results = parseVerificationResponse(
    JSON.stringify({
      findings: [
        {
          id: "F1",
          decision: "confirmed",
          reason: "The source contradicts the required keyboard behavior.",
        },
      ],
    }),
    [blockingFinding],
  );
  assert.deepEqual(results, [
    {
      id: "F1",
      decision: "confirmed",
      reason: "The source contradicts the required keyboard behavior.",
    },
  ]);
});

test("rejects incomplete verification results", () => {
  assert.throws(
    () =>
      parseVerificationResponse(JSON.stringify({ findings: [] }), [
        blockingFinding,
      ]),
    /omitted finding ids/,
  );
});

test("drops rejected findings before choosing the review action", () => {
  const review = {
    verdict: "request_changes",
    summary: "A possible issue was reported.",
    findings: [blockingFinding],
    risks: [],
  };
  const verified = applyVerification(review, [
    {
      id: "F1",
      decision: "rejected",
      reason: "The code correctly preserves focus.",
    },
  ]);
  assert.equal(verified.verdict, "approve");
  assert.deepEqual(verified.findings, []);
  assert.equal(verified.dismissedFindings.length, 1);
  assert.equal(getReviewAction(verified, 0), "awaiting-human-review");
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

test("truncated context always disables automatic approval and revision", () => {
  const review = finalizeReview(
    { verdict: "request_changes", summary: "Fix it.", findings: [], risks: [] },
    { contextTruncated: true },
  );
  assert.equal(review.verdict, "needs_human");
  assert.equal(getReviewAction(review, 0), "needs-human");
  assert.equal(
    finalizeReview(review, { contextTruncated: true }).summary,
    review.summary,
  );
});

test("renders a verified review with a truncation warning", () => {
  const review = parseReviewResponse(
    JSON.stringify({
      verdict: "request_changes",
      summary: "Keyboard behavior needs a correction.",
      findings: [blockingFinding],
      risks: ["No keyboard regression test covers this path."],
    }),
  );
  const verified = applyVerification(review, [
    {
      id: "F1",
      decision: "confirmed",
      reason: "The source confirms the focus regression.",
    },
  ]);
  const markdown = renderReviewMarkdown(verified, {
    changedFiles: ["packages/ui/src/Form.tsx"],
    revisionRound: 1,
    diffTruncated: true,
  });
  assert.match(markdown, /<!-- ai-reviewer:needs_human -->/);
  assert.match(markdown, /F1/);
  assert.match(markdown, /packages\/ui\/src\/Form\.tsx:10/);
  assert.match(markdown, /diff was truncated/);
  assert.match(markdown, /not a human approval/);
});

test("shows rejected findings as verifier evidence", () => {
  const review = applyVerification(
    {
      verdict: "request_changes",
      summary: "A possible issue was reported.",
      findings: [blockingFinding],
      risks: [],
    },
    [
      {
        id: "F1",
        decision: "rejected",
        reason: "The handler preserves focus correctly.",
      },
    ],
  );
  const markdown = renderReviewMarkdown(review, {
    changedFiles: ["packages/ui/src/Form.tsx"],
    revisionRound: 0,
  });

  assert.match(markdown, /Findings rejected by Verifier/);
  assert.match(markdown, /The handler preserves focus correctly/);
});

test("gives Builder only verified blocking findings", () => {
  const review = applyVerification(
    {
      verdict: "request_changes",
      summary: "Two possible issues were reported.",
      findings: [
        blockingFinding,
        {
          ...blockingFinding,
          id: "F2",
          severity: "low",
          issue: "A low-value cleanup.",
        },
      ],
      risks: [],
    },
    [
      {
        id: "F1",
        decision: "confirmed",
        reason: "The focus regression is confirmed.",
      },
      {
        id: "F2",
        decision: "confirmed",
        reason: "The cleanup is valid but low impact.",
      },
    ],
  );
  const repair = renderRepairMarkdown(review);
  assert.match(repair, /F1/);
  assert.doesNotMatch(repair, /F2/);
});

test("routes low-confidence blocking findings to human review", () => {
  const review = applyVerification(
    {
      verdict: "request_changes",
      summary: "A possible focus regression was reported.",
      findings: [{ ...blockingFinding, confidence: "low" }],
      risks: [],
    },
    [
      {
        id: "F1",
        decision: "confirmed",
        reason: "The source appears to contradict the focus contract.",
      },
    ],
  );

  assert.equal(review.verdict, "needs_human");
  assert.equal(review.findings[0].verification.status, "needs_human");
  assert.match(review.findings[0].verification.reason, /low confidence/);
  assert.equal(getReviewAction(review, 0), "needs-human");
  assert.doesNotMatch(renderRepairMarkdown(review), /F1/);
});

test("keeps low-confidence low-severity findings non-blocking", () => {
  const review = applyVerification(
    {
      verdict: "approve",
      summary: "A minor improvement may be possible.",
      findings: [
        {
          ...blockingFinding,
          confidence: "low",
          severity: "low",
          introducedByPr: false,
        },
      ],
      risks: [],
    },
    [
      {
        id: "F1",
        decision: "confirmed",
        reason: "The minor pre-existing issue is visible.",
      },
    ],
  );

  assert.equal(review.verdict, "approve");
  assert.equal(review.findings[0].verification.status, "confirmed");
});

test("gives the Verifier the spec, design, review, and repository contracts", () => {
  const system = buildVerifierSystemPrompt({
    agentRules: "AGENT-RULE-MARKER",
    designRules: "DESIGN-RULE-MARKER",
    reviewRules: "REVIEW-RULE-MARKER",
  });
  const user = buildVerifierUserPrompt({
    prTitle: "feat(ui): Badge",
    prBody: "PR-BODY-MARKER",
    spec: "SPEC-MARKER",
    context: "CONTEXT-MARKER",
    reviewLedger: "LEDGER-MARKER",
    findings: [blockingFinding],
  });

  assert.match(system, /AGENT-RULE-MARKER/);
  assert.match(system, /DESIGN-RULE-MARKER/);
  assert.match(system, /REVIEW-RULE-MARKER/);
  assert.match(user, /SPEC-MARKER/);
  assert.match(user, /CONTEXT-MARKER/);
  assert.match(user, /LEDGER-MARKER/);
  assert.match(user, /PR-BODY-MARKER/);
});

test("carries previous confirmed and rejected findings into the next round", () => {
  const ledger = buildReviewLedger({
    verdict: "request_changes",
    summary: "One issue was fixed and one report was rejected.",
    findings: [
      {
        ...blockingFinding,
        verification: {
          status: "confirmed",
          reason: "The focus regression was confirmed.",
        },
      },
    ],
    dismissedFindings: [
      {
        ...blockingFinding,
        id: "F2",
        verification: {
          status: "rejected",
          reason: "The handler preserves focus correctly.",
        },
      },
    ],
  });

  assert.match(ledger, /F1/);
  assert.match(ledger, /confirmed/);
  assert.match(ledger, /F2/);
  assert.match(ledger, /rejected/);
  assert.match(ledger, /The handler preserves focus correctly/);
});
