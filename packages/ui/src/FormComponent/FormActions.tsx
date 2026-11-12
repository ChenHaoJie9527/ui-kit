import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cx } from "../utils/cx";

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  function FormActions({ children, className, ...rest }, ref) {
    return (
      <div {...rest} ref={ref} className={cx("uk-form__actions", className)}>
        {children}
      </div>
    );
  },
);

// ============================================================================
// Export
// ============================================================================
