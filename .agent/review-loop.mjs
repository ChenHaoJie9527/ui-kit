#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const runId = process.env.AGENT_RUN_ID;
if (!runId) throw new Error("AGENT_RUN_ID is required.");
if (
  !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId) ||
  runId.split(/[\\/]/).includes("..")
) {
  throw new Error("AGENT_RUN_ID must be a safe single path segment.");
}

const maxRevisions = Number.parseInt(
  process.env.AGENT_MAX_REVISIONS || "2",
  10,
);
if (!Number.isInteger(maxRevisions) || maxRevisions < 0 || maxRevisions > 2) {
  throw new Error("AGENT_MAX_REVISIONS must be an integer between 0 and 2.");
}

const runDir = join(repoDir, ".agent", "runs", runId);
mkdirSync(runDir, { recursive: true });

const SENSITIVE_ENV = new Set([
  "ARK_API_KEY",
  "ARK_BASE_URL",
  "ARK_MODEL",
  "ARK_VERIFIER_MODEL",
  "AI_PIPELINE_TOKEN",
  "PIPELINE_TOKEN",
  "GH_TOKEN",
  "GITHUB_TOKEN",
]);

function safeEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !SENSITIVE_ENV.has(key)),
  );
}

function arkEnvironment() {
  return Object.fromEntries(
    Object.entries({
      ARK_API_KEY: process.env.ARK_API_KEY,
      ARK_BASE_URL: process.env.ARK_BASE_URL,
      ARK_MODEL: process.env.ARK_MODEL,
      ARK_VERIFIER_MODEL: process.env.ARK_VERIFIER_MODEL,
    }).filter(([, value]) => value !== undefined),
  );
}

function run(command, args, { env = {}, allowFailure = false } = {}) {
  console.log(`[Review Loop] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: repoDir,
    encoding: "utf-8",
    env: { ...safeEnvironment(), CI: "true", ...env },
    maxBuffer: 50 * 1024 * 1024,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}.\n${output.slice(-12_000)}`,
    );
  }
  return { ok: result.status === 0, output };
}

function ensureCleanWorkTree() {
  const status = run("git", ["status", "--porcelain"]).output.trim();
  if (status !== "") {
    throw new Error(
      "The review loop requires a clean, committed worktree. Commit generated changes before reviewing.",
    );
  }
}

function discardUnverifiedChanges(target = "HEAD") {
  run("git", ["reset", "--hard", target], { allowFailure: true });
  run("git", ["clean", "-fd", "--", "packages", "apps", "e2e", ".changeset"], {
    allowFailure: true,
  });
}

function writeResult({ action, verdict, round, reason = "" }) {
  const result = {
    action,
    verdict,
    round,
    reason,
    reviewFile: join(".agent", "runs", runId, "review.md"),
  };
  writeFileSync(
    join(runDir, "review-loop-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `action=${action}\nverdict=${verdict}\nround=${round}\nreview-file=${result.reviewFile}\n`,
    );
  }
  console.log(
    `[Review Loop] Result: ${action} after ${round} automatic revision(s).`,
  );
}

function runReviewer(round) {
  const previousReviewFile =
    round === 0 ? "" : join(runDir, `review-round-${round - 1}.json`);
  if (previousReviewFile && !existsSync(previousReviewFile)) {
    throw new Error(`Previous round review is missing: ${previousReviewFile}`);
  }
  run("node", [".agent/reviewer.mjs"], {
    env: {
      AGENT_REVIEW_ROUND: String(round),
      AGENT_PREVIOUS_REVIEW_FILE: previousReviewFile,
      AGENT_COMPONENT: process.env.AGENT_COMPONENT || "",
      AGENT_BASE_REF: process.env.AGENT_BASE_REF || "origin/main",
      AGENT_PR_TITLE: process.env.AGENT_PR_TITLE || "Untitled",
      AGENT_PR_BODY: process.env.AGENT_PR_BODY || "",
      GITHUB_OUTPUT: "",
      ...arkEnvironment(),
    },
  });
  const reviewPath = join(runDir, "review.json");
  if (!existsSync(reviewPath)) {
    throw new Error("Reviewer did not produce review.json.");
  }
  const review = JSON.parse(readFileSync(reviewPath, "utf-8"));
  if (!review.action) throw new Error("Review result is missing an action.");
  return review;
}

