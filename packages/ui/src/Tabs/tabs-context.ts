import { createContext, useContext } from "react";

import type { TabsOrientation } from "./TabsRoot";

export interface TabsContextValue {
  baseId: string;
  value: string;
  setValue: (value: string) => void;
  orientation: TabsOrientation;
  indicatorId: string;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tabs>`);
  }

  return context;
}

export function tabId(baseId: string, value: string) {
  return `${baseId}-tab-${encodeURIComponent(value)}`;
}

export function panelId(baseId: string, value: string) {
  return `${baseId}-panel-${encodeURIComponent(value)}`;
}
