import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const packages = [
  { directory: "hooks", workspaceName: "seam-hooks" },
  { directory: "ui", workspaceName: "seam-react" },
];
const dryRunArgs =
  process.env.JSR_DRY_RUN === "1" ? ["--dry-run", "--allow-dirty"] : [];

function run(args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function isPublished(manifest) {
  const response = await fetch(`https://jsr.io/${manifest.name}/meta.json`);

  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(
      `Unable to query ${manifest.name} from JSR: ${response.status}`,
    );
  }

  const metadata = await response.json();
  return Boolean(metadata.versions?.[manifest.version]);
}

const root = fileURLToPath(new URL("../", import.meta.url));

// seam-react resolves seam-hooks through its published package entry during
// JSR validation, so build hooks first even when only publishing the UI.
for (const { workspaceName } of packages) {
  run(["--filter", workspaceName, "build"], root);
}

const packageEntries = await Promise.all(
  packages.map(async ({ directory }) => {
    const packageUrl = new URL(`../packages/${directory}/`, import.meta.url);
    const manifest = JSON.parse(
      await readFile(new URL("jsr.json", packageUrl), "utf8"),
    );

    return {
      cwd: fileURLToPath(packageUrl),
      manifest,
      published: await isPublished(manifest),
    };
  }),
);

for (const { cwd, manifest, published } of packageEntries) {
  if (published) {
    console.log(
      `${manifest.name}@${manifest.version} is already published, skipping`,
    );
    continue;
  }

  run(["dlx", "jsr@0.14.3", "publish", ...dryRunArgs], cwd);
}
