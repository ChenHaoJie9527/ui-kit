import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface UseLocalStorageOptions<T> {
  /** 自定义序列化，默认 JSON.stringify。 */
  serializer?: (value: T) => string;
  /** 自定义反序列化，默认 JSON.parse。 */
  deserializer?: (value: string) => T;
}

export type UseLocalStorageResult<T> = [
  T,
  Dispatch<SetStateAction<T>>,
  () => void,
];

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    // 隐私模式或被策略禁用时访问 localStorage 会抛错。
    return null;
  }
}

function resolveInitial<T>(initialValue: T | (() => T)): T {
  return typeof initialValue === "function"
    ? (initialValue as () => T)()
    : initialValue;
}

/**
 * 把状态持久化到 localStorage。
 *
 * 首次渲染时同步读取，避免闪一下默认值；set 会同步写回。支持函数式
 * 更新、自定义序列化，以及通过 storage 事件同步其他标签页的修改。
 * 返回 [value, setValue, remove]。
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {},
): UseLocalStorageResult<T> {
  const serializer = useMemo(
    () => options.serializer ?? ((value: T) => JSON.stringify(value)),
    [options.serializer],
  );
  const deserializer = useMemo(
    () => options.deserializer ?? ((raw: string) => JSON.parse(raw) as T),
    [options.deserializer],
  );
  const [initial] = useState<T | (() => T)>(initialValue);

  const [value, setValue] = useState<T>(() => {
    const storage = getStorage();

    if (storage) {
      try {
        const raw = storage.getItem(key);

        if (raw !== null) {
          return deserializer(raw);
        }
      } catch {
        // 坏数据或不可用存储都回退到初始值。
      }
    }

    return resolveInitial(initialValue);
  });

  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(valueRef.current)
          : next;

      valueRef.current = resolved;
      setValue(resolved);

      const storage = getStorage();

      if (storage) {
        try {
          storage.setItem(key, serializer(resolved));
        } catch {
          // 配额或权限问题不应该影响内存状态。
        }
      }
    },
    [key, serializer],
  );

  const remove = useCallback(() => {
    const next = resolveInitial(initial);

    try {
      getStorage()?.removeItem(key);
    } catch {
      // 忽略存储不可用。
    }

    valueRef.current = next;
    setValue(next);
  }, [initial, key]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) {
        return;
      }

      if (event.newValue === null) {
        const next = resolveInitial(initial);
        valueRef.current = next;
        setValue(next);
        return;
      }

      try {
        const next = deserializer(event.newValue);
        valueRef.current = next;
        setValue(next);
      } catch {
        // 其他标签页写入非法数据时保持当前值。
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [deserializer, initial, key]);

  return [value, set, remove];
}
