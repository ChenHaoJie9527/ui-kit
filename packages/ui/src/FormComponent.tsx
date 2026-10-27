import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormHTMLAttributes,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from "react";
import { useControllableState, useEventCallback } from "seam-hooks";
import { cx } from "./utils/cx";

// ============================================================================
// Types
// ============================================================================

export type FormErrors<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  [K in keyof T]?: string;
} & Record<string, string | undefined>;

export type FieldRule<T = unknown> =
  | { required: boolean; message?: string }
  | { minLength: number; message?: string }
  | { maxLength: number; message?: string }
  | { pattern: RegExp; message?: string }
  | { min: number; message?: string }
  | { max: number; message?: string }
  | { enum: T[]; message?: string }
  | {
      validator: (
        value: T,
        values: Record<string, unknown>,
      ) => string | null | Promise<string | null>;
    };

export interface FieldState {
  value: unknown;
  initialValue: unknown;
  dirty: boolean;
  touched: boolean;
  focused: boolean;
  validating: boolean;
  invalid: boolean;
  valid: boolean;
  disabled: boolean;
  readOnly: boolean;
  hidden: boolean;
  error?: string;
}

export interface FormState {
  submitting: boolean;
  submitted: boolean;
  submitSucceeded: boolean;
  submitFailed: boolean;
  dirty: boolean;
  validating: boolean;
  errors: Record<string, string>;
  formError: string | null;
}

export interface FormRef<T = Record<string, unknown>> {
  getValues: () => T;
  getValue: (name: string) => unknown;
  setValue: (
    name: string,
    value: unknown,
    options?: { validate?: boolean; touch?: boolean },
  ) => void;
  setValues: (values: Partial<T>, options?: { validate?: boolean }) => void;
  reset: (values?: Partial<T>) => void;
  clear: () => void;
  validate: (fields?: string[]) => Promise<boolean>;
  setError: (name: string, error: string) => void;
  setFormError: (error: string | null) => void;
  clearErrors: (fields?: string[]) => void;
  focusFirstError: () => void;
}

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
  validateOn: "submit" | "blur" | "change";
  revalidateOn: "change" | "blur";
  validateDebounce: number;
}

interface FieldConfig {
  rules?: FieldRule[];
  transform?: (value: unknown) => unknown;
  dependencies?: string[];
  preserveOnUnmount?: boolean;
}

export interface FormRootProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange"> {
  values?: T;
  defaultValues?: Partial<T>;
  onValuesChange?: (values: T, changedField: keyof T) => void;
  onSubmit?: (values: T) => void | Promise<void>;
  onSubmitFailed?: (errors: FormErrors<T>) => void;
  validateOn?: "submit" | "blur" | "change";
  revalidateOn?: "change" | "blur";
  validateDebounce?: number;
  noValidate?: boolean;
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>;
  children: ReactNode;
}

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

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: ReactNode;
}

export interface FormControlProps {
  children: ReactElement;
}

export interface FormDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export interface FormErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: (error: string) => ReactNode;
}

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const FormContext = createContext<FormContextValue | null>(null);
const FieldContext = createContext<{
  name: string;
  fieldId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  state: FieldState;
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
  const values = names.map((n) => context.values[n]);

  if (Array.isArray(name)) {
    return values as T;
  }
  return values[0] as T;
}

