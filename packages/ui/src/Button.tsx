import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";
import { cx } from "./utils/cx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉层级，默认 primary。 */
  variant?: ButtonVariant;
  /** 尺寸，默认 md。 */
  size?: ButtonSize;
  /** 展示加载指示器并禁用点击。 */
  loading?: boolean;
  /** 仅包含图标时使用方形内边距，需自行提供 aria-label。 */
  iconOnly?: boolean;
  children?: ReactNode;
}

/**
 * 基础按钮。
 *
 * 样式由 data-variant / data-size 驱动，所有原生 button 属性都会透传。
 * loading 时自动设置 disabled 与 aria-busy，避免重复提交。
 */
export const Button: ForwardRefExoticComponent<
  ButtonProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    iconOnly = false,
    type = "button",
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={cx("uk-button", className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      data-icon-only={iconOnly ? "true" : undefined}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="uk-button__spinner" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
});
