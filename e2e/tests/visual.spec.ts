import { test, expect } from "@playwright/test";

interface ComponentPage {
  name: string;
  path: string;
}

const COMPONENT_PAGES: ComponentPage[] = [
  { name: "button", path: "/#/components/button" },
  { name: "checkbox", path: "/#/components/checkbox" },
  { name: "input", path: "/#/components/input" },
  { name: "switch", path: "/#/components/switch" },
  { name: "tabs", path: "/#/components/tabs" },
];

for (const { name, path } of COMPONENT_PAGES) {
  for (const theme of ["light", "dark"]) {
    test(`${name}: ${theme} theme snapshot`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      if (theme === "dark") {
        await page.emulateMedia({ colorScheme: "dark" });
      } else {
        await page.emulateMedia({ colorScheme: "light" });
      }

      await page.waitForTimeout(500);

      const main = page.locator("main");
      await expect(main).toHaveScreenshot(`${name}-${theme}.png`, {
        maxDiffPixels: 100,
      });
    });
  }
}
