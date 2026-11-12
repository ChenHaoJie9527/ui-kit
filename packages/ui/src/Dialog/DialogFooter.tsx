import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";

export type DialogFooterProps = HTMLAttributes<HTMLElement>;

export const DialogFooter: ForwardRefExoticComponent<
  DialogFooterProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DialogFooterProps>(function DialogFooter(
  { className, ...rest },
  ref,
) {
  return (
    <footer
      {...rest}
      ref={ref}
      className={cx("uk-dialog__footer", className)}
    />
  );
});
