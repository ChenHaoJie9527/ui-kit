import { expect, test } from "@playwright/test";

test("Badge: loading exposes a busy state and hides dismiss", async ({
  page,
}) => {
  await page.goto("/#/components/badge");
  await page.waitForLoadState("networkidle");

  const badge = page.locator(".demo-grid").nth(3).locator(".uk-badge").first();

  await expect(badge).toHaveAttribute("aria-busy", "true");
  await expect(badge.locator(".uk-badge__spinner")).toBeVisible();
  await expect(badge.getByRole("button")).toHaveCount(0);
});

test("Badge: status swap keeps the label and width continuous", async ({
  page,
}) => {
  await page.goto("/#/components/badge");
  await page.waitForLoadState("networkidle");

  const demo = page.locator(".demo-grid").nth(4);
  const badge = demo.locator(".uk-badge");
  const before = await badge.boundingBox();

  await demo.getByRole("button", { name: "切换状态" }).click();
  await page.waitForTimeout(700);

  const after = await badge.boundingBox();

  await expect(badge.locator(".uk-badge__label")).toHaveText("正在同步中");
  await expect(badge).toHaveAttribute("aria-busy", "true");
  expect(before?.width).toBeGreaterThan(0);
  expect(after?.width).toBeGreaterThan(before?.width ?? 0);
});

test("Badge: reduced motion removes the pulse", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/components/badge");
  await page.waitForLoadState("networkidle");

  const demo = page.locator(".demo-grid").nth(4);
  const badge = demo.locator(".uk-badge");

  await demo.getByRole("button", { name: "切换状态" }).click();
  await page.waitForTimeout(200);

  await expect(badge.locator(".uk-badge__label")).toHaveText("正在同步中");
  await expect(badge.locator(".uk-badge__pulse")).toHaveCount(0);
});
