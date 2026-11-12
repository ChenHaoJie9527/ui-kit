import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { EASE_OUT, UI_SPRING } from "../motion";
import { cx } from "../utils/cx";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "loading";

export type BadgeSize = "sm" | "md";

export type BadgeDismissEvent =
  | MouseEvent<HTMLButtonElement>
  | KeyboardEvent<HTMLButtonElement>;

export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "onChange"
> {
  /** 视觉与语义颜色；loading 会显示 spinner 并默认开启脉冲。 */
  variant?: BadgeVariant;
  /** 尺寸，默认 md 保持既有高度与字号。 */
  size?: BadgeSize;
  /** 简短的状态或元数据内容；Badge 不自动截断或换行。 */
  children: ReactNode;
  /** 覆盖当前 variant 的默认状态图标；图标需要控制在 1em 见方内。 */
  icon?: ReactNode;
  /** 是否显示状态图标，默认 true。 */
  showIcon?: boolean;
  /** 是否显示脉冲；默认只在 variant 为 loading 时开启。 */
  pulse?: boolean;
  /** 状态切换动画的稳定 key；默认取 children（文本）或 variant。 */
  contentKey?: string | number;
  /** 激活关闭按钮时调用；不会自动移除 Badge。 */
  onDismiss?: (event: BadgeDismissEvent) => void;
  /** 是否显示关闭按钮，默认 Boolean(onDismiss)；loading 时始终隐藏。 */
  dismissible?: boolean;
  /** 关闭按钮的无障碍名称，建议明确指出被移除的对象。 */
  dismissLabel?: string;
  /** 仅禁用关闭操作，不影响 Badge 内容显示。 */
  dismissDisabled?: boolean;
  /** 仅应用于关闭按钮的额外类名。 */
  dismissButtonClassName?: string;
}

const DEFAULT_DISMISS_LABEL = "Dismiss badge";

const ICON_BASE_PROPS = {
  viewBox: "0 0 16 16",
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  focusable: "false",
} as const;

const STATUS_ICONS: Record<Exclude<BadgeVariant, "loading">, ReactNode> = {
  default: (
    <svg {...ICON_BASE_PROPS}>
      <circle cx="8" cy="8" r="5.5" />
    </svg>
  ),
  primary: (
    <svg {...ICON_BASE_PROPS}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.3v3.5" />
      <circle cx="8" cy="5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  success: (
    <svg {...ICON_BASE_PROPS}>
      <path d="M3.6 8.4 6.4 11.2 12.4 5.2" />
    </svg>
  ),
  warning: (
    <svg {...ICON_BASE_PROPS}>
      <path d="M8 3.1 14 12.9H2L8 3.1Z" />
      <path d="M8 6.9v2.6" />
      <circle cx="8" cy="11.2" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  ),
  danger: (
    <svg {...ICON_BASE_PROPS}>
      <path d="M5 5l6 6M11 5l-6 6" />
    </svg>
  ),
};

const ROLL_EXIT_TRANSITION = { duration: 0.14, ease: EASE_OUT } as const;
const ROLL_BLUR = "blur(3px)";

const ICON_ROLL_VARIANTS: Variants = {
  initial: { opacity: 0, y: 12, filter: ROLL_BLUR },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: UI_SPRING,
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: ROLL_BLUR,
    transition: ROLL_EXIT_TRANSITION,
  },
};

const TEXT_ROLL_VARIANTS: Variants = {
  initial: { opacity: 0, y: "90%", filter: ROLL_BLUR },
  animate: {
    opacity: 1,
    y: "0%",
    filter: "blur(0px)",
    transition: UI_SPRING,
  },
  exit: {
    opacity: 0,
    y: "-90%",
    filter: ROLL_BLUR,
    transition: ROLL_EXIT_TRANSITION,
  },
};

// Reduced motion swaps in place: the next content lands at rest and the
// leaving content hides on its first frame instead of overlapping it.
const REST = { opacity: 1, y: 0, filter: "blur(0px)" } as const;
const REST_EXIT = { opacity: 0, transition: { duration: 0 } } as const;

