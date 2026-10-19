import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("docs/assets", { recursive: true });

await build({
  entryPoints: ["apps/docs/main.tsx"],
  bundle: true,
  format: "iife",
  outfile: "docs/assets/app.js",
  jsx: "automatic",
  minify: true,
  target: ["es2020"],
  define: { "process.env.NODE_ENV": '"production"' },
});

console.log("docs built → docs/assets/app.js");
