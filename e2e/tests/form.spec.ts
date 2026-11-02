import { expect, test, type Page } from "@playwright/test";

const FORM_URL = "/components/form";

async function gotoForm(page: Page) {
  await page.goto(FORM_URL);
  await expect(
    page.getByRole("heading", { name: "Form", exact: true }),
  ).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));

  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe("Form layouts", () => {
  test("vertical layout stacks fields and remains usable on desktop and phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoForm(page);

    const root = page.getByTestId("form-layout-vertical");
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute("data-layout", "vertical");

    const label = root.getByLabel("Vertical email");
    await expect(label).toBeVisible();

    const labelBox = await root
      .getByText("Vertical email", { exact: true })
      .boundingBox();
    const controlBox = await label.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(controlBox).not.toBeNull();
    expect(controlBox!.y).toBeGreaterThanOrEqual(
      labelBox!.y + labelBox!.height - 2,
    );
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(root).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(label).toBeVisible();
  });

  test("horizontal layout uses adjacent columns and collapses at phone width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoForm(page);

    const root = page.getByTestId("form-layout-horizontal");
    await expect(root).toHaveAttribute("data-layout", "horizontal");

    const label = root.getByText("Horizontal email", { exact: true });
    const control = root.getByLabel("Horizontal email");
    const labelBox = await label.boundingBox();
    const controlBox = await control.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(controlBox).not.toBeNull();
    expect(controlBox!.x).toBeGreaterThan(labelBox!.x);
    expect(Math.abs(controlBox!.y - labelBox!.y)).toBeLessThan(40);

    await page.setViewportSize({ width: 375, height: 812 });
    const narrowLabelBox = await label.boundingBox();
    const narrowControlBox = await control.boundingBox();
    expect(narrowLabelBox).not.toBeNull();
    expect(narrowControlBox).not.toBeNull();
    expect(narrowControlBox!.y).toBeGreaterThanOrEqual(
      narrowLabelBox!.y + narrowLabelBox!.height - 2,
    );
    await expectNoHorizontalOverflow(page);
  });

  test("inline layout wraps long content without changing keyboard order", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoForm(page);

    const root = page.getByTestId("form-layout-inline");
    await expect(root).toHaveAttribute("data-layout", "inline");

    const first = root.getByLabel("Inline name");
    const second = root.getByLabel("Inline email");
    const submit = root.getByRole("button", { name: "Apply filters" });

    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(second).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(submit).toBeFocused();

    await page.setViewportSize({ width: 375, height: 812 });
    await expectNoHorizontalOverflow(page);
    await first.focus();
    await page.keyboard.press("Tab");
    await expect(second).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(submit).toBeFocused();
  });
});

test.describe("Form validation and content", () => {
  test("keyboard focus, change, blur, and submit expose validation feedback", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page.getByTestId("form-validation-timing");
    const input = root.getByLabel("Validation email");

    await input.focus();
    await expect(root.getByText("Email is required")).toBeVisible();
    await input.fill("invalid");
    await input.press("Tab");
    await expect(root.getByText("Enter a valid email address")).toBeVisible();
    await input.fill("person@example.com");
    await input.press("Tab");
    await expect(root.getByText("Enter a valid email address")).toHaveCount(0);

    await input.fill("");
    await root.getByRole("button", { name: "Validate form" }).click();
    await expect(root.getByText("Email is required")).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("pointerleave supplements rather than replaces keyboard feedback", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page.getByTestId("form-validation-pointerleave");
    const input = root.getByLabel("Pointer validation email");
    const field = input.locator("xpath=ancestor::*[@data-field][1]");

    await input.focus();
    await input.fill("invalid");
    await field.hover();
    await page.mouse.move(1, 1);
    await expect(root.getByText("Enter a valid email address")).toBeVisible();

    await input.focus();
    await input.fill("person@example.com");
    await input.press("Tab");
    await expect(root.getByText("Enter a valid email address")).toHaveCount(0);

    await input.fill("");
    await input.press("Tab");
    await expect(root.getByText("Email is required")).toBeVisible();
  });

  test("wrapped labels and errors remain associated and do not overlap controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoForm(page);

    const root = page.getByTestId("form-label-wrap");
    const labelText =
      "A deliberately long account email label that wraps across several lines";
    const label = root.getByText(labelText, { exact: true });
    const control = root.getByLabel(labelText);

    await expect(label).toHaveAttribute("data-label-wrap", "true");
    await expect(control).toBeVisible();
    await root.getByRole("button", { name: "Check wrapped label" }).click();

    const error = root.getByRole("alert").filter({
      hasText: "Enter a valid email address",
    });
    await expect(error).toBeVisible();
    await expect(control).toHaveAttribute("aria-invalid", "true");
    await expect(control).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(error.getAttribute("id") ?? ""),
    );

    const labelBox = await label.boundingBox();
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
    await expectNoHorizontalOverflow(page);
  });

  test("Dialog form submission and first-error focus continue to work", async ({
    page,
  }) => {
    await gotoForm(page);

    await page.getByRole("button", { name: "Open form dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const input = dialog.getByLabel("Dialog email");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText("Email is required")).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill("person@example.com");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
