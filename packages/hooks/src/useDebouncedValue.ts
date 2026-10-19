import { useEffect, useState } from "react";

/**
 * 延迟更新值，常用于搜索输入、窗口尺寸等高频变化的场景。
 *
 * delay <= 0 时退化为同步更新，方便在测试或低延迟场景下关闭防抖。
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return;
    }

    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
