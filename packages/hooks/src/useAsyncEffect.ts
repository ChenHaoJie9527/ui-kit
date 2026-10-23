// 依赖数组由调用方传入，函数通过 useEventCallback 保持最新；
// 因此这里关闭静态依赖检查。
// oxlint-disable react-hooks/exhaustive-deps
// oxlint-disable react/exhaustive-effect-dependencies
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import { useEventCallback } from "./useEventCallback";

export type AsyncEffectStatus = "idle" | "loading" | "success" | "error";

export type AsyncEffectCleanup<T> =
  | ((value: T) => void)
  | ((value: T) => Promise<void>);

export interface AsyncEffectOutcome<T> {
  value?: T;
  cleanup?: AsyncEffectCleanup<T>;
}

export type AsyncEffectResult<T> =
  | AsyncEffectCleanup<T>
  | AsyncEffectOutcome<T>
  | void;

export interface AsyncEffectState<T> {
  status: AsyncEffectStatus;
  value: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export interface UseAsyncEffectOptions<T> {
  /** 首次渲染或尚未产生结果时的 value。 */
  initialValue?: T;
  /** 为 false 时暂停执行，常用于依赖尚未就绪的场景。 */
  enabled?: boolean;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * 执行一个 async effect，并跟踪 status / value / error / loading。
 *
 * 异步函数可以返回清理函数；清理函数会收到成功结果。依赖变化或卸载时，
 * 只有最新一次执行的结果和清理回调会生效。
 */
export function useAsyncEffect<T>(
  asyncEffect: () => Promise<T> | AsyncEffectResult<T>,
  deps: DependencyList = [],
  options: UseAsyncEffectOptions<T> = {},
): AsyncEffectState<T> & { cancel: () => void } {
  const { initialValue, enabled = true } = options;
  const [state, setState] = useState<AsyncEffectState<T>>({
    status: enabled ? "loading" : "idle",
    value: initialValue,
    error: undefined,
    loading: enabled,
  });

  const runEffect = useEventCallback(asyncEffect);

  const runIdRef = useRef(0);
  const mountedRef = useRef(true);
  const cleanupRef = useRef<
    { runId: number; value: T; cleanup: AsyncEffectCleanup<T> } | undefined
  >(undefined);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cancel = useCallback(() => {
    runIdRef.current += 1;

    setState((prev) => ({
      ...prev,
      status: "idle",
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) {
      cancel();
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    // 异步 effect 的外部状态需要先标记 loading，供调用方展示进行中状态。
    // oxlint-disable-next-line react/set-state-in-effect
    setState((prev) => ({
      status: "loading",
      value: prev.value,
      error: undefined,
      loading: true,
    }));

    void (async () => {
      try {
        const result = (await runEffect()) as T | AsyncEffectCleanup<T> | void;

        if (mountedRef.current && runId === runIdRef.current) {
          if (typeof result === "function") {
            cleanupRef.current = {
              runId,
              value: initialValue as T,
              cleanup: result as AsyncEffectCleanup<T>,
            };
            setState((prev) => ({
              status: "success",
              value: prev.value,
              error: undefined,
              loading: false,
            }));
          } else if (result && typeof result === "object") {
            const { value, cleanup } = result as AsyncEffectOutcome<T>;

            if (typeof cleanup === "function") {
              cleanupRef.current = {
                runId,
                value: (value ?? initialValue) as T,
                cleanup,
              };
            }

            setState((prev) => ({
              status: "success",
              value: value ?? prev.value,
              error: undefined,
              loading: false,
            }));
          } else {
            const value = result as T;

            setState({
              status: "success",
              value,
              error: undefined,
              loading: false,
            });
          }
        }
      } catch (error) {
        if (mountedRef.current && runId === runIdRef.current) {
          setState({
            status: "error",
            value: undefined,
            error: toError(error),
            loading: false,
          });
        }
      }
    })();

    return () => {
      const activeCleanup = cleanupRef.current;

      if (activeCleanup && activeCleanup.runId === runIdRef.current) {
        cleanupRef.current = undefined;
        void activeCleanup.cleanup(activeCleanup.value);
      }
    };
    // deps 由调用方声明，enabled 变化也需要重新执行。
  }, [...deps, enabled]);

  return { ...state, cancel };
}
