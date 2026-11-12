import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEventCallback } from "seam-hooks";

import { TAG_TRANSITION } from "../motion";
import { cx } from "../utils/cx";
import { useSelectContext } from "./select-context";
import {
  composeHandler,
  findSelectOption,
  firstChildNodeIndex,
  moveActiveIndex,
} from "./select-utils";
import type { SelectSize } from "./SelectRoot";

export const SelectTrigger = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    placeholder?: string;
    size?: SelectSize;
    clear?: boolean;
    loadingText?: string;
    disabled?: boolean;
  }
>(function SelectTrigger(
  {
    className,
    placeholder = "请选择",
    size = "md",
    clear = false,
    loadingText = "加载中...",
    disabled,
    onPointerDown,
    onKeyDown,
    ...rest
  },
  forwardedRef,
) {
  const context = useSelectContext("Select.Trigger");
  const reduceMotion = useReducedMotion() ?? false;
  const selectedOptions = context.values.map((value) => {
    const option = findSelectOption(context.options, value);

    return option ?? { value, label: value };
  });
  const selectedOption = selectedOptions[0];
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
    if (context.loading) {
      return;
    }

    const state = typeaheadRef.current;

    if (state.timer) {
      clearTimeout(state.timer);
    }

    state.search += character.toLowerCase();
    state.timer = setTimeout(clearTypeahead, 500);

    const labels = context.optionNodes.map((node) => {
      const label = node.option.label;

      return (
        typeof label === "string" ? label : node.option.value
      ).toLowerCase();
    });
    const startIndex =
      context.open && context.activeIndex >= 0 ? context.activeIndex + 1 : 0;
    const orderedIndexes = Array.from(
      { length: labels.length },
      (_, index) => (startIndex + index) % labels.length,
    );
    const exact = orderedIndexes.find(
      (index) =>
        !context.optionNodes[index]?.option.disabled &&
        labels[index]?.startsWith(state.search),
    );
    const fuzzy = orderedIndexes.find(
      (index) =>
        !context.optionNodes[index]?.option.disabled &&
        labels[index]?.includes(state.search),
    );
    const match = exact ?? fuzzy;

    if (match === undefined) {
      return;
    }

    if (context.open) {
      context.setActiveIndex(match);
    } else if (context.multiple || context.optionNodes[match]?.hasChildren) {
      context.setActiveIndex(match);
      context.setOpen(true);
    } else {
      context.commit(match);
    }
  });

  const handlePointerDown = useEventCallback(
    (_event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || context.loading) {
        return;
      }

      context.setOpen(!context.open);
    },
  );

  const handleKeyDown = useEventCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled || context.loading) {
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

      if (event.key === "Backspace" && context.multiple) {
        const lastValue = context.values[context.values.length - 1];

        if (lastValue) {
          event.preventDefault();
          context.removeValue(lastValue);
        }

        return;
      }

      if (!context.open) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          context.setOpen(true);
          if (!context.loading) {
            context.setActiveIndex(
              context.activeIndex >= 0
                ? context.activeIndex
                : moveActiveIndex(context.optionNodes, -1, 1),
            );
          }
        }

        return;
      }

      if (event.key === "Escape" || event.key === "Tab") {
        context.setOpen(false);
        event.currentTarget.focus();
        return;
      }

      const activeNode = context.optionNodes[context.activeIndex];

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (activeNode?.hasChildren) {
          context.setActiveIndex(
            firstChildNodeIndex(context.optionNodes, context.activeIndex),
          );
          event.currentTarget.focus();
          return;
        }

        context.commit(context.activeIndex);
        event.currentTarget.focus();
        return;
      }

      if (event.key === "ArrowRight" && activeNode?.hasChildren) {
        event.preventDefault();
        context.setActiveIndex(
          firstChildNodeIndex(context.optionNodes, context.activeIndex),
        );
        return;
      }

      if (event.key === "ArrowLeft" && activeNode?.parentIndex != null) {
        event.preventDefault();
        context.setActiveIndex(activeNode.parentIndex);
        return;
      }

      if (context.loading) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        context.setActiveIndex(
          moveActiveIndex(context.optionNodes, context.activeIndex, 1),
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        context.setActiveIndex(
          moveActiveIndex(context.optionNodes, context.activeIndex, -1),
        );
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const direction = event.key === "Home" ? 1 : -1;
        const start = event.key === "Home" ? -1 : context.optionNodes.length;
        context.setActiveIndex(
          moveActiveIndex(context.optionNodes, start, direction, false),
        );
      }
    },
  );

  return (
    <div
      {...rest}
      ref={forwardedRef}
      id={context.triggerId}
      role="combobox"
      tabIndex={disabled || context.loading ? -1 : 0}
      aria-disabled={disabled || context.loading || undefined}
      aria-expanded={context.open}
      aria-busy={context.loading || undefined}
      aria-haspopup="listbox"
      aria-controls={context.open ? context.contentId : undefined}
      aria-activedescendant={
        context.open && context.optionNodes[context.activeIndex]
          ? `${context.contentId}-option-${context.activeIndex}`
          : undefined
      }
      data-size={size}
      data-multiple={context.multiple || undefined}
      data-loading={context.loading || undefined}
      className={cx("uk-select__trigger", className)}
      onPointerDown={composeHandler(onPointerDown, handlePointerDown)}
      onKeyDown={composeHandler(onKeyDown, handleKeyDown)}
    >
      {context.multiple ? (
        <span className="uk-select__tags">
          <AnimatePresence initial={false}>
            {selectedOptions.map((option) => {
              const label = option.label ?? option.value;
              const accessibleLabel =
                typeof label === "string" ? label : option.value;

              return (
                <motion.span
                  key={option.value}
                  className="uk-select__tag"
                  data-slot="select-tag"
                  layout
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }
                  }
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 4 }}
                  transition={reduceMotion ? { duration: 0 } : TAG_TRANSITION}
                >
                  <span className="uk-select__tag-label">{label}</span>
                  <button
                    type="button"
                    className="uk-select__tag-remove"
                    disabled={disabled}
                    aria-label={`移除 ${accessibleLabel}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace") {
                        event.stopPropagation();
                      }
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      context.removeValue(option.value);
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l6 6M11 5l-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
          {selectedOptions.length === 0 ? (
            <span className="uk-select__placeholder">{placeholder}</span>
          ) : null}
        </span>
      ) : (
        <span className="uk-select__value">
          {selectedOption?.label ?? context.values[0] ?? placeholder}
        </span>
      )}
      <span className="uk-select__actions">
        {clear && !disabled && !context.loading && context.values.length > 0 ? (
          <button
            type="button"
            className="uk-select__clear"
            aria-label="清空"
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (["Backspace", " "].includes(event.key)) {
                event.stopPropagation();
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              document.getElementById(context.triggerId)?.focus();
              context.clearValues();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}
        <span
          aria-hidden="true"
          className={cx(
            "uk-select__chevron",
            context.loading && "uk-select__spinner",
          )}
        >
          {context.loading ? null : (
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="m4 6.2 4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
      {context.loading ? (
        <span
          className="uk-select__loading-status"
          role="status"
          aria-live="polite"
        >
          {loadingText}
        </span>
      ) : null}
    </div>
  );
});
