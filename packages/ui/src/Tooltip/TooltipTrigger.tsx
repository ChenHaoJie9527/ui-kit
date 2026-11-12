import {
  isValidElement,
  cloneElement,
  useCallback,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type Ref,
} from "react";

import { useTooltipContext } from "./tooltip-context";
import { appendDescription, composeHandler, setRef } from "./tooltip-utils";

export interface TooltipTriggerProps {
  /** 单个可聚焦的交互元素；事件和 ref 会与调用方传入的值合并。 */
  children: ReactElement;
}

export function TooltipTrigger({
  children,
}: TooltipTriggerProps): ReactElement {
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
