import { expect, type Page } from "@playwright/test";

export interface ScrimEntry {
  samples: { elapsed: number; opacity: number }[];
  duration: string;
  timing: string;
  overlayDuration: string;
  scrimEasing: string;
}

function toMs(value: string): number {
  const trimmed = value.trim();

  if (trimmed.endsWith("ms")) {
    return Number.parseFloat(trimmed);
  }

  return trimmed.endsWith("s")
    ? Number.parseFloat(trimmed) * 1000
    : Number.parseFloat(trimmed);
}

/**
 * 打开浮层，并按帧记录 `::backdrop` 的透明度轨迹与最终的过渡声明。
 * 遮罩是纯 CSS 过渡，这两项合起来就是它的全部行为。
 */
export async function sampleScrim(
  page: Page,
  trigger: string,
  dialogSelector: string,
): Promise<ScrimEntry> {
  return await page.evaluate(
    async (options: { trigger: string; dialogSelector: string }) => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (candidate) => candidate.textContent?.trim() === options.trigger,
      );
      const samples: { elapsed: number; opacity: number }[] = [];
      const start = performance.now();

      button?.click();

      await new Promise<void>((resolve) => {
        const tick = () => {
          const dialog = document.querySelector(options.dialogSelector);

          if (dialog) {
            samples.push({
              elapsed: performance.now() - start,
              opacity: Number(getComputedStyle(dialog, "::backdrop").opacity),
            });
          }

          if (performance.now() - start < 400) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(tick);
      });

      const dialog = document.querySelector(options.dialogSelector);
      const scrim = dialog ? getComputedStyle(dialog, "::backdrop") : null;
      const root = getComputedStyle(document.documentElement);

      return {
        samples,
        duration: scrim?.transitionDuration ?? "",
        timing: scrim?.transitionTimingFunction ?? "",
        overlayDuration: root.getPropertyValue("--uk-duration-overlay"),
        scrimEasing: root.getPropertyValue("--uk-ease-scrim"),
      };
    },
    { trigger, dialogSelector },
  );
}

export function expectScrimRamp(entry: ScrimEntry): void {
  // 进入走 overlay 时长与遮罩曲线，不再借用退出时长和 ease-out。
  expect(toMs(entry.duration)).toBe(toMs(entry.overlayDuration));
  expect(entry.timing).toBe(entry.scrimEasing.trim());

  expect(entry.samples.length).toBeGreaterThan(0);
  expect(Math.max(...entry.samples.map((sample) => sample.opacity))).toBe(1);
  // 淡入必须在多帧里被观察到；一帧完成的过渡读起来就是硬切。
  expect(
    entry.samples.filter(
      (sample) => sample.opacity > 0.08 && sample.opacity < 0.8,
    ).length,
  ).toBeGreaterThan(1);
  // ease-out 会把 60% 以上的进度压在头 40ms，遮罩曲线不会。
  expect(
    entry.samples.filter(
      (sample) => sample.elapsed < 50 && sample.opacity > 0.5,
    ),
  ).toEqual([]);
}

/**
 * 关闭浮层，并按帧记录 `::backdrop` 的透明度直到元素卸载。
 * 用来确认语境层真的走完了退出，而不是跟着元素一起消失。
 */
export async function sampleScrimExit(
  page: Page,
  dialogSelector: string,
  closeLabel: string,
): Promise<(number | "gone")[]> {
  return await page.evaluate(
    async (options: { dialogSelector: string; closeLabel: string }) => {
      const closeButton = Array.from(document.querySelectorAll("button")).find(
        (candidate) => candidate.textContent?.trim() === options.closeLabel,
      );
      const samples: (number | "gone")[] = [];
      const start = performance.now();

      closeButton?.click();

      await new Promise<void>((resolve) => {
        const tick = () => {
          const dialog = document.querySelector(options.dialogSelector);

          samples.push(
            dialog
              ? Number(getComputedStyle(dialog, "::backdrop").opacity)
              : "gone",
          );

          if (performance.now() - start < 400) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(tick);
      });

      return samples;
    },
    { dialogSelector, closeLabel },
  );
}

export function expectScrimExit(samples: (number | "gone")[]): void {
  const goneAt = samples.indexOf("gone");

  expect(goneAt).toBeGreaterThan(0);

  const faded = samples.slice(0, goneAt) as number[];

  // 卸载前一帧遮罩必须已经基本收干，否则退出就是硬切。
  expect(faded[faded.length - 1]).toBeLessThanOrEqual(0.05);
  expect(faded.filter((opacity) => opacity < 0.8).length).toBeGreaterThan(1);
}
