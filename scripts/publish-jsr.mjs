import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const packages = ["hooks", "ui"];
const dryRunArgs =
  process.env.JSR_DRY_RUN === "1" ? ["--dry-run", "--allow-dirty"] : [];

for (const packageName of packages) {
  const result = spawnSync(
    command,
    ["dlx", "jsr@0.14.3", "publish", ...dryRunArgs],
    {
      cwd: fileURLToPath(
        new URL(`../packages/${packageName}/`, import.meta.url),
      ),
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
