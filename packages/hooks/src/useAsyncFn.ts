// 依赖数组由调用方传入，函数通过 useEventCallback 保持最新；
// 因此这里关闭静态依赖检查。
// oxlint-disable react-hooks/exhaustive-deps
// oxlint-disable react/use-memo
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import { useEventCallback } from "./useEventCallback";

export interface AsyncFnState<T> {
  value: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export type AsyncFn<Args extends unknown[], T> = (...args: Args) => Promise<T>;

export type UseAsyncFnResult<Args extends unknown[], T> = [
  AsyncFnState<T>,
  AsyncFn<Args, T>,
];

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * 把任意 async 函数包装成带状态的回调。
 *
 * 返回 `[state, run]`：调用 run 会立即进入 loading，只有最后一次调用
 * 的结果会落盘；错误会写入 state 并继续向调用方抛出，方便 try/catch。
 */
export function useAsyncFn<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  deps: DependencyList = [],
): UseAsyncFnResult<Args, T> {
  const [state, setState] = useState<AsyncFnState<T>>({
    value: undefined,
    error: undefined,
    loading: false,
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

  const run = useCallback(
    async (...args: Args): Promise<T> => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;

      setState((prev) => ({ ...prev, error: undefined, loading: true }));

      try {
        const value = await runAsync(...args);

        if (mountedRef.current && runId === runIdRef.current) {
          setState({ value, error: undefined, loading: false });
        }

        return value;
      } catch (error) {
        if (mountedRef.current && runId === runIdRef.current) {
          setState({ value: undefined, error: toError(error), loading: false });
        }

        throw error;
      }
    },
    // deps 由调用方声明，函数本身通过 useEventCallback 读取最新值。
    deps,
  );

  return [state, run];
}
