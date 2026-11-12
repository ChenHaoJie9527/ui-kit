import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type ReactNode,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";
import { panelId, tabId, useTabsContext } from "./tabs-context";

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children?: ReactNode;
}

export const TabsContent: ForwardRefExoticComponent<
  TabsContentProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, className, ...rest },
  ref,
) {
  const context = useTabsContext("Tabs.Content");
  const selected = context.value === value;

  return (
    <div
      {...rest}
      ref={ref}
      role="tabpanel"
      id={panelId(context.baseId, value)}
      aria-labelledby={tabId(context.baseId, value)}
      hidden={!selected}
      tabIndex={0}
      data-state={selected ? "active" : "inactive"}
      className={cx("uk-tabs__panel", className)}
    />
  );
});
