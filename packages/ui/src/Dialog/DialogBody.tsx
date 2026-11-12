import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";

export type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

export const DialogBody: ForwardRefExoticComponent<
  DialogBodyProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody(
  { className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx("uk-dialog__body", className)} />
  );
});
