import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const packages = [
  {
    name: "seam-hooks",
    directory: new URL("../packages/hooks/", import.meta.url),
  },
  {
    name: "seam-react",
    directory: new URL("../packages/ui/", import.meta.url),
  },
];
const dryRunArgs = process.env.NPM_PUBLISH_DRY_RUN === "1" ? ["--dry-run"] : [];
const manifests = await Promise.all(
  packages.map(async ({ name, directory }) => {
    const manifest = JSON.parse(
      await readFile(new URL("package.json", directory), "utf8"),
    );

    return { name, directory, manifest };
  }),
);

for (const [index, { name, directory, manifest }] of manifests.entries()) {
  const published = spawnSync(
    "npm",
    ["view", `${name}@${manifest.version}`, "version"],
    { encoding: "utf8" },
  );

  if (published.status === 0) {
    console.log(`${name}@${manifest.version} 已存在，跳过`);

    // A skipped workspace package can still be a local build dependency of a
    // later package. Build it so the clean CI checkout has its dist artifacts.
    if (index < manifests.length - 1) {
      const build = spawnSync(command, ["build"], {
        cwd: fileURLToPath(directory),
        stdio: "inherit",
      });

      if (build.status !== 0) {
        process.exit(build.status ?? 1);
      }
    }

    continue;
  }

  const result = spawnSync(
    command,
    [
      "--filter",
      name,
      "publish",
      "--access",
      "public",
      "--no-git-checks",
      ...dryRunArgs,
    ],
    {
      cwd: fileURLToPath(directory),
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
