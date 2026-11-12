import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type Ref,
} from "react";

import { getControlKind } from "../control-contract";
import { useFieldContext, useFormContext } from "./form-context";

export interface FormControlProps {
  children: ReactElement;
}

export function FormControl({ children }: FormControlProps): ReactElement {
  const fieldContext = useFieldContext("Form.Control");
  const formContext = useFormContext();
  const {
    name,
    fieldId,
    labelId,
    descriptionId,
    errorId,
    state,
    hasLabel,
    hasDescription,
  } = fieldContext;

  if (!isValidElement(children)) {
    throw new Error("<Form.Control> expects a single valid React element");
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const childRef =
    (childProps.ref as Ref<HTMLElement> | undefined) ??
    (child as unknown as { ref?: Ref<HTMLElement> }).ref;

  const describedBy =
    [
      childProps["aria-describedby"],
      hasDescription ? descriptionId : null,
      state.invalid ? errorId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const labelledBy =
    [childProps["aria-labelledby"], hasLabel ? labelId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const controlKind = getControlKind(child.type);
  const isBooleanControl = controlKind === "boolean";
  const isNativeCheckbox = childProps.type === "checkbox";
  const isCompositeControl = controlKind === "value";

  const sharedProps: Record<string, unknown> = {
    id: fieldId,
    name,
    ref: childRef,
    "aria-invalid": state.invalid || undefined,
    "aria-describedby": describedBy,
    "aria-required": state.required || childProps["aria-required"] || undefined,
    "aria-disabled": state.disabled || undefined,
    "aria-readonly": state.readOnly || undefined,
    "aria-busy": state.validating || undefined,
    disabled: state.disabled || childProps.disabled,
    readOnly: state.readOnly || childProps.readOnly,
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
      formContext.handleFieldInteraction(name, "focus");
    },
  };

  if (isCompositeControl) {
    sharedProps["aria-labelledby"] = labelledBy;
  }

  let control: ReactElement;

  if (isBooleanControl) {
    const originalOnCheckedChange = childProps.onCheckedChange as
      | ((checked: boolean) => void)
      | undefined;

    control = cloneElement(child, {
      ...sharedProps,
      checked: Boolean(state.value),
      onCheckedChange: (checked: boolean) => {
        originalOnCheckedChange?.(checked);
        formContext.setValue(name, checked);
      },
    });
  } else if (isCompositeControl) {
    const originalOnValueChange = childProps.onValueChange as
      | ((value: string | string[]) => void)
      | undefined;

    control = cloneElement(child, {
      ...sharedProps,
      value: state.value as string | readonly string[] | null | undefined,
      onValueChange: (value: string | string[]) => {
        originalOnValueChange?.(value);
        formContext.setValue(name, value);
      },
    });
  } else {
    control = cloneElement(child, {
      ...sharedProps,
      value: isNativeCheckbox ? childProps.value : (state.value ?? ""),
      checked: isNativeCheckbox ? Boolean(state.value) : childProps.checked,
      onChange: (event: unknown) => {
        const originalOnChange = childProps.onChange as
          | ((event: unknown) => void)
          | undefined;
        originalOnChange?.(event);

        let value: unknown;
        if (event && typeof event === "object" && "target" in event) {
          const target = (event as { target: unknown }).target;
          if (target && typeof target === "object") {
            if ("selectedOptions" in target && childProps.multiple) {
              value = Array.from(
                target.selectedOptions as ArrayLike<HTMLOptionElement>,
              ).map((option) => option.value);
            } else if (
              "type" in target &&
              (target as { type: unknown }).type === "checkbox" &&
              "checked" in target
            ) {
              value = (target as { checked: unknown }).checked;
            } else if ("value" in target) {
              value = (target as { value: unknown }).value;
            }
          }
        } else {
          value = event;
        }

        formContext.setValue(name, value);
      },
    });
  }

  return (
    <div className="uk-form__control" data-slot="control">
      {control}
    </div>
  );
}

// ============================================================================
// Form.Description
// ============================================================================
