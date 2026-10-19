import { useCallback, useState } from "react";

export interface ListActions<T> {
  /** 设置指定下标的值，支持函数式更新。 */
  set: (index: number, value: T | ((prev: T) => T)) => void;
  /** 在末尾追加一项或多项。 */
  push: (...items: T[]) => void;
  /** 用 updater 更新指定下标。 */
  update: (index: number, updater: (value: T) => T) => void;
  /** 删除指定下标。 */
  remove: (index: number) => void;
  /** 清空数组。 */
  clear: () => void;
  /** 恢复到初始值。 */
  reset: () => void;
  /** 原地筛选（返回新数组）。 */
  filter: (predicate: (value: T, index: number) => boolean) => void;
  /** 排序（返回新数组）。 */
  sort: (compare?: (a: T, b: T) => number) => void;
}

export type UseListResult<T> = [T[], ListActions<T>];

function createInitialList<T>(initial?: T[] | (() => T[])): T[] {
  if (typeof initial === "function") {
    return [...initial()];
  }

  return initial ? [...initial] : [];
}

function isValidIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

/**
 * 用数组管理列表状态。
 *
 * 所有变更都是不可变更新，适合渲染列表；初始数组会被复制，避免
 * 外部修改原数组造成状态漂移。
 */
export function useList<T>(initial?: T[] | (() => T[])): UseListResult<T> {
  const [initialList] = useState<T[]>(() => createInitialList(initial));
  const [list, setList] = useState<T[]>(() => [...initialList]);

  const set = useCallback((index: number, value: T | ((prev: T) => T)) => {
    setList((prev) => {
      if (!isValidIndex(index, prev.length)) {
        return prev;
      }

      const current = prev[index] as T;
      const nextValue =
        typeof value === "function"
          ? (value as (prev: T) => T)(current)
          : value;

      if (Object.is(current, nextValue)) {
        return prev;
      }

      const next = [...prev];
      next[index] = nextValue;
      return next;
    });
  }, []);

  const push = useCallback((...items: T[]) => {
    if (items.length === 0) {
      return;
    }

    setList((prev) => [...prev, ...items]);
  }, []);

  const update = useCallback((index: number, updater: (value: T) => T) => {
    setList((prev) => {
      if (!isValidIndex(index, prev.length)) {
        return prev;
      }

      const next = [...prev];
      next[index] = updater(prev[index] as T);
      return next;
    });
  }, []);

  const remove = useCallback((index: number) => {
    setList((prev) => {
      if (!isValidIndex(index, prev.length)) {
        return prev;
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }, []);

  const clear = useCallback(() => {
    setList((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const reset = useCallback(() => {
    setList([...initialList]);
  }, [initialList]);

  const filter = useCallback(
    (predicate: (value: T, index: number) => boolean) => {
      setList((prev) => prev.filter(predicate));
    },
    [],
  );

  const sort = useCallback((compare?: (a: T, b: T) => number) => {
    // oxlint-disable-next-line unicorn/no-array-sort -- 先复制再排序，不会修改原数组
    setList((prev) => [...prev].sort(compare));
  }, []);

  return [list, { set, push, update, remove, clear, reset, filter, sort }];
}
