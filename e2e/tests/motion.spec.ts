import { expect, test } from "@playwright/test";

test("Radio Group indicator moves continuously between items", async ({
  page,
}) => {
  await page.goto("/#/components/radio-group");
  await page.waitForLoadState("networkidle");

  const positions = await page.evaluate(async () => {
    const group = document.querySelector('[aria-label="选择套餐"]');
    const radios = group?.querySelectorAll('input[type="radio"]');
    const indicator = () => group?.querySelector(".radio-group-indicator");
    const y = () => indicator()?.getBoundingClientRect().y ?? Number.NaN;

    const start = y();
    radios?.[1]?.click();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const moving = y();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const end = y();

    return { start, moving, end };
  });

  expect(positions.moving).toBeGreaterThan(positions.start);
  expect(positions.moving).toBeLessThan(positions.end);
});
