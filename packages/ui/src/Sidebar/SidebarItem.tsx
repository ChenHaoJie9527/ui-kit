import {
  cloneElement,
  isValidElement,
  useId,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { INDICATOR_SPRING } from "../motion";
import { cx } from "../utils/cx";
import { useSidebarContext } from "./sidebar-context";
import { composeHandler } from "./sidebar-context";

export interface SidebarItemProps {
  /** 当前页面是否对应此链接。 */
  active?: boolean;
  /** 单个原生链接或路由链接元素。 */
  children: ReactElement;
  /** 追加到链接元素的类名。 */
  className?: string;
}

type ClassNameValue =
  | string
  | ((args: {
      isActive: boolean;
      isPending: boolean;
      isTransitioning: boolean;
    }) => string | undefined);

export function SidebarItem({
  active = false,
  children,
  className,
}: SidebarItemProps): ReactElement {
  const context = useSidebarContext("Sidebar.Item");
  const itemId = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const indicatorTransition = reduceMotion ? { duration: 0 } : INDICATOR_SPRING;

  if (!isValidElement(children)) {
    throw new Error("<Sidebar.Item> expects a single valid React element");
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const childClassName = childProps.className as ClassNameValue | undefined;
  const mergedClassName =
    typeof childClassName === "function"
      ? (args: {
          isActive: boolean;
          isPending: boolean;
          isTransitioning: boolean;
        }) => cx("uk-sidebar__link", childClassName(args), className)
      : cx("uk-sidebar__link", childClassName, className);
  const childPointerEnter = childProps.onPointerEnter as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const childPointerLeave = childProps.onPointerLeave as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const childPointerCancel = childProps.onPointerCancel as
    | ((event: ReactPointerEvent<HTMLElement>) => void)
    | undefined;
  const hovered = context.hoveredId === itemId;

  const content = (
    <>
      <span className="uk-sidebar__rail" aria-hidden="true" />
      <AnimatePresence initial={false}>
        {context.hoverPreview &&
        context.hoverIndicator === "rail" &&
        hovered ? (
          <motion.span
            className="uk-sidebar__rail-indicator"
            data-kind="hover"
            data-slot="sidebar-hover-rail-indicator"
            layoutId={`${context.indicatorBaseId}-hover-rail`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={indicatorTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {context.hoverIndicator === "rail" && active ? (
          <motion.span
            className="uk-sidebar__rail-indicator"
            data-kind="active"
            data-slot="sidebar-active-rail-indicator"
            layoutId={`${context.indicatorBaseId}-active-rail`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={indicatorTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {context.hoverPreview &&
        context.hoverIndicator === "background" &&
        hovered ? (
          <motion.span
            className="uk-sidebar__surface"
            data-kind="hover"
            data-slot="sidebar-hover-highlight"
            layoutId={`${context.indicatorBaseId}-hover`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={indicatorTransition}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {context.hoverIndicator === "background" && active ? (
          <motion.span
            className="uk-sidebar__surface"
            data-kind="active"
            data-slot="sidebar-active-highlight"
            layoutId={`${context.indicatorBaseId}-active`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={indicatorTransition}
          />
        ) : null}
      </AnimatePresence>
      <span className="uk-sidebar__label">
        {childProps.children as ReactNode}
      </span>
    </>
  );

  return (
    <li className="uk-sidebar__item">
      {cloneElement(
        child,
        {
          className: mergedClassName,
          "data-active": active ? "true" : "false",
          "data-preview": active || hovered ? "true" : "false",
          "aria-current":
            childProps["aria-current"] ?? (active ? "page" : undefined),
          onPointerEnter: composeHandler(
            childPointerEnter,
            (event: ReactPointerEvent<HTMLElement>) => {
              if (context.hoverPreview && event.pointerType === "mouse") {
                context.setHoveredId(itemId);
              }
            },
          ),
          onPointerLeave: composeHandler(childPointerLeave, () => {
            if (context.hoveredId === itemId) {
              context.setHoveredId(null);
            }
          }),
          onPointerCancel: composeHandler(childPointerCancel, () => {
            if (context.hoveredId === itemId) {
              context.setHoveredId(null);
            }
          }),
        },
        content,
      )}
    </li>
  );
}

/**
 * 分组文档导航。
 *
 * 根节点保持原生 `<nav>`，Group 生成带名称的分组，Item 包装单个链接。
 * hoverIndicator 在轨道游标与共享布局背景之间二选一，hover 和当前项使用
 * 同一种反馈；Group 可按需展开和收起，同时保持链接的 Tab 顺序、焦点、
 * 原生事件和 aria-current 行为。
 */
