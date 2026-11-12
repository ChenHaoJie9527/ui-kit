import {
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState } from "seam-hooks";

import { DialogContext, type DialogContextValue } from "./dialog-context";

export interface DialogRootProps {
  children: ReactNode;
  /** 受控打开状态。 */
  open?: boolean;
  /** 非受控模式下的初始状态。 */
  defaultOpen?: boolean;
  /** 打开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
}

export function DialogRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: DialogRootProps): ReactElement {
  const baseId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [current, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const value = useMemo<DialogContextValue>(
    () => ({
      open: current,
      setOpen,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      titleId: `${baseId}-title`,
      descriptionId: `${baseId}-description`,
      hasTitle,
      setHasTitle,
      hasDescription,
      setHasDescription,
    }),
    [baseId, current, hasDescription, hasTitle, setOpen],
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}
