import type { RadioGroupOrientation } from "./RadioGroupRoot";
import { createContext, useContext } from "react";

export interface RadioGroupContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  orientation: RadioGroupOrientation;
  groupId: string;
  items: ReadonlyArray<{ value: string; id: string; disabled: boolean }>;
  registerItem: (value: string, id: string, disabled: boolean) => void;
  unregisterItem: (value: string, id: string) => void;
  getEnabledValues: () => string[];
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(
  null,
);

export function useRadioGroupContext(
  component: string,
): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <RadioGroup>`);
  }
  return context;
}
