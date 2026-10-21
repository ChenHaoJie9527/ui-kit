import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { INDICATOR_SPRING } from "./motion";
import { cx } from "./utils/cx";

interface SidebarContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  indicatorBaseId: string;
  hoverPreview: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext(component: string): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Sidebar>`);
  }

  return context;
}

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

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  /**
   * 鼠标悬停时是否显示与当前项并列的预览指示器。
   *
   * @default true
   */
  hoverPreview?: boolean;
}

function SidebarRoot({
  children,
  className,
  hoverPreview = true,
  ...rest
}: SidebarProps): ReactElement {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const indicatorBaseId = useId().replace(/:/g, "");
  const context = useMemo<SidebarContextValue>(
    () => ({ hoveredId, setHoveredId, indicatorBaseId, hoverPreview }),
    [hoveredId, indicatorBaseId, hoverPreview],
  );

  return (
    <SidebarContext.Provider value={context}>
      <LayoutGroup id={`sidebar-${indicatorBaseId}`}>
        <nav {...rest} className={cx("uk-sidebar", className)}>
          {children}
        </nav>
      </LayoutGroup>
    </SidebarContext.Provider>
  );
}

export interface SidebarGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  /** 分类名称。 */
  title: ReactNode;
  /** 分类标题前的视觉图标，不作为额外可访问名称。 */
  icon?: ReactNode;
  children?: ReactNode;
}

function SidebarGroup({
  title,
  icon,
  children,
  className,
  ...rest
}: SidebarGroupProps): ReactElement {
  const titleId = useId();
  const hasIcon = icon !== undefined && icon !== null;

  return (
    <section
      {...rest}
      className={cx("uk-sidebar__group", className)}
      aria-labelledby={rest["aria-labelledby"] ?? titleId}
      data-has-icon={hasIcon ? "true" : "false"}
    >
      <p className="uk-sidebar__group-title" id={titleId}>
        {hasIcon ? (
          <span className="uk-sidebar__group-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span>{title}</span>
      </p>
      <ul className="uk-sidebar__list">{children}</ul>
    </section>
  );
}

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

function SidebarItem({
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
        {context.hoverPreview && hovered ? (
          <motion.span
            className="uk-sidebar__indicator"
            data-kind="hover"
            data-slot="sidebar-hover-indicator"
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
        {active ? (
          <motion.span
            className="uk-sidebar__indicator"
            data-kind="active"
            data-slot="sidebar-active-indicator"
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
 * 当前项和鼠标预览使用两个独立的共享布局指示器；链接的 Tab 顺序、焦点、
 * 原生事件和 aria-current 行为保持不变。
 */
export interface SidebarComponent {
  (props: SidebarProps): ReactElement;
  Group: typeof SidebarGroup;
  Item: typeof SidebarItem;
}

export const Sidebar: SidebarComponent = Object.assign(SidebarRoot, {
  Group: SidebarGroup,
  Item: SidebarItem,
});
