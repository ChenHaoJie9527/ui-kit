import { forwardRef, type HTMLAttributes, type ReactElement } from "react";

import { cx } from "../utils/cx";
import { useProgressContext } from "./progress-context";

export interface ProgressValueProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "className"
> {
  /**
   * 自定义值文本。参数为当前值、min、max；不传时显示
   * 占范围的百分比（如 "42%"）。
   */
  format?: (value: number, min: number, max: number) => string;
  /** 合并到值元素。 */
  className?: string;
}

/**
 * 当前进度的文本展示。默认显示占范围的百分比；
 * 不确定进度时渲染为空。
 */
export const ProgressValue = forwardRef<HTMLSpanElement, ProgressValueProps>(
  function ProgressValue(
    { format, className, ...rest },
    ref,
  ): ReactElement | null {
    const { value, min, max, normalized } = useProgressContext("ProgressValue");

    if (value == null || normalized == null) {
      return null;
    }

    const text = format
      ? format(value, min, max)
      : `${Math.round(normalized)}%`;

    return (
      <span {...rest} ref={ref} className={cx("uk-progress__value", className)}>
        {text}
      </span>
    );
  },
);
