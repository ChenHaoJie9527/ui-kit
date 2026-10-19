import { useEffect, useState } from "react";

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(target.type);
  }

  return (
    target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  );
}

/**
 * 检测用户是否开始在页面空白处输入。
 *
 * 输入框、文本域、下拉框和 contentEditable 里的正常输入会被忽略，
 * 带修饰键的快捷键（⌘/Ctrl/Alt）也不算；一旦开始输入就保持为 true。
 */
export function useStartTyping(): boolean {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      setIsTyping(true);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return isTyping;
}
