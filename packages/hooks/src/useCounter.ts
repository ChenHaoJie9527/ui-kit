import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

export type CounterUpdate = number | ((current: number) => number);

export interface CounterActions {
  /** 设置计数器，返回经过校验与边界裁剪后的值。 */
  set: (next: CounterUpdate) => number;
  /** 增加默认步长或指定增量，返回经过边界裁剪后的值。 */
  increment: (delta?: number) => number;
  /** 减少默认步长或指定减量，返回经过边界裁剪后的值。 */
  decrement: (delta?: number) => number;
  /** 恢复到首次挂载时的初始值，并按当前边界裁剪。 */
  reset: () => number;
}

export interface UseCounterOptions {
  /** 受控值；传入后计数器以该值为数据源。 */
  value?: number;
  /** 非受控模式的初始值，支持惰性初始化，默认 0。 */
  defaultValue?: number | (() => number);
  /** 下界，包含该值。 */
  min?: number;
  /** 上界，包含该值。 */
  max?: number;
  /** increment / decrement 的默认步长，默认 1。 */
  step?: number;
  /** 有效值变化时触发；受控与非受控模式都会调用。 */
  onChange?: (value: number) => void;
}

export type UseCounterResult = readonly [number, CounterActions];

interface CounterConfig {
  min: number;
  max: number;
  step: number;
}

function assertFiniteNumber(
  value: unknown,
  label: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveConfig(
  min: number | undefined,
  max: number | undefined,
  step: number,
): CounterConfig {
  const resolvedMin = min ?? -Infinity;
  const resolvedMax = max ?? Infinity;

  if (min !== undefined) {
    assertFiniteNumber(min, "min");
  }
  if (max !== undefined) {
    assertFiniteNumber(max, "max");
  }
  assertFiniteNumber(step, "step");

  if (step <= 0) {
    throw new RangeError("step must be greater than 0.");
  }
  if (resolvedMin > resolvedMax) {
    throw new RangeError("min must be less than or equal to max.");
  }

  return { min: resolvedMin, max: resolvedMax, step };
}

/**
 * 管理一个带边界和默认步长的数值计数器。
 *
 * 同时支持受控与非受控模式。所有操作都基于最新有效值计算，连续同步
 * 调用不会丢失更新；actions 引用稳定，可安全传给子组件。
 */
export function useCounter({
  value,
  defaultValue = 0,
  min,
  max,
  step = 1,
  onChange,
}: UseCounterOptions = {}): UseCounterResult {
  const config = resolveConfig(min, max, step);
  const isControlled = value !== undefined;

  if (isControlled) {
    assertFiniteNumber(value, "value");
  }

  const [initialValue] = useState(() => {
    const resolvedInitial =
      typeof defaultValue === "function" ? defaultValue() : defaultValue;

    assertFiniteNumber(resolvedInitial, "defaultValue");
    return clamp(resolvedInitial, config.min, config.max);
  });
  const [internalValue, setInternalValue] = useState(initialValue);

  const sourceValue = isControlled ? value : internalValue;
  const currentValue = clamp(sourceValue, config.min, config.max);

  // 边界变化时同步收紧内部值，避免之后放宽边界时恢复已不可见的旧值。
  if (!isControlled && !Object.is(internalValue, currentValue)) {
    setInternalValue(currentValue);
  }

  const currentRef = useRef(currentValue);
  const initialRef = useRef(initialValue);
  const configRef = useRef(config);
  const controlledRef = useRef(isControlled);
  const onChangeRef = useRef(onChange);

  useLayoutEffect(() => {
    currentRef.current = currentValue;
    configRef.current = config;
    controlledRef.current = isControlled;
    onChangeRef.current = onChange;
  });

  const set = useCallback((next: CounterUpdate) => {
    const previous = currentRef.current;
    const proposed =
      typeof next === "function"
        ? (next as (current: number) => number)(previous)
        : next;

    assertFiniteNumber(proposed, "next");

    const { min: currentMin, max: currentMax } = configRef.current;
    const resolved = clamp(proposed, currentMin, currentMax);

    if (!Object.is(previous, resolved)) {
      // 先同步 ref，确保同一事件里的连续操作基于最新值计算。
      currentRef.current = resolved;

      if (!controlledRef.current) {
        setInternalValue(resolved);
      }

      onChangeRef.current?.(resolved);
    }

    return resolved;
  }, []);

  const increment = useCallback(
    (delta?: number) => {
      const resolvedDelta = delta ?? configRef.current.step;
      assertFiniteNumber(resolvedDelta, "delta");
      return set((current) => current + resolvedDelta);
    },
    [set],
  );

  const decrement = useCallback(
    (delta?: number) => {
      const resolvedDelta = delta ?? configRef.current.step;
      assertFiniteNumber(resolvedDelta, "delta");
      return set((current) => current - resolvedDelta);
    },
    [set],
  );

  const reset = useCallback(() => set(() => initialRef.current), [set]);

  const actions = useMemo<CounterActions>(
    () => ({ set, increment, decrement, reset }),
    [decrement, increment, reset, set],
  );

  return [currentValue, actions] as const;
}
