import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";
import { motion, useReducedMotion } from "motion/react";

import { INDICATOR_SPRING } from "../motion";
import { cx } from "../utils/cx";
import { panelId, tabId, useTabsContext } from "./tabs-context";

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  /** 渲染关闭控件；点击或按 Delete / Backspace 时触发。 */
  onClose?: () => void;
  children?: ReactNode;
}

export const TabsTrigger: ForwardRefExoticComponent<
  TabsTriggerProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  {
    value,
    type = "button",
    "aria-keyshortcuts": ariaKeyshortcuts,
    className,
    onClick,
    onKeyDown,
    onClose,
    children,
    ...rest
  },
  ref,
) {
  const context = useTabsContext("Tabs.Trigger");
  const selected = context.value === value;
  const reduceMotion = useReducedMotion() ?? false;
  const triggerRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => triggerRef.current!, []);

  useLayoutEffect(() => {
    if (!selected) {
      return;
    }

    const trigger = triggerRef.current;
    const list = trigger?.closest<HTMLElement>('[role="tablist"]');

    if (!trigger || !list || list.scrollWidth <= list.clientWidth) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();

    if (triggerRect.left < listRect.left) {
      list.scrollLeft += triggerRect.left - listRect.left;
    } else if (triggerRect.right > listRect.right) {
      list.scrollLeft += triggerRect.right - listRect.right;
    }
  }, [selected]);

  const requestClose = (trigger: HTMLButtonElement) => {
    if (!onClose || trigger.disabled) {
      return;
    }

    const list = trigger.closest<HTMLElement>('[role="tablist"]');
    const triggers = list
      ? Array.from(
          list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
        )
      : [];
    const index = triggers.indexOf(trigger);
    const fallback = triggers[index + 1] ?? triggers[index - 1];

    onClose();

    // Only update selection and focus after the consumer has committed the
    // removal. A close request may be cancelled or used to open a confirmation.
    queueMicrotask(() => {
      if (trigger.isConnected) {
        return;
      }

      if (selected) {
        context.setValue(fallback?.dataset.value ?? "");
      }

      if (
        fallback &&
        fallback.isConnected &&
        (!document.activeElement || document.activeElement === document.body)
      ) {
        fallback.focus();
      }
    });
  };

  return (
    <button
      {...rest}
      ref={triggerRef}
      type={type}
      role="tab"
      id={tabId(context.baseId, value)}
      aria-selected={selected}
      aria-controls={panelId(context.baseId, value)}
      aria-keyshortcuts={onClose ? "Delete Backspace" : ariaKeyshortcuts}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      data-state={selected ? "active" : "inactive"}
      data-closable={onClose ? "true" : undefined}
      className={cx("uk-tabs__trigger", className)}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          context.setValue(value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        if (
          event.defaultPrevented ||
          !onClose ||
          (event.key !== "Delete" && event.key !== "Backspace")
        ) {
          return;
        }

        event.preventDefault();
        requestClose(event.currentTarget);
      }}
    >
      <span className="uk-tabs__label">{children}</span>
      {onClose ? (
        <span
          className="uk-tabs__close"
          aria-hidden="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            const trigger =
              event.currentTarget.closest<HTMLButtonElement>('[role="tab"]');

            if (trigger) {
              requestClose(trigger);
            }
          }}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
            <path
              d="m4 4 8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.6"
            />
          </svg>
        </span>
      ) : null}
      {selected ? (
        <motion.span
          className="uk-tabs__indicator"
          layoutId={context.indicatorId}
          aria-hidden="true"
          transition={reduceMotion ? { duration: 0 } : INDICATOR_SPRING}
        />
      ) : null}
    </button>
  );
});
