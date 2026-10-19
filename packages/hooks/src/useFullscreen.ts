import { useCallback, useEffect, useState, type RefObject } from "react";
import { useEventCallback } from "./useEventCallback";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export interface UseFullscreenOptions {
  onEnter?: () => void;
  onExit?: () => void;
}

export interface UseFullscreenResult {
  isFullscreen: boolean;
  supported: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") {
    return null;
  }

  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * 让指定元素进入 / 退出全屏，并跟踪全屏状态。
 *
 * 同时兼容标准 API 与 Safari 的 webkit 前缀；不支持全屏的环境里
 * supported 为 false，调用 enter 不会抛错。
 */
export function useFullscreen<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: UseFullscreenOptions = {},
): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const supported =
    typeof document !== "undefined" &&
    (document.fullscreenEnabled === true ||
      typeof document.documentElement.requestFullscreen === "function" ||
      typeof (document.documentElement as FullscreenElement)
        .webkitRequestFullscreen === "function");

  const handleEnter = useEventCallback(() => options.onEnter?.());
  const handleExit = useEventCallback(() => options.onExit?.());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const onChange = () => {
      const active = getFullscreenElement() === ref.current;
      setIsFullscreen(active);

      if (active) {
        handleEnter();
      } else {
        handleExit();
      }
    };

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [handleEnter, handleExit, ref]);

  const enter = useCallback(async () => {
    const element = ref.current as FullscreenElement | null;

    if (!element) {
      return;
    }

    if (typeof element.requestFullscreen === "function") {
      await element.requestFullscreen();
      return;
    }

    await element.webkitRequestFullscreen?.();
  }, [ref]);

  const exit = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }

    const doc = document as FullscreenDocument;

    if (typeof document.exitFullscreen === "function") {
      await document.exitFullscreen();
      return;
    }

    await doc.webkitExitFullscreen?.();
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) {
      await exit();
      return;
    }

    await enter();
  }, [enter, exit]);

  return { isFullscreen, supported, enter, exit, toggle };
}
