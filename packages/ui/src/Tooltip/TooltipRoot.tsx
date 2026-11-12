import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState, useEventCallback } from "seam-hooks";

import { TooltipContext, type TooltipContextValue } from "./tooltip-context";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipRootProps {
  children: ReactNode;
  /** 受控打开状态。 */
  open?: boolean;
  /** 非受控模式下的初始打开状态。 */
  defaultOpen?: boolean;
  /** 打开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
  /** 指针停留或聚焦多久后显示，默认 300ms。 */
  delayDuration?: number;
  /** 离开触发器后多久关闭，默认 80ms。 */
  closeDelay?: number;
}

export function TooltipRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
  delayDuration = 300,
  closeDelay = 80,
}: TooltipRootProps): ReactElement {
  const contentId = useId();
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(
    null,
  );
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [current, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const requestOpen = useEventCallback((immediate = false) => {
    clearOpenTimer();
    clearCloseTimer();

    if (current) {
      return;
    }

    if (immediate || delayDuration <= 0) {
      setOpen(true);
      return;
    }

    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setOpen(true);
    }, delayDuration);
  });

  const requestClose = useEventCallback(() => {
    clearOpenTimer();
    clearCloseTimer();

    if (!current) {
      return;
    }

    if (closeDelay <= 0) {
      setOpen(false);
      return;
    }

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, closeDelay);
  });

  const dismiss = useEventCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setOpen(false);
  });

  useEffect(() => {
    if (current) {
      clearCloseTimer();
    } else {
      clearOpenTimer();
    }
  }, [clearCloseTimer, clearOpenTimer, current]);

  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [clearCloseTimer, clearOpenTimer],
  );

  const context = useMemo<TooltipContextValue>(
    () => ({
      open: current,
      triggerElement,
      setTriggerElement,
      contentId,
      requestOpen,
      requestClose,
      dismiss,
    }),
    [contentId, current, dismiss, requestClose, requestOpen, triggerElement],
  );

  return (
    <TooltipContext.Provider value={context}>
      {children}
    </TooltipContext.Provider>
  );
}
