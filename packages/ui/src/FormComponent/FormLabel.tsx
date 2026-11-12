import { forwardRef, type LabelHTMLAttributes, type ReactNode } from "react";

import { cx } from "../utils/cx";
import { useFieldContext } from "./form-context";

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  labelWrap?: boolean;
  children: ReactNode;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  function FormLabel(
    { required, labelWrap = false, children, className, ...rest },
    ref,
  ) {
    const fieldContext = useFieldContext("Form.Label");

    return (
      <label
        {...rest}
        ref={ref}
        id={fieldContext.labelId}
        htmlFor={fieldContext.fieldId}
        className={cx("uk-form__label", className)}
        data-wrap={labelWrap ? "true" : undefined}
      >
        {children}
        {required || fieldContext.state.required ? (
          <span className="uk-form__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
    );
  },
);

// ============================================================================
// Form.Control
// ============================================================================
