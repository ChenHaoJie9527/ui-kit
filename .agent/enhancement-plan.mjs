import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, normalize, resolve, sep } from "node:path";
import { resolveDependencyContext } from "./context-files.mjs";

const PLAN_PATTERN = /<!--\s*agent-files\s*\r?\n([\s\S]*?)-->/i;
const ALLOWED_ROOTS = [
  "packages/ui/src/",
  "packages/hooks/src/",
  "apps/docs/src/",
  "e2e/tests/",
];
const ALLOWED_EXTENSION = /\.(?:ts|tsx|css|md)$/;
const SAFE_PATH = /^[A-Za-z0-9._@+/-]+$/;

function cleanPlanEntry(entry) {
  return entry
    .trim()
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^`|`$/g, "")
    .trim();
}

export function normalizePlannedPath(filePath) {
  const value = String(filePath ?? "")
    .trim()
    .replaceAll("\\", "/");
  if (value === "") {
    throw new Error("Implementation file plan contains an empty path.");
  }
  if (isAbsolute(value) || value.split("/").includes("..")) {
    throw new Error(`Implementation file plan path is unsafe: ${value}`);
  }

  const normalized = normalize(value)
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
  if (!SAFE_PATH.test(normalized)) {
    throw new Error(
      `Implementation file plan path has unsupported characters: ${value}`,
    );
  }
  if (!ALLOWED_ROOTS.some((root) => normalized.startsWith(root))) {
    throw new Error(
      `Implementation file plan path is outside allowed roots: ${value}`,
    );
  }
  if (!ALLOWED_EXTENSION.test(normalized)) {
    throw new Error(
      `Implementation file plan path has an unsupported extension: ${value}`,
    );
  }
  return normalized;
}

export function extractImplementationFilePlan(spec, maxFiles = 24) {
  const match = spec.match(PLAN_PATTERN);
  if (!match) {
    throw new Error(
      "Approved enhancement spec must include an <!-- agent-files ... --> implementation plan.",
    );
  }

  const files = [
    ...new Set(
      match[1]
        .split(/\r?\n/)
        .map(cleanPlanEntry)
        .filter(Boolean)
        .map(normalizePlannedPath),
    ),
  ];

  if (files.length === 0) {
    throw new Error("Implementation file plan is empty.");
  }
  if (files.length > maxFiles) {
    throw new Error(
      `Implementation file plan has ${files.length} files; maximum is ${maxFiles}.`,
    );
  }
  if (!files.some((file) => /^packages\/(?:ui|hooks)\/src\//.test(file))) {
    throw new Error(
      "Implementation file plan must include a package source file.",
    );
  }
  if (
    !files.some(
      (file) => file.includes("/__tests__/") || file.startsWith("e2e/tests/"),
    )
  ) {
    throw new Error("Implementation file plan must include a test file.");
  }
  if (!files.some((file) => file.startsWith("apps/docs/src/"))) {
    throw new Error(
      "Implementation file plan must include a documentation file.",
    );
  }

  return files;
}

export function resolvePlannedFile(repoDir, filePath) {
  const normalized = normalizePlannedPath(filePath);
  const root = resolve(repoDir);
  const absolutePath = resolve(root, normalized);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${sep}`)) {
    throw new Error(
      `Implementation file path escapes the repository: ${filePath}`,
    );
  }
  return absolutePath;
}

export function readPlannedFileContext(
  repoDir,
  files,
  maxCharacters = 180_000,
) {
  let totalCharacters = 0;
  const sections = [];

  for (const file of files) {
    const absolutePath = resolvePlannedFile(repoDir, file);
    if (!existsSync(absolutePath)) {
      sections.push(
        `=== NEW FILE: ${file} ===\nThis file does not exist yet. Return a complete file.\n=== END NEW FILE ===`,
      );
      continue;
    }
    if (!statSync(absolutePath).isFile()) {
      throw new Error(`Implementation file plan target is not a file: ${file}`);
    }

    const content = readFileSync(absolutePath, "utf-8");
    totalCharacters += content.length;
    if (totalCharacters > maxCharacters) {
      throw new Error(
        `Implementation context exceeds ${maxCharacters} characters while reading ${file}.`,
      );
    }
    sections.push(
      `=== EXISTING FILE: ${file} ===\n${content}\n=== END EXISTING FILE ===`,
    );
  }

  return sections.join("\n\n");
}

export function readGenerationDependencyContext(
  repoDir,
  batchFiles,
  plannedFiles,
  maxFiles = 4,
) {
  const dependencies = resolveDependencyContext(
    repoDir,
    batchFiles,
    plannedFiles,
    maxFiles,
  )
    .filter((file) => !batchFiles.includes(file))
    .filter((file) => existsSync(join(repoDir, file)));

  return dependencies.length === 0
    ? ""
    : readPlannedFileContext(repoDir, dependencies);
}

export function buildEnhancementContext(
  repoDir,
  componentPascal,
  componentKebab,
) {
  const srcDir = join(repoDir, "packages", "ui", "src");
  const candidateNames = new Set([
    `${componentPascal}.tsx`,
    `${componentPascal}Component.tsx`,
  ]);

  if (existsSync(srcDir)) {
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        entry.name.replace(/\.tsx$/, "").startsWith(componentPascal)
      ) {
        candidateNames.add(entry.name);
      }
    }
  }

  const sourceFiles = [...candidateNames]
    .map((name) => `packages/ui/src/${name}`)
    .filter((file) => existsSync(join(repoDir, file)));
  if (sourceFiles.length === 0) {
    throw new Error(
      `Enhancement target ${componentPascal} was not found under packages/ui/src.`,
    );
  }

  const contextFiles = new Set(sourceFiles);
  for (const sourceFile of sourceFiles) {
    const baseName =
      sourceFile
        .split("/")
        .at(-1)
        ?.replace(/\.tsx$/, "") ?? "";
    for (const file of [
      `packages/ui/src/__tests__/${baseName}.test.tsx`,
      `packages/ui/src/${componentKebab}-component.css`,
      `packages/ui/src/${componentKebab}.css`,
    ]) {
      if (existsSync(join(repoDir, file))) contextFiles.add(file);
    }
  }

  const docsPage = `apps/docs/src/pages/${componentKebab}.tsx`;
  if (existsSync(join(repoDir, docsPage))) contextFiles.add(docsPage);

  const demoDir = `apps/docs/src/demos/components/${componentKebab}`;
  const demoDirPath = join(repoDir, demoDir);
  if (existsSync(demoDirPath)) {
    for (const entry of readdirSync(demoDirPath, { withFileTypes: true })) {
      if (entry.isFile() && /\.(?:ts|tsx|css|md)$/.test(entry.name)) {
        contextFiles.add(`${demoDir}/${entry.name}`);
      }
    }
  }

  const mainIndexPath = "packages/ui/src/index.ts";
  if (existsSync(join(repoDir, mainIndexPath))) {
    contextFiles.add(mainIndexPath);
  }

  return [
    `Detected existing component files: ${[...contextFiles].join(", ")}`,
    readPlannedFileContext(repoDir, [...contextFiles], 220_000),
  ].join("\n\n");
}
