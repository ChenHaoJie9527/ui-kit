import { useEffect, useState } from "react";

export interface Observer<T> {
  next: (value: T) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

export interface ObservableLike<T> {
  subscribe: (observer: Observer<T>) => Subscription | (() => void) | void;
}

/**
 * 订阅任意 Observable（RxJS、自定义事件流等），返回最新值。
 *
 * 只依赖最小接口 `subscribe(observer)`，不绑定具体库；可返回
 * `{ unsubscribe }` 或一个清理函数。observable 变化时会重新订阅。
 */
export function useObservable<T>(
  observable: ObservableLike<T>,
  initialValue?: T,
): T | undefined {
  const [value, setValue] = useState<T | undefined>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe({ next: setValue });

    return () => {
      if (typeof subscription === "function") {
        subscription();
        return;
      }

      subscription?.unsubscribe();
    };
  }, [observable]);

  return value;
}
