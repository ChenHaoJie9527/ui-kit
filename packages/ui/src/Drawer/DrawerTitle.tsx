import {
  forwardRef,
  useEffect,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";
import { useDrawerContext } from "./drawer-context";

export type DrawerTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const DrawerTitle: ForwardRefExoticComponent<
  DrawerTitleProps & RefAttributes<HTMLHeadingElement>
> = forwardRef<HTMLHeadingElement, DrawerTitleProps>(function DrawerTitle(
  { className, children, ...rest },
  ref,
) {
  const context = useDrawerContext("Drawer.Title");
  const setHasTitle = context.setHasTitle;

  useEffect(() => {
    setHasTitle(true);
    return () => setHasTitle(false);
  }, [setHasTitle]);

  return (
    <h2
      {...rest}
      ref={ref}
      id={context.titleId}
      className={cx("uk-drawer__title", className)}
    >
      {children}
    </h2>
  );
});
