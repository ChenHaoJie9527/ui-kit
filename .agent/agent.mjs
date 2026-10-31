#!/usr/bin/env node
/**
 * AI Component Agent for seam ui-kit.
 * Runs on Volcano Ark (OpenAI-compatible API) in GitHub Actions.
 *
 * Usage: AGENT_COMPONENT=Tooltip AGENT_TYPE=new-component node .agent/agent.mjs
 *
 * Requires env:
 *   ARK_API_KEY     - Volcano Ark API key
 *   ARK_MODEL       - Coding Plan model slug (e.g. kimi-k3.1-pro)
 *   AGENT_COMPONENT - Component name
 *   AGENT_TYPE      - new-component | enhancement | bugfix | deprecation
 *   AGENT_ISSUE_BODY - Issue description text (optional)
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, dirname, resolve as resolvePath, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import https from "node:https";
import { Readable } from "node:stream";
import { readArkStream } from "./ark-stream.mjs";
import { parseFileBlocks, planFileBatches } from "./implementation-output.mjs";
import {
  buildEnhancementContext,
  extractImplementationFilePlan,
  normalizePlannedPath,
  readPlannedFileContext,
  resolvePlannedFile,
} from "./enhancement-plan.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_MODEL = process.env.ARK_MODEL || "ark-code-latest";
const ARK_BASE_URL =
  process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/coding/v3";
const COMPONENT = process.env.AGENT_COMPONENT;
const TYPE = process.env.AGENT_TYPE || "new-component";
const ISSUE_BODY = process.env.AGENT_ISSUE_BODY || "";
const SPEC_ONLY = process.env.AGENT_SPEC_ONLY === "true";
const SPEC_APPROVED = process.env.AGENT_SPEC_APPROVED === "true";

function isSafeRunId(value) {
  return (
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) &&
    !value.split(/[\\/]/).includes("..")
  );
}

if (!ARK_API_KEY) {
  console.error("Error: ARK_API_KEY is required.");
  process.exit(1);
}

if (!COMPONENT) {
  console.error("Error: AGENT_COMPONENT is required.");
  process.exit(1);
}

if (/[\\/]/.test(COMPONENT) || COMPONENT.includes("..")) {
  console.error(
    "Error: AGENT_COMPONENT cannot contain path separators or '..'.",
  );
  process.exit(1);
}

if (!/^[\p{L}\p{N} ._-]+$/u.test(COMPONENT)) {
  console.error(
    "Error: AGENT_COMPONENT may only contain letters, numbers, spaces, dots, underscores, and hyphens.",
  );
  process.exit(1);
}

const COMPONENT_PASCAL = COMPONENT.replace(/(?:^|\s+)([a-zA-Z])/g, (_, char) =>
  char.toUpperCase(),
).replace(/\s+/g, "");
const COMPONENT_KEBAB = COMPONENT.toLowerCase().replace(/\s+/g, "-");

// ─── Scaffold run directory ───────────────────────────────────────────────
const date = new Date().toISOString().slice(0, 10);
const fallbackRunId =
  COMPONENT.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "component";
const runId = process.env.AGENT_RUN_ID || `${fallbackRunId}-${date}`;
if (!isSafeRunId(runId)) {
  console.error("Error: AGENT_RUN_ID must be a safe single path segment.");
  process.exit(1);
}
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

const docsPageReferencePath = join(
  repoDir,
  "apps",
  "docs",
  "src",
  "pages",
  "switch.tsx",
);
const docsRoutesPath = join(repoDir, "apps", "docs", "src", "routes.tsx");
const docsContentPath = join(
  repoDir,
  "apps",
  "docs",
  "src",
  "content",
  "components.ts",
);
const docsPageReference = existsSync(docsPageReferencePath)
  ? readFileSync(docsPageReferencePath, "utf-8")
  : "";
const docsRoutes = existsSync(docsRoutesPath)
  ? readFileSync(docsRoutesPath, "utf-8")
  : "";
const docsContent = existsSync(docsContentPath)
  ? readFileSync(docsContentPath, "utf-8")
  : "";

// ─── Call Ark API ─────────────────────────────────────────────────────────
function isRetryableArkError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|terminated|other side closed|Ark returned empty content/i.test(
    message,
  );
}

function httpsPostStream(urlString, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = JSON.stringify(body);
    const request = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        family: 4,
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 900_000,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            const responseBody = Buffer.concat(chunks).toString("utf-8");
            reject(new Error(`Ark API error ${status}: ${responseBody}`));
          });
          response.on("error", reject);
          return;
        }

        const streamedResponse = new Response(Readable.toWeb(response), {
          headers: {
            "content-type": response.headers["content-type"] ?? "",
          },
        });
        readArkStream(streamedResponse).then(resolve, reject);
      },
    );

    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy(new Error("Request timed out"));
    });
    request.write(payload);
    request.end();
  });
}

async function callArkOnce(systemPrompt, userPrompt) {
  const url = `${ARK_BASE_URL}/chat/completions`;
  console.log(`[Agent] Calling ${url} with model ${ARK_MODEL} (streaming)`);

  const content = await httpsPostStream(
    url,
    {
      Accept: "text/event-stream",
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
      stream: true,
    },
  );
  if (content.trim() === "") {
    throw new Error("Ark returned empty content.");
  }
  return content;
}

async function callArk(systemPrompt, userPrompt) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await callArkOnce(systemPrompt, userPrompt);
    } catch (error) {
      lastError = error;
      if (attempt === 2 || !isRetryableArkError(error)) throw error;
      console.warn(
        `[Agent] Ark request failed (${error.message}); retrying once.`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  throw lastError;
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
  const parsedFiles = parseFileBlocks(implementation);
  const filesWritten = [];

  for (const file of parsedFiles) {
    let filePath = file.path.replace(/^\.\//, "");
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

    writeFileSync(absPath, `${file.content}\n`);
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

  const isEnhancement = TYPE === "enhancement";
  const enhancementContext = isEnhancement
    ? buildEnhancementContext(repoDir, COMPONENT_PASCAL, COMPONENT_KEBAB)
    : "";
  const enhancementInstructions = isEnhancement
    ? `
This is an enhancement to an existing component. Modify the current implementation instead of creating a parallel component or a second state model.

End the spec with a machine-readable implementation file plan in this exact form:
<!-- agent-files
packages/ui/src/ExistingComponent.tsx
packages/ui/src/__tests__/ExistingComponent.test.tsx
apps/docs/src/pages/existing-component.tsx
-->

The plan must list every existing file to modify and every new file to add. Use one repository-relative path per line. Allowed roots are packages/ui/src/, packages/hooks/src/, apps/docs/src/, and e2e/tests/. Allowed extensions are .ts, .tsx, .css, and .md. Include implementation, tests, and documentation files. Do not include .github, .agent, package manifests, or build configuration.

## Existing Enhancement Context
${enhancementContext}
`
    : "";

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

${enhancementInstructions}

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
10. Compatibility and migration impact
11. Open questions (if any)
${isEnhancement ? "12. Implementation File Plan using the required agent-files comment" : ""}`;

  const spec = await callArk(systemPrompt, userPrompt);
  writeFileSync(join(runDir, "spec.md"), spec);
  if (isEnhancement) {
    const files = extractImplementationFilePlan(spec);
    console.log(`[Agent] Enhancement file plan: ${files.join(", ")}`);
  }
  console.log(`[Agent] Spec written to ${join(runDir, "spec.md")}`);
  return spec;
}

function readApprovedSpec() {
  const specPath = join(runDir, "spec.md");
  if (!existsSync(specPath)) {
    throw new Error(
      `Approved spec is missing at .agent/runs/${runId}/spec.md.`,
    );
  }
  const spec = readFileSync(specPath, "utf-8").trim();
  if (spec === "") {
    throw new Error(`Approved spec is empty at .agent/runs/${runId}/spec.md.`);
  }
  return `${spec}\n`;
}

// ─── Phase 3: Generate Implementation ─────────────────────────────────────
async function generateEnhancementImplementation(
  spec,
  plannedFiles,
  references,
) {
  const allowedFiles = new Map(
    plannedFiles.map((file) => [file, resolvePlannedFile(repoDir, file)]),
  );
  const filesWritten = [];
  const rawOutputs = [];
  const batches = planFileBatches(
    plannedFiles.map((file) => {
      const absolutePath = resolvePlannedFile(repoDir, file);
      return {
        path: file,
        characters: existsSync(absolutePath)
          ? statSync(absolutePath).size
          : undefined,
      };
    }),
  );

  console.log(
    `[Agent] Enhancement files will be generated in ${batches.length} batches.`,
  );

  const generateBatch = async (batch, label, allowSingleRetry = true) => {
    const filesToGenerate = batch
      .map((file, index) => `${index + 1}. ${file}`)
      .join("\n");
    const plannedContext = readPlannedFileContext(repoDir, plannedFiles);
    const systemPrompt = `You are a senior React component library engineer working on seam-ui.
You have written a spec and now must implement part of an existing component enhancement.

## Pattern Files (for reference)
${patternGuide}

## Design Tokens (CSS)
${tokens}

## Motion Tokens (TypeScript)
${motionTokens}

## Reference Components (for code style)
${references}

Output format: You must output separate complete files, each starting with a marker line:
=== FILE: <repository-relative path> ===
<complete file content>
=== END FILE ===

Only return files from the list below. Use their exact repository-relative paths. Do not return explanations, diffs, partial files, or code fences around the entire response.
Every requested file in this batch must be complete and include its closing marker.

Files to generate in this batch:
${filesToGenerate}

This is an enhancement to an existing component. Modify the existing implementation and preserve public behavior unless the approved Spec explicitly changes it. Do not create a parallel component, a second form/state system, or unrelated refactors.

Rules:
- Use existing hooks from seam-hooks
- Use CSS tokens (--uk-*) from tokens.css
- Use Motion tokens from motion.ts
- Follow the code style of existing components
- Include comprehensive tests where the requested batch contains tests

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

    const userPrompt = `Implement these existing component enhancement files: ${batch.join(", ")}

## Spec:
${spec}

## Existing index.ts exports:
${currentExports}

## Existing implementation files
${plannedContext}

Generate every requested file in this batch following the output format specified above.`;

    console.log(`[Agent] Implementation batch ${label}: ${batch.join(", ")}`);
    const implementation = await callArk(systemPrompt, userPrompt);
    rawOutputs.push(`# Batch ${label}\n\n${implementation}`);
    const parsedFiles = parseFileBlocks(implementation);
    const normalizedFiles = new Map();

    for (const file of parsedFiles) {
      const filePath = normalizePlannedPath(file.path);
      if (!allowedFiles.has(filePath)) {
        throw new Error(
          `Agent attempted to write an unsupported source file: ${filePath}`,
        );
      }
      if (normalizedFiles.has(filePath)) {
        throw new Error(
          `Agent returned the same file more than once: ${filePath}`,
        );
      }
      normalizedFiles.set(filePath, file.content);
    }

    for (const [filePath, fileContent] of normalizedFiles) {
      if (filesWritten.includes(filePath)) continue;
      const absolutePath = allowedFiles.get(filePath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, `${fileContent}\n`);
      filesWritten.push(filePath);
      console.log(`[Agent] Wrote: ${absolutePath}`);
    }

    const missingFiles = batch.filter((file) => !filesWritten.includes(file));
    if (missingFiles.length === 0) return;

    if (missingFiles.length === 1) {
      if (allowSingleRetry) {
        console.warn(
          `[Agent] Batch ${label} omitted ${missingFiles[0]}; retrying that file alone.`,
        );
        await generateBatch(missingFiles, `${label}.1`, false);
        return;
      }
      writeFileSync(
        join(runDir, "implementation-raw.md"),
        rawOutputs.join("\n\n"),
      );
      throw new Error(
        `Agent implementation omitted required file: ${missingFiles[0]}.`,
      );
    }
    const midpoint = Math.ceil(missingFiles.length / 2);
    console.warn(
      `[Agent] Batch ${label} omitted ${missingFiles.join(", ")}; splitting the remaining files.`,
    );
    await generateBatch(missingFiles.slice(0, midpoint), `${label}.1`);
    await generateBatch(missingFiles.slice(midpoint), `${label}.2`);
  };

  try {
    for (const [index, batch] of batches.entries()) {
      await generateBatch(batch, String(index + 1));
    }
  } catch (error) {
    if (rawOutputs.length > 0) {
      writeFileSync(
        join(runDir, "implementation-raw.md"),
        `${rawOutputs.join("\n\n")}\n`,
      );
    }
    throw error;
  }

  const missingFiles = plannedFiles.filter(
    (file) => !filesWritten.includes(file),
  );
  if (missingFiles.length > 0) {
    throw new Error(
      `Agent implementation omitted required files: ${missingFiles.join(", ")}.`,
    );
  }

  console.log(
    `[Agent] Enhancement implementation complete. ${filesWritten.length} files written.`,
  );
  return filesWritten;
}

async function generateImplementation(spec) {
  console.log(`[Agent] Phase 3: Generating implementation for ${COMPONENT}...`);

  const isEnhancement = TYPE === "enhancement";
  const isNewComponent = TYPE === "new-component";
  const references = referenceComponents.slice(0, 3).join("\n\n---\n\n");
  const plannedFiles = isEnhancement ? extractImplementationFilePlan(spec) : [];
  const plannedContext = isEnhancement
    ? readPlannedFileContext(repoDir, plannedFiles)
    : "";

  if (isEnhancement) {
    return generateEnhancementImplementation(spec, plannedFiles, references);
  }
  const docsFiles = isNewComponent
    ? `
5. apps/docs/src/pages/${COMPONENT_KEBAB}.tsx - Documentation page
6. apps/docs/src/routes.tsx - Import the new page and register its slug
7. apps/docs/src/content/components.ts - Add the component metadata to the catalog
`
    : "";
  const docsInstructions = isEnhancement
    ? `
This is an enhancement to an existing component. Modify the existing implementation and preserve public behavior unless the approved Spec explicitly changes it. Do not create a parallel component, a second form/state system, or unrelated refactors.

Only return files listed in the approved implementation file plan. Update the existing documentation and demos in place. Do not add routes or catalog entries unless the plan explicitly includes those files.
`
    : isNewComponent
      ? `
For the new component, also create the user-facing docs page and register it:
- The page must export ${COMPONENT_PASCAL}Page and follow the supplied docs reference.
- Include an import CodeBlock, a live Demo, an API PropsTable, and accessibility notes.
- Update routes.tsx with the import and componentPages entry.
- Update components.ts with a path, name, summary, and tags entry.
- Do not add a separate demo file unless the reference page requires one.

## Documentation Reference
${docsPageReference}

## Current Routes
${docsRoutes}

## Current Component Catalog
${docsContent}
`
      : "";
  const pathsInstructions = isEnhancement
    ? "Use the exact repository-relative paths from the approved implementation file plan. Always output complete files."
    : "For files 1-4, use paths relative to `packages/ui/src/`. For docs files 5-7, use repository-relative paths under `apps/docs/src/`. Always output complete files.";
  const filesToGenerate = isEnhancement
    ? plannedFiles.map((file, index) => `${index + 1}. ${file}`).join("\n")
    : `1. ${COMPONENT_PASCAL}.tsx - Component implementation
2. ${COMPONENT_KEBAB}.css - Component styles
3. __tests__/${COMPONENT_PASCAL}.test.tsx - Tests
4. Update to src/index.ts - Export addition
${docsFiles}`;

  const systemPrompt = `You are a senior React component library engineer working on seam-ui.
You have written a spec and now must implement ${isEnhancement ? "the existing component enhancement" : "the component"}.

## Pattern Files (for reference)
${patternGuide}

## Design Tokens (CSS)
${tokens}

## Motion Tokens (TypeScript)
${motionTokens}

## Reference Components (for code style)
${references}

Output format: You must output separate files, each starting with a marker line:
=== FILE: <path> ===
<file content>
=== END FILE ===

${pathsInstructions}

Files to generate:
${filesToGenerate}
${docsInstructions}

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

  const userPrompt = `Implement ${isEnhancement ? "the existing component enhancement" : "the component"}: ${COMPONENT}

## Spec:
${spec}

## Existing index.ts exports:
${currentExports}

${isEnhancement ? `## Existing implementation files\n${plannedContext}\n` : ""}

Generate the implementation files following the output format specified above.`;

  const implementation = await callArk(systemPrompt, userPrompt);

  const allowedFiles = isEnhancement
    ? new Map(
        plannedFiles.map((file) => [file, resolvePlannedFile(repoDir, file)]),
      )
    : new Map([
        [`${COMPONENT_PASCAL}.tsx`, join(srcDir, `${COMPONENT_PASCAL}.tsx`)],
        [`${COMPONENT_KEBAB}.css`, join(srcDir, `${COMPONENT_KEBAB}.css`)],
        [
          `__tests__/${COMPONENT_PASCAL}.test.tsx`,
          join(srcDir, "__tests__", `${COMPONENT_PASCAL}.test.tsx`),
        ],
        ["index.ts", join(srcDir, "index.ts")],
      ]);
  if (TYPE === "new-component") {
    allowedFiles.set(
      `apps/docs/src/pages/${COMPONENT_KEBAB}.tsx`,
      join(repoDir, "apps", "docs", "src", "pages", `${COMPONENT_KEBAB}.tsx`),
    );
    allowedFiles.set("apps/docs/src/routes.tsx", docsRoutesPath);
    allowedFiles.set("apps/docs/src/content/components.ts", docsContentPath);
  }
  const parsedFiles = parseFileBlocks(implementation);
  const filesWritten = [];

  for (const file of parsedFiles) {
    const filePath = file.path;
    const fileContent = file.content;

    const cleanPath = isEnhancement
      ? normalizePlannedPath(filePath)
      : filePath
          .replace(/^\.\//, "")
          .replace(/^packages\/ui\/src\//, "")
          .replace(/^src\//, "");
    const absPath = allowedFiles.get(cleanPath);
    if (!absPath) {
      throw new Error(
        `Agent attempted to write an unsupported source file: ${filePath}`,
      );
    }
    if (filesWritten.includes(cleanPath)) {
      throw new Error(
        `Agent returned the same file more than once: ${filePath}`,
      );
    }
    const absDir = dirname(absPath);
    mkdirSync(absDir, { recursive: true });
    writeFileSync(absPath, fileContent + "\n");
    filesWritten.push(cleanPath);
    console.log(`[Agent] Wrote: ${absPath}`);
  }

  if (filesWritten.length === 0) {
    writeFileSync(join(runDir, "implementation-raw.md"), implementation);
    throw new Error(
      "Implementation response did not contain any parseable file changes.",
    );
  }

  const requiredFiles = isEnhancement
    ? plannedFiles
    : TYPE === "new-component"
      ? [
          `${COMPONENT_PASCAL}.tsx`,
          `${COMPONENT_KEBAB}.css`,
          `__tests__/${COMPONENT_PASCAL}.test.tsx`,
          "index.ts",
          `apps/docs/src/pages/${COMPONENT_KEBAB}.tsx`,
          "apps/docs/src/routes.tsx",
          "apps/docs/src/content/components.ts",
        ]
      : [];
  const missingFiles = requiredFiles.filter(
    (file) => !filesWritten.includes(file),
  );
  if (missingFiles.length > 0) {
    writeFileSync(join(runDir, "implementation-raw.md"), implementation);
    throw new Error(
      `Agent implementation omitted required files: ${missingFiles.join(", ")}.`,
    );
  }

  if (!isEnhancement) {
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
  }

  console.log(
    `[Agent] Implementation complete. ${filesWritten.length} files written.`,
  );
  return filesWritten;
}

// ─── Phase 4: Generate Changeset ──────────────────────────────────────────
async function generateChangeset() {
  console.log(`[Agent] Phase 4: Generating Changeset...`);

  const bumpType =
    TYPE === "new-component" || TYPE === "enhancement" ? "minor" : "patch";
  const summary =
    TYPE === "new-component"
      ? `feat(ui): add ${COMPONENT} component`
      : TYPE === "enhancement"
        ? `feat(ui): enhance ${COMPONENT}`
        : `fix(ui): update ${COMPONENT}`;
  const changesetContent = `---
"seam-react": ${bumpType}
---

${summary}

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

    if (SPEC_ONLY) {
      const spec = await generateSpec();
      console.log(`[Agent] Spec-only run complete: ${join(runDir, "spec.md")}`);
      console.log(`[Agent] Spec characters: ${spec.length}`);
      return;
    }

    const spec = SPEC_APPROVED ? readApprovedSpec() : await generateSpec();
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
