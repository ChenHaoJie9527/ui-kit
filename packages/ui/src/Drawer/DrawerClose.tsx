import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
} from "react";

import { Button } from "../Button";
import { useDrawerContext } from "./drawer-context";
import { composeHandler } from "./drawer-context";

export interface DrawerCloseProps {
  children?: ReactElement;
  label?: string;
}

export function DrawerClose({
  children,
  label = "Close",
}: DrawerCloseProps): ReactElement {
  const context = useDrawerContext("Drawer.Close");

  if (isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    const childOnClick = child.props.onClick as
      | ((event: MouseEvent<HTMLElement>) => void)
      | undefined;

    return cloneElement(child, {
      onClick: composeHandler(childOnClick, () => {
        context.setOpen(false);
      }),
    });
  }

  return (
    <Button variant="ghost" onClick={() => context.setOpen(false)}>
      {label}
    </Button>
  );
}
