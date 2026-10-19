import { useCallback, useState } from "react";

export interface MapActions<K, V> {
  /** 读取当前值（引用随 map 更新）。 */
  get: (key: K) => V | undefined;
  /** 设置单个键值。 */
  set: (key: K, value: V) => void;
  /** 批量写入，后写入的条目覆盖先写入的。 */
  setAll: (entries: Iterable<readonly [K, V]>) => void;
  /** 删除单个键。 */
  remove: (key: K) => void;
  /** 清空所有条目。 */
  clear: () => void;
  /** 恢复到初始值。 */
  reset: () => void;
}

export type UseMapResult<K, V> = [Map<K, V>, MapActions<K, V>];

function createInitialMap<K, V>(
  initial?: Map<K, V> | (() => Map<K, V>),
): Map<K, V> {
  if (typeof initial === "function") {
    return new Map(initial());
  }

  return initial ? new Map(initial) : new Map<K, V>();
}

/**
 * 用 Map 管理键值状态。
 *
 * 每次变更都创建新的 Map，保证 React 能感知到引用变化；初始 Map
 * 会被复制一份，调用方后续修改原对象不会影响 hook 内部状态。
 */
export function useMap<K, V>(
  initial?: Map<K, V> | (() => Map<K, V>),
): UseMapResult<K, V> {
  const [initialMap] = useState<Map<K, V>>(() => createInitialMap(initial));
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialMap));

  const set = useCallback((key: K, value: V) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const setAll = useCallback((entries: Iterable<readonly [K, V]>) => {
    setMap((prev) => {
      const next = new Map(prev);

      for (const [key, value] of entries) {
        next.set(key, value);
      }

      return next;
    });
  }, []);

  const remove = useCallback((key: K) => {
    setMap((prev) => {
      if (!prev.has(key)) {
        return prev;
      }

      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setMap((prev) => (prev.size === 0 ? prev : new Map<K, V>()));
  }, []);

  const reset = useCallback(() => {
    setMap(new Map(initialMap));
  }, [initialMap]);

  const get = useCallback((key: K) => map.get(key), [map]);

  return [map, { get, set, setAll, remove, clear, reset }];
}
