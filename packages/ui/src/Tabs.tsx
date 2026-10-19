import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useControllableState } from "@ui-kit/hooks";
import { cx } from "./utils/cx";
import "./tabs.css";

export type TabsOrientation = "horizontal" | "vertical";

interface TabsContextValue {
  baseId: string;
  value: string;
  setValue: (value: string) => void;
  orientation: TabsOrientation;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tabs>`);
  }

  return context;
}

function tabId(baseId: string, value: string) {
  return `${baseId}-tab-${encodeURIComponent(value)}`;
}

function panelId(baseId: string, value: string) {
  return `${baseId}-panel-${encodeURIComponent(value)}`;
}

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

function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
}: TabsProps) {
  const baseId = useId();
  const [current, setValue] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });

  const context = useMemo<TabsContextValue>(
    () => ({ baseId, value: current, setValue, orientation }),
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

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, onKeyDown, ...rest },
  ref,
) {
  const { orientation } = useTabsContext("Tabs.List");

  return (
    <div
      {...rest}
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      tabIndex={-1}
      className={cx("uk-tabs__list", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        const target = event.target as HTMLElement | null;
        const trigger = target?.closest<HTMLElement>('[role="tab"]');

        if (!trigger || trigger.hasAttribute("disabled")) {
          return;
        }

        const triggers = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[role="tab"]:not([disabled])',
          ),
        );
        const index = triggers.indexOf(trigger);

        if (index === -1) {
          return;
        }

        const nextKey =
          orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
        const previousKey =
          orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

        let nextIndex = -1;

        switch (event.key) {
          case nextKey:
            nextIndex = (index + 1) % triggers.length;
            break;
          case previousKey:
            nextIndex = (index - 1 + triggers.length) % triggers.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = triggers.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();

        const nextTrigger = triggers[nextIndex];

        if (nextTrigger) {
          nextTrigger.focus();
          nextTrigger.click();
        }
      }}
    />
  );
});

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children?: ReactNode;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger(
    { value, type = "button", className, onClick, ...rest },
    ref,
  ) {
    const context = useTabsContext("Tabs.Trigger");
    const selected = context.value === value;

    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        role="tab"
        id={tabId(context.baseId, value)}
        aria-selected={selected}
        aria-controls={panelId(context.baseId, value)}
        tabIndex={selected ? 0 : -1}
        data-state={selected ? "active" : "inactive"}
        className={cx("uk-tabs__trigger", className)}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented) {
            context.setValue(value);
          }
        }}
      />
    );
  },
);

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children?: ReactNode;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ value, className, ...rest }, ref) {
    const context = useTabsContext("Tabs.Content");
    const selected = context.value === value;

    return (
      <div
        {...rest}
        ref={ref}
        role="tabpanel"
        id={panelId(context.baseId, value)}
        aria-labelledby={tabId(context.baseId, value)}
        hidden={!selected}
        tabIndex={0}
        data-state={selected ? "active" : "inactive"}
        className={cx("uk-tabs__panel", className)}
      />
    );
  },
);

/**
 * 标签页。
 *
 * 组合式 API：Tabs / Tabs.List / Tabs.Trigger / Tabs.Content。
 * 实现 roving tabindex、方向键循环、Home/End 跳转，并自动生成
 * aria-controls / aria-labelledby 关联。
 */
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
