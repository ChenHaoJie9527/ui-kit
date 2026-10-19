import { useCallback, useState, type DependencyList } from "react";
import { useAsync, type AsyncState } from "./useAsync";

export type UseAsyncRetryResult<T> = AsyncState<T> & {
  /** 重新执行一次 async 函数。 */
  retry: () => void;
};

/**
 * useAsync 加上 retry()。
 *
 * 内部通过递增一个 attempt 计数触发 useAsync 重新执行，因此同样具备
 * 竞态保护；适合失败后手动重试的请求场景。
 */
export function useAsyncRetry<T>(
  asyncFunction: () => Promise<T>,
  deps: DependencyList = [],
): UseAsyncRetryResult<T> {
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(asyncFunction, [...deps, attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}
