import { test } from "@playwright/test";
import { expectScrimRamp, stepScrimEnter } from "../support/scrim";

test("Dialog: scrim ramps in instead of snapping to full opacity", async ({
  page,
}) => {
  await page.goto("/#/components/dialog");
  await page.waitForLoadState("networkidle");

  const scrim = await stepScrimEnter(page, "打开对话框", "dialog.uk-dialog");

  expectScrimRamp(scrim);
});
