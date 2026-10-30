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
