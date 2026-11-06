import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const root = fileURLToPath(new URL("..", import.meta.url));
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
const dryRun = process.env.NPM_PUBLISH_DRY_RUN === "1";
const manifests = await Promise.all(
  packages.map(async ({ name, directory }) => {
    const manifest = JSON.parse(
      await readFile(new URL("package.json", directory), "utf8"),
    );

    return { name, directory, manifest };
  }),
);

// 已发布的版本不会重新发布，但后面的包可能依赖它的 dist。clean checkout 里
// 没有构建产物，所以先补一次 build，避免下游包构建失败。
for (const [index, { name, directory, manifest }] of manifests.entries()) {
  const published = spawnSync(
    "npm",
    ["view", `${name}@${manifest.version}`, "version"],
    { encoding: "utf8" },
  );

  if (published.status !== 0) {
    continue;
  }

  console.log(`${name}@${manifest.version} 已存在，跳过`);

  if (index >= manifests.length - 1) {
    continue;
  }

  const build = spawnSync(command, ["build"], {
    cwd: fileURLToPath(directory),
    stdio: "inherit",
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

// 交给 Changesets 完成发布：按依赖顺序发布未发布版本、创建 annotated git
// tag，并把 git-tag 事件写入 CHANGESETS_OUTPUT。release 工作流依赖这份事件
// 输出推送 tag 并创建 GitHub Release。
const result = spawnSync(
  command,
  ["exec", "changeset", dryRun ? "publish-plan" : "publish"],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
