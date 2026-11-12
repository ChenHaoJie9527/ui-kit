import {
  forwardRef,
  useEffect,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";
import { useDialogContext } from "./dialog-context";

export type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const DialogTitle: ForwardRefExoticComponent<
  DialogTitleProps & RefAttributes<HTMLHeadingElement>
> = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, children, ...rest },
  ref,
) {
  const context = useDialogContext("Dialog.Title");
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
      className={cx("uk-dialog__title", className)}
    >
      {children}
    </h2>
  );
});
