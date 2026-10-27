import { test, expect } from "@playwright/test";

test.describe("Keyboard navigation", () => {
  test("Tabs: arrow keys switch tabs", async ({ page }) => {
    await page.goto("/#/components/tabs");
    await page.waitForLoadState("networkidle");

    const firstTab = page.getByRole("tab").first();
    await firstTab.focus();
    await expect(firstTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    const secondTab = page.getByRole("tab").nth(1);
    await expect(secondTab).toHaveAttribute("aria-selected", "true");
    await expect(secondTab).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(firstTab).toHaveAttribute("aria-selected", "true");
    await expect(firstTab).toBeFocused();
  });

  test("Dialog: Escape closes", async ({ page }) => {
    await page.goto("/#/components/dialog");
    await page.waitForLoadState("networkidle");

    const trigger = page.getByRole("button", { name: /open|打开/i }).first();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("Switch: Space toggles", async ({ page }) => {
    await page.goto("/#/components/switch");
    await page.waitForLoadState("networkidle");

    const switchInput = page.getByRole("switch").first();
    await switchInput.focus();

    const before = await switchInput.getAttribute("aria-checked");
    await page.keyboard.press("Space");
    const after = await switchInput.getAttribute("aria-checked");

    expect(after).not.toBe(before);
  });

  test("CheckBox: Space toggles", async ({ page }) => {
    await page.goto("/#/components/checkbox");
    await page.waitForLoadState("networkidle");

    const checkbox = page.getByRole("checkbox").first();
    await checkbox.focus();

    const before = await checkbox.isChecked();
    await page.keyboard.press("Space");
    const after = await checkbox.isChecked();

    expect(after).not.toBe(before);
  });

  test("Focus rings are visible on keyboard navigation", async ({ page }) => {
    await page.goto("/#/components/button");
    await page.waitForLoadState("networkidle");

    const button = page.getByRole("button").first();
    await button.focus();

    const hasFocusIndicator = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.outlineWidth !== "0px" || style.boxShadow !== "none";
    });

    expect(hasFocusIndicator).toBe(true);
  });
});
