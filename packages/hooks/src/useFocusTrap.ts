import { useEffect, type RefObject } from "react";

export interface UseFocusTrapOptions {
  /** 是否启用焦点陷阱。 */
  active: boolean;
  /** 陷阱边界，通常是对话框根元素。 */
  containerRef: RefObject<HTMLElement | null>;
  /** 启用后优先聚焦的元素；不传则聚焦容器内第一个可聚焦元素。 */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 关闭后恢复焦点的元素；不传则不改动焦点。 */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** 关闭时是否恢复焦点，默认 true。 */
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "audio[controls]",
  "video[controls]",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]",
].join(",");

// 后打开的陷阱优先处理键盘与焦点事件，避免嵌套浮层互相拉扯。
const trapStack: symbol[] = [];

function isTopmost(token: symbol): boolean {
  return trapStack[trapStack.length - 1] === token;
}

function isVisible(element: HTMLElement): boolean {
  if (element.closest("[hidden]")) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.tabIndex >= 0 && isVisible(element));
}

function focusElement(element: HTMLElement | null | undefined): boolean {
  if (!element || typeof element.focus !== "function") {
    return false;
  }

  element.focus({ preventScroll: true });
  return document.activeElement === element;
}

/**
 * 把键盘焦点限制在容器内。
 *
 * 原生 `<dialog>` 的模态模式已经处理了正向 Tab 循环和遮罩，但反向
 * Shift+Tab 仍可能逃出文档，程序化 `focus()` 也能绕开。这个 hook 补上
 * 三件事：边界处的双向循环、外部聚焦的回收，以及关闭后的焦点恢复。
 *
 * 多个陷阱叠加时只有最上层生效，因此对话框里再开对话框不会互相抢焦点。
 */
export function useFocusTrap({
  active,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  restoreFocus = true,
}: UseFocusTrapOptions): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const container = containerRef.current;

    if (!container || typeof document === "undefined") {
      return;
    }

    const token = Symbol("focus-trap");
    trapStack.push(token);

    const returnTarget = returnFocusRef?.current ?? null;
    const hadTabIndex = container.hasAttribute("tabindex");

    const ensureContainerFocusable = () => {
      if (!hadTabIndex && container.tabIndex < 0) {
        container.setAttribute("tabindex", "-1");
      }
    };

    const focusFirst = () => {
      const [first] = getFocusable(container);

      if (first) {
        focusElement(first);
        return;
      }

      ensureContainerFocusable();
      focusElement(container);
    };

    // 初始焦点：显式指定 > autofocus > 第一个可聚焦元素。
    const initial =
      initialFocusRef?.current ??
      container.querySelector<HTMLElement>("[autofocus]");

    if (initial && container.contains(initial)) {
      focusElement(initial);
    } else if (!container.contains(document.activeElement)) {
      focusFirst();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented || !isTopmost(token)) {
        return;
      }

      const items = getFocusable(container);
      const current = document.activeElement as HTMLElement | null;
      const inside =
        current === container ||
        (current != null && container.contains(current));

      if (items.length === 0) {
        event.preventDefault();
        ensureContainerFocusable();
        focusElement(container);
        return;
      }

      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (!inside || current === first || current === container) {
          event.preventDefault();
          focusElement(last);
        }
        return;
      }

      if (!inside || current === last || current === container) {
        event.preventDefault();
        focusElement(first);
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isTopmost(token)) {
        return;
      }

      const target = event.target;

      if (target instanceof Node && container.contains(target)) {
        return;
      }

      // 程序化聚焦到了陷阱外面，把焦点拉回来。
      focusFirst();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);

      const index = trapStack.lastIndexOf(token);

      if (index !== -1) {
        trapStack.splice(index, 1);
      }

      if (!hadTabIndex && container.getAttribute("tabindex") === "-1") {
        container.removeAttribute("tabindex");
      }

      if (restoreFocus && returnTarget?.isConnected) {
        focusElement(returnTarget);
      }
    };
  }, [active, containerRef, initialFocusRef, restoreFocus, returnFocusRef]);
}
