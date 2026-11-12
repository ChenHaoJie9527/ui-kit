import { cloneElement, type MouseEvent, type ReactElement } from "react";

import { useDialogContext } from "./dialog-context";
import { composeHandler } from "./dialog-context";

export interface DialogTriggerProps {
  children: ReactElement;
}

export function DialogTrigger({ children }: DialogTriggerProps): ReactElement {
  const context = useDialogContext("Dialog.Trigger");
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
