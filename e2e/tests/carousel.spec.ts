import { expect, test, type Locator, type Page } from "@playwright/test";

async function gotoCarousel(page: Page) {
  await page.goto("/#/components/carousel");
  await page.waitForLoadState("networkidle");
}

function carousel(page: Page, name: string): Locator {
  return page.getByRole("region", { name, exact: true });
}

function readout(region: Locator): Locator {
  return region.getByTestId("carousel-readout");
}

test("Carousel: prev/next update snap and disable at boundaries", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "基础轮播");
  const output = readout(region);
  const previous = region.getByRole("button", { name: "Previous slide" });
  const next = region.getByRole("button", { name: "Next slide" });

  await expect(output).toHaveText("1 / 3");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(region.locator(".uk-carousel__track")).toHaveCSS(
    "touch-action",
    "pan-y pinch-zoom",
  );

  await next.click();
  await expect(output).toHaveText("2 / 3");
  await expect(previous).toBeEnabled();

  await next.click();
  await expect(output).toHaveText("3 / 3");
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(output).toHaveText("2 / 3");
});

test("Carousel: dragging moves to the next snap", async ({ page }) => {
  await gotoCarousel(page);

  const region = carousel(page, "基础轮播");
  const output = readout(region);
  const viewport = region.locator(".uk-carousel__viewport");

  await region.scrollIntoViewIfNeeded();

  const box = await viewport.boundingBox();

  if (!box) {
    throw new Error("carousel viewport not found");
  }

  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 });
  await page.mouse.up();

  await expect(output).toHaveText("2 / 3", { timeout: 5_000 });
});

test("Carousel: loop wraps from last to first and back", async ({ page }) => {
  await gotoCarousel(page);

  const region = carousel(page, "循环轮播");
  const output = readout(region);
  const previous = region.getByRole("button", { name: "上一张" });
  const next = region.getByRole("button", { name: "下一张" });

  await expect(output).toHaveText("1 / 3");

  await next.click();
  await expect(output).toHaveText("2 / 3");
  await next.click();
  await expect(output).toHaveText("3 / 3");
  await next.click();
  await expect(output).toHaveText("1 / 3");

  await previous.click();
  await expect(output).toHaveText("3 / 3");
});

test("Carousel: controlled index syncs with external buttons", async ({
  page,
}) => {
  await gotoCarousel(page);

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "index" }),
  });
  const region = carousel(page, "受控轮播");
  const output = readout(region);

  await expect(output).toHaveText("1 / 4");

  await section.getByRole("button", { name: "下一张" }).click();
  await expect(output).toHaveText("2 / 4");

  await section.getByRole("button", { name: "上一张" }).click();
  await expect(output).toHaveText("1 / 4");
});

test("Carousel: vertical orientation uses up/down controls", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "纵向轮播");
  const output = readout(region);

  await expect(region).toHaveAttribute("data-orientation", "vertical");
  await expect(output).toHaveText("1 / 3");
  await expect(region.locator(".uk-carousel__track")).toHaveCSS(
    "touch-action",
    "pan-x pinch-zoom",
  );

  await region.getByRole("button", { name: "Next slide" }).click();
  await expect(output).toHaveText("2 / 3");

  const nextIcon = region.locator(
    '[data-side="next"] .uk-carousel__control-icon',
  );
  await expect(nextIcon).toHaveCSS("transform", "matrix(0, 1, -1, 0, 0, 0)");

  // 纵向 + RTL 时控件仍在物理水平中心。
  await region.evaluate((element) => element.setAttribute("dir", "rtl"));

  const previous = region.getByRole("button", { name: "Previous slide" });
  const previousBox = await previous.boundingBox();
  const regionBox = await region.boundingBox();

  expect(
    Math.abs(
      (previousBox?.x ?? 0) +
        (previousBox?.width ?? 0) / 2 -
        ((regionBox?.x ?? 0) + (regionBox?.width ?? 0) / 2),
    ),
  ).toBeLessThan(1);
});

