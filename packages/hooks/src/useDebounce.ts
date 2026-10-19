import { useEffect, useMemo, useRef } from "react";
import { useEventCallback } from "./useEventCallback";

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** 取消尚未执行的调用。 */
  cancel: () => void;
  /** 立即执行尚未执行的调用。 */
  flush: () => void;
  /** 是否有等待中的调用。 */
  pending: () => boolean;
}

/**
 * 对函数做防抖：连续触发时只在停止 delay 毫秒后执行一次。
 *
 * 返回的函数引用在 delay 不变时保持稳定，内部总是调用最新的 fn；
 * 组件卸载时会自动清掉定时器。
 */
export function useDebounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 300,
): DebouncedFunction<Args> {
  const callback = useEventCallback(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Args | null>(null);

  const debounced = useMemo(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const invoke = () => {
      const args = pendingArgsRef.current;
      pendingArgsRef.current = null;
      clearTimer();

      if (args) {
        callback(...args);
      }
    };

    const debouncedFunction = ((...args: Args) => {
      pendingArgsRef.current = args;
      clearTimer();
      timerRef.current = setTimeout(invoke, delay);
    }) as DebouncedFunction<Args>;

    debouncedFunction.cancel = () => {
      pendingArgsRef.current = null;
      clearTimer();
    };
    debouncedFunction.flush = () => {
      if (pendingArgsRef.current) {
        invoke();
      }
    };
    debouncedFunction.pending = () => pendingArgsRef.current !== null;

    return debouncedFunction;
  }, [callback, delay]);

  useEffect(() => () => debounced.cancel(), [debounced]);

  return debounced;
}
