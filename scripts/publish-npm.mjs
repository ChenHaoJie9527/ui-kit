import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const packages = ["seam-hooks", "seam-react"];
const dryRunArgs = process.env.NPM_PUBLISH_DRY_RUN === "1" ? ["--dry-run"] : [];

for (const packageName of packages) {
  const result = spawnSync(
    command,
    [
      "--filter",
      packageName,
      "publish",
      "--access",
      "public",
      "--no-git-checks",
      ...dryRunArgs,
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
