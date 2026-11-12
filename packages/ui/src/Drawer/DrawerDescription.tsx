import {
  forwardRef,
  useEffect,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";
import { useDrawerContext } from "./drawer-context";

export type DrawerDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const DrawerDescription: ForwardRefExoticComponent<
  DrawerDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  function DrawerDescription({ className, ...rest }, ref) {
    const context = useDrawerContext("Drawer.Description");
    const setHasDescription = context.setHasDescription;

    useEffect(() => {
      setHasDescription(true);
      return () => setHasDescription(false);
    }, [setHasDescription]);

    return (
      <p
        {...rest}
        ref={ref}
        id={context.descriptionId}
        className={cx("uk-drawer__description", className)}
      />
    );
  },
);
