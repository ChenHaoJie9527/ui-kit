#!/usr/bin/env node
/**
 * AI Component Agent for seam ui-kit.
 * Runs on Volcano Ark (OpenAI-compatible API) in GitHub Actions.
 *
 * Usage: AGENT_COMPONENT=Tooltip AGENT_TYPE=new-component node .agent/agent.mjs
 *
 * Requires env:
 *   ARK_API_KEY     - Volcano Ark API key
 *   ARK_MODEL       - Model endpoint ID (e.g. ep-2024xxxx-xxxxx)
 *   AGENT_COMPONENT - Component name
 *   AGENT_TYPE      - new-component | enhancement | bugfix | deprecation
 *   AGENT_ISSUE_BODY - Issue description text (optional)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve as resolvePath, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import https from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_MODEL = process.env.ARK_MODEL || "ark-code-latest";
const ARK_BASE_URL =
  process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/coding/v3";
const COMPONENT = process.env.AGENT_COMPONENT;
const TYPE = process.env.AGENT_TYPE || "new-component";
const ISSUE_BODY = process.env.AGENT_ISSUE_BODY || "";

const COMPONENT_PASCAL = COMPONENT.replace(/(?:^|\s+)([a-zA-Z])/g, (_, char) =>
  char.toUpperCase(),
).replace(/\s+/g, "");
const COMPONENT_KEBAB = COMPONENT.toLowerCase().replace(/\s+/g, "-");

if (!ARK_API_KEY) {
  console.error("Error: ARK_API_KEY is required.");
  process.exit(1);
}

if (!COMPONENT) {
  console.error("Error: AGENT_COMPONENT is required.");
  process.exit(1);
}

// ─── Scaffold run directory ───────────────────────────────────────────────
const date = new Date().toISOString().slice(0, 10);
const runId =
  process.env.AGENT_RUN_ID ||
  `${COMPONENT.toLowerCase().replace(/\s+/g, "-")}-${date}`;
const runDir = join(__dirname, "runs", runId);
const repoDir = join(__dirname, "..");

mkdirSync(runDir, { recursive: true });

// ─── Load pattern guide ───────────────────────────────────────────────────
const patternGuidePath = join(__dirname, "docs", "pattern-guide.md");
const patternGuide = readFileSync(patternGuidePath, "utf-8");

const overlayPath = join(__dirname, "patterns", "overlay.md");
const formControlPath = join(__dirname, "patterns", "form-control.md");
const navigationPath = join(__dirname, "patterns", "navigation.md");
const inlinePath = join(__dirname, "patterns", "inline.md");

const overlayPattern = readFileSync(overlayPath, "utf-8");
const formControlPattern = readFileSync(formControlPath, "utf-8");
const navigationPattern = readFileSync(navigationPath, "utf-8");
const inlinePattern = readFileSync(inlinePath, "utf-8");

// ─── Read existing component sources for reference ────────────────────────
const srcDir = join(repoDir, "packages", "ui", "src");
const referenceComponents = [];

for (const file of [
  "Button.tsx",
  "Dialog.tsx",
  "Tooltip.tsx",
  "Switch.tsx",
  "Tabs.tsx",
]) {
  const filePath = join(srcDir, file);
  if (existsSync(filePath)) {
    referenceComponents.push(`// ${file}\n${readFileSync(filePath, "utf-8")}`);
  }
}

const tokensPath = join(srcDir, "styles", "tokens.css");
const tokens = readFileSync(tokensPath, "utf-8");

const motionPath = join(srcDir, "motion.ts");
const motionTokens = readFileSync(motionPath, "utf-8");

const indexPath = join(srcDir, "index.ts");
const currentExports = readFileSync(indexPath, "utf-8");

// ─── Call Ark API ─────────────────────────────────────────────────────────
function httpsPost(urlString, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = JSON.stringify(body);

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        family: 4,
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 600_000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({ status: res.statusCode, body: text });
        });
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });
    req.write(payload);
    req.end();
  });
}

async function callArk(systemPrompt, userPrompt) {
  const url = `${ARK_BASE_URL}/chat/completions`;
  console.log(`[Agent] Calling ${url} with model ${ARK_MODEL}`);

  const response = await httpsPost(
    url,
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ARK_API_KEY}`,
    },
    {
      model: ARK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 16384,
      temperature: 0.6,
      thinking: { type: "disabled" },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Ark API error ${response.status}: ${response.body}`);
  }

  const data = JSON.parse(response.body);
  return data.choices[0]?.message?.content || "";
}

function getRepairFiles() {
  const options = { cwd: repoDir, encoding: "utf-8" };
  const tracked = execFileSync("git", ["diff", "--name-only"], options);
  const baseRef = process.env.AGENT_BASE_REF || "origin/main";
  let committed = "";
  try {
    committed = execFileSync(
      "git",
      ["diff", "--name-only", `${baseRef}...HEAD`],
      options,
    );
  } catch {
    console.warn(`[Agent] Base ref ${baseRef} is unavailable for repair diff.`);
  }
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    options,
  );

  return [...new Set(`${tracked}\n${committed}\n${untracked}`.split("\n"))]
    .map((file) => file.trim())
    .filter((file) =>
      /^(?:packages|apps|e2e)\/.+\.(?:ts|tsx|css|md)$/.test(file),
    )
    .filter((file) => existsSync(join(repoDir, file)))
    .slice(0, 16);
}

async function repairImplementation(logPath, mode = "verification") {
  const isReview = mode === "review";
  console.log(`[Agent] Repairing ${mode} feedback from ${logPath}...`);

  const verificationLog = readFileSync(logPath, "utf-8").slice(-40_000);
  const repairFiles = getRepairFiles();
  if (repairFiles.length === 0) {
    throw new Error("No changed source files are available for repair.");
  }

  const sources = repairFiles
    .map((file) => {
      const content = readFileSync(join(repoDir, file), "utf-8");
      return `=== FILE: ${file} ===\n${content}`;
    })
    .join("\n\n");
  const specPath = join(runDir, "spec.md");
  const spec = existsSync(specPath) ? readFileSync(specPath, "utf-8") : "";

  const systemPrompt = `You are ${isReview ? "revising an existing seam-ui change after independent code review" : "repairing an existing seam-ui change after automated verification failed"}.
Make the smallest correct changes that resolve the reported ${isReview ? "findings" : "failures"}. Preserve the public API and existing design decisions unless the feedback proves they are incorrect.

## Component Spec
${spec}

## Pattern Guide
${patternGuide}

## Design Tokens
${tokens}

## Motion Tokens
${motionTokens}

Return ONLY complete files that require changes. Do not return explanations, diffs, or code fences around the entire response.
Start with the first file marker and do not describe your analysis or plan.
Each file must use this exact format:
=== FILE: <existing-repository-relative-path> ===
<complete file content>
=== END FILE ===

You may only return files supplied in the current sources. Do not create files or modify unrelated code.
Remove unused imports, satisfy strict TypeScript checks including noUncheckedIndexedAccess, and preserve the repository testing conventions.
${isReview ? "Address every actionable reviewer finding. If a finding requires files outside the supplied sources or a product decision, do not guess." : ""}`;

  const userPrompt = `## ${isReview ? "Independent Review Feedback" : "Verification Log"}
${verificationLog}

## Current Sources
${sources}

Repair the failures and rerun-ready source files.`;

  const implementation = await callArk(systemPrompt, userPrompt);
  const fileRegex = /=== FILE: (.+?) ===\n([\s\S]*?)=== END FILE ===/g;
  const filesWritten = [];
  let match;

  while ((match = fileRegex.exec(implementation)) !== null) {
    let filePath = match[1].trim().replace(/^\.\//, "");
    if (filePath.startsWith("src/")) {
      filePath = `packages/ui/${filePath}`;
    }
    if (!repairFiles.includes(filePath)) {
      throw new Error(
        `Repair attempted to modify an unapproved file: ${filePath}`,
      );
    }

    const absPath = resolvePath(repoDir, filePath);
    if (!absPath.startsWith(`${repoDir}${sep}`)) {
      throw new Error(`Repair path escapes the repository: ${filePath}`);
    }

    writeFileSync(absPath, `${match[2].trim()}\n`);
    filesWritten.push(filePath);
    console.log(`[Agent] Repaired: ${filePath}`);
  }

  if (filesWritten.length === 0) {
    writeFileSync(join(runDir, "repair-raw.md"), implementation);
    throw new Error(
      "Repair response did not contain any parseable file changes.",
    );
  }

  return filesWritten;
}

// ─── Phase 1: Generate Spec ───────────────────────────────────────────────
async function generateSpec() {
  console.log(`[Agent] Phase 1: Generating spec for ${COMPONENT}...`);

  const systemPrompt = `You are a senior React component library engineer working on seam-ui.
You MUST follow the pattern files and design tokens exactly. Do not invent new patterns.

## Pattern Guide
${patternGuide}

## Overlay Pattern
${overlayPattern}

## Form Control Pattern
${formControlPattern}

## Navigation Pattern
${navigationPattern}

## Inline Pattern
${inlinePattern}

## Design Tokens (CSS)
${tokens}

## Motion Tokens (TypeScript)
${motionTokens}

## Existing Component Exports
${currentExports}

You are writing a spec.md file. Output ONLY the spec content in Markdown, no code fences around the entire output.`;

  const userPrompt = `Generate a spec for the component: ${COMPONENT}
Type: ${TYPE}

Requirements from the user:
${ISSUE_BODY || "No specific requirements provided. Infer reasonable defaults from the pattern files."}

Write a complete spec.md covering:
1. Purpose
2. Pattern selection (which pattern file does this component follow)
3. States
4. Public API (TypeScript interface)
5. Keyboard behavior (differences from pattern)
6. Accessibility (role, ARIA attributes)
7. Failure states
8. Motion Gate (frequency, purpose, implementation, token)
9. Test plan
10. Open questions (if any)`;

  const spec = await callArk(systemPrompt, userPrompt);
  writeFileSync(join(runDir, "spec.md"), spec);
  console.log(`[Agent] Spec written to ${join(runDir, "spec.md")}`);
  return spec;
}

// ─── Phase 3: Generate Implementation ─────────────────────────────────────
async function generateImplementation(spec) {
  console.log(`[Agent] Phase 3: Generating implementation for ${COMPONENT}...`);

  // Write reference component code to a temp context for the LLM
  const references = referenceComponents.slice(0, 3).join("\n\n---\n\n");

  const systemPrompt = `You are a senior React component library engineer working on seam-ui.
You have written a spec and now must implement the component.

## Pattern Files (for reference)
${patternGuide}

## Design Tokens (CSS)
${tokens}

## Motion Tokens (TypeScript)
${motionTokens}

## Reference Components (for code style)
${references}

Output format: You must output separate files, each starting with a marker line:
=== FILE: <relative-path-from-packages/ui/src/> ===
<file content>
=== END FILE ===

Files to generate:
1. ${COMPONENT_PASCAL}.tsx - Component implementation
2. ${COMPONENT_KEBAB}.css - Component styles
3. __tests__/${COMPONENT_PASCAL}.test.tsx - Tests
4. Update to src/index.ts - Export addition

Rules:
- Use existing hooks from seam-hooks
- Use CSS tokens (--uk-*) from tokens.css
- Use Motion tokens from motion.ts
- Follow the code style of existing components
- Include comprehensive tests

Testing conventions (MUST follow exactly):
- Import from "vitest": import { describe, expect, it, vi } from "vitest";
- Use vi.fn<() => void>() (with type parameter), NEVER jest.fn()
- Use fireEvent from "@testing-library/react", NEVER userEvent
- Do NOT import jest-axe or @testing-library/jest-dom
- Use plain DOM assertions: el.getAttribute("..."), el.classList.contains("..."), etc.
- Do NOT use toHaveAttribute, toBeInTheDocument, toBeDisabled, toHaveAccessibleName
- Use expect(el.getAttribute("data-variant")).toBe("...") instead of toHaveAttribute
- Use expect(screen.queryByRole("...")).toBeNull() instead of not.toBeInTheDocument
- Use expect((el as HTMLButtonElement).disabled).toBe(true) instead of toBeDisabled`;

  const userPrompt = `Implement the component: ${COMPONENT}

## Spec:
${spec}

## Existing index.ts exports:
${currentExports}

Generate the implementation files following the output format specified above.`;

  const implementation = await callArk(systemPrompt, userPrompt);

  // Parse the file markers and write files
  const fileRegex = /=== FILE: (.+?) ===\n([\s\S]*?)=== END FILE ===/g;
  let match;
  const filesWritten = [];

  while ((match = fileRegex.exec(implementation)) !== null) {
    const filePath = match[1].trim();
    const fileContent = match[2].trim();

    const cleanPath = filePath
      .replace(/^packages\/ui\/src\//, "")
      .replace(/^src\//, "");
    const absPath = join(srcDir, cleanPath);
    const absDir = dirname(absPath);
    mkdirSync(absDir, { recursive: true });
    writeFileSync(absPath, fileContent + "\n");
    filesWritten.push(filePath);
    console.log(`[Agent] Wrote: ${absPath}`);
  }

  if (filesWritten.length === 0) {
    console.warn(
      "[Agent] Warning: No files were parsed from the implementation output.",
    );
    // Save raw output for debugging
    writeFileSync(join(runDir, "implementation-raw.md"), implementation);
  }

  const cssFileName = `${COMPONENT_KEBAB}.css`;
  const cssImportLine = `@import "./${cssFileName}";`;
  const stylesCssPath = join(srcDir, "styles.css");
  if (existsSync(stylesCssPath)) {
    const stylesContent = readFileSync(stylesCssPath, "utf-8");
    if (
      !stylesContent.includes(cssImportLine) &&
      filesWritten.some((f) => f.endsWith(".css"))
    ) {
      const updated = stylesContent.replace(
        '@import "./styles/tokens.css";',
        `@import "./styles/tokens.css";\n${cssImportLine}`,
      );
      writeFileSync(stylesCssPath, updated);
      console.log(`[Agent] Registered ${cssFileName} in styles.css`);
    }
  }

  console.log(
    `[Agent] Implementation complete. ${filesWritten.length} files written.`,
  );
  return filesWritten;
}

// ─── Phase 4: Generate Changeset ──────────────────────────────────────────
async function generateChangeset() {
  console.log(`[Agent] Phase 4: Generating Changeset...`);

  const bumpType = TYPE === "new-component" ? "minor" : "patch";
  const changesetContent = `---
"seam-react": ${bumpType}
---

feat(ui): add ${COMPONENT} component

🤖 Developed by AI Agent (Volcano Ark) under human-defined spec patterns.
`;

  const changesetDir = join(__dirname, "..", ".changeset");
  const changesetFile = join(changesetDir, `ai-agent-${runId}.md`);
  writeFileSync(changesetFile, changesetContent);
  console.log(`[Agent] Changeset written to ${changesetFile}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[Agent] Starting run: ${runId}`);
  console.log(`[Agent] Component: ${COMPONENT}, Type: ${TYPE}`);

  try {
    if (process.env.AGENT_REVIEW_LOG) {
      const files = await repairImplementation(
        process.env.AGENT_REVIEW_LOG,
        "review",
      );
      console.log(`[Agent] Review revision complete: ${files.join(", ")}`);
      return;
    }

    if (process.env.AGENT_REPAIR_LOG) {
      const files = await repairImplementation(process.env.AGENT_REPAIR_LOG);
      console.log(`[Agent] Repair complete: ${files.join(", ")}`);
      return;
    }

    const spec = await generateSpec();
    const files = await generateImplementation(spec);
    await generateChangeset();

    console.log(`\n[Agent] Run complete.`);
    console.log(`[Agent] Files generated: ${files.join(", ")}`);
    console.log(`[Agent] Spec: ${join(runDir, "spec.md")}`);
  } catch (error) {
    console.error(`[Agent] Error: ${error.message}`);

    // Write error to checkpoint for debugging
    writeFileSync(
      join(runDir, "checkpoint.md"),
      `# Checkpoint: ${runId}\n\n## Status\nfailed\n\n## Error\n${error.message}\n`,
    );

    process.exit(1);
  }
}

main();
