import { useSyncExternalStore } from "react";

export interface WindowSize {
  width: number;
  height: number;
}

const serverSnapshot: WindowSize = { width: 0, height: 0 };
let cachedSnapshot: WindowSize = serverSnapshot;

function readWindowSize(): WindowSize {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

function getSnapshot(): WindowSize {
  const next = readWindowSize();

  // useSyncExternalStore 要求快照引用稳定，尺寸没变时复用旧对象。
  if (
    next.width !== cachedSnapshot.width ||
    next.height !== cachedSnapshot.height
  ) {
    cachedSnapshot = next;
  }

  return cachedSnapshot;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

/**
 * 跟踪窗口可视区域尺寸，窗口 resize 时自动更新。
 *
 * 服务端渲染返回 0×0，客户端首次渲染会立刻拿到真实尺寸。
 */
export function useWindowSize(): WindowSize {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}
