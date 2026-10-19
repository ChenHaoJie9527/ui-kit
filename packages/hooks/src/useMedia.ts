import { useCallback, useSyncExternalStore } from "react";

function getMediaQueryList(query: string): MediaQueryList | null {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }

  return window.matchMedia(query);
}

/**
 * 订阅一条 CSS 媒体查询，返回当前是否命中。
 *
 * 通过 useSyncExternalStore 直接读取浏览器状态，避免首屏渲染后再由
 * effect 纠正导致的闪烁；服务端渲染时固定返回 false。
 */
export function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = getMediaQueryList(query);

      if (!mediaQueryList) {
        return () => {};
      }

      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => getMediaQueryList(query)?.matches ?? false,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
