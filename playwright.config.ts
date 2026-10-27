import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: "./e2e/results",
  snapshotDir: "./e2e/screenshots",
  timeout: 30_000,
  retries: 1,
  workers: 4,
  updateSnapshots: process.env.CI ? "missing" : "none",
  reporter: [["html", { open: "never", outputFolder: "e2e/report" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
  webServer: {
    command: "pnpm --filter @chenhaojie9527/docs dev --port 5173",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
