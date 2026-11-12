import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState } from "seam-hooks";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DISCLOSURE_TRANSITION, INDICATOR_SPRING } from "../motion";
import { cx } from "../utils/cx";
import { useSidebarContext } from "./sidebar-context";

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

export function SidebarGroup({
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
