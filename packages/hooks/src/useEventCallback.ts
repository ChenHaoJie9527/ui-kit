import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * 返回一个引用永远稳定的回调，但内部总是执行最新的函数。
 *
 * 常用于事件监听、定时器、订阅等场景：既不想因为依赖变化反复解绑，
 * 又需要拿到最新的 props/state。
 */
export function useEventCallback<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
) {
  const fnRef = useRef(fn);

  // 用 layout effect 保证在浏览器绘制前更新，避免事件里读到旧闭包。
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  return useCallback((...args: Args) => fnRef.current(...args), []);
}
