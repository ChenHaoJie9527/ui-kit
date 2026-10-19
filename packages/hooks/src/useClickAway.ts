import { useEffect, type RefObject } from "react";
import { useEventCallback } from "./useEventCallback";

const DEFAULT_EVENTS = ["pointerdown"];

export type ClickAwayEvent = MouseEvent | PointerEvent | TouchEvent;

/**
 * 当用户在目标元素之外点击时触发回调。
 *
 * 默认监听 pointerdown（同时覆盖鼠标、触控笔和触摸），也可以传入
 * mousedown / touchstart 等事件名自行组合。回调始终读取最新闭包。
 */
export function useClickAway<T extends Element>(
  ref: RefObject<T | null>,
  handler: (event: ClickAwayEvent) => void,
  events: readonly string[] = DEFAULT_EVENTS,
): void {
  const onEvent = useEventCallback(handler);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const listener = (event: Event) => {
      const target = event.target;
      const element = ref.current;

      if (!element || !(target instanceof Node)) {
        return;
      }

      if (!element.contains(target)) {
        onEvent(event as ClickAwayEvent);
      }
    };

    events.forEach((eventName) =>
      document.addEventListener(eventName, listener),
    );

    return () => {
      events.forEach((eventName) =>
        document.removeEventListener(eventName, listener),
      );
    };
  }, [events, onEvent, ref]);
}
