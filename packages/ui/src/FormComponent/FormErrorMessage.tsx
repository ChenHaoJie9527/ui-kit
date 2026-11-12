import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cx } from "../utils/cx";
import { useFieldContext } from "./form-context";

export interface FormErrorMessageProps extends Omit<
  HTMLAttributes<HTMLParagraphElement>,
  "children"
> {
  children?: (error: string) => ReactNode;
}

export const FormErrorMessage = forwardRef<
  HTMLParagraphElement,
  FormErrorMessageProps
>(function FormErrorMessage({ children, className, ...rest }, ref) {
  const fieldContext = useFieldContext("Form.ErrorMessage");
  const error = fieldContext.state.error;

  return (
    <p
      {...rest}
      ref={ref}
      id={fieldContext.errorId}
      role={error ? "alert" : undefined}
      aria-live="polite"
      data-state={error ? "visible" : "hidden"}
      className={cx("uk-form__error", className)}
    >
      {error ? (children ? children(error) : error) : null}
    </p>
  );
});

// ============================================================================
// Form.Actions
// ============================================================================
