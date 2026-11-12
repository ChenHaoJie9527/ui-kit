import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useControllableState, useEventCallback } from "seam-hooks";

import { cx } from "../utils/cx";
import { FormContext, type FormContextValue } from "./form-context";
import {
  deepEqual,
  getNestedValue,
  isEmpty,
  setNestedValue,
} from "./form-utils";
import type { FieldConfig } from "./form-context";

export type FormErrors<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  [K in keyof T]?: string;
} & Record<string, string | undefined>;

export type FormValidationTrigger =
  | "submit"
  | "focus"
  | "change"
  | "blur"
  | "pointerleave";

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
  required: boolean;
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

export interface FormRootProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange"> {
  values?: T;
  defaultValues?: Partial<T>;
  onValuesChange?: (values: T, changedField?: keyof T) => void;
  onSubmit?: (values: T) => void | Promise<void>;
  onSubmitFailed?: (errors: FormErrors<T>) => void;
  validateOn?: FormValidationTrigger;
  revalidateOn?: Exclude<FormValidationTrigger, "submit">;
  validateDebounce?: number;
  noValidate?: boolean;
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>;
  layout?: "vertical" | "inline" | "horizontal";
  children: ReactNode;
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
      rule.pattern.lastIndex = 0;
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

const EMPTY_DEFAULT_VALUES: Partial<Record<string, unknown>> = {};

