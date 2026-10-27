import { expect, test } from "@playwright/test";

for (const path of ["checkbox", "radio-group"]) {
  test(`${path}: import example uses a code block`, async ({ page }) => {
    await page.goto(`/#/components/${path}`);
    await page.waitForLoadState("networkidle");

    const importSection = page.locator("section#引入");
    await expect(importSection.locator("pre")).toBeVisible();
    await expect(
      importSection.getByRole("button", { name: "复制" }),
    ).toBeVisible();
  });
}

test("Radio Group shows the New release badge", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-28T00:00:00Z") });
  await page.goto("/#/components/radio-group");
  await page.waitForLoadState("networkidle");

  const navLink = page.getByRole("link", { name: /Radio Group/ });
  await expect(navLink.getByText("New", { exact: true })).toBeVisible();
});
