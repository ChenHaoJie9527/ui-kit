#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, "templates");

const component = process.argv[2];
const type = process.argv[3] || "new-component";

if (!component) {
  console.error("Usage: node .agent/scaffold.mjs <ComponentName> [type]");
  console.error("Types: new-component | enhancement | bugfix | deprecation");
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const runId = `${component.toLowerCase()}-${date}`;
const runDir = join(__dirname, "runs", runId);

mkdirSync(runDir, { recursive: true });

const files = [
  "manifest.json",
  "task.md",
  "spec.md",
  "decisions.md",
  "checkpoint.md",
  "evidence.json",
  "references.json",
];

for (const file of files) {
  let content = readFileSync(join(templatesDir, file), "utf-8");
  content = content.replaceAll("{component}", component);
  content = content.replaceAll("{runId}", runId);
  content = content.replaceAll("{date}", date);
  content = content.replaceAll("{ISO date}", new Date().toISOString());
  content = content.replaceAll(
    "{new-component | enhancement | bugfix | deprecation}",
    type,
  );
  content = content.replaceAll("{new-component}", type);
  writeFileSync(join(runDir, file), content);
}

const manifestPath = join(runDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
manifest.component = component;
manifest.type = type;
manifest.startedAt = new Date().toISOString();
manifest.updatedAt = new Date().toISOString();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Run directory created: .agent/runs/${runId}/`);
console.log(
  `Next: fill in task.md, then ask the agent to generate spec.md (read-only, no code changes).`,
);
