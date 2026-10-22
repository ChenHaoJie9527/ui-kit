import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "seam-hooks": fileURLToPath(
        new URL("../../packages/hooks/src/index.ts", import.meta.url),
      ),
      "seam-react": fileURLToPath(
        new URL("../../packages/ui/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
