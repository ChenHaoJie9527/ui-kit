import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const MODULE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const IMPORT_PATTERN = /(?:\bfrom\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;

function addModuleCandidates(candidates, basePath) {
  const extension = extname(basePath);
  if (extension !== "") {
    candidates.push(basePath);
    return;
  }

  for (const candidateExtension of MODULE_EXTENSIONS) {
    candidates.push(`${basePath}${candidateExtension}`);
  }
  for (const candidateExtension of MODULE_EXTENSIONS) {
    candidates.push(join(basePath, `index${candidateExtension}`));
  }
}

export function getTestDependencies(filePath) {
  const fileName = filePath.split("/").at(-1) ?? "";
  const match = fileName.match(/^(.*)\.(?:test|spec)\.(tsx|ts|jsx|js)$/);
  if (!match) return [];

  const baseName = match[1];
  const extension = match[2];
  const directory = dirname(filePath);
  return [
    join(directory, "..", `${baseName}.${extension}`),
    join(directory, "..", `${baseName}.tsx`),
    join(directory, "..", `${baseName}.ts`),
  ].map((path) => path.replaceAll("\\", "/"));
}

function getRelativeImports(repoDir, filePath) {
  if (!existsSync(join(repoDir, filePath))) return [];

  const source = readFileSync(join(repoDir, filePath), "utf-8");
  const imports = [];
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const basePath = join(dirname(filePath), specifier).replaceAll("\\", "/");
    const candidates = [];
    addModuleCandidates(candidates, basePath);
    imports.push(candidates);
  }
  return imports;
}

export function resolveDependencyContext(
  repoDir,
  seedFiles,
  availableFiles,
  maxFiles = 8,
) {
  const available = new Set(availableFiles);
  const result = [];
  const queued = [...seedFiles];
  const seen = new Set();

  while (queued.length > 0 && result.length < maxFiles) {
    const filePath = queued.shift()?.replaceAll("\\", "/");
    if (!filePath || seen.has(filePath)) continue;
    seen.add(filePath);

    if (available.has(filePath)) result.push(filePath);

    const candidates = [
      ...getTestDependencies(filePath),
      ...getRelativeImports(repoDir, filePath).flat(),
    ];
    for (const candidate of candidates) {
      if (available.has(candidate) && !seen.has(candidate)) {
        queued.push(candidate);
      }
    }
  }

  return result;
}