test("Carousel: RTL keeps logical next and flips horizontal icons", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "RTL carousel");
  const output = readout(region);
  const previous = region.getByRole("button", { name: "Previous slide" });
  const next = region.getByRole("button", { name: "Next slide" });

  await expect(output).toHaveText("1 / 3");
  await expect(region).toHaveCSS("direction", "rtl");

  await next.click();
  await expect(output).toHaveText("2 / 3");

  const previousBox = await previous.boundingBox();
  const nextBox = await next.boundingBox();

  expect(previousBox?.x).toBeGreaterThan(nextBox?.x ?? 0);

  const previousIcon = region.locator(
    '[data-side="previous"] .uk-carousel__control-icon',
  );
  await expect(previousIcon).toHaveCSS(
    "transform",
    "matrix(-1, 0, 0, 1, 0, 0)",
  );
});

test("Carousel: arrow keys inside slide inputs are not hijacked", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "键盘与焦点轮播");
  const output = readout(region);
  const input = region.getByRole("searchbox", { name: "搜索" });

  await input.focus();
  await expect(output).toHaveText("1 / 3");

  await input.press("ArrowRight");
  await expect(output).toHaveText("1 / 3");
});

test("Carousel: focusing an off-screen slide scrolls it into view", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "键盘与焦点轮播");
  const link = region.getByRole("link", { name: "查看详情" });

  await link.focus();

  await expect
    .poll(async () =>
      link.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const viewport = element
          .closest(".uk-carousel__viewport")
          ?.getBoundingClientRect();

        if (!viewport) {
          return false;
        }

        return (
          rect.left >= viewport.left &&
          rect.right <= viewport.right &&
          rect.top >= viewport.top &&
          rect.bottom <= viewport.bottom
        );
      }),
    )
    .toBe(true);
});

test("Carousel: adding and removing slides updates count and survives empty", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "动态轮播");
  const output = readout(region);
  const add = page.getByRole("button", { name: "添加一张" });
  const remove = page.getByRole("button", { name: "移除一张" });

  await expect(output).toHaveText("1 / 3");
  await expect(region.getByRole("group")).toHaveCount(3);

  await add.click();
  await expect(output).toHaveText("1 / 4");
  await expect(region.getByRole("group")).toHaveCount(4);
  await expect(region.getByRole("group").first()).toHaveAttribute(
    "aria-label",
    "1 of 4",
  );

  for (let index = 0; index < 4; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- 每次删除都会改变下一次的按钮状态
    await remove.click();
  }

  await expect(output).toHaveText("0 / 0");
  await expect(region.getByRole("group")).toHaveCount(0);
  await expect(region.getByRole("button", { name: "下一张" })).toBeDisabled();

  await add.click();
  await expect(output).toHaveText("1 / 1");
  await expect(region.getByRole("group")).toHaveCount(1);
  await expect(region.getByRole("button", { name: "下一张" })).toBeDisabled();
});

test("Carousel: controls remain functional under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoCarousel(page);

  const region = carousel(page, "基础轮播");
  const output = readout(region);
  const next = region.getByRole("button", { name: "Next slide" });

  await next.click();
  await expect(output).toHaveText("2 / 3");

  const icon = region.locator('[data-side="next"] .uk-carousel__control-icon');
  const duration = await icon.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );

  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
});

test("Carousel: dots reflect snap count and move on click", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "分页点轮播");
  const output = readout(region);
  const dots = region.locator(".uk-carousel__dot");

  await expect(output).toHaveText("1 / 3");
  await expect(dots).toHaveCount(3);
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");

  await dots.nth(1).click();

  await expect(output).toHaveText("2 / 3");
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(dots.nth(0)).not.toHaveAttribute("aria-current", "true");
});

