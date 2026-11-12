import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type ReactNode,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";
import { useTabsContext } from "./tabs-context";

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const TabsList: ForwardRefExoticComponent<
  TabsListProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, onKeyDown, ...rest },
  ref,
) {
  const { orientation } = useTabsContext("Tabs.List");

  return (
    <div
      {...rest}
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      tabIndex={-1}
      className={cx("uk-tabs__list", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        const target = event.target as HTMLElement | null;
        const trigger = target?.closest<HTMLElement>('[role="tab"]');

        if (!trigger || trigger.hasAttribute("disabled")) {
          return;
        }

        const triggers = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[role="tab"]:not([disabled])',
          ),
        );
        const index = triggers.indexOf(trigger);

        if (index === -1) {
          return;
        }

        const nextKey =
          orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
        const previousKey =
          orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

        let nextIndex = -1;

        switch (event.key) {
          case nextKey:
            nextIndex = (index + 1) % triggers.length;
            break;
          case previousKey:
            nextIndex = (index - 1 + triggers.length) % triggers.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = triggers.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();

        const nextTrigger = triggers[nextIndex];

        if (nextTrigger) {
          nextTrigger.focus();
          nextTrigger.click();
        }
      }}
    />
  );
});
