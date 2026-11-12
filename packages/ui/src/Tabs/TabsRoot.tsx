import { useId, useMemo, type ReactElement, type ReactNode } from "react";
import { useControllableState } from "seam-hooks";

import { cx } from "../utils/cx";
import { TabsContext, type TabsContextValue } from "./tabs-context";

export type TabsOrientation = "horizontal" | "vertical";

interface TabsBaseProps {
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  className?: string;
  children: ReactNode;
}

export type TabsProps = TabsBaseProps &
  (
    | { value: string; defaultValue?: never }
    | { value?: never; defaultValue: string }
  );

export function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
}: TabsProps): ReactElement {
  const baseId = useId();
  const [current, setValue] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });

  const context = useMemo<TabsContextValue>(
    () => ({
      baseId,
      value: current,
      setValue,
      orientation,
      indicatorId: `${baseId}-indicator`,
    }),
    [baseId, current, orientation, setValue],
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={cx("uk-tabs", className)} data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}
