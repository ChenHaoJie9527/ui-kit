import { expect, test } from "@playwright/test";

for (const path of ["checkbox", "radio-group"]) {
  test(`${path}: import example uses a code block`, async ({ page }) => {
    await page.goto(`/#/components/${path}`);
    await page.waitForLoadState("networkidle");

    const importSection = page.locator("section#引入");
    await expect(importSection.locator("pre")).toBeVisible();
    await expect(
      importSection.getByRole("button", { name: "复制" }),
    ).toBeVisible();
  });
}

test("Radio Group shows the New release badge", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-28T00:00:00Z") });
  await page.goto("/#/components/radio-group");
  await page.waitForLoadState("networkidle");

  const navLink = page.getByRole("link", { name: /Radio Group/ });
  await expect(navLink.getByText("New", { exact: true })).toBeVisible();
});

test("Form Valibot example validates and submits", async ({ page }) => {
  await page.goto("/#/components/form");
  await page.waitForLoadState("networkidle");

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Valibot 校验" }),
  });
  const email = section.getByRole("textbox", { name: "邮箱" });
  const password = section.getByLabel("密码");
  const submit = section.getByRole("button", { name: "登录" });

  await expect(section.locator("pre")).toBeVisible();
  await submit.click();
  await expect(section.getByText("请输入邮箱", { exact: true })).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");

  await email.fill("member@example.com");
  await password.fill("short");
  await submit.click();
  await expect(
    section.getByText("密码至少 8 位", { exact: true }),
  ).toBeVisible();

  await password.fill("password8");
  await submit.click();
  await expect(section.getByText("校验通过，已提交登录。")).toBeVisible();
});

test("Form business recipes expose runnable source code", async ({ page }) => {
  await page.goto("/#/components/form");
  await page.waitForLoadState("networkidle");

  const titles = [
    "业务配方：登录",
    "业务配方：企业注册",
    "业务配方：企业信息",
    "业务配方：Dialog 内嵌表单",
  ];

  await Promise.all(
    titles.map(async (title) => {
      const section = page.locator("section").filter({
        has: page.getByRole("heading", { name: title }),
      });

      await expect(section.locator("pre")).toBeVisible();
      await expect(section.getByRole("button", { name: "复制" })).toBeVisible();
    }),
  );
});

test("Form login recipe exposes async loading and server failure", async ({
  page,
}) => {
  await page.goto("/#/components/form");
  await page.waitForLoadState("networkidle");

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "业务配方：登录" }),
  });
  const submit = section.getByRole("button", { name: "登录", exact: true });

  await section.getByLabel("工作邮箱").fill("blocked@example.com");
  await section.getByLabel("密码").fill("password123");
  await submit.click();

  await expect(submit).toHaveAttribute("aria-busy", "true");
  await expect(section.getByRole("status")).toHaveText("正在验证账号…");
  await expect(section.getByRole("alert")).toHaveText(
    "账号或密码不正确，请重试。",
  );

  await section.getByLabel("工作邮箱").fill("member@example.com");
  await submit.click();
  await expect(section.getByText("登录成功，正在进入工作台。")).toBeVisible();
});

test("Form registration recipe composes Select and CheckBox", async ({
  page,
}) => {
  await page.goto("/#/components/form");
  await page.waitForLoadState("networkidle");

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "业务配方：企业注册" }),
  });

  await section.getByLabel("姓名").fill("张明");
  await section.getByLabel("公司名称").fill("Seam Labs");
  await section.getByLabel("工作邮箱").fill("team@example.com");
  await section.getByLabel("设置密码").fill("seam2026");
  await section.getByRole("combobox", { name: "团队规模" }).click();
  await page.getByRole("option", { name: "11–50 人" }).click();
  await section
    .getByText(
      "我已阅读并同意服务条款与隐私政策，并确认拥有创建企业空间的权限。",
    )
    .first()
    .click();
  await section
    .getByRole("button", { name: "创建企业账号", exact: true })
    .click();

  await expect(
    section.getByText("企业账号已创建，邀请邮件已发送。"),
  ).toBeVisible();
});

test("Form Dialog recipe keeps focus and async submit inside the modal", async ({
  page,
}) => {
  await page.goto("/#/components/form");
  await page.waitForLoadState("networkidle");

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "业务配方：Dialog 内嵌表单" }),
  });

  await section.getByRole("button", { name: "邀请成员" }).click();
  const dialog = page.getByRole("dialog");
  const name = dialog.getByLabel("姓名");

  await expect(name).toBeFocused();
  await name.fill("李敏");
  await dialog.getByLabel("邮箱").fill("member@example.com");
  await dialog.getByRole("combobox", { name: "成员角色" }).click();
  await page.getByRole("option", { name: "设计师" }).click();
  await dialog.getByRole("button", { name: "发送邀请" }).click();

  await expect(
    dialog.getByRole("button", { name: "发送邀请" }),
  ).toHaveAttribute("aria-busy", "true");
  await expect(dialog).toBeHidden();
  await expect(section.getByText("member@example.com")).toBeVisible();
});

test("Form business recipes remain usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/components/form");
  await page.waitForLoadState("networkidle");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "业务配方：Dialog 内嵌表单" }),
  });

  await section.getByRole("button", { name: "邀请成员" }).click();
  const dialog = page.getByRole("dialog");
  const box = await dialog.boundingBox();

  expect(box).not.toBeNull();
  expect(box?.width).toBeLessThanOrEqual(390);
  await expect(dialog.getByLabel("姓名")).toBeVisible();
});
