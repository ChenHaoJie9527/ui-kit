import { readFile, writeFile } from "node:fs/promises";

const rootUrl = new URL("../", import.meta.url);
const packageUrl = new URL("packages/ui/package.json", rootUrl);
const entryUrl = new URL("packages/ui/src/index.ts", rootUrl);
const releasesUrl = new URL(
  "apps/docs/src/content/component-releases.json",
  rootUrl,
);
const dryRun = process.argv.includes("--dry-run");
const releaseDate =
  process.env.COMPONENT_RELEASE_DATE ?? new Date().toISOString();

const [manifest, entry, releases] = await Promise.all([
  readFile(packageUrl, "utf8").then(JSON.parse),
  readFile(entryUrl, "utf8"),
  readFile(releasesUrl, "utf8").then(JSON.parse),
]);
const exportedComponents = new Set();
let changed = false;
const exportPattern = /export\s*\{([^}]+)\}\s*from\s*["']\.[^"']+["'];?/gs;

for (const match of entry.matchAll(exportPattern)) {
  for (const specifier of (match[1] ?? "").split(",")) {
    const normalized = specifier.trim();

    if (!normalized || normalized.startsWith("type ")) {
      continue;
    }

    const exportedName = normalized.split(/\s+as\s+/).at(-1);

    if (exportedName) {
      exportedComponents.add(exportedName);
    }
  }
}

for (const name of exportedComponents) {
  if (!releases[name]) {
    releases[name] = {
      introducedIn: manifest.version,
      releasedAt: releaseDate,
    };
    changed = true;
    console.log(
      `${dryRun ? "Would add" : "Add"} ${name}@${manifest.version} to component release history`,
    );
  }
}

for (const name of Object.keys(releases)) {
  if (!exportedComponents.has(name)) {
    delete releases[name];
    changed = true;
    console.log(
      `${dryRun ? "Would remove" : "Remove"} ${name} from component release history`,
    );
  }
}

const next = `${JSON.stringify(releases, null, 2)}\n`;

if (!dryRun && changed) {
  await writeFile(releasesUrl, next);
}
