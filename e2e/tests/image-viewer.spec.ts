import { expect, test } from "@playwright/test";

test.describe("Image Viewer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/components/image-viewer");
    await page.waitForLoadState("networkidle");
  });

  test("opens from a thumbnail into a dialog with the gallery label", async ({
    page,
  }) => {
    const thumbnail = page.getByRole("button", { name: /打开图片/ }).first();

    await thumbnail.click();

    const dialog = page.getByRole("dialog", { name: "收集的照片" });

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("1 / 6")).toBeVisible();
  });

  test("navigates with arrows, previous and next, and disables at bounds", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /打开图片/ })
      .nth(1)
      .click();

    const dialog = page.getByRole("dialog");
    const previous = dialog.getByRole("button", { name: "上一张图片" });
    const next = dialog.getByRole("button", { name: "下一张图片" });

    await expect(dialog.getByText("2 / 6")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText("3 / 6")).toBeVisible();

    await next.click();
    await expect(dialog.getByText("4 / 6")).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText("3 / 6")).toBeVisible();

    await previous.click();
    await previous.click();
    await expect(dialog.getByText("1 / 6")).toBeVisible();
    await expect(previous).toBeDisabled();
  });

  test("closes on Escape and on the close button", async ({ page }) => {
    await page
      .getByRole("button", { name: /打开图片/ })
      .first()
      .click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    await page
      .getByRole("button", { name: /打开图片/ })
      .first()
      .click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "关闭查看器" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("toggles zoom with a pressed state", async ({ page }) => {
    await page
      .getByRole("button", { name: /打开图片/ })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    const zoom = dialog.getByRole("button", { name: "放大图片" });

    await zoom.click();

    await expect(
      dialog.getByRole("button", { name: "缩小图片" }),
    ).toHaveAttribute("aria-pressed", "true");

    await dialog.getByRole("button", { name: "缩小图片" }).click();
    await expect(
      dialog.getByRole("button", { name: "放大图片" }),
    ).toBeVisible();
  });
});
