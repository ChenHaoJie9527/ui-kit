import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

interface ComponentPage {
  name: string;
  path: string;
}

const COMPONENT_PAGES: ComponentPage[] = [
  { name: "Button", path: "/#/components/button" },
  { name: "CheckBox", path: "/#/components/checkbox" },
  { name: "Dialog", path: "/#/components/dialog" },
  { name: "Input", path: "/#/components/input" },
  { name: "Marquee", path: "/#/components/marquee" },
  { name: "Select", path: "/#/components/select" },
  { name: "Sidebar", path: "/#/components/sidebar" },
  { name: "Switch", path: "/#/components/switch" },
  { name: "Tabs", path: "/#/components/tabs" },
  { name: "Toast", path: "/#/components/toast" },
  { name: "Tooltip", path: "/#/components/tooltip" },
];

for (const { name, path } of COMPONENT_PAGES) {
  test(`${name}: axe-core has no violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .include(".demo-grid")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations = results.violations.filter(
      (v) =>
        (v.impact === "critical" || v.impact === "serious") &&
        v.id !== "color-contrast",
    );

    expect(violations).toEqual([]);
  });
}
