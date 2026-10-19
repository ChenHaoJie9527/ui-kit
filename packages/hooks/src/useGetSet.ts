import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/**
 * 返回状态的 getter 而不是原始值。
 *
 * `get()` 直接读 ref，不会因为读取而触发渲染；`set` 仍会更新状态并
 * 触发重渲染。适合把「读取最新值」传给定时器、订阅或事件回调。
 */
export function useGetSet<T>(
  initialValue: T | (() => T),
): [() => T, Dispatch<SetStateAction<T>>] {
  const [initial] = useState<T>(() =>
    typeof initialValue === "function"
      ? (initialValue as () => T)()
      : initialValue,
  );
  const valueRef = useRef<T>(initial);
  const [, forceRender] = useState(0);

  const get = useCallback(() => valueRef.current as T, []);

  const set = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const resolved =
      typeof next === "function"
        ? (next as (prev: T) => T)(valueRef.current as T)
        : next;

    valueRef.current = resolved;
    forceRender((version) => version + 1);
  }, []);

  return [get, set];
}
