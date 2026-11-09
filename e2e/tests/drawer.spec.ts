import { expect, test } from "@playwright/test";
import {
  expectScrimExit,
  expectScrimRamp,
  stepScrimEnter,
  stepScrimExit,
} from "../support/scrim";

test("Drawer: opens from the right and keeps focus inside", async ({
  page,
}) => {
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "打开筛选" }).click();

  const drawer = page.getByRole("dialog", { name: "筛选条件" });
  await expect(drawer).toBeVisible();

  const search = page.getByRole("textbox", { name: "搜索筛选条件" });
  await expect(search).toBeFocused();

  for (let press = 0; press < 8; press += 1) {
    // oxlint-disable-next-line no-await-in-loop -- 焦点移动依赖上一次 Tab 的结果
    await page.keyboard.press("Tab");
    // oxlint-disable-next-line no-await-in-loop -- 需要逐次确认焦点仍在面板内
    const inside = await drawer.evaluate((element) =>
      element.contains(document.activeElement),
    );
    expect(inside).toBe(true);
  }
});

test("Drawer: backdrop click closes the drawer", async ({ page }) => {
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "打开筛选" }).click();

  const drawer = page.getByRole("dialog", { name: "筛选条件" });
  await expect(drawer).toBeVisible();

  await page.mouse.click(20, 300);

  await expect(drawer).not.toBeVisible();
});

test("Drawer: protected close ignores Escape and backdrop", async ({
  page,
}) => {
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "删除前确认" }).click();

  const drawer = page.getByRole("dialog", { name: "删除项目？" });
  await expect(drawer).toBeVisible();

  await page.keyboard.press("Escape");
  await page.mouse.click(20, 300);
  await expect(drawer).toBeVisible();

  await page.getByRole("button", { name: "取消" }).click();
  await expect(drawer).not.toBeVisible();
});

test("Drawer: entering from the right never scrolls the dialog", async ({
  page,
}) => {
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  const { samples, viewportWidth } = await page.evaluate(async () => {
    const trigger = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "打开筛选",
    );
    const collected: { offset: number; left: number }[] = [];

    trigger?.click();

    const start = performance.now();

    await new Promise<void>((resolve) => {
      const tick = () => {
        const dialog = document.querySelector("dialog.uk-drawer");
        const panel = dialog?.querySelector(".uk-drawer__panel");

        if (dialog && panel) {
          collected.push({
            offset: dialog.scrollLeft,
            left: panel.getBoundingClientRect().left,
          });
        }

        if (performance.now() - start < 600) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });

    return {
      samples: collected,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(samples.length).toBeGreaterThan(0);
  // A scrollable dialog gets scrolled by the focus that lands in the still
  // off-screen panel, which cancels the slide and reads as a jump.
  expect(samples.filter((sample) => sample.offset !== 0)).toEqual([]);
  // The panel has to start outside the viewport and travel in from that edge.
  expect(samples[0].left).toBeGreaterThanOrEqual(viewportWidth - 1);
});

test("Drawer: scrim ramps in instead of snapping to full opacity", async ({
  page,
}) => {
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  const scrim = await stepScrimEnter(page, "打开筛选", "dialog.uk-drawer");

  expectScrimRamp(scrim);
});

test("Drawer: scrim finishes fading before the layer unmounts", async ({
  page,
}) => {
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "打开筛选" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(400);

  const exit = await stepScrimExit(page, "dialog.uk-drawer", "取消");

  expectScrimExit(exit);
});

test("Drawer: reduced motion removes the slide transform", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/components/drawer");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "打开筛选" }).click();

  const panel = page.locator(".uk-drawer__panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("transform", "none");
});
