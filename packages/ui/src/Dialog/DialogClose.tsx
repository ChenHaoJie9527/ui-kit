import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
} from "react";

import { Button } from "../Button";
import { useDialogContext } from "./dialog-context";
import { composeHandler } from "./dialog-context";

export interface DialogCloseProps {
  children?: ReactElement;
  label?: string;
}

export function DialogClose({
  children,
  label = "Close",
}: DialogCloseProps): ReactElement {
  const context = useDialogContext("Dialog.Close");

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