function verify(round) {
  const logPath = join(runDir, `review-verification-${round}.log`);
  let output = "";
  const check = run("pnpm", ["check"], { allowFailure: true });
  output += `## pnpm check\n${check.output}\n`;
  const e2e = run("pnpm", ["test:e2e"], { allowFailure: true });
  output += `## pnpm test:e2e\n${e2e.output}\n`;
  const build = run("pnpm", ["build"], { allowFailure: true });
  output += `## pnpm build\n${build.output}\n`;
  writeFileSync(logPath, output);
  return { ok: check.ok && e2e.ok && build.ok, logPath };
}

function repairVerification(logPath, label) {
  run("node", [".agent/agent.mjs"], {
    env: {
      AGENT_REPAIR_LOG: logPath,
      AGENT_COMPONENT: process.env.AGENT_COMPONENT || "",
      AGENT_TYPE: process.env.AGENT_TYPE || "new-component",
      AGENT_BASE_REF: process.env.AGENT_BASE_REF || "origin/main",
      ...arkEnvironment(),
    },
  });
  run("pnpm", ["format"]);
  run("pnpm", ["lint:fix"], { allowFailure: true });
  return verify(label);
}

function formatAndVerify(round) {
  run("pnpm", ["format"]);
  run("pnpm", ["lint:fix"], { allowFailure: true });

  let result = verify(String(round));
  for (let attempt = 1; !result.ok && attempt <= 2; attempt += 1) {
    result = repairVerification(result.logPath, `${round}-repair-${attempt}`);
  }
  if (!result.ok) {
    throw new Error("Verification failed after review repair and retries.");
  }
}

function commitReviewRevision(round) {
  const status = run("git", ["status", "--porcelain"]).output.trim();
  if (status === "") return false;

  run("git", ["add", "-A"]);
  run("git", [
    "commit",
    "--no-verify",
    "-m",
    `fix(ui): address verified AI review findings (round ${round})`,
  ]);
  return true;
}

function main() {
  ensureCleanWorkTree();
  const startingHead = run("git", ["rev-parse", "HEAD"]).output.trim();
  let round = 0;

  try {
    for (; round <= maxRevisions; round += 1) {
      const review = runReviewer(round);
      if (review.action === "awaiting-human-review") {
        writeResult({
          action: review.action,
          verdict: review.verdict,
          round,
        });
        return;
      }
      if (review.action === "needs-human") {
        writeResult({
          action: review.action,
          verdict: review.verdict,
          round,
          reason:
            "Reviewer requires human judgment or the revision limit was reached.",
        });
        return;
      }

      if (round >= maxRevisions) {
        writeResult({
          action: "needs-human",
          verdict: review.verdict,
          round,
          reason: "Automatic revision limit reached.",
        });
        return;
      }

      run("node", [".agent/agent.mjs"], {
        env: {
          AGENT_REVIEW_LOG: join(
            runDir,
            existsSync(join(runDir, "review-repair.md"))
              ? "review-repair.md"
              : "review.md",
          ),
          AGENT_COMPONENT: process.env.AGENT_COMPONENT || "",
          AGENT_TYPE: process.env.AGENT_TYPE || "new-component",
          AGENT_BASE_REF: process.env.AGENT_BASE_REF || "origin/main",
          ...arkEnvironment(),
        },
      });

      formatAndVerify(round + 1);

      if (!commitReviewRevision(round + 1)) {
        writeResult({
          action: "needs-human",
          verdict: review.verdict,
          round,
          reason: "Builder did not change any file for the verified finding.",
        });
        return;
      }
    }
  } catch (error) {
    discardUnverifiedChanges(startingHead);
    writeResult({
      action: "needs-human",
      verdict: "needs_human",
      round,
      reason: `Review loop failed: ${error.message}`,
    });
    throw error;
  }
}

main();