function warn(message: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[seam-ui Badge] ${message}`);
  }
}

function isEmptyContent(children: ReactNode): boolean {
  if (children === null || children === undefined || children === false) {
    return true;
  }

  if (Array.isArray(children)) {
    return children.every(isEmptyContent);
  }

  return typeof children === "string" && children.trim().length === 0;
}

/**
 * 紧凑的内联状态或元数据标签。
 *
 * 按 variant 自动配状态图标；loading 使用 spinner 与轻脉冲。状态或文案变化时
 * 图标和文字做一次短距离滚动替换，宽度通过共享 layout 连续过渡。默认不添加
 * live region，也不做挂载入场动画。
 */
export const Badge: ForwardRefExoticComponent<
  BadgeProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = "default",
    size = "md",
    children,
    icon,
    showIcon = true,
    pulse,
    contentKey,
    onDismiss,
    dismissible,
    dismissLabel,
    dismissDisabled = false,
    dismissButtonClassName,
    className,
    ...rest
  },
  ref,
) {
  const reduceMotion = useReducedMotion() ?? false;
  const loading = variant === "loading";
  const requestedDismiss = (dismissible ?? Boolean(onDismiss)) && !loading;
  const missingHandler = requestedDismiss && !onDismiss;
  const showDismiss = requestedDismiss && Boolean(onDismiss);
  const emptyContent = isEmptyContent(children);
  const showStatusIcon = showIcon && !emptyContent;
  const pulseActive = (pulse ?? loading) && !reduceMotion;
  const labelKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number"
      ? children
      : variant);
  // Reduced motion skips layout projection entirely: a zero-duration layout
  // animation would still paint one transformed frame.
  const slotLayout = reduceMotion ? false : ("position" as const);

  if (process.env.NODE_ENV !== "production") {
    if (dismissible === true && !onDismiss) {
      warn(
        "dismissible={true} requires onDismiss. The nonfunctional dismiss button was not rendered.",
      );
    }

    if (showDismiss && !dismissLabel?.trim()) {
      warn(
        `Provide dismissLabel to identify what is being dismissed. Falling back to "${DEFAULT_DISMISS_LABEL}".`,
      );
    }

    if (emptyContent) {
      warn(
        "Badge children are empty. Provide visible status or metadata content.",
      );
    }
  }

  return (
    <motion.span
      // motion 的拖拽回调与原生 onDrag 同名；Badge 不开放拖拽配置，这里只
      // 透传调用方传入的普通 span 属性。
      {...(rest as HTMLMotionProps<"span">)}
      ref={ref}
      layout={!reduceMotion}
      transition={UI_SPRING}
      className={cx("uk-badge", className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      data-dismissible={showDismiss ? "true" : undefined}
      aria-busy={loading || undefined}
    >
      {pulseActive ? (
        <motion.span
          aria-hidden="true"
          className="uk-badge__pulse"
          initial={{ opacity: 0.06 }}
          animate={{ opacity: [0.06, 0.18, 0.06] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      {showStatusIcon ? (
        <motion.span
          layout={slotLayout}
          transition={UI_SPRING}
          className="uk-badge__slot uk-badge__slot--icon"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={variant}
              aria-hidden="true"
              className="uk-badge__icon"
              variants={ICON_ROLL_VARIANTS}
              initial={reduceMotion ? false : "initial"}
              animate={reduceMotion ? REST : "animate"}
              exit={reduceMotion ? REST_EXIT : "exit"}
            >
              {loading ? (
                <span className="uk-badge__spinner" />
              ) : (
                (icon ?? STATUS_ICONS[variant])
              )}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      ) : null}

      {emptyContent ? null : (
        <motion.span
          layout={slotLayout}
          transition={UI_SPRING}
          className="uk-badge__slot uk-badge__slot--label"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={labelKey}
              className="uk-badge__label"
              variants={TEXT_ROLL_VARIANTS}
              initial={reduceMotion ? false : "initial"}
              animate={reduceMotion ? REST : "animate"}
              exit={reduceMotion ? REST_EXIT : "exit"}
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      )}

      {showDismiss ? (
        <button
          type="button"
          className={cx("uk-badge__dismiss", dismissButtonClassName)}
          aria-label={dismissLabel?.trim() || DEFAULT_DISMISS_LABEL}
          disabled={dismissDisabled || missingHandler}
          onClick={onDismiss}
        >
          <svg
            className="uk-badge__dismiss-icon"
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </motion.span>
  );
});
