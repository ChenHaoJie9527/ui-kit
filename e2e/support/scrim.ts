import { expect, type Page } from "@playwright/test";

/**
 * 遮罩是纯 CSS 过渡，断言分两层：
 * 1. 计算样式里的时长与曲线必须来自共享 token；
 * 2. 把过渡暂停后按进度取样，确认透明度真的是渐次推进的。
 *
 * 第 2 层不能靠逐帧轮询：CI 上帧率不稳定，采样会漏掉中间值而假失败。
 */
export interface ScrimEnter {
  duration: string;
  timing: string;
  overlayDuration: string;
  scrimEasing: string;
  /** fraction 为进度（0–1），opacity 为该进度下的遮罩透明度。 */
  steps: { fraction: number; opacity: number }[];
}

export interface ScrimExit {
  delay: number;
  duration: number;
  /** 面板退出动画时长，也就是整层卸载前的窗口。 */
  panelExit: number;
  /** at 为从触发关闭算起的毫秒数。 */
  steps: { at: number; opacity: number }[];
}

interface Probe {
  duration: number;
  delay: number;
  panelExit: number;
  steps: { at: number; opacity: number }[];
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

async function pauseBackdrop(
  page: Page,
  dialogSelector: string,
  clickLabel: string,
  mode: "enter" | "exit",
): Promise<Probe | null> {
  return await page.evaluate(
    async (input: {
      dialogSelector: string;
      clickLabel: string;
      mode: "enter" | "exit";
    }) => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (candidate) => candidate.textContent?.trim() === input.clickLabel,
      );

      if (!button) {
        return null;
      }

      button.click();
      // 让 React 提交 DOM，再强制样式重算，遮罩的过渡对象此时才存在。
      await new Promise((resolve) => setTimeout(resolve, 0));

      const dialog = document.querySelector(input.dialogSelector);

      if (!dialog) {
        return null;
      }

      // 强制一次样式重算：遮罩的过渡对象要等 dialog 完成首次样式解析后才存在。
      void getComputedStyle(dialog, "::backdrop").opacity;

      const animations = dialog.getAnimations({ subtree: true });
      const backdrop = animations.find(
        (animation) => animation.effect?.pseudoElement === "::backdrop",
      );

      if (!backdrop) {
        return null;
      }

      // 全部暂停：遮罩进度被固定，层也不会在取样途中被卸载。
      animations.forEach((animation) => animation.pause());

      const timing = backdrop.effect?.getTiming();
      const duration = Number(timing?.duration ?? 0);
      const delay = Number(timing?.delay ?? 0);
      const panelExit = Math.max(
        0,
        ...animations
          .filter(
            (animation) => animation.effect?.pseudoElement !== "::backdrop",
          )
          .map((animation) => Number(animation.effect?.getTiming().duration)),
      );
      const read = () => Number(getComputedStyle(dialog, "::backdrop").opacity);
      const offsets =
        input.mode === "enter"
          ? [0, 0.25, 0.5, 0.75, 1].map((fraction) => duration * fraction)
          : [0, delay, delay + duration / 2, delay + duration];
      const steps = offsets.map((at) => {
        backdrop.currentTime = at;

        return { at, opacity: read() };
      });

      return { duration, delay, panelExit, steps };
    },
    { dialogSelector, clickLabel, mode },
  );
}

/** 打开浮层并暂停在遮罩过渡上取样。 */
export async function stepScrimEnter(
  page: Page,
  trigger: string,
  dialogSelector: string,
): Promise<ScrimEnter | null> {
  const probe = await pauseBackdrop(page, dialogSelector, trigger, "enter");

  if (!probe) {
    return null;
  }

  const declared = await page.evaluate((selector) => {
    const dialog = document.querySelector(selector);
    const scrim = dialog ? getComputedStyle(dialog, "::backdrop") : null;
    const root = getComputedStyle(document.documentElement);

    return {
      duration: scrim?.transitionDuration ?? "",
      timing: scrim?.transitionTimingFunction ?? "",
      overlayDuration: root.getPropertyValue("--uk-duration-overlay"),
      scrimEasing: root.getPropertyValue("--uk-ease-scrim"),
    };
  }, dialogSelector);

  return {
    ...declared,
    steps: probe.steps.map((step) => ({
      fraction: probe.duration === 0 ? 0 : step.at / probe.duration,
      opacity: step.opacity,
    })),
  };
}

/** 关闭浮层并暂停在遮罩退出过渡上取样。 */
export async function stepScrimExit(
  page: Page,
  dialogSelector: string,
  closeLabel: string,
): Promise<ScrimExit | null> {
  const probe = await pauseBackdrop(page, dialogSelector, closeLabel, "exit");

  return probe
    ? {
        delay: probe.delay,
        duration: probe.duration,
        panelExit: probe.panelExit,
        steps: probe.steps,
      }
    : null;
}

export function expectScrimRamp(enter: ScrimEnter | null): void {
  expect(enter).not.toBeNull();

  if (!enter) {
    return;
  }

  // 进入走 overlay 时长与遮罩曲线，不借用退出时长和 ease-out。
  expect(toMs(enter.duration)).toBe(toMs(enter.overlayDuration));
  expect(enter.timing).toBe(enter.scrimEasing.trim());

  const [start, quarter, half, , end] = enter.steps.map((step) => step.opacity);

  expect(start).toBeLessThanOrEqual(0.02);
  // ease-out 在 1/4 处已经跑到 ~0.63，遮罩曲线不会。
  expect(quarter).toBeLessThan(0.5);
  expect(half).toBeGreaterThan(0.2);
  expect(half).toBeLessThan(0.95);
  expect(end).toBeGreaterThanOrEqual(0.99);
}

export function expectScrimExit(exit: ScrimExit | null): void {
  expect(exit).not.toBeNull();

  if (!exit) {
    return;
  }

  // 面板退出结束就会卸载整层，遮罩必须在这个窗口内收完。
  expect(exit.delay + exit.duration).toBeLessThanOrEqual(exit.panelExit);

  const [start, afterDelay, middle, end] = exit.steps.map(
    (step) => step.opacity,
  );

  expect(start).toBeGreaterThan(0.99);
  expect(afterDelay).toBeGreaterThan(0.99);
  expect(middle).toBeGreaterThan(0.02);
  expect(middle).toBeLessThan(0.98);
  expect(end).toBeLessThanOrEqual(0.01);
}
