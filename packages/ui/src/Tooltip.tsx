import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";
import { useControllableState, useEventCallback } from "seam-hooks";
import {
  REDUCED_MOTION_TRANSITION,
  TOOLTIP_GROUP_TRANSITION,
  TOOLTIP_TRANSITION,
} from "./motion";
import { cx } from "./utils/cx";

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

interface TooltipContextValue {
  open: boolean;
  triggerElement: HTMLElement | null;
  setTriggerElement: (element: HTMLElement | null) => void;
  contentId: string;
  requestOpen: (immediate?: boolean) => void;
  requestClose: () => void;
  dismiss: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useTooltipContext(component: string): TooltipContextValue {
  const context = useContext(TooltipContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tooltip.Root>`);
  }

  return context;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as { current: T | null }).current = value;
  }
}

function appendDescription(existing: unknown, id: string): string {
  const ids =
    typeof existing === "string" ? existing.split(/\s+/).filter(Boolean) : [];

  return Array.from(new Set([...ids, id])).join(" ");
}

function composeHandler<T extends { defaultPrevented: boolean }>(
  childHandler: ((event: T) => void) | undefined,
  handler: (event: T) => void,
) {
  return (event: T) => {
    childHandler?.(event);

    if (!event.defaultPrevented) {
      handler(event);
    }
  };
}

/** Tooltip 的状态、计时器与语义 ID 根节点。 */
function TooltipRoot({
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

export interface TooltipTriggerProps {
  /** 单个可聚焦的交互元素；事件和 ref 会与调用方传入的值合并。 */
  children: ReactElement;
}

/** 为原生交互元素补充 hover、focus、Escape 与 aria-describedby。 */
function TooltipTrigger({ children }: TooltipTriggerProps): ReactElement {
  const context = useTooltipContext("Tooltip.Trigger");
  const { setTriggerElement } = context;

  if (!isValidElement(children)) {
    throw new Error("<Tooltip.Trigger> expects a single valid React element");
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const childRef =
    (childProps.ref as Ref<HTMLElement> | undefined) ??
    (child as unknown as { ref?: Ref<HTMLElement> }).ref;
  const childPointerEnter = childProps.onPointerEnter as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const childPointerLeave = childProps.onPointerLeave as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const childFocus = childProps.onFocus as
    | ((event: FocusEvent<HTMLElement>) => void)
    | undefined;
  const childBlur = childProps.onBlur as
    | ((event: FocusEvent<HTMLElement>) => void)
    | undefined;
  const childKeyDown = childProps.onKeyDown as
    | ((event: KeyboardEvent<HTMLElement>) => void)
    | undefined;
  const setTriggerRef = useCallback(
    (element: HTMLElement | null) => {
      setRef(childRef, element);
      setTriggerElement(element);
    },
    [childRef, setTriggerElement],
  );

  return cloneElement(child, {
    ref: setTriggerRef,
    "aria-describedby": context.open
      ? appendDescription(childProps["aria-describedby"], context.contentId)
      : childProps["aria-describedby"],
    onPointerEnter: composeHandler(childPointerEnter, (event) => {
      context.requestOpen(event.pointerType === "touch");
    }),
    onPointerLeave: composeHandler(childPointerLeave, (event) => {
      if (event.pointerType !== "touch") {
        context.requestClose();
      }
    }),
    onFocus: composeHandler(childFocus, () => {
      context.requestOpen();
    }),
    onBlur: composeHandler(childBlur, () => {
      context.requestClose();
    }),
    onKeyDown: composeHandler(childKeyDown, (event) => {
      if (event.key === "Escape" && context.open) {
        event.preventDefault();
        event.stopPropagation();
        context.dismiss();
      }
    }),
  });
}

export interface TooltipContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  children?: ReactNode;
  /** 首选方向，空间不足时自动翻转。 */
  side?: TooltipSide;
  /** 沿首选方向与触发器的对齐方式。 */
  align?: TooltipAlign;
  /** 与触发器之间的间距，默认 8px。 */
  sideOffset?: number;
  /** 与视口边缘的最小间距，默认 8px。 */
  collisionPadding?: number;
  /** 是否根据视口空间翻转和避让，默认 true。 */
  avoidCollisions?: boolean;
}

interface Rectangle {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  x: number;
  y: number;
  side: TooltipSide;
  arrowOffset: number;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function oppositeSide(side: TooltipSide): TooltipSide {
  switch (side) {
    case "top":
      return "bottom";
    case "right":
      return "left";
    case "bottom":
      return "top";
    case "left":
      return "right";
  }
}

function mainAxisRoom(
  trigger: Rectangle,
  side: TooltipSide,
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
) {
  switch (side) {
    case "top":
      return trigger.top - padding;
    case "right":
      return viewportWidth - trigger.right - padding;
    case "bottom":
      return viewportHeight - trigger.bottom - padding;
    case "left":
      return trigger.left - padding;
  }
}

function fitsOnSide(
  trigger: Rectangle,
  tooltip: Rectangle,
  side: TooltipSide,
  offset: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
) {
  const room = mainAxisRoom(
    trigger,
    side,
    viewportWidth,
    viewportHeight,
    padding,
  );

  return (
    room >=
    (side === "top" || side === "bottom" ? tooltip.height : tooltip.width) +
      offset
  );
}

export function calculateTooltipPosition({
  trigger,
  tooltip,
  side,
  align,
  sideOffset,
  collisionPadding,
  avoidCollisions,
  viewportWidth,
  viewportHeight,
}: {
  trigger: Rectangle;
  tooltip: Rectangle;
  side: TooltipSide;
  align: TooltipAlign;
  sideOffset: number;
  collisionPadding: number;
  avoidCollisions: boolean;
  viewportWidth: number;
  viewportHeight: number;
}): TooltipPosition {
  let resolvedSide = side;

  if (
    avoidCollisions &&
    !fitsOnSide(
      trigger,
      tooltip,
      side,
      sideOffset,
      viewportWidth,
      viewportHeight,
      collisionPadding,
    )
  ) {
    const opposite = oppositeSide(side);
    const oppositeFits = fitsOnSide(
      trigger,
      tooltip,
      opposite,
      sideOffset,
      viewportWidth,
      viewportHeight,
      collisionPadding,
    );
    const preferredRoom = mainAxisRoom(
      trigger,
      side,
      viewportWidth,
      viewportHeight,
      collisionPadding,
    );
    const oppositeRoom = mainAxisRoom(
      trigger,
      opposite,
      viewportWidth,
      viewportHeight,
      collisionPadding,
    );

    if (oppositeFits || oppositeRoom > preferredRoom) {
      resolvedSide = opposite;
    }
  }

  const triggerCenterX = trigger.left + trigger.width / 2;
  const triggerCenterY = trigger.top + trigger.height / 2;
  let x = 0;
  let y = 0;

  switch (resolvedSide) {
    case "top":
    case "bottom":
      x =
        align === "start"
          ? trigger.left
          : align === "end"
            ? trigger.right - tooltip.width
            : triggerCenterX - tooltip.width / 2;
      y =
        resolvedSide === "top"
          ? trigger.top - tooltip.height - sideOffset
          : trigger.bottom + sideOffset;
      break;
    case "left":
    case "right":
      x =
        resolvedSide === "left"
          ? trigger.left - tooltip.width - sideOffset
          : trigger.right + sideOffset;
      y =
        align === "start"
          ? trigger.top
          : align === "end"
            ? trigger.bottom - tooltip.height
            : triggerCenterY - tooltip.height / 2;
      break;
  }

  if (avoidCollisions) {
    x = clamp(
      x,
      collisionPadding,
      viewportWidth - tooltip.width - collisionPadding,
    );
    y = clamp(
      y,
      collisionPadding,
      viewportHeight - tooltip.height - collisionPadding,
    );
  }

  const arrowMargin = 10;
  const arrowOffset =
    resolvedSide === "top" || resolvedSide === "bottom"
      ? clamp(
          triggerCenterX - x,
          arrowMargin,
          Math.max(arrowMargin, tooltip.width - arrowMargin),
        )
      : clamp(
          triggerCenterY - y,
          arrowMargin,
          Math.max(arrowMargin, tooltip.height - arrowMargin),
        );

  return { x, y, side: resolvedSide, arrowOffset };
}

interface TooltipLayerProps extends TooltipContentProps {
  contentId: string;
  triggerElement: HTMLElement;
  dismiss: () => void;
}

interface TooltipPositionOptions {
  side: TooltipSide;
  align: TooltipAlign;
  sideOffset: number;
  collisionPadding: number;
  avoidCollisions: boolean;
}

function useTooltipPosition(
  triggerElement: HTMLElement | null,
  floatingRef: { current: HTMLDivElement | null },
  {
    side,
    align,
    sideOffset,
    collisionPadding,
    avoidCollisions,
  }: TooltipPositionOptions,
): TooltipPosition | null {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useLayoutEffect(() => {
    const floating = floatingRef.current;

    if (!floating || !triggerElement) {
      return;
    }

    const updatePosition = () => {
      const triggerRect = triggerElement.getBoundingClientRect();
      const tooltipRect = floating.getBoundingClientRect();

      setPosition(
        calculateTooltipPosition({
          trigger: triggerRect,
          tooltip: tooltipRect,
          side,
          align,
          sideOffset,
          collisionPadding,
          avoidCollisions,
          viewportWidth:
            window.innerWidth || document.documentElement.clientWidth,
          viewportHeight:
            window.innerHeight || document.documentElement.clientHeight,
        }),
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePosition);
    resizeObserver?.observe(triggerElement);
    resizeObserver?.observe(floating);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [
    align,
    avoidCollisions,
    collisionPadding,
    floatingRef,
    side,
    sideOffset,
    triggerElement,
  ]);

  return position;
}

function useTooltipDismissBehavior(
  triggerElement: HTMLElement,
  floatingRef: { current: HTMLDivElement | null },
  dismiss: () => void,
) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        triggerElement.contains(target) ||
        floatingRef.current?.contains(target)
      ) {
        return;
      }

      dismiss();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        dismiss();
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target;

      if (
        event.key !== "Escape" ||
        (target instanceof Node && triggerElement.contains(target))
      ) {
        return;
      }

      dismiss();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("blur", dismiss);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("blur", dismiss);
    };
  }, [dismiss, floatingRef, triggerElement]);
}

function transformOriginForSide(
  side: TooltipSide | undefined,
): CSSProperties["transformOrigin"] {
  switch (side) {
    case "top":
      return "center bottom";
    case "bottom":
      return "center top";
    case "left":
      return "right center";
    case "right":
      return "left center";
    default:
      return "center";
  }
}

function TooltipLayer({
  contentId,
  triggerElement,
  dismiss,
  children,
  className,
  style,
  side = "top",
  align = "center",
  sideOffset = 8,
  collisionPadding = 8,
  avoidCollisions = true,
  ...rest
}: TooltipLayerProps): ReactElement {
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

  const transformOrigin = transformOriginForSide(position?.side ?? side);
  const wrapperStyle = {
    ...style,
    left: position ? `${position.x}px` : 0,
    top: position ? `${position.y}px` : 0,
    visibility: position ? "visible" : "hidden",
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={floatingRef}
      id={contentId}
      role="tooltip"
      data-side={position?.side ?? side}
      data-align={align}
      data-state={isPresent ? "open" : "closed"}
      aria-hidden={isPresent ? undefined : true}
      className={cx("uk-tooltip", className)}
      style={wrapperStyle}
    >
      <motion.div
        className="uk-tooltip__surface"
        style={{ transformOrigin }}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        transition={
          reduceMotion ? REDUCED_MOTION_TRANSITION : TOOLTIP_TRANSITION
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
        {children}
      </motion.div>
    </div>
  );
}

/** Portal 并管理 Tooltip 的测量、定位、presence 与退出生命周期。 */
function TooltipContent(props: TooltipContentProps): ReactElement | null {
  const context = useTooltipContext("Tooltip.Content");
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );
  const portalContainer =
    isClient && context.triggerElement
      ? (context.triggerElement.closest<HTMLElement>("dialog") ?? document.body)
      : null;

  if (!portalContainer || !context.triggerElement) {
    return null;
  }

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {context.open ? (
          <TooltipLayer
            key="uk-tooltip"
            contentId={context.contentId}
            triggerElement={context.triggerElement}
            dismiss={context.dismiss}
            {...props}
          />
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    portalContainer,
  );
}

interface RegisteredTooltipItem {
  triggerElement: HTMLElement;
  content: ReactNode;
}

interface TooltipGroupContextValue {
  open: boolean;
  activeValue: string | null;
  contentId: string;
  activate: (value: string, immediate?: boolean) => void;
  requestClose: () => void;
  dismiss: () => void;
  register: (
    value: string,
    triggerElement: HTMLElement,
    content: ReactNode,
  ) => void;
  unregister: (value: string) => void;
}

const TooltipGroupContext = createContext<TooltipGroupContextValue | null>(
  null,
);

function useTooltipGroupContext(component: string): TooltipGroupContextValue {
  const context = useContext(TooltipGroupContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tooltip.Group>`);
  }