function useFieldContext(component: string) {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Form.Field>`);
  }
  return context;
}

// ============================================================================
// Utility functions
// ============================================================================

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = path.split(".");
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...((current[key] as Record<string, unknown>) || {}) };
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

async function validateFieldRules(
  value: unknown,
  rules: FieldRule[],
  values: Record<string, unknown>,
): Promise<string | null> {
  for (const rule of rules) {
    if ("required" in rule && rule.required) {
      if (isEmpty(value)) {
        return rule.message ?? "This field is required";
      }
    }

    if ("minLength" in rule && typeof value === "string") {
      if (value.length < rule.minLength) {
        return rule.message ?? `Must be at least ${rule.minLength} characters`;
      }
    }

    if ("maxLength" in rule && typeof value === "string") {
      if (value.length > rule.maxLength) {
        return rule.message ?? `Must be at most ${rule.maxLength} characters`;
      }
    }

    if ("pattern" in rule && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return rule.message ?? "Invalid format";
      }
    }

    if ("min" in rule && typeof value === "number") {
      if (value < rule.min) {
        return rule.message ?? `Must be at least ${rule.min}`;
      }
    }

    if ("max" in rule && typeof value === "number") {
      if (value > rule.max) {
        return rule.message ?? `Must be at most ${rule.max}`;
      }
    }

    if ("enum" in rule) {
      if (!rule.enum.includes(value)) {
        return rule.message ?? "Invalid value";
      }
    }

    if ("validator" in rule) {
      const result = await rule.validator(value, values);
      if (result) return result;
    }
  }

  return null;
}

// ============================================================================
// Form.Root
// ============================================================================

const FormRoot = forwardRef<FormRef, FormRootProps>(function FormRoot(
  {
    values: controlledValues,
    defaultValues = {},
    onValuesChange,
    onSubmit,
    onSubmitFailed,
    validateOn = "blur",
    revalidateOn = "change",
    validateDebounce = 300,
    noValidate = true,
    validate,
    children,
    className,
    ...rest
  },
  ref,
) {
  const [values, setValuesState] = useControllableState<
    Record<string, unknown>
  >({
    value: controlledValues,
    defaultValue: defaultValues as Record<string, unknown>,
    onChange: onValuesChange as (values: Record<string, unknown>) => void,
  });

  const [formState, setFormState] = useState<FormState>({
    submitting: false,
    submitted: false,
    submitSucceeded: false,
    submitFailed: false,
    dirty: false,
    validating: false,
    errors: {},
    formError: null,
  });

  const fieldsRef = useRef<Map<string, FieldConfig>>(new Map());
  const fieldStatesRef = useRef<
    Map<
      string,
      {
        initialValue: unknown;
        touched: boolean;
        focused: boolean;
        validating: boolean;
        disabled: boolean;
        readOnly: boolean;
        hidden: boolean;
      }
    >
  >(new Map());
  const validationTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const validationAbortRef = useRef<Map<string, AbortController>>(new Map());
  const submitAbortRef = useRef<AbortController | null>(null);
  const formElementRef = useRef<HTMLFormElement>(null);

  const getFieldState = useCallback(
    (name: string): FieldState => {
      const value = getNestedValue(values, name);
      const fieldMeta = fieldStatesRef.current.get(name);
      const initialValue = fieldMeta?.initialValue;
      const error = formState.errors[name];

      return {
        value,
        initialValue,
        dirty: !deepEqual(value, initialValue),
        touched: fieldMeta?.touched ?? false,
        focused: fieldMeta?.focused ?? false,
        validating: fieldMeta?.validating ?? false,
        invalid: Boolean(error),
        valid: (fieldMeta?.touched ?? false) && !error,
        disabled: fieldMeta?.disabled ?? false,
        readOnly: fieldMeta?.readOnly ?? false,
        hidden: fieldMeta?.hidden ?? false,
        error,
      };
    },
    [values, formState.errors],
  );

  const setFieldMeta = useCallback(
    (
      name: string,
      updates: Partial<{
        touched: boolean;
        focused: boolean;
        validating: boolean;
      }>,
    ) => {
      const current = fieldStatesRef.current.get(name) ?? {
        initialValue: getNestedValue(values, name),
        touched: false,
        focused: false,
        validating: false,
        disabled: false,
        readOnly: false,
        hidden: false,
      };
      fieldStatesRef.current.set(name, { ...current, ...updates });
      setFormState((prev) => ({ ...prev }));
    },
    [values],
  );

  const setValue = useEventCallback(
    (
      name: string,
      value: unknown,
      options?: { validate?: boolean; touch?: boolean },
    ) => {
      const config = fieldsRef.current.get(name);
      const transformedValue = config?.transform
        ? config.transform(value)
        : value;
      const newValues = setNestedValue(values, name, transformedValue);

      setValuesState(newValues);

      if (options?.touch) {
        setFieldMeta(name, { touched: true });
      }

      const shouldValidate =
        options?.validate ??
        (validateOn === "change" ||
          (revalidateOn === "change" && formState.errors[name]));

      if (shouldValidate) {
        const timer = validationTimersRef.current.get(name);
        if (timer) clearTimeout(timer);

        const hasAsyncRules = config?.rules?.some(
          (rule) =>
            "validator" in rule &&
            rule.validator.constructor.name === "AsyncFunction",
        );

        if (hasAsyncRules && validateDebounce > 0) {
          const newTimer = setTimeout(() => {
            validateField(name);
            validationTimersRef.current.delete(name);
          }, validateDebounce);
          validationTimersRef.current.set(name, newTimer);
        } else {
          validateField(name);
        }
      }

      // Trigger dependent field validation
      fieldsRef.current.forEach((fieldConfig, fieldName) => {
        if (fieldConfig.dependencies?.includes(name)) {
          validateField(fieldName);
        }
      });
    },
  );

  const setValues = useEventCallback(
    (
      newValues: Partial<Record<string, unknown>>,
      options?: { validate?: boolean },
    ) => {
      let updatedValues = { ...values };
      Object.entries(newValues).forEach(([name, value]) => {
        updatedValues = setNestedValue(updatedValues, name, value);
      });
      setValuesState(updatedValues);

      if (options?.validate) {
        Object.keys(newValues).forEach((name) => validateField(name));
      }
    },
  );

  const setFieldTouched = useEventCallback((name: string, touched: boolean) => {
    setFieldMeta(name, { touched });

    if (touched && validateOn === "blur") {
      validateField(name);
    } else if (touched && revalidateOn === "blur" && formState.errors[name]) {
      validateField(name);
    }
  });

  const setFieldFocused = useEventCallback((name: string, focused: boolean) => {
    setFieldMeta(name, { focused });
  });

  const validateField = useEventCallback(
    async (name: string): Promise<boolean> => {
      const config = fieldsRef.current.get(name);
      if (!config?.rules || config.rules.length === 0) return true;

      // Cancel previous validation
      const prevAbort = validationAbortRef.current.get(name);
      if (prevAbort) prevAbort.abort();

      const abortController = new AbortController();
      validationAbortRef.current.set(name, abortController);

      setFieldMeta(name, { validating: true });
      setFormState((prev) => ({ ...prev, validating: true }));

      try {
        const value = getNestedValue(values, name);
        const error = await validateFieldRules(value, config.rules, values);

        if (abortController.signal.aborted) return false;

        setFormState((prev) => {
          const newErrors = { ...prev.errors };
          if (error) {
            newErrors[name] = error;
          } else {
            delete newErrors[name];
          }
          return { ...prev, errors: newErrors };
        });

        return !error;
      } finally {
        if (!abortController.signal.aborted) {
          setFieldMeta(name, { validating: false });
          const anyValidating = Array.from(
            fieldStatesRef.current.values(),
          ).some((meta) => meta.validating);
          setFormState((prev) => ({ ...prev, validating: anyValidating }));
        }
        validationAbortRef.current.delete(name);
      }
    },
  );

  const validateForm = useEventCallback(async (): Promise<boolean> => {
    const fieldNames = Array.from(fieldsRef.current.keys());
    const results = await Promise.all(
      fieldNames.map((name) => validateField(name)),
    );

    let formLevelErrors: FormErrors = {};
    if (validate) {
      formLevelErrors = await validate(values);
    }

    const allErrors = { ...formState.errors };
    Object.entries(formLevelErrors).forEach(([key, value]) => {
      if (value) allErrors[key] = value;
    });

    setFormState((prev) => ({ ...prev, errors: allErrors }));

    const isValid =
      results.every((r) => r) && Object.keys(formLevelErrors).length === 0;
    return isValid;
  });

  const submit = useEventCallback(async () => {
    if (formState.submitting) return;

    // Wait for ongoing validations
    while (formState.validating) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setFormState((prev) => ({ ...prev, submitting: true, submitted: true }));

    const isValid = await validateForm();

    if (!isValid) {
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitFailed: true,
        submitSucceeded: false,
      }));
      onSubmitFailed?.(formState.errors as FormErrors);
      focusFirstError();
      return;
    }

    const abortController = new AbortController();
    submitAbortRef.current = abortController;

    try {
      await onSubmit?.(values as never);

      if (abortController.signal.aborted) return;

      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitSucceeded: true,
        submitFailed: false,
        formError: null,
      }));
    } catch (error) {
      if (abortController.signal.aborted) return;

      const errorMessage =
        error instanceof Error ? error.message : "Submission failed";
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitSucceeded: false,
        submitFailed: true,
        formError: errorMessage,
      }));
    } finally {
      submitAbortRef.current = null;
    }
  });

  const reset = useEventCallback(
    (newValues?: Partial<Record<string, unknown>>) => {
      // Cancel all pending validations
      validationTimersRef.current.forEach((timer) => clearTimeout(timer));
      validationTimersRef.current.clear();
      validationAbortRef.current.forEach((abort) => abort.abort());
      validationAbortRef.current.clear();

      // Cancel submit
      if (submitAbortRef.current) {
        submitAbortRef.current.abort();
        submitAbortRef.current = null;
      }

      const resetValues = (newValues ?? defaultValues) as Record<
        string,
        unknown
      >;
      setValuesState(resetValues);

      fieldStatesRef.current.forEach((meta, name) => {
        fieldStatesRef.current.set(name, {
          ...meta,
          initialValue: getNestedValue(resetValues, name),
          touched: false,
          focused: false,
          validating: false,
        });
      });

      setFormState({
        submitting: false,
        submitted: false,
        submitSucceeded: false,
        submitFailed: false,
        dirty: false,
        validating: false,
        errors: {},
        formError: null,
      });
    },
  );

  const clear = useEventCallback(() => {
    const clearedValues: Record<string, unknown> = {};
    Object.keys(values).forEach((key) => {
      clearedValues[key] = undefined;
    });
    setValuesState(clearedValues);
    setFormState((prev) => ({ ...prev, errors: {}, formError: null }));
  });

  const setError = useEventCallback((name: string, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  });

  const setFormError = useEventCallback((error: string | null) => {
    setFormState((prev) => ({ ...prev, formError: error }));
  });

  const clearErrors = useEventCallback((fields?: string[]) => {
    setFormState((prev) => {
      if (!fields) {
        return { ...prev, errors: {}, formError: null };
      }
      const newErrors = { ...prev.errors };
      fields.forEach((field) => delete newErrors[field]);
      return { ...prev, errors: newErrors };
    });
  });

  const focusFirstError = useEventCallback(() => {
    const firstErrorField = Object.keys(formState.errors)[0];
    if (!firstErrorField || !formElementRef.current) return;

    const element = formElementRef.current.querySelector<HTMLElement>(
      `[name="${firstErrorField}"]`,
    );
    element?.focus();
  });

  const registerField = useEventCallback(
    (name: string, config: FieldConfig) => {
      if (
        process.env.NODE_ENV !== "production" &&
        fieldsRef.current.has(name)
      ) {
        console.warn(
          `Field "${name}" is already registered. Last registration wins.`,
        );
      }

      fieldsRef.current.set(name, config);

      if (!fieldStatesRef.current.has(name)) {
        fieldStatesRef.current.set(name, {
          initialValue: getNestedValue(values, name),
          touched: false,
          focused: false,
          validating: false,
          disabled: false,
          readOnly: false,
          hidden: false,
        });
      }
    },
  );

  const unregisterField = useEventCallback((name: string) => {
    const config = fieldsRef.current.get(name);
    fieldsRef.current.delete(name);

    if (!config?.preserveOnUnmount) {
      fieldStatesRef.current.delete(name);
      setFormState((prev) => {
        const newErrors = { ...prev.errors };
        delete newErrors[name];
        return { ...prev, errors: newErrors };
      });
    }

    // Cancel pending validation
    const timer = validationTimersRef.current.get(name);
    if (timer) {
      clearTimeout(timer);
      validationTimersRef.current.delete(name);
    }
    const abort = validationAbortRef.current.get(name);
    if (abort) {
      abort.abort();
      validationAbortRef.current.delete(name);
    }
  });

  useImperativeHandle(
    ref,
    () => ({
      getValues: () => values as never,
      getValue: (name: string) => getNestedValue(values, name),
      setValue,
      setValues,
      reset,
      clear,
      validate: async (fields?: string[]) => {
        if (!fields) return validateForm();
        const results = await Promise.all(fields.map((f) => validateField(f)));
        return results.every((r) => r);
      },
      setError,
      setFormError,
      clearErrors,
      focusFirstError,
    }),
    [
      values,
      setValue,
      setValues,
      reset,
      clear,
      validateForm,
      validateField,
      setError,
      setFormError,
      clearErrors,
      focusFirstError,
    ],
  );

  useEffect(() => {
    const isDirty = Array.from(fieldStatesRef.current.keys()).some((name) => {
      const state = getFieldState(name);
      return state.dirty;
    });
    setFormState((prev) => ({ ...prev, dirty: isDirty }));
  }, [values, getFieldState]);

  useEffect(() => {
    return () => {
      validationTimersRef.current.forEach((timer) => clearTimeout(timer));
      validationAbortRef.current.forEach((abort) => abort.abort());
      if (submitAbortRef.current) submitAbortRef.current.abort();
    };
  }, []);

  const contextValue = useMemo<FormContextValue>(
    () => ({
      values,
      state: formState,
      getFieldState,
      setValue,
      setFieldTouched,
      setFieldFocused,
      registerField,
      unregisterField,
      validateField,
      validateForm,
      submit,
      reset,
      clear,
      setError,
      setFormError,
      clearErrors,
      focusFirstError,
      validateOn,
      revalidateOn,
      validateDebounce,
    }),
    [
      values,
      formState,
      getFieldState,
      setValue,
      setFieldTouched,
      setFieldFocused,
      registerField,
      unregisterField,
      validateField,
      validateForm,
      submit,
      reset,
      clear,
      setError,
      setFormError,
      clearErrors,
      focusFirstError,
      validateOn,
      revalidateOn,
      validateDebounce,
    ],
  );

  const handleSubmit = useEventCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
  );

  return (
    <FormContext.Provider value={contextValue}>
      <form
        {...rest}
        ref={formElementRef}
        className={cx("uk-form", className)}
        noValidate={noValidate}
        onSubmit={handleSubmit}
        data-submitting={formState.submitting ? "true" : undefined}
        data-submitted={formState.submitted ? "true" : undefined}
      >
        {children}
        {formState.formError ? (
          <div
            className="uk-form__error-summary"
            role="alert"
            aria-live="assertive"
          >
            {formState.formError}
          </div>
        ) : null}
      </form>
    </FormContext.Provider>
  );
});

// ============================================================================
// Form.Field
// ============================================================================

function FormField({
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

  const { registerField, unregisterField, setValue } = formContext;

  useEffect(() => {
    registerField(name, { rules, transform, dependencies, preserveOnUnmount });

    if (
      defaultValue !== undefined &&
      getNestedValue(formContext.values, name) === undefined
    ) {
      setValue(name, defaultValue, { validate: false });
    }

    const meta = fieldStatesRefSafeGet(formContext, name);
    if (meta) {
      meta.disabled = disabled;
      meta.readOnly = readOnly;
      meta.hidden = hidden;
    }

    return () => unregisterField(name);
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
    unregisterField,
    setValue,
    formContext,
  ]);

  const fieldState = formContext.getFieldState(name);

  const contextValue = useMemo(
    () => ({
      name,
      fieldId,
      labelId,
      descriptionId,
      errorId,
      state: fieldState,
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
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}

// Helper to safely access field meta (workaround for ref access)
function fieldStatesRefSafeGet(context: FormContextValue, name: string) {
  const state = context.getFieldState(name);
  return {
    disabled: state.disabled,
    readOnly: state.readOnly,
    hidden: state.hidden,
  };
}

// ============================================================================
// Form.Label
// ============================================================================

const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  function FormLabel({ required, children, className, ...rest }, ref) {
    const fieldContext = useFieldContext("Form.Label");
    const hasRequiredRule = fieldContext.state && "rules" in fieldContext.state;

    return (
      <label
        {...rest}
        ref={ref}
        id={fieldContext.labelId}
        htmlFor={fieldContext.fieldId}
        className={cx("uk-form__label", className)}
      >
        {children}
        {required || hasRequiredRule ? (
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

function FormControl({ children }: FormControlProps): ReactElement {
  const fieldContext = useFieldContext("Form.Control");
  const formContext = useFormContext();
  const { name, fieldId, descriptionId, errorId, state, hasDescription } =
    fieldContext;

  if (!isValidElement(children)) {
    throw new Error("<Form.Control> expects a single valid React element");
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const childRef =
    (childProps.ref as Ref<HTMLElement> | undefined) ??
    (child as unknown as { ref?: Ref<HTMLElement> }).ref;

  const describedBy =
    [hasDescription ? descriptionId : null, state.invalid ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const injectedProps: Record<string, unknown> = {
    id: fieldId,
    name,
    ref: childRef,
    "aria-invalid": state.invalid || undefined,
    "aria-describedby": describedBy,
    "aria-required": childProps["aria-required"],
    "aria-disabled": state.disabled || undefined,
    "aria-readonly": state.readOnly || undefined,
    "aria-busy": state.validating || undefined,
    disabled: state.disabled || childProps.disabled,
    readOnly: state.readOnly || childProps.readOnly,
    value: state.value ?? "",
    onChange: (event: unknown) => {
      const originalOnChange = childProps.onChange as
        | ((event: unknown) => void)
        | undefined;
      originalOnChange?.(event);

      let value: unknown;
      if (event && typeof event === "object" && "target" in event) {
        const target = (event as { target: unknown }).target;
        if (target && typeof target === "object" && "value" in target) {
          value = (target as { value: unknown }).value;
        } else if (
          target &&
          typeof target === "object" &&
          "checked" in target
        ) {
          value = (target as { checked: unknown }).checked;
        }
      } else {
        value = event;
      }

      formContext.setValue(name, value);
    },
    onBlur: (event: unknown) => {
      const originalOnBlur = childProps.onBlur as
        | ((event: unknown) => void)
        | undefined;
      originalOnBlur?.(event);
      formContext.setFieldTouched(name, true);
      formContext.setFieldFocused(name, false);
    },
    onFocus: (event: unknown) => {
      const originalOnFocus = childProps.onFocus as
        | ((event: unknown) => void)
        | undefined;
      originalOnFocus?.(event);
      formContext.setFieldFocused(name, true);
    },
  };

  return cloneElement(child, injectedProps);
}

// ============================================================================
// Form.Description
// ============================================================================

const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  function FormDescription({ children, className, ...rest }, ref) {
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
  },
);

// ============================================================================
// Form.ErrorMessage
// ============================================================================

const FormErrorMessage = forwardRef<
  HTMLParagraphElement,
  FormErrorMessageProps
>(function FormErrorMessage({ children, className, ...rest }, ref) {
  const fieldContext = useFieldContext("Form.ErrorMessage");
  const error = fieldContext.state.error;

  if (!error) return null;

  return (
    <p
      {...rest}
      ref={ref}
      id={fieldContext.errorId}
      role="alert"
      aria-live="polite"
      className={cx("uk-form__error", className)}
    >
      {children ? children(error) : error}
    </p>
  );
});

// ============================================================================
// Form.Actions
// ============================================================================

const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
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

export interface FormComponent {
  Root: typeof FormRoot;
  Field: typeof FormField;
  Label: typeof FormLabel;
  Control: typeof FormControl;
  Description: typeof FormDescription;
  ErrorMessage: typeof FormErrorMessage;
  Actions: typeof FormActions;
}

export const Form: FormComponent = {
  Root: FormRoot,
  Field: FormField,
  Label: FormLabel,
  Control: FormControl,
  Description: FormDescription,
  ErrorMessage: FormErrorMessage,
  Actions: FormActions,
};
