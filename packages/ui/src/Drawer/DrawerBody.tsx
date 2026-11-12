import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";

export type DrawerBodyProps = HTMLAttributes<HTMLDivElement>;

export const DrawerBody: ForwardRefExoticComponent<
  DrawerBodyProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DrawerBodyProps>(function DrawerBody(
  { className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx("uk-drawer__body", className)} />
  );
});
