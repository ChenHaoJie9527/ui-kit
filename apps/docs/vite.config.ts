import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import uiPackage from "../../packages/ui/package.json";

const hooksEntry = fileURLToPath(
  new URL("../../packages/hooks/src/index.ts", import.meta.url),
);
const uiEntry = fileURLToPath(
  new URL("../../packages/ui/src/index.ts", import.meta.url),
);
const uiValibotEntry = fileURLToPath(
  new URL("../../packages/ui/src/valibot.ts", import.meta.url),
);

/**
 * 站点部署后要能回答「线上到底是哪个版本」。
 * 版本徽标只存在于压缩后的 bundle 里，无法从外面读取，所以构建时
 * 额外产出一份 version.json 给 scripts/check-site-version.mjs 比对。
 */
function emitVersionManifest(): Plugin {
  return {
    name: "seam-emit-version-manifest",
    apply: "build",
    generateBundle() {
      const manifest = {
        version: uiPackage.version,
        commit: process.env.GITHUB_SHA ?? null,
        builtAt: new Date().toISOString(),
      };

      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
  };
}

export default defineConfig({
  // 提供 React Fast Refresh：改组件时保留状态，而不是整页刷新。
  plugins: [react(), tailwindcss(), emitVersionManifest()],
  resolve: {
    // 直接指向源码，开发时改 hooks / 组件会立刻热更新，无需先构建 dist。
    alias: {
      "seam-hooks": hooksEntry,
      "seam-react/valibot": uiValibotEntry,
      "seam-react": uiEntry,
    },
  },
  server: {
    port: 5173,
    // 端口被占用时自动换一个，而不是让 pnpm dev 直接失败。
    strictPort: false,
    fs: {
      // 允许读取工作区根目录，才能从 apps/docs 访问 packages/* 的源码。
      allow: ["../.."],
    },
  },
});
