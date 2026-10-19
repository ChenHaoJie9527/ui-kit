// 依赖数组由调用方传入，函数通过 useEventCallback 保持最新；
// 因此这里关闭静态依赖检查。
// oxlint-disable react-hooks/exhaustive-deps
// oxlint-disable react/exhaustive-effect-dependencies
import { useEffect, useRef, useState, type DependencyList } from "react";
import { useEventCallback } from "./useEventCallback";

export interface AsyncState<T> {
  value: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export interface UseAsyncOptions<T> {
  /** 首次渲染时的值。 */
  initialValue?: T;
  /** 为 false 时暂停执行，常用于依赖尚未就绪的场景。 */
  enabled?: boolean;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * 执行一个 async 函数并跟踪 loading / error / value。
 *
 * 依赖数组变化时自动重新执行；只有最后一次执行的结果会写入状态，
 * 避免快速切换参数时旧请求覆盖新结果。组件卸载后不再更新状态。
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: DependencyList = [],
  options: UseAsyncOptions<T> = {},
): AsyncState<T> {
  const { initialValue, enabled = true } = options;
  const [state, setState] = useState<AsyncState<T>>({
    value: initialValue,
    error: undefined,
    loading: enabled,
  });

  const runAsync = useEventCallback(asyncFunction);

  const runIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      // 使仍在飞行中的请求结果失效，但不在 effect 里同步改状态。
      runIdRef.current += 1;
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    // oxlint-disable-next-line react/set-state-in-effect -- 异步请求的外部状态需要先标记 loading
    setState((prev) => ({
      ...prev,
      error: undefined,
      loading: true,
    }));

    void (async () => {
      try {
        const value = await runAsync();

        if (mountedRef.current && runId === runIdRef.current) {
          setState({ value, error: undefined, loading: false });
        }
      } catch (error) {
        if (mountedRef.current && runId === runIdRef.current) {
          setState({ value: undefined, error: toError(error), loading: false });
        }
      }
    })();
    // deps 由调用方声明，enabled 变化也需要重新执行。
  }, [...deps, enabled]);

  if (!enabled) {
    return { ...state, loading: false };
  }

  return state;
}
