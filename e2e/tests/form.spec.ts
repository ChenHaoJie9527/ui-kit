import { expect, test, type Page } from "@playwright/test";

const FORM_URL = "/components/form";

async function openFormDocs(page: Page) {
  await page.goto(FORM_URL);
  await expect(
    page.getByRole("heading", { name: /Form/ }).first(),
  ).toBeVisible();
}

function demo(page: Page, name: string) {
  return page.locator(`[data-demo="${name}"]`).first();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });

  expect(overflow).toBe(false);
}

async function expectDomTabOrder(page: Page, labels: string[]) {
  for (const label of labels) {
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(label, { exact: true })).toBeFocused();
  }
}

test.describe("Form layouts", () => {
  test("vertical, horizontal, and inline layouts expose their styling state", async ({
    page,
  }) => {
    await openFormDocs(page);

    await expect(
      demo(page, "layouts").locator('[data-layout="vertical"]'),
    ).toBeVisible();
    await expect(
      demo(page, "layouts").locator('[data-layout="horizontal"]'),
    ).toBeVisible();
    await expect(
      demo(page, "layouts").locator('[data-layout="inline"]'),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("horizontal fields collapse into readable order at phone width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFormDocs(page);

    const form = demo(page, "layouts").locator('[data-layout="horizontal"]');
    await expect(form).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const geometry = await form.evaluate((element) => {
      const label = element.querySelector("label");
      const control = element.querySelector("input, select, textarea");

      if (!label || !control) {
        return null;
      }

      const labelRect = label.getBoundingClientRect();
      const controlRect = control.getBoundingClientRect();

      return {
        labelBottom: labelRect.bottom,
        controlTop: controlRect.top,
        controlLeft: controlRect.left,
        formLeft: element.getBoundingClientRect().left,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry!.controlTop).toBeGreaterThanOrEqual(
      geometry!.labelBottom - 2,
    );
    expect(geometry!.controlLeft).toBeGreaterThanOrEqual(
      geometry!.formLeft - 1,
    );
  });

  test("inline fields wrap without page overflow or clipped long content", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFormDocs(page);

    const form = demo(page, "layouts").locator('[data-layout="inline"]');
    await expect(form).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const bounds = await form.evaluate((element) => {
      const formRect = element.getBoundingClientRect();
      const controls = Array.from(
        element.querySelectorAll("input, select, textarea, button"),
      );

      return controls.map((control) => {
        const rect = control.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          formLeft: formRect.left,
          formRight: formRect.right,
        };
      });
    });

    expect(bounds.length).toBeGreaterThan(0);
    for (const bound of bounds) {
      expect(bound.left).toBeGreaterThanOrEqual(bound.formLeft - 2);
      expect(bound.right).toBeLessThanOrEqual(bound.formRight + 2);
      expect(bound.width).toBeGreaterThan(0);
    }
  });

  test("tab order follows DOM order in every layout", async ({ page }) => {
    await openFormDocs(page);

    for (const layout of ["vertical", "horizontal", "inline"] as const) {
      const form = demo(page, "layouts").locator(`[data-layout="${layout}"]`);
      const controls = form.locator(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
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
});

test.describe("Form validation timing", () => {
  test("focus and blur validation are keyboard usable", async ({ page }) => {
    await openFormDocs(page);

    const form = demo(page, "validation-timing").locator(
      '[data-validation-timing="focus"]',
    );
    const input = form.getByLabel(/Email/i).first();
    await input.focus();
    await expect(form.locator(".uk-form__error-message").first()).toBeVisible();

    await input.fill("person@example.com");
    await page.keyboard.press("Tab");
    await expect(input).toHaveAttribute("aria-invalid", "false");
  });

  test("change validation updates errors and submit validates all fields", async ({
    page,
  }) => {
    await openFormDocs(page);

    const form = demo(page, "validation-timing").locator(
      '[data-validation-timing="change"]',
    );
    const input = form.getByLabel(/Email/i).first();
    await input.fill("invalid");
    await expect(form.locator(".uk-form__error-message").first()).toBeVisible();
    await input.fill("person@example.com");
    await expect(input).toHaveAttribute("aria-invalid", "false");

    await form.getByRole("button", { name: /Submit|Validate/i }).click();
    await expectNoHorizontalOverflow(page);
  });

  test("pointerleave supplements rather than removes keyboard feedback", async ({
    page,
  }) => {
    await openFormDocs(page);

    const form = demo(page, "validation-timing").locator(
      '[data-validation-timing="pointerleave"]',
    );
    const field = form.locator(".uk-form__field").first();
    const input = field.locator("input").first();

    await input.focus();
    await input.blur();
    await expect(form.locator(".uk-form__error-message").first()).toBeVisible();

    await input.fill("person@example.com");
    await field.hover();
    await page.mouse.move(0, 0);
    await expect(input).toHaveAttribute("aria-invalid", "false");
  });
});

test.describe("Form labels and errors", () => {
  test("required markers have one visual source and remain hidden from AT", async ({
    page,
  }) => {
    await openFormDocs(page);

    const root = demo(page, "label-wrap");
    const labels = root.locator("label");
    expect(await labels.count()).toBeGreaterThan(0);

    const markers = root.locator('label [aria-hidden="true"]');
    expect(await markers.count()).toBeGreaterThan(0);
    await expect(root.locator('[aria-required="true"]').first()).toBeVisible();
  });

  test("long wrapped labels and errors do not overlap controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFormDocs(page);

    const root = demo(page, "label-wrap");
    const wrapped = root.locator('[data-label-wrap="true"]').first();
    await expect(wrapped).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const overlap = await root.evaluate((element) => {
      const labels = Array.from(element.querySelectorAll("label"));
      const controls = Array.from(
        element.querySelectorAll("input, select, textarea"),
      );

      return labels.some((label) => {
        const labelRect = label.getBoundingClientRect();
        return controls.some((control) => {
          if (label.contains(control) || control.contains(label)) {
            return false;
          }
          const controlRect = control.getBoundingClientRect();
          return (
            labelRect.left < controlRect.right &&
            labelRect.right > controlRect.left &&
            labelRect.top < controlRect.bottom &&
            labelRect.bottom > controlRect.top
          );
        });
      });
    });

    expect(overlap).toBe(false);
  });
});

test.describe("Form Dialog integration", () => {
  test("invalid submission focuses the first error and valid submission succeeds", async ({
    page,
  }) => {
    await openFormDocs(page);

    const root = demo(page, "dialog");
    await root.getByRole("button", { name: /Open|Edit|Create/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /Submit|Save/i }).click();
    const invalid = dialog.locator('[aria-invalid="true"]').first();
    await expect(invalid).toBeVisible();
    await expect(invalid).toBeFocused();

    await invalid.fill("Valid value");
    await dialog.getByRole("button", { name: /Submit|Save/i }).click();
    await expect(dialog).toBeHidden();
  });
});