  return context;
}

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

export interface TooltipItemProps {
  /** 组内唯一值，用于切换共享 Tooltip。 */
  value: string;
  /** 该项激活时显示在共享 Tooltip 中的内容。 */
  content: ReactNode;
  /** 单个可聚焦交互元素。 */
  children: ReactElement;
}

interface TooltipGroupLayerProps extends TooltipPositionOptions {
  activeValue: string;
  content: ReactNode;
  contentClassName?: string;
  contentId: string;
  dismiss: () => void;
  triggerElement: HTMLElement;
}

function TooltipGroupLayer({
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
function TooltipGroup({
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

/** 注册组内触发器与内容，但不改变触发器的 DOM 结构或交互语义。 */
function TooltipItem({
  value,
  content,
  children,
}: TooltipItemProps): ReactElement {
  const context = useTooltipGroupContext("Tooltip.Item");
  const { register, unregister } = context;
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(
    null,
  );

  if (!isValidElement(children)) {
    throw new Error("<Tooltip.Item> expects a single valid React element");
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const childRef =
    (childProps.ref as Ref<HTMLElement> | undefined) ??
    (child as unknown as { ref?: Ref<HTMLElement> }).ref;
  const childPointerEnter = childProps.onPointerEnter as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const childPointerLeave = childProps.onPointerLeave as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const childFocus = childProps.onFocus as
    | ((event: FocusEvent<HTMLElement>) => void)
    | undefined;
  const childBlur = childProps.onBlur as
    | ((event: FocusEvent<HTMLElement>) => void)
    | undefined;
  const childKeyDown = childProps.onKeyDown as
    | ((event: KeyboardEvent<HTMLElement>) => void)
    | undefined;
  const active = context.open && context.activeValue === value;
  const setTriggerRef = useCallback(
    (element: HTMLElement | null) => {
      setRef(childRef, element);
      setTriggerElement(element);
    },
    [childRef, setTriggerElement],
  );

  useLayoutEffect(() => {
    if (!triggerElement) {
      return;
    }

    register(value, triggerElement, content);
    return () => unregister(value);
  }, [content, register, triggerElement, unregister, value]);

  return cloneElement(child, {
    ref: setTriggerRef,
    "aria-describedby": active
      ? appendDescription(childProps["aria-describedby"], context.contentId)
      : childProps["aria-describedby"],
    onPointerEnter: composeHandler(childPointerEnter, (event) => {
      context.activate(value, event.pointerType === "touch");
    }),
    onPointerLeave: composeHandler(childPointerLeave, (event) => {
      if (event.pointerType !== "touch") {
        context.requestClose();
      }
    }),
    onFocus: composeHandler(childFocus, () => {
      context.activate(value);
    }),
    onBlur: composeHandler(childBlur, () => {
      context.requestClose();
    }),
    onKeyDown: composeHandler(childKeyDown, (event) => {
      if (event.key === "Escape" && active) {
        event.preventDefault();
        event.stopPropagation();
        context.dismiss();
      }
    }),
  });
}

export interface TooltipComponent {
  Root: typeof TooltipRoot;
  Trigger: typeof TooltipTrigger;
  Content: typeof TooltipContent;
  Group: typeof TooltipGroup;
  Item: typeof TooltipItem;
}

/**
 * 简短说明性浮层。
 *
 * 组合式 API：单个 Tooltip 使用 Root / Trigger / Content；相邻说明使用
 * Group / Item 共享同一个浮动表面。触发器保留原生语义，Content 只承担
 * role="tooltip"；需要交互或较长内容时应使用可见说明或 Popover。
 */
export const Tooltip: TooltipComponent = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Group: TooltipGroup,
  Item: TooltipItem,
};
