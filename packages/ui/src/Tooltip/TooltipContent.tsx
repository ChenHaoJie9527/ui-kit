import {
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";

import { REDUCED_MOTION_TRANSITION, TOOLTIP_TRANSITION } from "../motion";
import { cx } from "../utils/cx";
import { useTooltipContext } from "./tooltip-context";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNothing,
} from "./tooltip-context";
import type { TooltipAlign, TooltipSide } from "./TooltipRoot";
import {
  transformOriginForSide,
  useTooltipDismissBehavior,
  useTooltipPosition,
} from "./tooltip-utils";

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

export interface TooltipLayerProps extends TooltipContentProps {
  contentId: string;
  triggerElement: HTMLElement;
  dismiss: () => void;
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

export function TooltipContent(
  props: TooltipContentProps,
): ReactElement | null {
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
