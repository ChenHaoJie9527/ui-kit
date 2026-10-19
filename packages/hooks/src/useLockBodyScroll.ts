import { useEffect } from "react";

let lockCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

/**
 * 锁定 / 解锁 body 滚动。
 *
 * 打开弹窗、抽屉时常用。内部用引用计数支持多个组件同时锁定；第一次
 * 锁定时补偿滚动条宽度，避免页面内容横向跳动。默认 locked = true。
 */
export function useLockBodyScroll(locked = true): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") {
      return;
    }

    const body = document.body;

    if (lockCount === 0) {
      originalOverflow = body.style.overflow;
      originalPaddingRight = body.style.paddingRight;

      // jsdom 等环境 clientWidth 为 0，此时不做补偿。
      const viewportWidth = document.documentElement.clientWidth;
      const scrollbarWidth =
        viewportWidth > 0 ? window.innerWidth - viewportWidth : 0;

      body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        const currentPadding =
          Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        body.style.overflow = originalOverflow;
        body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [locked]);
}
