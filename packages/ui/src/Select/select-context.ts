import { createContext, useContext } from "react";

import type { SelectOption } from "./SelectRoot";

export interface SelectContextValue {
  values: Array<string>;
  multiple: boolean;
  activeIndex: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  setActiveIndex: (index: number) => void;
  commit: (index: number) => void;
  removeValue: (value: string) => void;
  clearValues: () => void;
  triggerId: string;
  contentId: string;
  options: Array<SelectOption>;
  optionNodes: Array<SelectOptionNode>;
  loading: boolean;
}

export interface SelectOptionNode {
  option: SelectOption;
  index: number;
  parentIndex: number | null;
  depth: number;
  hasChildren: boolean;
}

export const SelectContext = createContext<SelectContextValue | null>(null);

export function useSelectContext(component: string): SelectContextValue {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Select>`);
  }

  return context;
}
