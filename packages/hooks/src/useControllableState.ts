import { useCallback, useRef, useState } from "react";

export interface UseControllableStateOptions<T> {
  /** 受控值。传入即进入受控模式，内部状态不再生效。 */
  value?: T;
  /** 非受控模式下的初始值，支持惰性初始化。 */
  defaultValue: T | (() => T);
  /** 值变化时的回调，受控与非受控都会触发。 */
  onChange?: (value: T) => void;
}

/**
 * 统一受控 / 非受控状态的读写。
 *
 * 组件库里的输入类组件几乎都需要这套逻辑：受控时以外部 value 为准，
 * 非受控时自己维护状态，同时无论哪种模式都通知 onChange。
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  const currentValue = isControlled ? (value as T) : internalValue;

  // 用 ref 保存最新值，避免 setValue 的引用随 value 变化而重建，
  // 这样把它传给子组件时不会造成无谓的重渲染。
  const currentRef = useRef(currentValue);
  currentRef.current = currentValue;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = currentRef.current;
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(prev) : next;

      // Object.is 能正确处理 NaN 与 +0/-0，避免无意义的重渲染。
      if (!Object.is(prev, resolved)) {
        if (!isControlled) {
          setInternalValue(resolved);
        }
        onChangeRef.current?.(resolved);
      }

      return resolved;
    },
    [isControlled],
  );

  return [currentValue, setValue] as const;
}
