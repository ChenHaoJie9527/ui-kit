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
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_MODEL = process.env.ARK_MODEL || "ark-code-latest";
const ARK_BASE_URL =
  process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/coding/v3";
const COMPONENT = process.env.AGENT_COMPONENT;
const TYPE = process.env.AGENT_TYPE || "new-component";
const ISSUE_BODY = process.env.AGENT_ISSUE_BODY || "";

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
const runId = `${COMPONENT.toLowerCase().replace(/\s+/g, "-")}-${date}`;
const runDir = join(__dirname, "runs", runId);

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
const srcDir = join(__dirname, "..", "packages", "ui", "src");
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
async function callArk(systemPrompt, userPrompt) {
  const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: ARK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 16384,
      temperature: 0.6,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ark API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
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
1. ${COMPONENT}.tsx - Component implementation
2. ${COMPONENT.toLowerCase()}.css - Component styles
3. src/__tests__/${COMPONENT}.test.tsx - Tests
4. Update to src/index.ts - Export addition

Rules:
- Use existing hooks from seam-hooks
- Use CSS tokens (--uk-*) from tokens.css
- Use Motion tokens from motion.ts
- Follow the code style of existing components
- Include comprehensive tests`;

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
