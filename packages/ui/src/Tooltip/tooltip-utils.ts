import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type Ref,
} from "react";

import type { TooltipAlign, TooltipSide } from "./TooltipRoot";

export function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as { current: T | null }).current = value;
  }
}

export function appendDescription(existing: unknown, id: string): string {
  const ids =
    typeof existing === "string" ? existing.split(/\s+/).filter(Boolean) : [];

  return Array.from(new Set([...ids, id])).join(" ");
}

export function composeHandler<T extends { defaultPrevented: boolean }>(
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

export interface Rectangle {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipPosition {
  x: number;
  y: number;
  side: TooltipSide;
  arrowOffset: number;
}

export function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function oppositeSide(side: TooltipSide): TooltipSide {
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

export function mainAxisRoom(
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

export function fitsOnSide(
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

export interface TooltipPositionOptions {
  side: TooltipSide;
  align: TooltipAlign;
  sideOffset: number;
  collisionPadding: number;
  avoidCollisions: boolean;
}

export function useTooltipPosition(
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

export function useTooltipDismissBehavior(
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

export function transformOriginForSide(
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
