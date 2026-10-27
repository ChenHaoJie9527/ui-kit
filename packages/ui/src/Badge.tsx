import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
} from "react";
import { cx } from "./utils/cx";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export type BadgeDismissEvent =
  | MouseEvent<HTMLButtonElement>
  | KeyboardEvent<HTMLButtonElement>;

export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "onChange"
> {
  /** 视觉与语义颜色，默认 default。 */
  variant?: BadgeVariant;
  /** 简短的状态或元数据内容；Badge 不自动截断或换行。 */
  children: ReactNode;
  /** 激活关闭按钮时调用；不会自动移除 Badge。 */
  onDismiss?: (event: BadgeDismissEvent) => void;
  /** 是否显示关闭按钮，默认 Boolean(onDismiss)。 */
  dismissible?: boolean;
  /** 关闭按钮的无障碍名称，建议明确指出被移除的对象。 */
  dismissLabel?: string;
  /** 仅禁用关闭操作，不影响 Badge 内容显示。 */
  dismissDisabled?: boolean;
  /** 仅应用于关闭按钮的额外类名。 */
  dismissButtonClassName?: string;
}

const DEFAULT_DISMISS_LABEL = "Dismiss badge";

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
 * 默认只渲染语义中性的 span，不添加 live region 或入场动画。提供
 * onDismiss 时显示原生关闭按钮；是否移除 Badge 始终由调用方控制。
 */
export const Badge: ForwardRefExoticComponent<
  BadgeProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = "default",
    children,
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
  const requestedDismiss = dismissible ?? Boolean(onDismiss);
  const missingHandler = requestedDismiss && !onDismiss;
  const showDismiss = requestedDismiss && Boolean(onDismiss);
  const emptyContent = isEmptyContent(children);

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
    <span
      {...rest}
      ref={ref}
      className={cx("uk-badge", className)}
      data-variant={variant}
      data-dismissible={showDismiss ? "true" : undefined}
    >
      {emptyContent && !showDismiss ? null : (
        <span className="uk-badge__label">{children}</span>
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
    </span>
  );
});
