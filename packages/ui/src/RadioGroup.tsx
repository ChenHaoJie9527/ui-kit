import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { useControllableState, useEventCallback } from "seam-hooks";
import {
  INDICATOR_SPRING,
  REDUCED_MOTION_TRANSITION,
  UI_SPRING,
} from "./motion";
import { cx } from "./utils/cx";

export type RadioGroupOrientation = "horizontal" | "vertical";

export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "children"
> {
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value for an uncontrolled group. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
  /** Layout direction. Defaults to "vertical". */
  orientation?: RadioGroupOrientation;
  /** RadioGroupItem children. */
  children?: ReactNode;
  /** Merged onto the group root. */
  className?: string;
  /** Accessible name when no visible external label exists. */
  "aria-label"?: string;
  /** ID of an external element that labels the group. */
  "aria-labelledby"?: string;
}

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

interface RadioGroupContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  orientation: RadioGroupOrientation;
  groupId: string;
  itemCount: number;
  registerItem: (value: string, id: string) => void;
  unregisterItem: (value: string, id: string) => void;
  getEnabledValues: () => string[];
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(component: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <RadioGroup>`);
  }
  return context;
}

function RadioGroupRoot({
  value,
  defaultValue,
  onValueChange,
  orientation = "vertical",
  children,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: RadioGroupProps): ReactElement {
  const groupId = useId();
  const [current, setCurrent] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });
  const itemsRef = useRef(new Map<string, string>());
  const [itemCount, setItemCount] = useState(0);

  const registerItem = useEventCallback((itemValue: string, id: string) => {
    const map = itemsRef.current;
    if (process.env.NODE_ENV !== "production") {
      if (map.has(itemValue)) {
        console.warn(
          `RadioGroup: duplicate item value "${itemValue}" detected.`,
        );
      }
      for (const existingId of map.values()) {
        if (existingId === id) {
          console.warn(`RadioGroup: duplicate item id "${id}" detected.`);
        }
      }
    }
    map.set(itemValue, id);
    setItemCount(map.size);
  });

  const unregisterItem = useEventCallback((itemValue: string, id: string) => {
    const map = itemsRef.current;
    if (map.get(itemValue) === id) {
      map.delete(itemValue);
      setItemCount(map.size);
    }
  });

  const getEnabledValues = useEventCallback(() => {
    const root = document.getElementById(groupId);
    if (!root) return [];
    const inputs = Array.from(
      root.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    return inputs
      .filter((input) => !input.disabled)
      .map((input) => input.value);
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (!ariaLabel && !ariaLabelledBy) {
        console.warn(
          "RadioGroup: an accessible name is required. Provide aria-label or aria-labelledby.",
        );
      }
    }
  }, [ariaLabel, ariaLabelledBy]);

  const context = useMemo<RadioGroupContextValue>(
    () => ({
      value: current || undefined,
      setValue: setCurrent,
      orientation,
      groupId,
      itemCount,
      registerItem,
      unregisterItem,
      getEnabledValues,
    }),
    [
      current,
      setCurrent,
      orientation,
      groupId,
      itemCount,
      registerItem,
      unregisterItem,
      getEnabledValues,
    ],
  );

  return (
    <RadioGroupContext.Provider value={context}>
      <div
        {...rest}
        id={groupId}
        role="radiogroup"
        aria-orientation={orientation}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cx("radio-group", className)}
        data-orientation={orientation}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
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
    const reduceMotion = useReducedMotion() ?? false;
    const [pressed, setPressed] = useState(false);
    const isSingle = context.itemCount <= 1;

    useEffect(() => {
      context.registerItem(value, inputId);
      return () => context.unregisterItem(value, inputId);
    }, [context, inputId, value]);

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
      const root = document.getElementById(context.groupId);
      const nextInput = root?.querySelector<HTMLInputElement>(
        `input[type="radio"][value="${CSS.escape(nextValue)}"]`,
      );
      nextInput?.focus();
      nextInput?.click();
    };

    const sharedLayout = !isSingle && !reduceMotion;
    const indicatorTransition = reduceMotion
      ? REDUCED_MOTION_TRANSITION
      : isSingle
        ? UI_SPRING
        : INDICATOR_SPRING;

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
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-describedby={describedBy}
            className="radio-group-input"
          />
          <span className="radio-group-track" aria-hidden="true">
            {checked ? (
              <motion.span
                className="radio-group-indicator"
                layoutId={
                  sharedLayout ? `${context.groupId}-indicator` : undefined
                }
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : isSingle
                      ? { opacity: 0, scale: 0 }
                      : { opacity: 0, scale: 0.5 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }
                }
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

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
});
export { RadioGroupItem };
export type RadioGroupComponent = typeof RadioGroup;
