import {
  useEffect,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { useEventCallback } from "seam-hooks";

import { cx } from "../utils/cx";
import {
  RadioGroupContext,
  type RadioGroupContextValue,
} from "./radio-context";
import { useRadioGroup } from "./useRadioGroup";

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

export function RadioGroupRoot({
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
  const { value: current, onValueChange: setCurrent } = useRadioGroup({
    value,
    defaultValue,
    onValueChange,
  });
  const [items, setItems] = useState<
    ReadonlyArray<{ value: string; id: string; disabled: boolean }>
  >([]);

  const registerItem = useEventCallback(
    (itemValue: string, id: string, disabled: boolean) => {
      setItems((previous) => {
        const index = previous.findIndex((item) => item.id === id);
        if (index === -1) {
          return [...previous, { value: itemValue, id, disabled }];
        }

        const existing = previous[index];
        if (existing?.value === itemValue && existing.disabled === disabled) {
          return previous;
        }

        const next = [...previous];
        next[index] = { value: itemValue, id, disabled };
        return next;
      });
    },
  );

  const unregisterItem = useEventCallback((itemValue: string, id: string) => {
    setItems((previous) => {
      const next = previous.filter(
        (item) => item.id !== id || item.value !== itemValue,
      );
      return next.length === previous.length ? previous : next;
    });
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const values = new Set<string>();
    const ids = new Set<string>();
    for (const item of items) {
      if (values.has(item.value)) {
        console.warn(
          `RadioGroup: duplicate item value "${item.value}" detected.`,
        );
      }
      if (ids.has(item.id)) {
        console.warn(`RadioGroup: duplicate item id "${item.id}" detected.`);
      }
      values.add(item.value);
      ids.add(item.id);
    }
  }, [items]);

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
      value: current,
      setValue: setCurrent,
      orientation,
      groupId,
      items,
      registerItem,
      unregisterItem,
      getEnabledValues,
    }),
    [
      current,
      setCurrent,
      orientation,
      groupId,
      items,
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
