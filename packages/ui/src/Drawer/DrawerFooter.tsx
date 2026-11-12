import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";

export type DrawerFooterProps = HTMLAttributes<HTMLElement>;

export const DrawerFooter: ForwardRefExoticComponent<
  DrawerFooterProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DrawerFooterProps>(function DrawerFooter(
  { className, ...rest },
  ref,
) {
  return (
    <footer
      {...rest}
      ref={ref}
      className={cx("uk-drawer__footer", className)}
    />
  );
});
