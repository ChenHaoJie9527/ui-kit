import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import { useControllableState } from "seam-hooks";
import { DISCLOSURE_TRANSITION, INDICATOR_SPRING } from "./motion";
import { cx } from "./utils/cx";

interface SidebarContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  indicatorBaseId: string;
  hoverPreview: boolean;
  hoverIndicator: SidebarHoverIndicator;
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
   * 鼠标悬停时是否显示会跟随指针移动的背景预览。
   *
   * @default true
   */
  hoverPreview?: boolean;
  /**
   * 鼠标预览的互斥呈现方式：轨道游标或整行背景。
   *
   * @default "rail"
   */
  hoverIndicator?: SidebarHoverIndicator;
  /**
   * 分组之间的垂直间距。数字按 px 处理，也可传入 CSS 长度字符串。
   *
   * @default "1.5rem"
   */
  groupGap?: number | string;
}

export type SidebarHoverIndicator = "rail" | "background";

function SidebarRoot({
  children,
  className,
  hoverPreview = true,
  hoverIndicator = "rail",
  groupGap,
  style,
  ...rest
}: SidebarProps): ReactElement {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const indicatorBaseId = useId().replace(/:/g, "");
  const context = useMemo<SidebarContextValue>(
    () => ({
      hoveredId,
      setHoveredId,
      indicatorBaseId,
      hoverPreview,
      hoverIndicator,
    }),
    [hoveredId, indicatorBaseId, hoverPreview, hoverIndicator],
  );
  const groupGapValue =
    typeof groupGap === "number" ? `${groupGap}px` : groupGap;
  const rootStyle = {
    ...style,
    ...(groupGapValue === undefined
      ? {}
      : { "--uk-sidebar-group-gap": groupGapValue }),
  } as CSSProperties;

  return (
    <SidebarContext.Provider value={context}>
      <LayoutGroup id={`sidebar-${indicatorBaseId}`}>
        <nav
          {...rest}
          className={cx("uk-sidebar", className)}
          style={rootStyle}
        >
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
  /** 是否允许用户展开和收起该分组。默认保持展开且不显示触发器。 */
  collapsible?: boolean;
  /** 受控展开状态。 */
  open?: boolean;
  /** 非受控模式下是否默认展开。 */
  defaultOpen?: boolean;
  /** 展开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

function SidebarGroup({
  title,
  icon,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  children,
  className,
  ...rest
}: SidebarGroupProps): ReactElement {
  const titleId = useId();
  const contentId = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const context = useSidebarContext("Sidebar.Group");
  const hasIcon = icon !== undefined && icon !== null;
  const reduceMotion = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const isOpen = collapsible ? expanded : true;
  const triggerHovered = context.hoveredId === triggerId;

  useEffect(() => {
    if (!collapsible || isOpen) {
      return;
    }

    if (contentRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
  }, [collapsible, isOpen]);

  const titleContent = (
    <>
      {hasIcon ? (
        <span className="uk-sidebar__group-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="uk-sidebar__group-label">{title}</span>
      {collapsible ? (
        <span className="uk-sidebar__chevron" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
            <path
              d="m6 3.8 4.2 4.2L6 12.2"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : null}
    </>
  );

  return (
    <section
      {...rest}
      className={cx("uk-sidebar__group", className)}
      aria-labelledby={rest["aria-labelledby"] ?? titleId}
      data-collapsible={collapsible ? "true" : "false"}
      data-has-icon={hasIcon ? "true" : "false"}
      data-state={isOpen ? "open" : "closed"}
    >
      {collapsible ? (
        <button
          ref={triggerRef}
          type="button"
          className="uk-sidebar__group-title uk-sidebar__group-trigger"
          id={titleId}
          aria-controls={contentId}
          aria-expanded={isOpen}
          data-preview={
            context.hoverIndicator === "background" && triggerHovered
              ? "true"
              : undefined
          }
          onClick={() => setExpanded((value) => !value)}
          onPointerEnter={(event) => {
            if (
              context.hoverPreview &&
              context.hoverIndicator === "background" &&
              event.pointerType === "mouse"
            ) {
              context.setHoveredId(triggerId);
            }
          }}
          onPointerLeave={() => {
            if (context.hoveredId === triggerId) {
              context.setHoveredId(null);
            }
          }}
          onPointerCancel={() => {
            if (context.hoveredId === triggerId) {
              context.setHoveredId(null);
            }
          }}
        >
          <AnimatePresence initial={false}>
            {context.hoverPreview &&
            context.hoverIndicator === "background" &&
            triggerHovered ? (
              <motion.span
                className="uk-sidebar__group-surface"
                data-kind="hover"
                data-slot="sidebar-hover-highlight"
                layoutId={`${context.indicatorBaseId}-hover`}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : INDICATOR_SPRING}
              />
            ) : null}
          </AnimatePresence>
          {titleContent}
        </button>
      ) : (
        <div className="uk-sidebar__group-title" id={titleId}>
          {titleContent}
        </div>
      )}
      <motion.div
        ref={contentRef}
        className="uk-sidebar__content"
        id={contentId}
        data-state={isOpen ? "open" : "closed"}
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={reduceMotion ? { duration: 0 } : DISCLOSURE_TRANSITION}
        inert={collapsible && !isOpen}
        aria-hidden={collapsible && !isOpen ? true : undefined}
      >
        <ul className="uk-sidebar__list">{children}</ul>
      </motion.div>
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
export interface SidebarComponent {
  (props: SidebarProps): ReactElement;
  Group: typeof SidebarGroup;
  Item: typeof SidebarItem;
}

export const Sidebar: SidebarComponent = Object.assign(SidebarRoot, {
  Group: SidebarGroup,
  Item: SidebarItem,
});
