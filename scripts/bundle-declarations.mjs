/**
 * 把 tsrs 输出的逐文件声明打包成每个入口一个自包含的 .d.ts。
 *
 * 背景（issue #83）：tsrs 在 Bundler 解析模式下把源码的无后缀相对导入
 * 原样输出到声明文件，node16/nodenext 消费者因此把全部导出解析成 any。
 * 逐入口打包后声明内部不再有相对导入，任何 moduleResolution 都能正确解析。
 *
 * 用法：node scripts/bundle-declarations.mjs
 * 前置：两个包已执行 tsrs 声明输出（pnpm build 的一部分）。
 */
import { copyFile, readFile, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";

const root = fileURLToPath(new URL("..", import.meta.url));

const packages = [
  {
    directory: "packages/ui",
    tsconfig: "packages/ui/tsconfig.build.json",
    // package.json exports 里的每个 "types" 入口都打包一份。
    entries: {
      index: "dist/index.d.ts",
      valibot: "dist/valibot.d.ts",
      SeamStyles: "dist/SeamStyles.d.ts",
    },
  },
  {
    directory: "packages/hooks",
    tsconfig: "packages/hooks/tsconfig.build.json",
    entries: {
      index: "dist/index.d.ts",
    },
  },
];

/** 这些包的公开类型保留为外部导入（消费者作为依赖持有它们）。 */
const externalPackages = [
  /^react($|\/)/,
  /^react-dom($|\/)/,
  /^motion($|\/)/,
  /^embla-carousel($|\/)/,
  /^valibot($|\/)/,
  /^seam-hooks($|\/)/,
];

const target = process.argv[2];

for (const pkg of packages) {
  if (target && pkg.directory !== target) {
    continue;
  }
  const directory = `${root}${pkg.directory}`;
  const tempDir = `${directory}/dist/.dts-bundle-tmp`;

  const build = await rollup({
    input: Object.fromEntries(
      Object.entries(pkg.entries).map(([name, path]) => [
        name,
        `${directory}/${path}`,
      ]),
    ),
    external: externalPackages,
    plugins: [dts({ tsconfig: `${root}${pkg.tsconfig}` })],
  });

  await build.write({
    dir: tempDir,
    format: "es",
    entryFileNames: "[name].d.ts",
  });
  await build.close();

  // 打包产物就位，随后清掉逐模块声明（共享类型会被拆成带 hash 的 chunk）。
  const bundled = await readdir(tempDir);
  for (const file of bundled) {
    await copyFile(`${tempDir}/${file}`, `${directory}/dist/${file}`);
  }
  await rm(tempDir, { recursive: true, force: true });

  // 自检：打包后的声明不允许出现无扩展名的相对导入。
  // 只要不存在这种导入，node16/nodenext 消费者就必然能正确解析（issue #83 的回归防线）。
  const relativeImport = /(?:from\s+|import\()["'](\.\.?\/[^"']+)["']/g;
  for (const file of bundled) {
    const text = await readFile(`${directory}/dist/${file}`, "utf8");
    for (const match of text.matchAll(relativeImport)) {
      const specifier = match[1];
      if (!/\.(js|mjs|cjs)$/.test(specifier)) {
        throw new Error(
          `${file} 存在无扩展名的相对导入（${match[0]}）。打包声明应自包含，请检查构建配置。`,
        );
      }
    }
  }

  // 清掉逐模块声明留下的空目录，避免发布包携带无用目录。
  const { glob } = await import("node:fs/promises");
  const keep = new Set(bundled);
  for await (const file of glob(`${directory}/dist/**/*.d.ts`)) {
    const relative = file.slice(`${directory}/dist/`.length);
    if (!keep.has(relative)) {
      await rm(file, { force: true });
    }
  }
  for (const dir of await readdir(`${directory}/dist`, {
    withFileTypes: true,
  })) {
    if (dir.isDirectory()) {
      await rm(`${directory}/dist/${dir.name}`, {
        recursive: true,
        force: true,
      });
    }
  }

  console.log(`✓ ${pkg.directory}: 声明已打包（${bundled.length} 个文件）`);
}
