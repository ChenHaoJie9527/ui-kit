import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  RADIO_GROUP_INDICATOR_SPRING,
  REDUCED_MOTION_TRANSITION,
  UI_SPRING,
} from "../motion";
import { cx } from "../utils/cx";
import { useRadioGroupContext } from "./radio-context";

export interface RadioGroupItemProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "type"
  | "value"
  | "checked"
  | "defaultChecked"
  | "children"
  | "className"
  | "size"
> {
  /** Value submitted and returned when this item is selected. */
  value: string;
  /** Visible option label. */
  label: ReactNode;
  /** Optional supporting text displayed below the label. */
  description?: ReactNode;
  /** Prevents focus and selection through the native disabled input. */
  disabled?: boolean;
  /** Merged onto the outer item wrapper, not the native input. */
  className?: string;
  /** Optional stable native input ID. */
  id?: string;
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  function RadioGroupItem(
    {
      value,
      label,
      description,
      disabled = false,
      className,
      id: providedId,
      onChange,
      onKeyDown,
      "aria-describedby": ariaDescribedBy,
      ...rest
    },
    ref,
  ) {
    const context = useRadioGroupContext("RadioGroupItem");
    const generatedId = useId();
    const inputId = providedId ?? generatedId;
    const labelId = `${inputId}-label`;
    const descriptionId = `${inputId}-description`;
    const checked = context.value === value;
    const { registerItem, unregisterItem } = context;
    const hasEnabledSelection = context.items.some(
      (item) => item.value === context.value && !item.disabled,
    );
    const firstEnabledValue = hasEnabledSelection
      ? undefined
      : context.items.find((item) => !item.disabled)?.value;
    const tabIndex = disabled
      ? -1
      : checked || firstEnabledValue === value
        ? 0
        : -1;
    const reduceMotion = useReducedMotion() ?? false;
    const [pressed, setPressed] = useState(false);

    useEffect(() => {
      registerItem(value, inputId, disabled);
    }, [disabled, inputId, registerItem, value]);

    useEffect(
      () => () => unregisterItem(value, inputId),
      [inputId, unregisterItem, value],
    );

    useEffect(() => {
      if (process.env.NODE_ENV !== "production") {
        const hasLabel =
          label !== null &&
          label !== undefined &&
          !(typeof label === "string" && label.trim() === "");
        if (!hasLabel && !rest["aria-label"] && !rest["aria-labelledby"]) {
          console.warn(
            `RadioGroupItem: item "${value}" has no label. Provide an external accessible name.`,
          );
        }
      }
    }, [label, rest, value]);

    const describedBy =
      [ariaDescribedBy, description ? descriptionId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      if (!event.defaultPrevented && event.target.checked) {
        context.setValue(value);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const isHorizontal = context.orientation === "horizontal";
      const nextKeys = isHorizontal ? ["ArrowRight"] : ["ArrowDown"];
      const prevKeys = isHorizontal ? ["ArrowLeft"] : ["ArrowUp"];
      let direction: 1 | -1 | 0 = 0;
      if (nextKeys.includes(event.key)) direction = 1;
      if (prevKeys.includes(event.key)) direction = -1;
      if (direction === 0) return;

      event.preventDefault();
      const enabledValues = context.getEnabledValues();
      if (enabledValues.length === 0) return;
      const currentIndex = enabledValues.indexOf(value);
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + direction + enabledValues.length) %
            enabledValues.length;
      const nextValue = enabledValues[nextIndex];
      if (nextValue === undefined) return;
      const root = document.getElementById(context.groupId);
      const nextInput = Array.from(
        root?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [],
      ).find((input) => input.value === nextValue);
      nextInput?.focus();
      nextInput?.click();
    };

    const indicatorTransition = reduceMotion
      ? REDUCED_MOTION_TRANSITION
      : RADIO_GROUP_INDICATOR_SPRING;

    return (
      <span
        className={cx("radio-group-item", className)}
        data-disabled={disabled ? "true" : undefined}
        data-checked={checked ? "true" : undefined}
      >
        <motion.span
          className="radio-group-control"
          animate={{ scale: pressed && !disabled && !reduceMotion ? 0.97 : 1 }}
          transition={reduceMotion ? REDUCED_MOTION_TRANSITION : UI_SPRING}
          onPointerDown={() => {
            if (!disabled && !reduceMotion) setPressed(true);
          }}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        >
          <input
            {...rest}
            ref={ref}
            type="radio"
            id={inputId}
            value={value}
            checked={checked}
            disabled={disabled}
            tabIndex={tabIndex}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-describedby={describedBy}
            className="radio-group-input"
          />
          <span className="radio-group-track" aria-hidden="true">
            {checked ? (
              <motion.span
                className="radio-group-indicator"
                layoutId={`${context.groupId}-indicator`}
                transition={indicatorTransition}
              />
            ) : null}
          </span>
        </motion.span>
        <span className="radio-group-copy">
          <label id={labelId} htmlFor={inputId} className="radio-group-label">
            {label}
          </label>
          {description ? (
            <span id={descriptionId} className="radio-group-description">
              {description}
            </span>
          ) : null}
        </span>
      </span>
    );
  },
);
