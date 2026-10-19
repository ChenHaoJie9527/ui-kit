import { useEffect, useRef } from "react";

export interface UseTitleOptions {
  /** 卸载时恢复挂载前的标题，默认 false。 */
  restoreOnUnmount?: boolean;
}

/**
 * 设置 document.title。
 *
 * 适合路由切换、弹窗打开时更新页面标题；restoreOnUnmount 为 true 时
 * 会在组件卸载后恢复成挂载前的标题。
 */
export function useTitle(title: string, options: UseTitleOptions = {}): void {
  const { restoreOnUnmount = false } = options;
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title;
    }

    document.title = title;
  }, [title]);

  useEffect(() => {
    if (!restoreOnUnmount) {
      return;
    }

    return () => {
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
      }
    };
  }, [restoreOnUnmount]);
}
