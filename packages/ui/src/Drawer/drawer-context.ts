import { createContext, useContext } from "react";

export interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  contentId: string;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  setHasTitle: (hasTitle: boolean) => void;
  hasDescription: boolean;
  setHasDescription: (hasDescription: boolean) => void;
}

export const DrawerContext = createContext<DrawerContextValue | null>(null);

export const subscribeToNothing = () => () => {};
export const getClientSnapshot = () => true;
export const getServerSnapshot = () => false;

export function useDrawerContext(component: string): DrawerContextValue {
  const context = useContext(DrawerContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Drawer.Root>`);
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
