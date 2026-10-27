import { test, expect } from "@playwright/test";

test.describe("Reduced motion", () => {
  test("Dialog: no spatial movement under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/components/dialog");
    await page.waitForLoadState("networkidle");

    const trigger = page.getByRole("button", { name: /open|打开/i }).first();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const transform = await dialog.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.transform;
    });

    expect(transform).toBe("none");
  });

  test("Tabs indicator: no spring animation under reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/components/tabs");
    await page.waitForLoadState("networkidle");

    const firstTab = page.getByRole("tab").first();
    await firstTab.click();

    const indicator = page
      .locator('[data-tabs-indicator], [class*="indicator"]')
      .first();

    if ((await indicator.count()) > 0) {
      const transition = await indicator.evaluate(
        (el) => getComputedStyle(el).transitionDuration,
      );
      const duration = Number.parseFloat(transition) || 0;
      expect(duration).toBeLessThanOrEqual(0.15);
    }
  });
});
