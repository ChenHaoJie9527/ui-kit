import {
  forwardRef,
  useEffect,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cx } from "../utils/cx";
import { useDialogContext } from "./dialog-context";

export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const DialogDescription: ForwardRefExoticComponent<
  DialogDescriptionProps & RefAttributes<HTMLParagraphElement>
> = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...rest }, ref) {
    const context = useDialogContext("Dialog.Description");
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
        className={cx("uk-dialog__description", className)}
      />
    );
  },
);
