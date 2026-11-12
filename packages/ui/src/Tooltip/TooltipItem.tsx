import {
  cloneElement,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { useTooltipGroupContext } from "./tooltip-context";
import { appendDescription, composeHandler, setRef } from "./tooltip-utils";

export interface TooltipItemProps {
  /** 组内唯一值，用于切换共享 Tooltip。 */
  value: string;
  /** 该项激活时显示在共享 Tooltip 中的内容。 */
  content: ReactNode;
  /** 单个可聚焦交互元素。 */
  children: ReactElement;
}

export function TooltipItem({
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
