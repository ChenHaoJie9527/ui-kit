import { expect, test } from "@playwright/test";

test.describe("Form layouts and validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/form");
  });

  test("vertical, horizontal, and inline layouts stay readable without horizontal overflow", async ({
    page,
  }) => {
    const layouts = page.locator('[data-demo="form-layouts"]');
    await expect(layouts).toBeVisible();

    for (const layout of ["vertical", "horizontal", "inline"] as const) {
      const form = layouts.locator(`form[data-layout="${layout}"]`);
      await expect(form).toBeVisible();

      const labels = form.locator("label");
      const controls = form.locator("input, textarea, select, button");
      expect(await labels.count()).toBeGreaterThan(0);
      expect(await controls.count()).toBeGreaterThan(0);

      for (let index = 0; index < (await labels.count()); index += 1) {
        const label = labels.nth(index);
        await expect(label).toBeVisible();
        const box = await label.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);
      }
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("horizontal layout collapses at phone width and inline content wraps", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const layouts = page.locator('[data-demo="form-layouts"]');
    const horizontal = layouts.locator('form[data-layout="horizontal"]');
    const inline = layouts.locator('form[data-layout="inline"]');
    await expect(horizontal).toBeVisible();
    await expect(inline).toBeVisible();

    const horizontalField = horizontal.locator(".uk-form__field").first();
    const horizontalLabel = horizontalField.locator("label").first();
    const horizontalControl = horizontalField
      .locator("input, textarea, select")
      .first();
    const labelBox = await horizontalLabel.boundingBox();
    const controlBox = await horizontalControl.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(controlBox).not.toBeNull();
    expect(controlBox!.y).toBeGreaterThanOrEqual(
      labelBox!.y + labelBox!.height - 2,
    );

    const inlineFields = inline.locator(".uk-form__field");
    expect(await inlineFields.count()).toBeGreaterThan(1);
    const firstInlineBox = await inlineFields.first().boundingBox();
    const lastInlineBox = await inlineFields.last().boundingBox();
    expect(firstInlineBox).not.toBeNull();
    expect(lastInlineBox).not.toBeNull();
    expect(lastInlineBox!.y).toBeGreaterThan(firstInlineBox!.y);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("keyboard focus order follows DOM order in every layout", async ({
    page,
  }) => {
    const layouts = page.locator('[data-demo="form-layouts"]');

    for (const layout of ["vertical", "horizontal", "inline"] as const) {
      const form = layouts.locator(`form[data-layout="${layout}"]`);
      const controls = form.locator(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])',
      );
      const count = await controls.count();
      expect(count).toBeGreaterThan(1);

      await controls.first().focus();
      for (let index = 1; index < count; index += 1) {
        await page.keyboard.press("Tab");
        await expect(controls.nth(index)).toBeFocused();
      }
    }
  });

  test("focus, change, blur, and submit validation remain keyboard usable", async ({
    page,
  }) => {
    const demo = page.locator('[data-demo="form-validation-timing"]');
    await expect(demo).toBeVisible();

    const focusForm = demo.locator('form[data-validation="focus"]');
    const focusInput = focusForm.locator("input").first();
    await focusInput.focus();
    await expect(
      focusForm.locator(".uk-form__error-message").first(),
    ).toBeVisible();

    const changeForm = demo.locator('form[data-validation="change"]');
    const changeInput = changeForm.locator("input").first();
    await changeInput.focus();
    await changeInput.fill("a");
    await expect(
      changeForm.locator(".uk-form__error-message").first(),
    ).toBeVisible();
    await changeInput.fill("valid value");
    await expect(changeForm.locator(".uk-form__error-message")).toHaveCount(0);

    const blurForm = demo.locator('form[data-validation="blur"]');
    const blurInput = blurForm.locator("input").first();
    await blurInput.focus();
    await expect(blurForm.locator(".uk-form__error-message")).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(
      blurForm.locator(".uk-form__error-message").first(),
    ).toBeVisible();

    const submitForm = demo.locator('form[data-validation="submit"]');
    const submitInput = submitForm.locator("input").first();
    await submitInput.focus();
    await page.keyboard.press("Tab");
    await expect(submitForm.locator(".uk-form__error-message")).toHaveCount(0);
    await submitForm.locator('button[type="submit"]').click();
    await expect(
      submitForm.locator(".uk-form__error-message").first(),
    ).toBeVisible();
    await expect(submitInput).toBeFocused();
  });

  test("pointerleave supplements rather than replaces keyboard feedback", async ({
    page,
  }) => {
    const demo = page.locator('[data-demo="form-validation-timing"]');
    const form = demo.locator('form[data-validation="pointerleave"]');
    const field = form.locator(".uk-form__field").first();
    const input = field.locator("input").first();

    await input.focus();
    await expect(form.locator(".uk-form__error-message")).toHaveCount(0);
    await field.hover();
    await page.mouse.move(0, 0);
    await expect(form.locator(".uk-form__error-message").first()).toBeVisible();

    await input.focus();
    await input.fill("valid value");
    await page.keyboard.press("Tab");
    await expect(form.locator(".uk-form__error-message")).toHaveCount(0);
  });

  test("long wrapped labels and errors stay associated and do not overlap controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const demo = page.locator('[data-demo="form-label-wrap"]');
    await expect(demo).toBeVisible();

    const wrappedLabel = demo.locator('label[data-label-wrap="true"]').first();
    await expect(wrappedLabel).toBeVisible();
    const controlId = await wrappedLabel.getAttribute("for");
    expect(controlId).toBeTruthy();
    const control = demo.locator(`#${controlId}`);
    await expect(control).toBeVisible();

    const accessibleName = await control.getAttribute("aria-label");
    const labelledBy = await control.getAttribute("aria-labelledby");
    if (!accessibleName && !labelledBy) {
      const labelText = await wrappedLabel.textContent();
      expect(labelText?.replace("*", "").trim().length).toBeGreaterThan(0);
    }

    const marker = wrappedLabel.locator('[aria-hidden="true"]');
    await expect(marker).toHaveCount(1);
    expect(await marker.textContent()).toContain("*");
    await expect(control).toHaveAttribute("aria-required", "true");

    await demo.locator('button[type="submit"]').first().click();
    const error = demo.locator(".uk-form__error-message").first();
    await expect(error).toBeVisible();
    const errorId = await error.getAttribute("id");
    expect(errorId).toBeTruthy();
    expect(await control.getAttribute("aria-describedby")).toContain(errorId!);

    const labelBox = await wrappedLabel.boundingBox();
    const controlBox = await control.boundingBox();
    const errorBox = await error.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(controlBox).not.toBeNull();
    expect(errorBox).not.toBeNull();
    expect(controlBox!.y).toBeGreaterThanOrEqual(
      labelBox!.y + labelBox!.height - 2,
    );
    expect(errorBox!.y).toBeGreaterThanOrEqual(
      controlBox!.y + controlBox!.height - 2,
    );

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("required markers come from labels and required rules", async ({
    page,
  }) => {
    const demo = page.locator('[data-demo="form-label-wrap"]');
    const explicit = demo.locator('[data-required-source="label"]');
    const rule = demo.locator('[data-required-source="rule"]');

    for (const field of [explicit, rule]) {
      await expect(field).toBeVisible();
      const marker = field.locator('label [aria-hidden="true"]');
      await expect(marker).toHaveCount(1);
      expect(await marker.textContent()).toContain("*");
      await expect(field.locator("input").first()).toHaveAttribute(
        "aria-required",
        "true",
      );
    }
  });

  test("dialog-embedded form validates, focuses the first error, and submits", async ({
    page,
  }) => {
    const demo = page.locator('[data-demo="form-dialog"]');
    await expect(demo).toBeVisible();
    await demo.getByRole("button", { name: /open|edit|create/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const form = dialog.locator("form");
    const firstInput = form.locator("input").first();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator(".uk-form__error-message").first()).toBeVisible();
    await expect(firstInput).toBeFocused();

    const inputs = form.locator("input");
    for (let index = 0; index < (await inputs.count()); index += 1) {
      const input = inputs.nth(index);
      if ((await input.getAttribute("type")) !== "checkbox") {
        await input.fill(`Valid value ${index + 1}`);
      }
    }
    await form.locator('button[type="submit"]').click();
    await expect(dialog).toHaveCount(0);
  });
});
