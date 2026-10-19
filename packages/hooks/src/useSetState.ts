import { useCallback, useState } from "react";

export type SetStatePatch<T extends object> =
  | Partial<T>
  | ((prev: T) => Partial<T>);

export type UseSetStateResult<T extends object> = [
  T,
  (patch: SetStatePatch<T>) => void,
];

/**
 * 类似 class 组件的 this.setState：浅合并补丁，而不是整体替换。
 *
 * 支持函数式补丁，连续多次调用也不会读到旧状态。
 */
export function useSetState<T extends object>(
  initialState: T | (() => T),
): UseSetStateResult<T> {
  const [state, setState] = useState<T>(initialState);

  const mergeState = useCallback((patch: SetStatePatch<T>) => {
    setState((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));
  }, []);

  return [state, mergeState];
}
