import { createContext, useContext, type ReactNode } from "react";

export interface TooltipContextValue {
  open: boolean;
  triggerElement: HTMLElement | null;
  setTriggerElement: (element: HTMLElement | null) => void;
  contentId: string;
  requestOpen: (immediate?: boolean) => void;
  requestClose: () => void;
  dismiss: () => void;
}

export const TooltipContext = createContext<TooltipContextValue | null>(null);

export const subscribeToNothing = () => () => {};
export const getClientSnapshot = () => true;
export const getServerSnapshot = () => false;

export function useTooltipContext(component: string): TooltipContextValue {
  const context = useContext(TooltipContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tooltip.Root>`);
  }

  return context;
}

export interface RegisteredTooltipItem {
  triggerElement: HTMLElement;
  content: ReactNode;
}

export interface TooltipGroupContextValue {
  open: boolean;
  activeValue: string | null;
  contentId: string;
  activate: (value: string, immediate?: boolean) => void;
  requestClose: () => void;
  dismiss: () => void;
  register: (
    value: string,
    triggerElement: HTMLElement,
    content: ReactNode,
  ) => void;
  unregister: (value: string) => void;
}

export const TooltipGroupContext =
  createContext<TooltipGroupContextValue | null>(null);

export function useTooltipGroupContext(
  component: string,
): TooltipGroupContextValue {
  const context = useContext(TooltipGroupContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tooltip.Group>`);
  }

  return context;
}
