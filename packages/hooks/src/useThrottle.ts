import { useEffect, useMemo } from "react";
import { useEventCallback } from "./useEventCallback";

export interface ThrottleOptions {
  /** 是否在窗口开始时立即执行，默认 true。 */
  leading?: boolean;
  /** 是否在窗口结束时补一次调用，默认 true。 */
  trailing?: boolean;
}

export interface ThrottledFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** 取消等待中的尾部调用。 */
  cancel: () => void;
  /** 立即执行等待中的尾部调用。 */
  flush: () => void;
}

interface ThrottleState<Args extends unknown[]> {
  timer: ReturnType<typeof setTimeout> | null;
  pendingArgs: Args | null;
  lastInvoke: number;
}

function createThrottledFunction<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
  leading: boolean,
  trailing: boolean,
): ThrottledFunction<Args> {
  const state: ThrottleState<Args> = {
    timer: null,
    pendingArgs: null,
    lastInvoke: 0,
  };

  const clearTimer = () => {
    if (state.timer !== null) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  };

  const invoke = (args: Args) => {
    state.lastInvoke = Date.now();
    state.pendingArgs = null;
    clearTimer();
    callback(...args);
  };

  const schedule = (remaining: number) => {
    if (state.timer !== null) {
      return;
    }

    state.timer = setTimeout(() => {
      state.timer = null;

      if (state.pendingArgs) {
        invoke(state.pendingArgs);
      }
    }, remaining);
  };

  const throttled = ((...args: Args) => {
    const now = Date.now();
    const remaining = wait - (now - state.lastInvoke);

    if (remaining <= 0) {
      if (leading) {
        invoke(args);
        return;
      }

      state.lastInvoke = now;

      if (trailing) {
        state.pendingArgs = args;
        schedule(wait);
      }

      return;
    }

    if (trailing) {
      state.pendingArgs = args;
      schedule(remaining);
    }
  }) as ThrottledFunction<Args>;

  throttled.cancel = () => {
    state.pendingArgs = null;
    clearTimer();
  };
  throttled.flush = () => {
    if (state.pendingArgs) {
      invoke(state.pendingArgs);
    }
  };

  return throttled;
}

/**
 * 对函数做节流：wait 毫秒内最多执行一次。
 *
 * 默认 leading + trailing：第一次立即执行，窗口内最后一次在结束时补执行。
 * 返回的函数引用在配置不变时保持稳定，内部总是调用最新的 fn。
 */
export function useThrottle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait = 300,
  options: ThrottleOptions = {},
): ThrottledFunction<Args> {
  const { leading = true, trailing = true } = options;
  const callback = useEventCallback(fn);

  const throttled = useMemo(
    () => createThrottledFunction(callback, wait, leading, trailing),
    [callback, leading, trailing, wait],
  );

  useEffect(() => () => throttled.cancel(), [throttled]);

  return throttled;
}
