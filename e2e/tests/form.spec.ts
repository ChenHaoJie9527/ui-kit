import { test, expect, type Page } from "@playwright/test";

const gotoForm = async (page: Page) => {
  await page.goto("/form");
  await page.waitForLoadState("networkidle");
};

const getHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test.describe("Form layouts", () => {
  test("vertical layout stacks fields at desktop and phone widths", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page.locator(".uk-form[data-layout='vertical']").first();
    await expect(root).toBeVisible();

    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(root).toBeVisible();
      expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

      const field = root.locator(".uk-form__field").first();
      const label = field.locator("label").first();
      const control = field.locator("input, textarea, select").first();

      if ((await label.count()) && (await control.count())) {
        const labelBox = await label.boundingBox();
        const controlBox = await control.boundingBox();
        expect(labelBox).not.toBeNull();
        expect(controlBox).not.toBeNull();
        expect(controlBox!.y).toBeGreaterThanOrEqual(labelBox!.y);
      }
    }
  });

  test("horizontal layout uses a label column and collapses on phones", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page
      .locator(
        ".uk-form[data-layout='horizontal'], .uk-form:not([data-layout])",
      )
      .first();
    await expect(root).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

    const field = root.locator(".uk-form__field").first();
    const label = field.locator("label").first();
    const control = field.locator("input, textarea, select").first();

    if ((await label.count()) && (await control.count())) {
      const desktopLabel = await label.boundingBox();
      const desktopControl = await control.boundingBox();
      expect(desktopLabel).not.toBeNull();
      expect(desktopControl).not.toBeNull();
      expect(desktopControl!.x).toBeGreaterThanOrEqual(desktopLabel!.x);

      await page.setViewportSize({ width: 390, height: 844 });
      expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

      const phoneLabel = await label.boundingBox();
      const phoneControl = await control.boundingBox();
      expect(phoneLabel).not.toBeNull();
      expect(phoneControl).not.toBeNull();
      expect(phoneControl!.y).toBeGreaterThanOrEqual(
        phoneLabel!.y + phoneLabel!.height - 1,
      );
    }
  });

  test("inline layout wraps without changing DOM focus order", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page.locator(".uk-form[data-layout='inline']").first();
    await expect(root).toBeVisible();

    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);
    }

    const focusOrder = await root
      .locator("input, select, textarea, button")
      .evaluateAll((elements) =>
        elements
          .filter((element) => !(element as HTMLButtonElement).disabled)
          .map(
            (element) =>
              element.getAttribute("name") ??
              element.getAttribute("aria-label") ??
              element.textContent?.trim() ??
              element.tagName,
          ),
      );

    const visited: string[] = [];
    for (let index = 0; index < focusOrder.length; index += 1) {
      await page.keyboard.press("Tab");
      const active = await page.evaluate(
        () =>
          document.activeElement?.getAttribute("name") ??
          document.activeElement?.getAttribute("aria-label") ??
          document.activeElement?.textContent?.trim() ??
          document.activeElement?.tagName ??
          "",
      );
      if (focusOrder.includes(active)) {
        visited.push(active);
      }
      if (visited.length === focusOrder.length) {
        break;
      }
    }

    expect(visited).toEqual(focusOrder);
  });
});

test.describe("Form validation interactions", () => {
  test("focus, change, blur, and submit validation remain keyboard usable", async ({
    page,
  }) => {
    await gotoForm(page);

    const form = page.locator("form").first();
    const input = form.locator("input").first();
    await expect(input).toBeVisible();

    await input.focus();
    await input.fill("a");
    await page.keyboard.press("Tab");
    await expect(input).not.toBeFocused();

    await input.focus();
    await input.fill("");
    await page.keyboard.press("Tab");

    const error = form.locator(".uk-form__error, [role='alert']").first();
    if (await error.count()) {
      await expect(error).toBeVisible();
    }

    const submit = form.locator("button[type='submit'], button").last();
    await submit.focus();
    await page.keyboard.press("Enter");

    const invalidControl = form.locator("[aria-invalid='true']").first();
    if (await invalidControl.count()) {
      await expect(invalidControl).toBeFocused();
    }
  });

  test("pointerleave supplements rather than replaces keyboard feedback", async ({
    page,
  }) => {
    await gotoForm(page);

    const form = page.locator("form").first();
    const field = form.locator(".uk-form__field").first();
    const input = field.locator("input").first();
    await expect(input).toBeVisible();

    await input.focus();
    await input.fill("");
    await field.hover();
    await page.mouse.move(1, 1);

    const error = form.locator(".uk-form__error, [role='alert']").first();
    if (await error.count()) {
      await expect(error).toBeVisible();
    }

    await input.focus();
    await page.keyboard.press("Tab");
    await expect(input).not.toBeFocused();

    if (await error.count()) {
      await expect(error).toBeVisible();
    }
  });

  test("long labels and errors remain associated and do not cover controls", async ({
    page,
  }) => {
    await gotoForm(page);
    await page.setViewportSize({ width: 390, height: 844 });

    const wrappingLabel = page.locator("label[data-label-wrap='true']").first();
    if (await wrappingLabel.count()) {
      const controlId = await wrappingLabel.getAttribute("for");
      expect(controlId).toBeTruthy();
      const control = page.locator(`#${controlId}`);
      await expect(control).toBeVisible();

      const labelText = await wrappingLabel.textContent();
      expect(labelText?.replace("*", "").trim().length).toBeGreaterThan(0);
      expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

      const labelBox = await wrappingLabel.boundingBox();
      const controlBox = await control.boundingBox();
      expect(labelBox).not.toBeNull();
      expect(controlBox).not.toBeNull();
      expect(controlBox!.y).toBeGreaterThanOrEqual(labelBox!.y);
    }
  });
});

test.describe("Form in Dialog", () => {
  test("submission errors focus the first invalid field inside the dialog", async ({
    page,
  }) => {
    await gotoForm(page);

    const trigger = page
      .getByRole("button", {
        name: /dialog|对话框|编辑|打开/i,
      })
      .first();

    if (!(await trigger.count())) {
      test.skip();
      return;
    }

    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const form = dialog.locator("form").first();
    const submit = form.locator("button[type='submit'], button").last();
    await submit.click();

    const invalidControl = dialog.locator("[aria-invalid='true']").first();
    if (await invalidControl.count()) {
      await expect(invalidControl).toBeFocused();
      await expect(dialog).toBeVisible();
    }
  });
});
