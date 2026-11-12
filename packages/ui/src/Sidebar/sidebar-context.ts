import { createContext, useContext } from "react";

import type { SidebarHoverIndicator } from "./SidebarRoot";

export interface SidebarContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  indicatorBaseId: string;
  hoverPreview: boolean;
  hoverIndicator: SidebarHoverIndicator;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext(component: string): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Sidebar>`);
  }

  return context;
}

export function composeHandler<T extends { defaultPrevented: boolean }>(
  childHandler: ((event: T) => void) | undefined,
  handler: (event: T) => void,
) {
  return (event: T) => {
    childHandler?.(event);

    if (!event.defaultPrevented) {
      handler(event);
    }
  };
}
