import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";

export type DrawerHeaderProps = HTMLAttributes<HTMLElement>;

export const DrawerHeader: ForwardRefExoticComponent<
  DrawerHeaderProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DrawerHeaderProps>(function DrawerHeader(
  { className, ...rest },
  ref,
) {
  return (
    <header
      {...rest}
      ref={ref}
      className={cx("uk-drawer__header", className)}
    />
  );
});
