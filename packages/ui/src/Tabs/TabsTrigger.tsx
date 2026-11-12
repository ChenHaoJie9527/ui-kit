import {
  forwardRef,
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
  children?: ReactNode;
}

export const TabsTrigger: ForwardRefExoticComponent<
  TabsTriggerProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, type = "button", className, onClick, children, ...rest },
  ref,
) {
  const context = useTabsContext("Tabs.Trigger");
  const selected = context.value === value;
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      role="tab"
      id={tabId(context.baseId, value)}
      aria-selected={selected}
      aria-controls={panelId(context.baseId, value)}
      tabIndex={selected ? 0 : -1}
      data-state={selected ? "active" : "inactive"}
      className={cx("uk-tabs__trigger", className)}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          context.setValue(value);
        }
      }}
    >
      {children}
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
