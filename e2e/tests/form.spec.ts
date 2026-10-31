import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";

test.beforeEach(async ({ page }) => {
  await page.goto(baseURL);
});

test("vertical layout stacks labels and controls without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${baseURL}/form`);

  const form = page.locator('[data-demo="form-layout-vertical"] form');
  await expect(form).toHaveAttribute("data-layout", "vertical");

  const field = form.locator(".uk-form__field").first();
  const label = field.locator("label");
  const control = field.locator("input, textarea, select, button").first();
  const labelBox = await label.boundingBox();
  const controlBox = await control.boundingBox();

  expect(labelBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(controlBox!.y).toBeGreaterThanOrEqual(
    labelBox!.y + labelBox!.height - 2,
  );

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
});

test("horizontal layout uses adjacent columns on desktop and collapses on phones", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);
  await page.setViewportSize({ width: 1280, height: 900 });

  const form = page.locator('[data-demo="form-layout-horizontal"] form');
  await expect(form).toHaveAttribute("data-layout", "horizontal");

  const field = form.locator(".uk-form__field").first();
  const label = field.locator("label");
  const control = field.locator("input, textarea, select, button").first();
  let labelBox = await label.boundingBox();
  let controlBox = await control.boundingBox();

  expect(labelBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(controlBox!.x).toBeGreaterThanOrEqual(
    labelBox!.x + labelBox!.width - 2,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  labelBox = await label.boundingBox();
  controlBox = await control.boundingBox();

  expect(controlBox!.y).toBeGreaterThanOrEqual(
    labelBox!.y + labelBox!.height - 2,
  );
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
});

test("inline layout wraps long content and preserves DOM tab order", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);
  await page.setViewportSize({ width: 390, height: 844 });

  const form = page.locator('[data-demo="form-layout-inline"] form');
  await expect(form).toHaveAttribute("data-layout", "inline");

  const focusable = form.locator(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex="0"]',
  );
  const count = await focusable.count();
  expect(count).toBeGreaterThan(1);

  await focusable.first().focus();
  for (let index = 1; index < count; index += 1) {
    await page.keyboard.press("Tab");
    await expect(focusable.nth(index)).toBeFocused();
  }

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
});

test("keyboard focus, blur, change, and submit expose validation feedback", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);

  const form = page.locator('[data-demo="form-validation-timing"] form');
  const input = form.locator('input[name="email"]');
  const error = form
    .locator(".uk-form__error")
    .filter({ hasText: /email|required|valid/i })
    .first();

  await input.focus();
  await expect(error).toBeVisible();
  await input.fill("person@example.com");
  await input.press("Tab");
  await expect(error).toBeHidden();

  await input.fill("invalid");
  await input.press("Tab");
  await expect(error).toBeVisible();

  await form.locator('button[type="submit"]').click();
  await expect(input).toBeFocused();
});

test("pointerleave supplements rather than replaces keyboard validation", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);

  const form = page.locator('[data-demo="form-validation-timing"] form');
  const field = form.locator(".uk-form__field").first();
  const input = field.locator("input").first();

  await input.focus();
  await input.fill("");
  await input.press("Tab");
  await expect(field.locator(".uk-form__error")).toBeVisible();

  await field.hover();
  await page.mouse.move(1, 1);
  await expect(field.locator(".uk-form__error")).toBeVisible();
});

test("long wrapped labels and errors remain associated and do not overlap controls", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);
  await page.setViewportSize({ width: 390, height: 844 });

  const form = page.locator('[data-demo="form-label-wrap"] form');
  const field = form.locator(".uk-form__field").first();
  const label = field.locator("label");
  const control = field.locator("input, textarea, select, button").first();

  await expect(label).toHaveAttribute("data-label-wrap", "true");
  const labelText = await label.textContent();
  expect(labelText?.replace("*", "").trim().length).toBeGreaterThan(0);

  const labelBox = await label.boundingBox();
  const controlBox = await control.boundingBox();
  expect(labelBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(390);
  expect(controlBox!.y + controlBox!.height).toBeGreaterThan(labelBox!.y);

  const describedBy = await control.getAttribute("aria-describedby");
  if (describedBy) {
    for (const id of describedBy.split(/\s+/)) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  }
});

test("required markers come from labels and required rules", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);

  const form = page.locator('[data-demo="form-label-wrap"] form');
  const markers = form.locator('.uk-form__required[aria-hidden="true"]');
  expect(await markers.count()).toBeGreaterThan(0);

  const requiredControls = form.locator('[aria-required="true"]');
  expect(await requiredControls.count()).toBeGreaterThan(0);
});

test("dialog-embedded form submits and focuses the first invalid control", async ({
  page,
}) => {
  await page.goto(`${baseURL}/form`);

  await page
    .getByRole("button", { name: /open.*dialog|dialog.*form|编辑|打开/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const form = dialog.locator("form");
  await form.locator('button[type="submit"]').click();

  const invalid = form.locator('[aria-invalid="true"]').first();
  await expect(invalid).toBeVisible();
  await expect(invalid).toBeFocused();

  await invalid.fill("valid value");
  await form.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
});
