import { createContext, useContext } from "react";

import { getNestedValue } from "./form-utils";
import type {
  FieldRule,
  FieldState,
  FormState,
  FormValidationTrigger,
} from "./FormRoot";

export interface FormContextValue<T = Record<string, unknown>> {
  values: T;
  state: FormState;
  getFieldState: (name: string) => FieldState;
  setValue: (
    name: string,
    value: unknown,
    options?: { validate?: boolean; touch?: boolean },
  ) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  setFieldFocused: (name: string, focused: boolean) => void;
  handleFieldInteraction: (
    name: string,
    trigger: Exclude<FormValidationTrigger, "submit">,
  ) => void;
  registerField: (name: string, config: FieldConfig) => void;
  unregisterField: (name: string) => void;
  validateField: (name: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  submit: () => Promise<void>;
  reset: (values?: Partial<T>) => void;
  clear: () => void;
  setError: (name: string, error: string) => void;
  setFormError: (error: string | null) => void;
  clearErrors: (fields?: string[]) => void;
  focusFirstError: () => void;
  validateOn: FormValidationTrigger;
  revalidateOn: Exclude<FormValidationTrigger, "submit">;
  validateDebounce: number;
}

export interface FieldConfig {
  rules?: FieldRule[];
  transform?: (value: unknown) => unknown;
  dependencies?: string[];
  preserveOnUnmount?: boolean;
  defaultValue?: unknown;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
}

export const FormContext = createContext<FormContextValue | null>(null);
export const FieldContext = createContext<{
  name: string;
  fieldId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  state: FieldState;
  hasLabel: boolean;
  hasDescription: boolean;
  setHasDescription: (has: boolean) => void;
} | null>(null);

export function useFormContext<
  T = Record<string, unknown>,
>(): FormContextValue<T> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within Form.Root");
  }
  return context as FormContextValue<T>;
}

export function useFieldState(name: string): FieldState {
  const context = useFormContext();
  return context.getFieldState(name);
}

export function useWatch<T = unknown>(name: string | string[]): T {
  const context = useFormContext();
  const names = Array.isArray(name) ? name : [name];
  const values = names.map((n) => getNestedValue(context.values, n));

  if (Array.isArray(name)) {
    return values as T;
  }
  return values[0] as T;
}

export function useFieldContext(component: string) {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Form.Field>`);
  }
  return context;
}

// ============================================================================
// Utility functions
// ============================================================================
