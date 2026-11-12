import {
  forwardRef,
  useEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cx } from "../utils/cx";
import { useFieldContext } from "./form-context";

export interface FormDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const FormDescription = forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(function FormDescription({ children, className, ...rest }, ref) {
  const fieldContext = useFieldContext("Form.Description");
  const { setHasDescription } = fieldContext;

  useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  return (
    <p
      {...rest}
      ref={ref}
      id={fieldContext.descriptionId}
      className={cx("uk-form__description", className)}
    >
      {children}
    </p>
  );
});

// ============================================================================
// Form.ErrorMessage
// ============================================================================
