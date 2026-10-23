import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";
import { useControllableState, useEventCallback } from "seam-hooks";
import { DISCLOSURE_TRANSITION, REDUCED_MOTION_TRANSITION } from "./motion";
import { INDICATOR_SPRING } from "./motion";
import { cx } from "./utils/cx";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  /** 提交给 onValueChange 的稳定值。 */
  value: string;
  /** 展示内容；缺省时渲染 value。 */
  label?: ReactNode;
  /** 是否禁止选择该项。 */
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "value" | "onChange" | "aria-expanded" | "defaultValue"
> {
  /** 可选项；label 用于展示，value 用于提交。 */
  options: Array<SelectOption>;
  /** 受控选中值。 */
  value?: string | null;
  /** 非受控模式下的初始值。 */
  defaultValue?: string | null;
  /** 选中值变化时触发。 */
  onValueChange?: (value: string) => void;
  /** 未选择时的展示文本。 */
  placeholder?: string;
  /** 控件尺寸。 */
  size?: SelectSize;
  /** 是否禁用整个控件。 */
  disabled?: boolean;
  /** 列表为空时的提示文本。 */
  emptyText?: string;
  /** 标记选择值无效，使用共享 invalid 样式。 */
  invalid?: boolean;
}

interface SelectContextValue {
  value: string | null;
  activeIndex: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  setActiveIndex: (index: number) => void;
  commit: (index: number) => void;
  triggerId: string;
  contentId: string;
  options: Array<SelectOption>;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string): SelectContextValue {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Select>`);
  }

  return context;
}

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function composeHandler<T extends { defaultPrevented: boolean }>(
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

interface SelectPosition {
  x: number;
  y: number;
  side: "top" | "bottom";
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function transformOrigin(
  side: SelectPosition["side"],
): CSSProperties["transformOrigin"] {
  return side === "bottom" ? "center top" : "center bottom";
}

/** Select 的状态、键盘语义与选项查找根节点。 */
function SelectRoot({
  options,
  value,
  defaultValue = null,
  onValueChange,
  children,
}: {
  options: Array<SelectOption>;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}): ReactElement {
  const baseId = useId();
  const [current, setValue] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
  });
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === current);
  const [activeIndexOverride, setActiveIndexOverride] = useState<number | null>(
    null,
  );
  const activeIndex = activeIndexOverride ?? Math.max(selectedIndex, 0);
  const setActiveIndex = useCallback((index: number) => {
    setActiveIndexOverride(index);
  }, []);

  const commit = useEventCallback((index: number) => {
    const option = options[index];

    if (!option || option.disabled) {
      return;
    }

    setValue(option.value);
    setOpen(false);
    setActiveIndexOverride(null);
  });

  const context = useMemo<SelectContextValue>(
    () => ({
      value: current,
      activeIndex,
      open,
      setOpen,
      setActiveIndex,
      commit,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      options,
    }),
    [activeIndex, baseId, commit, current, open, options, setActiveIndex],
  );

  return (
    <SelectContext.Provider value={context}>{children}</SelectContext.Provider>
  );
}

function moveActiveIndex(
  options: Array<SelectOption>,
  activeIndex: number,
  direction: 1 | -1,
  wrap = true,
) {
  const total = options.length;

  if (total === 0) {
    return -1;
  }

  for (let step = 1; step <= total; step += 1) {
    const candidate = wrap
      ? (activeIndex + direction * step + total * step) % total
      : activeIndex + direction * step;

    if (candidate < 0 || candidate >= total) {
      break;
    }

    if (!options[candidate]?.disabled) {
      return candidate;
    }
  }

  return activeIndex;
}

/** 渲染触发器并合并调用方的事件、aria 与 ref。 */
const SelectTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }
>(function SelectTrigger(
  { className, placeholder = "请选择", onPointerDown, onKeyDown, ...rest },
  forwardedRef,
) {
  const context = useSelectContext("Select.Trigger");
  const selectedOption = context.options.find(
    (option) => option.value === context.value,
  );
  const disabled = rest.disabled;
  const typeaheadRef = useRef<{
    search: string;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ search: "", timer: null });
  const clearTypeahead = useCallback(() => {
    if (typeaheadRef.current.timer) {
      clearTimeout(typeaheadRef.current.timer);
      typeaheadRef.current.timer = null;
    }
    typeaheadRef.current.search = "";
  }, []);

  useEffect(() => clearTypeahead, [clearTypeahead]);

  const selectByTypeahead = useEventCallback((character: string) => {
    const state = typeaheadRef.current;

    if (state.timer) {
      clearTimeout(state.timer);
    }

    state.search += character.toLowerCase();
    state.timer = setTimeout(clearTypeahead, 500);

    const labels = context.options.map((option) => {
      const label = option.label;

      return (typeof label === "string" ? label : option.value).toLowerCase();
    });
    const startIndex =
      context.open && context.activeIndex >= 0 ? context.activeIndex + 1 : 0;
    const orderedIndexes = Array.from(
      { length: labels.length },
      (_, index) => (startIndex + index) % labels.length,
    );
    const exact = orderedIndexes.find(
      (index) =>
        !context.options[index]?.disabled &&
        labels[index]?.startsWith(state.search),
    );
    const fuzzy = orderedIndexes.find(
      (index) =>
        !context.options[index]?.disabled &&
        labels[index]?.includes(state.search),
    );
    const match = exact ?? fuzzy;

    if (match === undefined) {
      return;
    }

    if (context.open) {
      context.setActiveIndex(match);
    } else {
      context.commit(match);
    }
  });

  const handlePointerDown = useEventCallback(
    (_event: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      context.setOpen(!context.open);
    },
  );

  const handleKeyDown = useEventCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        selectByTypeahead(event.key);
        return;
      }

      if (!context.open) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          context.setOpen(true);
          context.setActiveIndex(
            context.activeIndex >= 0
              ? context.activeIndex
              : moveActiveIndex(context.options, -1, 1),
          );
        }

        return;
      }

      if (event.key === "Escape" || event.key === "Tab") {
        context.setOpen(false);
        event.currentTarget.focus();
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        context.commit(context.activeIndex);
        event.currentTarget.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        context.setActiveIndex(
          moveActiveIndex(context.options, context.activeIndex, 1),
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        context.setActiveIndex(
          moveActiveIndex(context.options, context.activeIndex, -1),
        );
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const direction = event.key === "Home" ? 1 : -1;
        const start = event.key === "Home" ? -1 : context.options.length;
        context.setActiveIndex(
          moveActiveIndex(context.options, start, direction, false),
        );
      }
    },
  );

  return (
    <button
      {...rest}
      ref={forwardedRef}
      id={context.triggerId}
      type="button"
      role="combobox"
      aria-expanded={context.open}
      aria-haspopup="listbox"
      aria-controls={context.open ? context.contentId : undefined}
      aria-activedescendant={
        context.open && context.options[context.activeIndex]
          ? `${context.contentId}-option-${context.activeIndex}`
          : undefined
      }
      data-size="md"
      className={cx("uk-select__trigger", className)}
      onPointerDown={composeHandler(onPointerDown, handlePointerDown)}
      onKeyDown={composeHandler(onKeyDown, handleKeyDown)}
    >
      <span className="uk-select__value">
        {selectedOption?.label ?? context.value ?? placeholder}
      </span>
      <span aria-hidden="true" className="uk-select__chevron" />
    </button>
  );
});

function useSelectPosition(
  triggerElement: HTMLButtonElement | null,
  floatingRef: { current: HTMLDivElement | null },
): SelectPosition | null {
  const [position, setPosition] = useState<SelectPosition | null>(null);

  const updatePosition = useCallback(() => {
    const floating = floatingRef.current;

    if (!triggerElement || !floating) {
      return;
    }

    const trigger = triggerElement.getBoundingClientRect();
    const floatingRect = floating.getBoundingClientRect();
    const bottomRoom = window.innerHeight - trigger.bottom - 8;
    const topRoom = trigger.top - 8;
    const side: SelectPosition["side"] =
      bottomRoom >= Math.min(floatingRect.height, 320) || bottomRoom >= topRoom
        ? "bottom"
        : "top";
    const y =
      side === "bottom"
        ? trigger.bottom + 6
        : trigger.top - floatingRect.height - 6;
    const x = clamp(
      trigger.left,
      8,
      Math.max(8, window.innerWidth - trigger.width - 8),
    );

    setPosition({ x, y, side });
  }, [floatingRef, triggerElement]);

  useLayoutEffect(() => {
    if (!triggerElement) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePosition);
    resizeObserver?.observe(triggerElement);
    resizeObserver?.observe(floatingRef.current ?? triggerElement);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [floatingRef, triggerElement, updatePosition]);

  return position;
}

function SelectLayer({
  emptyText,
}: {
  emptyText: string;
}): ReactElement | null {
  const context = useSelectContext("Select.Content");
  const triggerId = context.triggerId;
  const triggerElement = document.getElementById(
    triggerId,
  ) as HTMLButtonElement | null;
  const floatingRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isPresent = useIsPresent();
  const position = useSelectPosition(triggerElement, floatingRef);
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!context.open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        triggerElement?.contains(target) ||
        floatingRef.current?.contains(target)
      ) {
        return;
      }

      context.setOpen(false);
      triggerElement?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        context.setOpen(false);
        triggerElement?.focus();
      }
    };
    const onBlur = () => {
      context.setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [context, triggerElement]);

  if (!isClient) {
    return null;
  }

  const portalContainer =
    triggerElement?.closest<HTMLElement>("dialog") ?? document.body;

  return createPortal(
    <div
      ref={floatingRef}
      className="uk-select"
      data-side={position?.side ?? "bottom"}
      data-state={isPresent ? "open" : "closed"}
      aria-hidden={isPresent ? undefined : true}
      style={
        {
          left: position ? `${position.x}px` : 0,
          top: position ? `${position.y}px` : 0,
          "--uk-select-width": `${triggerElement?.offsetWidth ?? 220}px`,
          visibility: position ? "visible" : "hidden",
        } as CSSProperties
      }
    >
      <motion.div
        className="uk-select__surface"
        style={{ transformOrigin: transformOrigin(position?.side ?? "bottom") }}
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }
        }
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={
          reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -2 }
        }
        transition={
          reduceMotion ? REDUCED_MOTION_TRANSITION : DISCLOSURE_TRANSITION
        }
      >
        {context.options.length === 0 ? (
          <p className="uk-select__empty">{emptyText}</p>
        ) : (
          <LayoutGroup id={`select-${context.contentId}`}>
            <ul
              id={context.contentId}
              className="uk-select__list"
              role="listbox"
              aria-labelledby={triggerId}
            >
              {context.options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${context.contentId}-option-${index}`}
                  role="option"
                  aria-disabled={option.disabled || undefined}
                  aria-selected={option.value === context.value}
                  data-disabled={option.disabled || undefined}
                  data-selected={option.value === context.value || undefined}
                  data-active={index === context.activeIndex || undefined}
                  className="uk-select__option"
                  onPointerEnter={(event: ReactPointerEvent<HTMLLIElement>) => {
                    if (event.pointerType === "mouse" && !option.disabled) {
                      context.setActiveIndex(index);
                    }
                  }}
                  onClick={(event: ReactMouseEvent<HTMLLIElement>) => {
                    event.stopPropagation();
                    context.commit(index);
                  }}
                >
                  <AnimatePresence initial={false}>
                    {index === context.activeIndex ? (
                      <motion.span
                        className="uk-select__option-highlight"
                        data-slot="select-active-highlight"
                        layoutId={`${context.contentId}-active`}
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={
                          reduceMotion ? { duration: 0 } : INDICATOR_SPRING
                        }
                      />
                    ) : null}
                  </AnimatePresence>
                  <span className="uk-select__option-label">
                    {option.label ?? option.value}
                  </span>
                  <span aria-hidden="true" className="uk-select__check" />
                </li>
              ))}
            </ul>
          </LayoutGroup>
        )}
      </motion.div>
    </div>,
    portalContainer,
  );
}

/** Select 单控件：受控/非受控选择、键盘搜索语义由内部共享。 */
const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    size = "md",
    disabled,
    invalid,
    emptyText = "暂无可选项",
    className,
    ...rest
  },
  ref,
) {
  return (
    <SelectRoot
      options={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <SelectTrigger
        {...rest}
        ref={ref}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        data-size={size}
        className={className}
      />
      <SelectPresence emptyText={emptyText} />
    </SelectRoot>
  );
});

function SelectPresence({ emptyText }: { emptyText: string }): ReactElement {
  const context = useSelectContext("Select.Content");

  return (
    <AnimatePresence>
      {context.open ? (
        <SelectLayer key="select-layer" emptyText={emptyText} />
      ) : null}
    </AnimatePresence>
  );
}

export { Select };
