import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@ui-kit/hooks": fileURLToPath(
        new URL("../../packages/hooks/src/index.ts", import.meta.url),
      ),
      "@ui-kit/ui": fileURLToPath(
        new URL("../../packages/ui/src/index.ts", import.meta.url),
      ),
    },
  },
});
