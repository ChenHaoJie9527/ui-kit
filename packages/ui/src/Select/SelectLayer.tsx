import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { createPortal } from "react-dom";

import {
  DISCLOSURE_TRANSITION,
  INDICATOR_SPRING,
  REDUCED_MOTION_TRANSITION,
  SELECT_SUBMENU_TRANSITION,
} from "../motion";
import { type SelectOptionNode, useSelectContext } from "./select-context";
import {
  clamp,
  firstChildNodeIndex,
  getClientSnapshot,
  getServerSnapshot,
  hasSelectedDescendant,
  subscribeToNothing,
  transformOrigin,
  type SelectPosition,
  type SelectSubmenu,
} from "./select-utils";

function useSelectPosition(
  triggerElement: HTMLElement | null,
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
  ) as HTMLElement | null;
  const floatingRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isPresent = useIsPresent();
  const position = useSelectPosition(triggerElement, floatingRef);
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [submenus, setSubmenus] = useState<Array<SelectSubmenu>>([]);
  const [submenuSession, setSubmenuSession] = useState(0);
  const optionNodeRefs = useRef(new Map<number, HTMLLIElement>());
  const submenuRefs = useRef(new Map<number, HTMLDivElement>());
  const [renderedOpen, setRenderedOpen] = useState(context.open);
  const [surfaceSettled, setSurfaceSettled] = useState(false);

  if (renderedOpen !== context.open) {
    setRenderedOpen(context.open);
    setSurfaceSettled(false);

    if (!context.open) {
      setSubmenus([]);
      setSubmenuSession((session) => session + 1);
    }
  }

  useEffect(() => {
    if (!context.open || !position || !surfaceSettled) {
      return;
    }

    setSubmenus((previous) => {
      const node = context.optionNodes[context.activeIndex];

      if (!node) {
        return previous;
      }

      const ancestorIndexes: Array<number> = [];
      let ancestor: number | null = node.hasChildren
        ? (context.optionNodes[node.index]?.parentIndex ?? null)
        : node.parentIndex;

      while (ancestor != null) {
        ancestorIndexes.unshift(ancestor);
        ancestor = context.optionNodes[ancestor]?.parentIndex ?? null;
      }

      const targetParentIndexes = node.hasChildren
        ? [...ancestorIndexes, node.index]
        : ancestorIndexes;
      const lastParentIndex =
        targetParentIndexes[targetParentIndexes.length - 1];
      const deepestLevel =
        lastParentIndex == null
          ? 0
          : (context.optionNodes[lastParentIndex]?.depth ?? 0) + 1;
      let next = previous.filter((submenu) => submenu.level <= deepestLevel);
      let changed = next.length !== previous.length;

      for (const parentIndex of targetParentIndexes) {
        const parentNode = context.optionNodes[parentIndex];

        if (!parentNode) {
          continue;
        }

        const level = parentNode.depth + 1;
        const parentElement = optionNodeRefs.current.get(parentIndex);

        if (!parentElement) {
          continue;
        }

        const parentRect = parentElement.getBoundingClientRect();
        const estimatedWidth = 224;
        const flipLeft =
          parentRect.right + estimatedWidth + 14 > window.innerWidth;
        const left = flipLeft
          ? parentRect.left - estimatedWidth - 6
          : parentRect.right + 6;
        const top = clamp(parentRect.top - 6, 8, window.innerHeight - 8);
        const existing = next.find((submenu) => submenu.level === level);

        if (existing?.parentIndex === parentIndex) {
          if (existing.left === left && existing.top === top) {
            continue;
          }

          next = [
            ...next.filter((submenu) => submenu.level !== level),
            { ...existing, left, top },
          ];
          changed = true;
          continue;
        }

        next = [
          ...next.filter((submenu) => submenu.level !== level),
          {
            session: submenuSession,
            level,
            parentIndex,
            left,
            top,
          },
        ];
        changed = true;
      }

      return changed ? next : previous;
    });
  }, [
    context.activeIndex,
    context.open,
    context.optionNodes,
    submenuSession,
    position,
    surfaceSettled,
    setSubmenus,
  ]);

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
        floatingRef.current?.contains(target) ||
        Array.from(submenuRefs.current.values()).some((element) =>
          element.contains(target),
        )
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

  const setOptionNodeRef = useCallback(
    (index: number, element: HTMLLIElement | null) => {
      if (element) {
        optionNodeRefs.current.set(index, element);
      } else {
        optionNodeRefs.current.delete(index);
      }
    },
    [],
  );

  const renderOptionNode = (node: SelectOptionNode): ReactElement => {
    const option = node.option;
    const selected = context.values.includes(option.value);
    const active = node.index === context.activeIndex;

    return (
      <li
        key={option.value}
        ref={(element) => setOptionNodeRef(node.index, element)}
        id={`${context.contentId}-option-${node.index}`}
        role="option"
        aria-disabled={option.disabled || undefined}
        aria-selected={selected}
        data-disabled={option.disabled || undefined}
        data-selected={
          selected || hasSelectedDescendant(option, context.values) || undefined
        }
        data-active={active || undefined}
        data-has-children={node.hasChildren || undefined}
        data-depth={node.depth}
        className="uk-select__option"
        onPointerEnter={(event: ReactPointerEvent<HTMLLIElement>) => {
          if (event.pointerType === "mouse" && !option.disabled) {
            context.setActiveIndex(node.index);
          }
        }}
        onClick={(event: ReactMouseEvent<HTMLLIElement>) => {
          event.stopPropagation();

          if (node.hasChildren) {
            context.setActiveIndex(
              firstChildNodeIndex(context.optionNodes, node.index),
            );
            return;
          }

          context.commit(node.index);
        }}
      >
        <AnimatePresence initial={false}>
          {active ? (
            <motion.span
              className="uk-select__option-highlight"
              data-slot="select-active-highlight"
              layoutId={`${context.contentId}-active-${node.depth}`}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : INDICATOR_SPRING}
            />
          ) : null}
        </AnimatePresence>
        <span className="uk-select__option-label">
          {option.label ?? option.value}
        </span>
        {node.hasChildren ? (
          <span aria-hidden="true" className="uk-select__expand">
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="m6 4 4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          <span aria-hidden="true" className="uk-select__check" />
        )}
      </li>
    );
  };

  const visibleSubmenus = context.open ? submenus : [];

  return createPortal(
    <LayoutGroup id={`select-${context.contentId}`}>
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
          style={{
            transformOrigin: transformOrigin(position?.side ?? "bottom"),
          }}
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }
          }
          animate={
            reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
          }
          exit={
            reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -2 }
          }
          transition={
            reduceMotion ? REDUCED_MOTION_TRANSITION : DISCLOSURE_TRANSITION
          }
          onAnimationComplete={() => {
            if (context.open) {
              setSurfaceSettled(true);
            }
          }}
        >
          {context.options.length === 0 ? (
            <p className="uk-select__empty">{emptyText}</p>
          ) : (
            <ul
              id={context.contentId}
              className="uk-select__list"
              role="listbox"
              aria-labelledby={triggerId}
              aria-owns={
                visibleSubmenus
                  .map(
                    (submenu) =>
                      `${context.contentId}-submenu-${submenu.level}`,
                  )
                  .join(" ") || undefined
              }
            >
              {context.optionNodes
                .filter((node) => node.depth === 0)
                .map(renderOptionNode)}
            </ul>
          )}
        </motion.div>
      </div>
      {visibleSubmenus.map((submenu) => {
        const submenuOptions = context.optionNodes.filter(
          (node) => node.parentIndex === submenu.parentIndex,
        );

        return (
          <motion.div
            key={`${submenu.session}-${submenu.level}`}
            ref={(element) => {
              if (element) {
                submenuRefs.current.set(submenu.level, element);
              } else {
                submenuRefs.current.delete(submenu.level);
              }
            }}
            className="uk-select__submenu"
            data-select-owner={context.contentId}
            data-state={isPresent ? "open" : "closed"}
            layout
            initial={{
              opacity: 0,
              x: -34,
              scaleX: 0.18,
              scaleY: 0.36,
            }}
            animate={{ opacity: 1, x: 0, scaleX: 1, scaleY: 1 }}
            exit={{ opacity: 0, x: -16, scaleX: 0.28, scaleY: 0.42 }}
            style={{
              left: submenu.left,
              top: submenu.top,
              transformOrigin: "left center",
            }}
            transition={
              reduceMotion
                ? REDUCED_MOTION_TRANSITION
                : SELECT_SUBMENU_TRANSITION
            }
          >
            <ul
              id={`${context.contentId}-submenu-${submenu.level}`}
              className="uk-select__list"
              role="listbox"
              aria-labelledby={triggerId}
            >
              {submenuOptions.map(renderOptionNode)}
            </ul>
          </motion.div>
        );
      })}
    </LayoutGroup>,
    portalContainer,
  );
}

/** Select 单控件：受控/非受控选择、键盘搜索语义由内部共享。 */

export function SelectPresence({
  emptyText,
}: {
  emptyText: string;
}): ReactElement {
  const context = useSelectContext("Select.Content");

  return (
    <AnimatePresence>
      {context.open ? (
        <SelectLayer key="select-layer" emptyText={emptyText} />
      ) : null}
    </AnimatePresence>
  );
}
