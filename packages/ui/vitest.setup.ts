import { MotionGlobalConfig } from "motion/react";

MotionGlobalConfig.skipAnimations = true;

// jsdom implements <dialog> but not its modal methods yet, so provide the
// minimal behavior the components rely on: open state plus the close event.
function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
}

function show(this: HTMLDialogElement) {
  this.setAttribute("open", "");
}

function close(this: HTMLDialogElement, returnValue?: string) {
  if (returnValue !== undefined) {
    this.returnValue = returnValue;
  }

  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
}

if (typeof HTMLDialogElement !== "undefined") {
  const proto = HTMLDialogElement.prototype;

  if (typeof proto.showModal !== "function") {
    proto.showModal = showModal;
  }

  if (typeof proto.show !== "function") {
    proto.show = show;
  }

  if (typeof proto.close !== "function") {
    proto.close = close;
  }
}

if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
      this.isPrimary = init.isPrimary ?? true;
    }
  }

  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: PointerEventPolyfill,
  });
}
