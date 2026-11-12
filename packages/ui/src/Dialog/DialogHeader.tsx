import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";

export type DialogHeaderProps = HTMLAttributes<HTMLElement>;

export const DialogHeader: ForwardRefExoticComponent<
  DialogHeaderProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DialogHeaderProps>(function DialogHeader(
  { className, ...rest },
  ref,
) {
  return (
    <header
      {...rest}
      ref={ref}
      className={cx("uk-dialog__header", className)}
    />
  );
});
