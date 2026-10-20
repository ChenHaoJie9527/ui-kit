import { readFile, writeFile } from "node:fs/promises";

const packages = ["hooks", "ui"];

await Promise.all(
  packages.map(async (packageName) => {
    const directory = new URL(`../packages/${packageName}/`, import.meta.url);
    const packageUrl = new URL("package.json", directory);
    const jsrUrl = new URL("jsr.json", directory);
    const manifest = JSON.parse(await readFile(packageUrl, "utf8"));
    const config = JSON.parse(await readFile(jsrUrl, "utf8"));

    if (manifest.version !== config.version) {
      config.version = manifest.version;
      await writeFile(jsrUrl, `${JSON.stringify(config, null, 2)}\n`);
    }
  }),
);
