import { useEffect, useState } from "react";
import { useEventCallback } from "./useEventCallback";

/**
 * 监听鼠标离开页面边界。
 *
 * 返回一个布尔值表示当前是否已经离开；再次进入页面时会重置。
 * 可选的 onLeave 回调适合在离开时做埋点或提示。
 */
export function usePageLeave(onLeave?: () => void): boolean {
  const [isLeft, setIsLeft] = useState(false);
  const handleLeave = useEventCallback(() => {
    setIsLeft(true);
    onLeave?.();
  });

  useEffect(() => {
    const onMouseOut = (event: MouseEvent) => {
      // relatedTarget 为空，说明鼠标移出了整个文档，而不是移到页面内另一个元素。
      if (event.relatedTarget === null) {
        handleLeave();
      }
    };

    const onMouseOver = () => setIsLeft(false);

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("mouseover", onMouseOver);

    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, [handleLeave]);

  return isLeft;
}