test("Carousel: counter follows the active snap", async ({ page }) => {
  await gotoCarousel(page);

  const region = carousel(page, "计数器轮播");
  const output = readout(region);
  const counter = region.locator(".uk-carousel__counter");
  const dots = region.locator(".uk-carousel__dot");

  await expect(output).toHaveText("1 / 3");
  await expect(counter).toHaveAttribute("aria-hidden", "true");
  await expect(counter).toContainText("1");

  await dots.nth(1).click();

  await expect(output).toHaveText("2 / 3");
  await expect(counter).toContainText("2");
});

test("Carousel: scale keeps a full-size center and shrinks neighbours", async ({
  page,
}) => {
  await gotoCarousel(page);

  const region = carousel(page, "缩放轮播");
  const output = readout(region);
  const next = region.getByRole("button", { name: "下一张" });

  await expect(region).toHaveAttribute("data-scale", "true");
  await expect(output).toHaveText("1 / 20");

  const scales = async () =>
    await region.locator(".uk-carousel__item").evaluateAll((items) =>
      items.map((item) => {
        const inner = item.querySelector(".uk-carousel__item-inner");
        return Number(
          inner?.style.getPropertyValue("--uk-carousel-slide-scale") || 1,
        );
      }),
    );

  await expect.poll(scales).toContain(1);
  expect((await scales()).some((scale) => scale < 1)).toBe(true);

  await next.click();
  await expect(output).toHaveText("2 / 20");
  await expect.poll(scales).toContain(1);

  await next.click();
  await expect(output).toHaveText("3 / 20");
  await expect.poll(scales).toContain(1);
});

test("Carousel: scale keeps its geometry in RTL", async ({ page }) => {
  await gotoCarousel(page);

  const region = carousel(page, "RTL 缩放轮播");
  const output = readout(region);

  await expect(region).toHaveCSS("direction", "rtl");
  await expect(output).toHaveText("1 / 20");

  const scales = await region
    .locator(".uk-carousel__item")
    .evaluateAll((items) =>
      items.map((item) =>
        Number(
          item
            .querySelector(".uk-carousel__item-inner")
            ?.style.getPropertyValue("--uk-carousel-slide-scale") || 1,
        ),
      ),
    );

  expect(scales).toContain(1);
  expect(scales.some((scale) => scale < 1)).toBe(true);

  await region.getByRole("button", { name: "下一张" }).click();
  await expect(output).toHaveText("2 / 20");
});

test("Carousel: scale keeps its geometry when vertical", async ({ page }) => {
  await gotoCarousel(page);

  const region = carousel(page, "纵向缩放轮播");
  const output = readout(region);

  await expect(region).toHaveAttribute("data-orientation", "vertical");
  await expect(output).toHaveText("1 / 5");

  const scales = await region
    .locator(".uk-carousel__item")
    .evaluateAll((items) =>
      items.map((item) =>
        Number(
          item
            .querySelector(".uk-carousel__item-inner")
            ?.style.getPropertyValue("--uk-carousel-slide-scale") || 1,
        ),
      ),
    );

  expect(scales).toContain(1);
  expect(scales.some((scale) => scale < 1)).toBe(true);

  await region.getByRole("button", { name: "下一张" }).click();
  await expect(output).toHaveText("2 / 5");
});

test("Carousel: scale is disabled visually under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoCarousel(page);

  const region = carousel(page, "缩放轮播");

  await expect(region).toHaveAttribute("data-scale", "true");

  const transforms = await region
    .locator(".uk-carousel__item-inner")
    .evaluateAll((inners) =>
      inners.map((inner) => ({
        scale: inner.style.getPropertyValue("--uk-carousel-slide-scale"),
        transform: getComputedStyle(inner).transform,
      })),
    );

  expect(transforms.every(({ scale }) => scale === "")).toBe(true);
  expect(
    transforms.every(
      ({ transform }) => transform === "matrix(1, 0, 0, 1, 0, 0)",
    ),
  ).toBe(true);
});
