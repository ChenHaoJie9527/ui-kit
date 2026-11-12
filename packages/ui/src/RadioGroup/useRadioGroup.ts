import { useControllableState } from "seam-hooks";

import type { RadioGroupProps } from "./RadioGroupRoot";

export type UseRadioGroupOptions = Pick<
  RadioGroupProps,
  "value" | "defaultValue" | "onValueChange"
>;

export interface UseRadioGroupReturn {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

export function useRadioGroup({
  value,
  defaultValue,
  onValueChange,
}: UseRadioGroupOptions = {}): UseRadioGroupReturn {
  const [current, setCurrent] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });

  return { value: current || undefined, onValueChange: setCurrent };
}
