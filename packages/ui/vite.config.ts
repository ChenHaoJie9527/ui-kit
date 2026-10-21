import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: true,
    emptyOutDir: true,
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/build-entry.ts", import.meta.url)),
        styles: fileURLToPath(new URL("./src/SeamStyles.tsx", import.meta.url)),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        if (entryName === "styles") {
          return format === "es" ? "styles.js" : "styles.cjs";
        }

        return format === "es" ? "index.js" : "index.cjs";
      },
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "seam-hooks",
        "motion",
        "motion/react",
        "motion/react-m",
      ],
    },
  },
});
