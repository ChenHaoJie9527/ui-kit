import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { useEventCallback } from "seam-hooks";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";

import {
  REDUCED_MOTION_TRANSITION,
  TOOLTIP_GROUP_TRANSITION,
  TOOLTIP_TRANSITION,
} from "../motion";
import { cx } from "../utils/cx";
import {
  type RegisteredTooltipItem,
  TooltipGroupContext,
  type TooltipGroupContextValue,
} from "./tooltip-context";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNothing,
} from "./tooltip-context";
import type { TooltipAlign, TooltipSide } from "./TooltipRoot";
import {
  transformOriginForSide,
  type TooltipPositionOptions,
  useTooltipDismissBehavior,
  useTooltipPosition,
} from "./tooltip-utils";

export interface TooltipGroupProps {
  children: ReactNode;
  /** 组内所有 Tooltip 共用的方向。 */
  side?: TooltipSide;
  /** 组内所有 Tooltip 共用的对齐方式。 */
  align?: TooltipAlign;
  sideOffset?: number;
  collisionPadding?: number;
  avoidCollisions?: boolean;
  /** 刚进入组时延迟多久显示，默认 180ms；组已经打开后切换立即生效。 */
  delayDuration?: number;
  /** 完全离开组内触发器后多久关闭，默认 80ms。 */
  closeDelay?: number;
  contentClassName?: string;
}

interface TooltipGroupLayerProps extends TooltipPositionOptions {
  activeValue: string;
  content: ReactNode;
  contentClassName?: string;
  contentId: string;
  dismiss: () => void;
  triggerElement: HTMLElement;
}

export function TooltipGroupLayer({
  activeValue,
  content,
  contentClassName,
  contentId,
  dismiss,
  triggerElement,
  side,
  align,
  sideOffset,
  collisionPadding,
  avoidCollisions,
}: TooltipGroupLayerProps): ReactElement {
  const floatingRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isPresent = useIsPresent();
  const position = useTooltipPosition(triggerElement, floatingRef, {
    side,
    align,
    sideOffset,
    collisionPadding,
    avoidCollisions,
  });
  useTooltipDismissBehavior(triggerElement, floatingRef, dismiss);

  const floatingStyle = {
    left: position ? `${position.x}px` : 0,
    top: position ? `${position.y}px` : 0,
    transformOrigin: transformOriginForSide(position?.side ?? side),
    visibility: position ? "visible" : "hidden",
  } as CSSProperties;

  return (
    <motion.div
      ref={floatingRef}
      id={contentId}
      role="tooltip"
      layout={!reduceMotion}
      layoutDependency={activeValue}
      data-side={position?.side ?? side}
      data-align={align}
      data-state={isPresent ? "open" : "closed"}
      aria-hidden={isPresent ? undefined : true}
      className={cx(
        "uk-tooltip",
        "uk-tooltip__surface",
        "uk-tooltip--group",
        contentClassName,
      )}
      style={floatingStyle}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={
        reduceMotion
          ? { ...REDUCED_MOTION_TRANSITION, layout: { duration: 0 } }
          : TOOLTIP_GROUP_TRANSITION
      }
    >
      <span
        className="uk-tooltip__arrow"
        aria-hidden="true"
        style={
          {
            "--uk-tooltip-arrow-offset": `${position?.arrowOffset ?? 0}px`,
          } as CSSProperties
        }
      />
      <motion.div
        key={activeValue}
        className="uk-tooltip__content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion ? REDUCED_MOTION_TRANSITION : TOOLTIP_TRANSITION
        }
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

/**
 * 一组共享同一浮动表面的 Tooltip。
 *
 * 首次进入按 delayDuration 显示；已打开后在相邻 Item 间切换会立即更新内容，
 * 并由 Motion layout 连续移动到新触发器的位置。
 */
export function TooltipGroup({
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  collisionPadding = 8,
  avoidCollisions = true,
  delayDuration = 180,
  closeDelay = 80,
  contentClassName,
}: TooltipGroupProps): ReactElement {
  const contentId = useId();
  const [items, setItems] = useState<Map<string, RegisteredTooltipItem>>(
    () => new Map(),
  );
  const [open, setOpen] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );

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

  const activate = useEventCallback((value: string, immediate = false) => {
    clearOpenTimer();
    clearCloseTimer();
    setActiveValue(value);

    if (open) {
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

    if (!open) {
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

  const register = useEventCallback(
    (value: string, triggerElement: HTMLElement, content: ReactNode) => {
      setItems((previous) => {
        const existing = previous.get(value);

        if (
          existing?.triggerElement === triggerElement &&
          Object.is(existing.content, content)
        ) {
          return previous;
        }

        const next = new Map(previous);
        next.set(value, { triggerElement, content });
        return next;
      });
    },
  );

  const unregister = useEventCallback((value: string) => {
    setItems((previous) => {
      if (!previous.has(value)) {
        return previous;
      }

      const next = new Map(previous);
      next.delete(value);
      return next;
    });
  });

  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [clearCloseTimer, clearOpenTimer],
  );

  const context = useMemo<TooltipGroupContextValue>(
    () => ({
      open,
      activeValue,
      contentId,
      activate,
      requestClose,
      dismiss,
      register,
      unregister,
    }),
    [
      activate,
      activeValue,
      contentId,
      dismiss,
      open,
      register,
      requestClose,
      unregister,
    ],
  );
  const activeItem = activeValue ? items.get(activeValue) : undefined;
  const isOpen = open && Boolean(activeItem);
  const portalContainer =
    isClient && activeItem
      ? (activeItem.triggerElement.closest<HTMLElement>("dialog") ??
        document.body)
      : null;

  return (
    <TooltipGroupContext.Provider value={context}>
      {children}
      {portalContainer && activeItem
        ? createPortal(
            <MotionConfig reducedMotion="user">
              <AnimatePresence>
                {isOpen ? (
                  <TooltipGroupLayer
                    key="uk-tooltip-group"
                    activeValue={activeValue ?? ""}
                    content={activeItem.content}
                    contentClassName={contentClassName}
                    contentId={contentId}
                    dismiss={dismiss}
                    triggerElement={activeItem.triggerElement}
                    side={side}
                    align={align}
                    sideOffset={sideOffset}
                    collisionPadding={collisionPadding}
                    avoidCollisions={avoidCollisions}
                  />
                ) : null}
              </AnimatePresence>
            </MotionConfig>,
            portalContainer,
          )
        : null}
    </TooltipGroupContext.Provider>
  );
}
