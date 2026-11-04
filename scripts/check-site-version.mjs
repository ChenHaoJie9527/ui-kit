#!/usr/bin/env node
/**
 * 比对线上站点实际部署的版本与 packages/ui/package.json。
 *
 * 站点是静态产物，版本号只存在于压缩后的 bundle 里，外面读不到。
 * 所以构建时会额外产出 version.json（见 apps/docs/vite.config.ts），
 * 这个脚本只做一件事：把它抓回来比对。
 *
 * 用法：
 *   node scripts/check-site-version.mjs                      # 默认检查 ui-kit.cn
 *   node scripts/check-site-version.mjs https://a https://b   # 多个站点
 *   node scripts/check-site-version.mjs --report out.json     # 额外写一份机器可读报告
 *
 * 退出码：
 *   0 = 全部一致
 *   1 = 版本不一致
 *   2 = 站点不可达，或没有 version.json（说明部署的是引入本脚本之前的构建）
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SITES = ["https://ui-kit.cn"];
const TIMEOUT_MS = 20_000;

const args = process.argv.slice(2);
let reportPath = null;
const sites = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--report") {
    reportPath = args[index + 1] ?? null;
    index += 1;
    continue;
  }

  sites.push(arg);
}

const targets = sites.length > 0 ? sites : DEFAULT_SITES;

const uiPackage = JSON.parse(
  await readFile(resolve(repoRoot, "packages/ui/package.json"), "utf8"),
);
const expected = uiPackage.version;

async function checkSite(target) {
  const url = new URL(
    "version.json",
    target.endsWith("/") ? target : `${target}/`,
  );

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "cache-control": "no-cache" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("json")) {
      // 静态站点的 SPA 回退会把未知路径喂成 index.html，
      // 这种情况比 HTTP 404 更能说明「部署产物太旧」。
      throw new Error(
        `返回的是 ${contentType || "未知类型"} 而不是 JSON（多半是 SPA 回退到了 index.html）`,
      );
    }

    const manifest = await response.json();
    const live = String(manifest.version ?? "");
    const matched = live === expected;

    return {
      site: target,
      status: matched ? "match" : "mismatch",
      expected,
      live,
      commit: manifest.commit ?? null,
      builtAt: manifest.builtAt ?? null,
      detail: matched ? null : `线上 ${live || "(空)"}，期望 ${expected}`,
    };
  } catch (error) {
    return {
      site: target,
      status: "unreachable",
      expected,
      live: null,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

const results = await Promise.all(targets.map((target) => checkSite(target)));

let worstExitCode = 0;

for (const result of results) {
  if (result.status === "mismatch") worstExitCode = Math.max(worstExitCode, 1);
  if (result.status === "unreachable")
    worstExitCode = Math.max(worstExitCode, 2);
}

for (const result of results) {
  const label = result.status === "unreachable" ? "取值失败" : result.status;

  if (result.status === "match") {
    console.log(
      `✓ ${result.site} — ${result.live}（${result.commit ?? "本地构建"}）`,
    );
    continue;
  }

  if (result.status === "unreachable") {
    console.error(
      `✗ ${result.site} — 无法读取 version.json：${result.detail}\n` +
        "  说明站点部署的是引入 version.json 之前的构建，或站点本身不可达。",
    );
    continue;
  }

  console.error(
    `✗ ${result.site} — 版本漂移：${result.detail}` +
      (result.builtAt ? `（线上构建于 ${result.builtAt}）` : ""),
  );
  console.error(`  ${label}`);
}

if (reportPath) {
  await writeFile(
    reportPath,
    `${JSON.stringify(
      { expected, checkedAt: new Date().toISOString(), results },
      null,
      2,
    )}\n`,
  );
  console.log(`报告已写入 ${reportPath}`);
}

process.exit(worstExitCode);
