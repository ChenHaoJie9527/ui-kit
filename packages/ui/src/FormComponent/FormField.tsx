import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { cx } from "../utils/cx";
import { FieldContext, useFormContext } from "./form-context";
import { FormLabel } from "./FormLabel";
import type { FieldRule } from "./FormRoot";

export interface FormFieldProps<T = unknown> {
  name: string;
  defaultValue?: T;
  rules?: FieldRule<T>[];
  transform?: (value: T) => T;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  preserveOnUnmount?: boolean;
  dependencies?: string[];
  children: ReactNode;
  className?: string;
}

export function FormField({
  name,
  defaultValue,
  rules,
  transform,
  disabled = false,
  readOnly = false,
  hidden = false,
  preserveOnUnmount = false,
  dependencies,
  children,
  className,
}: FormFieldProps): ReactElement | null {
  const formContext = useFormContext();
  const baseId = useId();
  const fieldId = `${baseId}-field`;
  const labelId = `${baseId}-label`;
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const [hasDescription, setHasDescription] = useState(false);
  const hasLabel = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === FormLabel,
  );

  const { registerField, unregisterField } = formContext;

  useEffect(() => {
    registerField(name, {
      rules,
      transform,
      dependencies,
      preserveOnUnmount,
      defaultValue,
      disabled,
      readOnly,
      hidden,
    });
  }, [
    name,
    rules,
    transform,
    dependencies,
    preserveOnUnmount,
    disabled,
    readOnly,
    hidden,
    defaultValue,
    registerField,
  ]);

  useEffect(() => {
    return () => unregisterField(name);
  }, [name, unregisterField]);

  const fieldState = formContext.getFieldState(name);

  const contextValue = useMemo(
    () => ({
      name,
      fieldId,
      labelId,
      descriptionId,
      errorId,
      state: fieldState,
      hasLabel,
      hasDescription,
      setHasDescription,
    }),
    [
      name,
      fieldId,
      labelId,
      descriptionId,
      errorId,
      fieldState,
      hasLabel,
      hasDescription,
    ],
  );

  if (hidden) return null;

  return (
    <FieldContext.Provider value={contextValue}>
      <div
        className={cx("uk-form__field", className)}
        data-disabled={disabled ? "true" : undefined}
        data-readonly={readOnly ? "true" : undefined}
        data-invalid={fieldState.invalid ? "true" : undefined}
        data-validating={fieldState.validating ? "true" : undefined}
        data-dirty={fieldState.dirty ? "true" : undefined}
        onPointerLeave={() => {
          formContext.handleFieldInteraction(name, "pointerleave");
        }}
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}

// ============================================================================
// Form.Label
// ============================================================================
