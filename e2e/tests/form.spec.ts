import { expect, test, type Page } from "@playwright/test";

const FORM_URL = "/#/components/form";
const LONG_LABEL =
  "个人简介（这是一个非常长的标签，用于演示 labelWrap 属性允许文本换行而不截断）";

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
    await expect(root.locator("form")).toHaveAttribute(
      "data-layout",
      "vertical",
    );

    const label = root.getByText("联系邮箱", { exact: true });
    const control = root.getByLabel("联系邮箱");
    const labelBox = await label.boundingBox();
    const controlBox = await control.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(controlBox).not.toBeNull();
    expect(controlBox!.y).toBeGreaterThanOrEqual(
      labelBox!.y + labelBox!.height - 2,
    );
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(root).toBeVisible();
    await expect(control).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("horizontal layout uses adjacent columns and collapses at phone width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoForm(page);

    const root = page.getByTestId("form-layout-horizontal");
    const form = root.locator("form");
    await expect(form).toHaveAttribute("data-layout", "horizontal");

    const label = root.getByText("联系邮箱", { exact: true });
    const control = root.getByLabel("联系邮箱");
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
    await expect(root.locator("form")).toHaveAttribute("data-layout", "inline");

    const first = root.getByRole("textbox", { name: "关键词" });
    const second = root.getByRole("combobox", { name: "区域" });
    const submit = root.getByRole("button", { name: "应用筛选" });

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
  test("focus, change, blur, and submit expose validation feedback", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page.getByTestId("form-validation-timing");
    const trigger = page.getByLabel(/验证时机/);
    const email = root.getByLabel("邮箱");

    await trigger.selectOption("blur");
    await email.focus();
    await expect(root.getByText("请输入有效邮箱")).toHaveCount(0);
    await email.blur();
    await expect(root.getByText("请输入有效邮箱")).toBeVisible();

    await trigger.selectOption("focus");
    await email.blur();
    await email.focus();
    await expect(root.getByText("请输入有效邮箱")).toBeVisible();

    await trigger.selectOption("change");
    await email.fill("invalid");
    await expect(root.getByText("请输入有效邮箱")).toBeVisible();
    await email.fill("person@example.com");
    await expect(root.getByText("请输入有效邮箱")).toHaveCount(0);

    await email.fill("");
    await root.getByRole("button", { name: "提交" }).click();
    await expect(root.getByText("请输入有效邮箱")).toBeVisible();
    await expect(email).toBeFocused();
  });

  test("pointerleave supplements rather than replaces keyboard feedback", async ({
    page,
  }) => {
    await gotoForm(page);

    const root = page.getByTestId("form-validation-timing");
    const trigger = page.getByLabel(/验证时机/);
    const email = root.getByLabel("邮箱");
    const field = email.locator(
      "xpath=ancestor::div[contains(@class,'uk-form__field')][1]",
    );

    await trigger.selectOption("pointerleave");
    await email.focus();
    await email.fill("invalid");
    await field.hover();
    await page.mouse.move(1, 1);
    await expect(root.getByText("请输入有效邮箱")).toBeVisible();

    await email.fill("person@example.com");
    await email.blur();
    await expect(root.getByText("请输入有效邮箱")).toHaveCount(0);
  });

  test("wrapped labels and errors remain associated and do not overlap controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoForm(page);

    const root = page.getByTestId("form-label-wrap");
    const label = root.locator("label").filter({ hasText: LONG_LABEL }).first();
    const control = root.getByLabel(LONG_LABEL);

    await expect(label).toHaveAttribute("data-wrap", "true");
    await expect(control).toBeVisible();
    await root.getByRole("button", { name: "保存" }).click();

    const error = root.getByRole("alert").filter({
      hasText: "请输入个人简介",
    });
    await expect(error).toBeVisible();
    await expect(control).toHaveAttribute("aria-invalid", "true");
    await expect(control).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining((await error.getAttribute("id")) ?? ""),
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

    await page.getByRole("button", { name: "邀请成员" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const name = dialog.getByLabel("姓名");
    const email = dialog.getByLabel("邮箱");
    await expect(name).toBeFocused();

    await dialog.getByRole("button", { name: "发送邀请" }).click();
    await expect(dialog.getByText("请输入成员姓名")).toBeVisible();
    await expect(name).toBeFocused();

    await name.fill("林澈");
    await email.fill("person@example.com");
    await dialog.getByRole("button", { name: "发送邀请" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
