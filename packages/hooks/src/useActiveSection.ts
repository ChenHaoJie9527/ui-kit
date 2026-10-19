import { useEffect, useState } from "react";

export interface UseActiveSectionOptions {
  /**
   * 判定「已经滚到该段落」的偏移量，通常等于吸顶头部高度。
   * 默认 0，表示元素顶部与视口顶部对齐时才算命中。
   */
  offset?: number;
}

// 滚动位置与 getBoundingClientRect 都可能带小数，留 1px 容差，
// 否则「刚滚到阈值」的那一段会因为舍入而判不中。
const EDGE_TOLERANCE = 1;

/**
 * 跟踪当前滚动到哪一段，返回对应的 id。
 *
 * 适合目录、锚点导航、阅读进度这类场景。内部在滚动与 resize 时用
 * requestAnimationFrame 合并计算，不会每个 scroll 事件都触发重渲染；
 * 只有结果变化时才更新状态，因此可以安全地直接渲染高亮。
 *
 * 判定规则：取「顶部已越过 offset 的最后一段」；滚到页面底部时固定
 * 返回最后一段，避免最后几段太短而永远无法高亮。
 */
export function useActiveSection(
  ids: string[],
  { offset = 0 }: UseActiveSectionOptions = {},
): string | null {
  // 调用方通常直接传入内联数组，用拼接后的 key 作为依赖，
  // 避免每次渲染都重新绑定滚动监听。
  const key = ids.join("\u0001");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const list = key === "" ? [] : key.split("\u0001");
    let frame = 0;
    let scheduled = false;

    const compute = () => {
      scheduled = false;

      if (list.length === 0) {
        setActive((previous) => (previous === null ? previous : null));
        return;
      }

      const root = document.documentElement;
      const scrollable = root.scrollHeight > window.innerHeight + 1;
      const atBottom =
        scrollable &&
        window.scrollY + window.innerHeight >= root.scrollHeight - 2;

      if (atBottom) {
        const last = list[list.length - 1] ?? null;
        setActive((previous) => (previous === last ? previous : last));
        return;
      }

      let current = list[0] ?? null;

      for (const id of list) {
        const element = document.getElementById(id);

        if (!element) {
          continue;
        }

        if (element.getBoundingClientRect().top - offset <= EDGE_TOLERANCE) {
          current = id;
        } else {
          // 后续元素只会更靠下，无需继续测量。
          break;
        }
      }

      setActive((previous) => (previous === current ? previous : current));
    };

    const schedule = () => {
      if (scheduled) {
        return;
      }

      scheduled = true;
      frame = window.requestAnimationFrame(compute);
    };

    // 先算一次，避免刚挂载时目录没有高亮。
    compute();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [key, offset]);

  return active;
}
