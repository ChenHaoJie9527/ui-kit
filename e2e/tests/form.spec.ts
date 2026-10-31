import { expect, test, type Locator, type Page } from "@playwright/test";

const FORM_PATH = "/components/form";
const PHONE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 900 };

type Layout = "vertical" | "horizontal" | "inline";

async function openFormPage(page: Page): Promise<void> {
  await page.goto(FORM_PATH);
  await expect(
    page.getByRole("heading", { name: "Form", exact: true }),
  ).toBeVisible();
}

async function chooseLayout(page: Page, layout: Layout): Promise<void> {
  await page
    .getByRole("group", { name: "选择表单布局" })
    .getByRole("button", { name: layout, exact: true })
    .click();
}

function layoutsForm(page: Page): Locator {
  return page.locator("form[data-layout]").filter({
    has: page.getByRole("button", { name: "应用筛选", exact: true }),
  });
}

function timingForm(page: Page): Locator {
  return page.locator("form").filter({
    has: page.getByRole("button", { name: "提交并完整校验", exact: true }),
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

function boxesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

async function expectReadableGeometry(
  label: Locator,
  control: Locator,
  description: Locator,
  error: Locator,
): Promise<void> {
  const [labelBox, controlBox, descriptionBox, errorBox] = await Promise.all([
    label.boundingBox(),
    control.boundingBox(),
    description.boundingBox(),
    error.boundingBox(),
  ]);

  expect(labelBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  expect(descriptionBox).not.toBeNull();
  expect(errorBox).not.toBeNull();

  expect(labelBox!.width).toBeGreaterThan(0);
  expect(labelBox!.height).toBeGreaterThan(0);
  expect(controlBox!.width).toBeGreaterThan(80);
  expect(controlBox!.height).toBeGreaterThan(20);
  expect(descriptionBox!.width).toBeGreaterThan(0);
  expect(errorBox!.width).toBeGreaterThan(0);
  expect(boxesOverlap(labelBox!, controlBox!)).toBe(false);
}

async function expectDomTabOrder(
  page: Page,
  controls: Locator[],
): Promise<void> {
  for (const control of controls) {
    await page.keyboard.press("Tab");
    await expect(control).toBeFocused();
  }
}

test.describe("Form enhancement", () => {
  test("supports all layouts at desktop and phone widths without overflow", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openFormPage(page);

    for (const viewport of [DESKTOP_VIEWPORT, PHONE_VIEWPORT]) {
      await page.setViewportSize(viewport);

      for (const layout of ["vertical", "horizontal", "inline"] as const) {
        await chooseLayout(page, layout);

        const form = layoutsForm(page);
        await expect(form).toHaveAttribute("data-layout", layout);

        const keyword = form.getByRole("textbox", {
          name: "项目或成员关键词",
        });
        const team = form.getByRole("combobox", { name: "所属团队" });
        const description = form.getByText(
          "horizontal 在桌面端使用稳定标签列，窄屏自动恢复纵向排列。",
        );
        const error = form.locator(".uk-form__error").first();

        await expect(keyword).toBeVisible();
        await expect(team).toBeVisible();
        await expect(description).toBeVisible();
        await expectReadableGeometry(
          form.locator("label").first(),
          keyword,
          description,
          error,
        );
        await expectNoHorizontalOverflow(page);

        if (layout === "horizontal") {
          const field = form.locator(".uk-form__field").first();
          const display = await field.evaluate(
            (element) => getComputedStyle(element).display,
          );

          if (viewport.width <= 640) {
            expect(display).toBe("flex");
            const labelBox = await form.locator("label").first().boundingBox();
            const controlBox = await keyword.boundingBox();
            expect(labelBox).not.toBeNull();
            expect(controlBox).not.toBeNull();
            expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(
              controlBox!.y + 1,
            );
          } else {
            expect(display).toBe("grid");
            const columns = await field.evaluate(
              (element) => getComputedStyle(element).gridTemplateColumns,
            );
            expect(columns.split(" ").length).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  });

  test("wraps inline content while preserving DOM keyboard order", async ({
    page,
  }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await openFormPage(page);
    await chooseLayout(page, "inline");

    const form = layoutsForm(page);
    const keyword = form.getByRole("textbox", {
      name: "项目或成员关键词",
    });
    const team = form.getByRole("combobox", { name: "所属团队" });
    const submit = form.getByRole("button", { name: "应用筛选" });

    await keyword.fill("一个用于验证窄屏内联布局自动换行的很长搜索关键词");
    await expectNoHorizontalOverflow(page);

    const keywordBox = await keyword.boundingBox();
    const teamBox = await team.boundingBox();
    expect(keywordBox).not.toBeNull();
    expect(teamBox).not.toBeNull();
    expect(keywordBox!.width).toBeGreaterThan(80);
    expect(teamBox!.width).toBeGreaterThan(80);
    expect(teamBox!.y).toBeGreaterThanOrEqual(keywordBox!.y);

    await keyword.focus();
    await expectDomTabOrder(page, [team, submit]);
  });

  test("keeps keyboard validation usable and pointerleave supplementary", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openFormPage(page);

    const validateOn = page.getByLabel("首次校验 validateOn");
    const revalidateOn = page.getByLabel("错误重检 revalidateOn");
    await expect(validateOn).toHaveValue("blur");
    await expect(revalidateOn).toHaveValue("change");

    const blurForm = timingForm(page);
    const email = blurForm.getByRole("textbox", { name: "工作邮箱" });
    const nickname = blurForm.getByRole("textbox", { name: "显示昵称" });

    await email.focus();
    await expect(blurForm.getByText("请输入邮箱", { exact: true })).toHaveCount(
      0,
    );
    await page.keyboard.press("Tab");
    await expect(nickname).toBeFocused();
    await expect(
      blurForm.getByText("请输入邮箱", { exact: true }),
    ).toBeVisible();

    await email.fill("person@example.com");
    await expect(blurForm.getByText("请输入邮箱", { exact: true })).toHaveCount(
      0,
    );

    await validateOn.selectOption("focus");
    const focusForm = timingForm(page);
    const focusEmail = focusForm.getByRole("textbox", { name: "工作邮箱" });
    await focusEmail.focus();
    await expect(
      focusForm.getByText("请输入邮箱", { exact: true }),
    ).toBeVisible();

    await validateOn.selectOption("change");
    const changeForm = timingForm(page);
    const changeEmail = changeForm.getByRole("textbox", { name: "工作邮箱" });
    await changeEmail.fill("invalid");
    await expect(
      changeForm.getByText("请输入有效邮箱", { exact: true }),
    ).toBeVisible();
    await changeEmail.fill("person@example.com");
    await expect(
      changeForm.getByText("请输入有效邮箱", { exact: true }),
    ).toHaveCount(0);

    await validateOn.selectOption("pointerleave");
    const pointerForm = timingForm(page);
    const pointerEmail = pointerForm.getByRole("textbox", {
      name: "工作邮箱",
    });
    const pointerField = pointerEmail.locator(
      "xpath=ancestor::div[contains(@class, 'uk-form__field')][1]",
    );
    await pointerField.hover();
    await page.mouse.move(0, 0);
    await expect(
      pointerForm.getByText("请输入邮箱", { exact: true }),
    ).toBeVisible();

    await pointerEmail.focus();
    await pointerEmail.fill("person@example.com");
    await page.keyboard.press("Tab");
    await expect(
      pointerForm.getByText("请输入邮箱", { exact: true }),
    ).toHaveCount(0);

    await validateOn.selectOption("submit");
    const submitForm = timingForm(page);
    const submitEmail = submitForm.getByRole("textbox", { name: "工作邮箱" });
    const submitNickname = submitForm.getByRole("textbox", {
      name: "显示昵称",
    });
    await submitEmail.focus();
    await page.keyboard.press("Tab");
    await expect(submitNickname).toBeFocused();
    await expect(
      submitForm.getByText("请输入邮箱", { exact: true }),
    ).toHaveCount(0);

    await submitForm
      .getByRole("button", { name: "提交并完整校验", exact: true })
      .click();
    await expect(
      submitForm.getByText("请输入邮箱", { exact: true }),
    ).toBeVisible();
    await expect(submitForm.getByText("昵称至少 2 个字符")).toBeVisible();
    await expect(submitEmail).toBeFocused();

    await submitEmail.fill("person@example.com");
    await submitNickname.fill("Seam");
    await submitForm
      .getByRole("button", { name: "提交并完整校验", exact: true })
      .click();
    await expect(
      page.getByText("字段与 Valibot schema 均通过，已提交。"),
    ).toBeVisible();
  });

  test("keeps long wrapped labels, required markers, and errors associated", async ({
    page,
  }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await openFormPage(page);

    const longLabelText =
      "企业法定全称（必须与营业执照及合同主体保持完全一致）";
    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: "保存企业资料", exact: true }),
    });
    const label = form.locator("label").filter({ hasText: longLabelText });
    const input = form.getByRole("textbox", { name: longLabelText });
    const description = form.getByText(
      "required 规则自动显示星号；长标签、说明和错误都在各自区域内换行。",
    );

    await expect(label).toHaveAttribute("data-wrap", "true");
    await expect(label.locator(".uk-form__required")).toHaveCount(1);
    await expect(label.locator(".uk-form__required")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(input).toHaveAttribute("aria-required", "true");

    const descriptionId = await description.getAttribute("id");
    expect(descriptionId).not.toBeNull();
    await expect(input).toHaveAttribute(
      "aria-describedby",
      new RegExp(descriptionId!),
    );

    await form.getByRole("button", { name: "保存企业资料" }).click();
    const error = form.getByText("请输入营业执照上的完整名称。");
    await expect(error).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    const errorId = await error.getAttribute("id");
    expect(errorId).not.toBeNull();
    await expect(input).toHaveAttribute(
      "aria-describedby",
      new RegExp(errorId!),
    );

    await expectReadableGeometry(label, input, description, error);
    await expectNoHorizontalOverflow(page);
  });

  test("preserves Dialog form submission and server-error focus", async ({
    page,
  }) => {
    await openFormPage(page);

    await page.getByRole("button", { name: "邀请成员", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const name = dialog.getByRole("textbox", { name: "姓名" });
    const email = dialog.getByRole("textbox", { name: "邮箱", exact: true });
    await expect(name).toBeFocused();

    await dialog.getByRole("button", { name: "发送邀请" }).click();
    await expect(dialog.getByText("请输入成员姓名")).toBeVisible();
    await expect(dialog.getByText("请输入成员邮箱")).toBeVisible();
    await expect(name).toBeFocused();

    await name.fill("张明");
    await email.fill("blocked@example.com");
    await dialog.getByRole("button", { name: "发送邀请" }).click();

    await expect(dialog.getByText("该用户已属于其他企业空间")).toBeVisible();
    await expect(
      dialog.getByText("邀请发送失败，请检查标记字段后重试。"),
    ).toBeVisible();
    await expect(email).toBeFocused();
    await expect(dialog).toBeVisible();

    await email.fill("member@example.com");
    await dialog.getByRole("button", { name: "发送邀请" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByText("member@example.com", { exact: true }),
    ).toBeVisible();
  });
});
