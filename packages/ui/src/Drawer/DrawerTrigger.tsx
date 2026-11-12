import { cloneElement, type MouseEvent, type ReactElement } from "react";

import { useDrawerContext } from "./drawer-context";
import { composeHandler } from "./drawer-context";

export interface DrawerTriggerProps {
  children: ReactElement;
}

/** 包装一个交互元素，同步 Drawer 的状态与 ARIA 关联。 */

export function DrawerTrigger({ children }: DrawerTriggerProps): ReactElement {
  const context = useDrawerContext("Drawer.Trigger");
  const child = children as ReactElement<Record<string, unknown>>;
  const childOnClick = child.props.onClick as
    | ((event: MouseEvent<HTMLElement>) => void)
    | undefined;

  return cloneElement(child, {
    id: context.triggerId,
    "aria-haspopup": "dialog",
    "aria-expanded": context.open,
    "aria-controls": context.open ? context.contentId : undefined,
    onClick: composeHandler(childOnClick, () => {
      context.setOpen(!context.open);
    }),
  });
}
