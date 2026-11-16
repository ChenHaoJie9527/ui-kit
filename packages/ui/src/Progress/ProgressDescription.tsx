import {
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cx } from "../utils/cx";

export interface ProgressDescriptionProps extends Omit<
  HTMLAttributes<HTMLOutputElement>,
  "children" | "className"
> {
  /** 动态状态文案。 */
  children: ReactNode;
  /** 合并到文案元素。 */
  className?: string;
}

/**
 * 进度进行中的动态状态文案，使用原生 <output>（隐式 role="status"、
 * aria-live="polite"），内容变化时屏幕阅读器会播报。
 *
 * 由 Progress 根组件放置在轨道下方、progressbar 语义元素之外，
 * 与数值播报互不干扰。
 */
export const ProgressDescription = forwardRef<
  HTMLOutputElement,
  ProgressDescriptionProps
>(function ProgressDescription(
  { children, className, ...rest },
  ref,
): ReactElement {
  return (
    <output
      {...rest}
      ref={ref}
      className={cx("uk-progress__description", className)}
    >
      {children}
    </output>
  );
});