export const FormRoot = forwardRef<FormRef, FormRootProps>(function FormRoot(
  {
    values: controlledValues,
    defaultValues = EMPTY_DEFAULT_VALUES,
    onValuesChange,
    onSubmit,
    onSubmitFailed,
    validateOn = "blur",
    revalidateOn = "change",
    validateDebounce = 300,
    noValidate = true,
    validate,
    layout = "horizontal",
    children,
    className,
    ...rest
  },
  ref,
) {
  const changedFieldRef = useRef<string | undefined>(undefined);
  const [values, setValuesState] = useControllableState<
    Record<string, unknown>
  >({
    value: controlledValues,
    defaultValue: defaultValues as Record<string, unknown>,
    onChange: (nextValues) =>
      onValuesChange?.(nextValues, changedFieldRef.current),
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
  const errorsRef = useRef<Record<string, string>>({});
  const formLevelErrorsRef = useRef<Record<string, string>>({});

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
  const formValidationAbortRef = useRef<AbortController | null>(null);
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
        required: Boolean(
          fieldsRef.current
            .get(name)
            ?.rules?.some((rule) => "required" in rule && rule.required),
        ),
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

  const setFieldFocused = useEventCallback((name: string, focused: boolean) => {
    setFieldMeta(name, { focused });
  });

  const updateFieldError = useCallback((name: string, error?: string) => {
    const nextErrors = { ...errorsRef.current };
    if (error) {
      nextErrors[name] = error;
    } else {
      delete nextErrors[name];
    }
    errorsRef.current = nextErrors;
    setFormState((prev) => ({ ...prev, errors: nextErrors }));
  }, []);

  const validateField = useEventCallback(
    async (
      name: string,
      nextValues: Record<string, unknown> = values,
    ): Promise<boolean> => {
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
        const value = getNestedValue(nextValues, name);
        const error = await validateFieldRules(value, config.rules, nextValues);

        if (abortController.signal.aborted) return false;

        updateFieldError(name, error ?? undefined);

        return !error;
      } finally {
        if (!abortController.signal.aborted) {
          setFieldMeta(name, { validating: false });
          const anyValidating = Array.from(
            fieldStatesRef.current.values(),
          ).some((meta) => meta.validating);
          setFormState((prev) => ({ ...prev, validating: anyValidating }));
        }
        if (validationAbortRef.current.get(name) === abortController) {
          validationAbortRef.current.delete(name);
        }
      }
    },
  );

  const runFormLevelValidation = useEventCallback(
    async (
      nextValues: Record<string, unknown> = values,
      triggerFields?: string[],
    ): Promise<FormErrors> => {
      formValidationAbortRef.current?.abort();

      if (!validate) {
        const previousFormLevelErrors = formLevelErrorsRef.current;
        const allErrors = { ...errorsRef.current };
        Object.keys(previousFormLevelErrors).forEach((key) => {
          if (allErrors[key] === previousFormLevelErrors[key]) {
            delete allErrors[key];
          }
        });
        formLevelErrorsRef.current = {};
        errorsRef.current = allErrors;
        setFormState((prev) => ({ ...prev, errors: allErrors }));
        return {};
      }

      const abortController = new AbortController();
      formValidationAbortRef.current = abortController;
      setFormState((prev) => ({ ...prev, validating: true }));

      try {
        const formLevelErrors = await validate(nextValues as never);

        if (abortController.signal.aborted) return formLevelErrors;

        // Interactive validation may update the field that caused it and
        // fields the user already touched or that already show an error.
        // Untouched fields wait for their own interaction or a full submit.
        const touchedFields = Array.from(fieldStatesRef.current.entries())
          .filter(([, meta]) => meta.touched)
          .map(([fieldName]) => fieldName);
        const fieldsToUpdate = triggerFields
          ? new Set([
              ...triggerFields,
              ...touchedFields,
              ...Object.keys(errorsRef.current),
            ])
          : null;
        const shouldUpdateField = (name: string) =>
          fieldsToUpdate === null || fieldsToUpdate.has(name);
        const previousFormLevelErrors = formLevelErrorsRef.current;
        const allErrors = { ...errorsRef.current };
        const nextFormLevelErrors: Record<string, string> = fieldsToUpdate
          ? { ...previousFormLevelErrors }
          : {};

        Object.keys(previousFormLevelErrors).forEach((key) => {
          if (!shouldUpdateField(key)) return;
          if (allErrors[key] === previousFormLevelErrors[key]) {
            delete allErrors[key];
          }
          delete nextFormLevelErrors[key];
        });
        Object.entries(formLevelErrors).forEach(([key, value]) => {
          if (value && shouldUpdateField(key)) {
            allErrors[key] = value;
            nextFormLevelErrors[key] = value;
          }
        });

        formLevelErrorsRef.current = nextFormLevelErrors;
        errorsRef.current = allErrors;
        setFormState((prev) => ({ ...prev, errors: allErrors }));

        return formLevelErrors;
      } finally {
        if (formValidationAbortRef.current === abortController) {
          formValidationAbortRef.current = null;
          if (!abortController.signal.aborted) {
            const anyValidating = Array.from(
              fieldStatesRef.current.values(),
            ).some((meta) => meta.validating);
            setFormState((prev) => ({
              ...prev,
              validating: anyValidating,
            }));
          }
        }
      }
    },
  );

  const validateForm = useEventCallback(async (): Promise<boolean> => {
    const fieldNames = Array.from(fieldsRef.current.keys());
    const results = await Promise.all(
      fieldNames.map((name) => validateField(name)),
    );

    const formLevelErrors = await runFormLevelValidation(values);

    const isValid =
      results.every((r) => r) && Object.keys(formLevelErrors).length === 0;
    return isValid;
  });

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
      changedFieldRef.current = name;
      const newValues = setValuesState((previousValues) =>
        setNestedValue(previousValues, name, transformedValue),
      );
      changedFieldRef.current = undefined;

      if (options?.touch) {
        setFieldMeta(name, { touched: true });
      }

      const shouldValidate =
        options?.validate ??
        (validateOn === "change" ||
          (revalidateOn === "change" &&
            (Boolean(formState.errors[name]) ||
              Boolean(fieldStatesRef.current.get(name)?.touched))));

      if (shouldValidate) {
        const timer = validationTimersRef.current.get(name);
        if (timer) clearTimeout(timer);
        const dependentFields = Array.from(fieldsRef.current.entries())
          .filter(([, fieldConfig]) => fieldConfig.dependencies?.includes(name))
          .map(([fieldName]) => fieldName);

        const hasCustomValidator = config?.rules?.some(
          (rule) => "validator" in rule,
        );

        if (hasCustomValidator && validateDebounce > 0) {
          const newTimer = setTimeout(() => {
            validateField(name, newValues);
            runFormLevelValidation(newValues, [name, ...dependentFields]);
            validationTimersRef.current.delete(name);
          }, validateDebounce);
          validationTimersRef.current.set(name, newTimer);
        } else {
          validateField(name, newValues);
          runFormLevelValidation(newValues, [name, ...dependentFields]);
        }
      }

      fieldsRef.current.forEach((fieldConfig, fieldName) => {
        if (fieldConfig.dependencies?.includes(name)) {
          validateField(fieldName, newValues);
        }
      });
    },
  );

  const setValues = useEventCallback(
    (
      newValues: Partial<Record<string, unknown>>,
      options?: { validate?: boolean },
    ) => {
      const updatedValues = setValuesState((previousValues) => {
        let nextValues = { ...previousValues };
        Object.entries(newValues).forEach(([name, value]) => {
          nextValues = setNestedValue(nextValues, name, value);
        });
        return nextValues;
      });

      if (options?.validate) {
        Object.keys(newValues).forEach((name) =>
          validateField(name, updatedValues),
        );
        runFormLevelValidation(updatedValues, Object.keys(newValues));
      }
    },
  );

  const setFieldTouched = useEventCallback((name: string, touched: boolean) => {
    setFieldMeta(name, { touched });

    if (touched && validateOn === "blur") {
      validateField(name);
      runFormLevelValidation(values, [name]);
    } else if (touched && revalidateOn === "blur" && formState.errors[name]) {
      validateField(name);
      runFormLevelValidation(values, [name]);
    }
  });

  const handleFieldInteraction = useEventCallback(
    (name: string, trigger: Exclude<FormValidationTrigger, "submit">) => {
      if (trigger === "change") return;

      const shouldValidate =
        validateOn === trigger ||
        (revalidateOn === trigger && Boolean(formState.errors[name]));

      if (shouldValidate) {
        validateField(name);
        runFormLevelValidation(values, [name]);
      }
    },
  );

  const focusFirstError = useEventCallback(() => {
    const firstErrorField = Object.keys(errorsRef.current)[0];
    if (!firstErrorField || !formElementRef.current) return;

    const element = formElementRef.current.querySelector<HTMLElement>(
      `[name="${firstErrorField}"]`,
    );
    element?.focus();
  });

  const submit = useEventCallback(async () => {
    if (formState.submitting) return;

    setFormState((prev) => ({ ...prev, submitting: true, submitted: true }));

    const isValid = await validateForm();

    if (!isValid) {
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        submitFailed: true,
        submitSucceeded: false,
      }));
      onSubmitFailed?.(errorsRef.current as FormErrors);
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
      formValidationAbortRef.current?.abort();
      formValidationAbortRef.current = null;

      // Cancel submit
      if (submitAbortRef.current) {
        submitAbortRef.current.abort();
        submitAbortRef.current = null;
      }

      const resetValues = (newValues ?? defaultValues) as Record<
        string,
        unknown
      >;
      let resolvedResetValues = { ...resetValues };
      fieldsRef.current.forEach((config, fieldName) => {
        if (
          config.defaultValue !== undefined &&
          getNestedValue(resolvedResetValues, fieldName) === undefined
        ) {
          resolvedResetValues = setNestedValue(
            resolvedResetValues,
            fieldName,
            config.defaultValue,
          );
        }
      });
      errorsRef.current = {};
      formLevelErrorsRef.current = {};
      setValuesState(resolvedResetValues);

      fieldStatesRef.current.forEach((meta, name) => {
        fieldStatesRef.current.set(name, {
          ...meta,
          initialValue: getNestedValue(resolvedResetValues, name),
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
    errorsRef.current = {};
    formLevelErrorsRef.current = {};
    setValuesState(clearedValues);
    setFormState((prev) => ({ ...prev, errors: {}, formError: null }));
  });

  const setError = useEventCallback((name: string, error: string) => {
    updateFieldError(name, error);
  });

  const setFormError = useEventCallback((error: string | null) => {
    setFormState((prev) => ({ ...prev, formError: error }));
  });

  const clearErrors = useEventCallback((fields?: string[]) => {
    if (!fields) {
      errorsRef.current = {};
      formLevelErrorsRef.current = {};
      setFormState((prev) => ({ ...prev, errors: {}, formError: null }));
      return;
    }

    const nextErrors = { ...errorsRef.current };
    const nextFormLevelErrors = { ...formLevelErrorsRef.current };
    fields.forEach((field) => {
      delete nextErrors[field];
      delete nextFormLevelErrors[field];
    });
    formLevelErrorsRef.current = nextFormLevelErrors;
    errorsRef.current = nextErrors;
    setFormState((prev) => ({ ...prev, errors: nextErrors }));
  });

  const registerField = useEventCallback(
    (name: string, config: FieldConfig) => {
      const isNewField = !fieldsRef.current.has(name);
      fieldsRef.current.set(name, config);
      const currentValue = getNestedValue(values, name);

      if (!fieldStatesRef.current.has(name)) {
        fieldStatesRef.current.set(name, {
          initialValue:
            currentValue === undefined ? config.defaultValue : currentValue,
          touched: false,
          focused: false,
          validating: false,
          disabled: false,
          readOnly: false,
          hidden: false,
        });
      }

      const meta = fieldStatesRef.current.get(name);
      if (meta) {
        fieldStatesRef.current.set(name, {
          ...meta,
          initialValue:
            meta.initialValue === undefined && currentValue === undefined
              ? config.defaultValue
              : meta.initialValue,
          disabled: config.disabled ?? false,
          readOnly: config.readOnly ?? false,
          hidden: config.hidden ?? false,
        });
      }

      if (
        isNewField &&
        config.defaultValue !== undefined &&
        currentValue === undefined
      ) {
        changedFieldRef.current = name;
        setValuesState((previousValues) =>
          getNestedValue(previousValues, name) === undefined
            ? setNestedValue(previousValues, name, config.defaultValue)
            : previousValues,
        );
        changedFieldRef.current = undefined;
      }

      setFormState((previousState) => ({ ...previousState }));
    },
  );

  const unregisterField = useEventCallback((name: string) => {
    const config = fieldsRef.current.get(name);
    fieldsRef.current.delete(name);

    if (!config?.preserveOnUnmount) {
      fieldStatesRef.current.delete(name);
      updateFieldError(name);
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

    setFormState((previousState) => ({ ...previousState }));
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
  }, [getFieldState]);

  useEffect(() => {
    const validationTimers = validationTimersRef.current;
    const validationAborts = validationAbortRef.current;

    return () => {
      validationTimers.forEach((timer) => clearTimeout(timer));
      validationAborts.forEach((abort) => abort.abort());
      formValidationAbortRef.current?.abort();
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
      handleFieldInteraction,
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
      handleFieldInteraction,
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
        data-layout={layout}
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
}) as <T extends Record<string, unknown> = Record<string, unknown>>(
  props: FormRootProps<T> & { ref?: Ref<FormRef> },
) => ReactElement | null;

// ============================================================================
// Form.Field
// ============================================================================
