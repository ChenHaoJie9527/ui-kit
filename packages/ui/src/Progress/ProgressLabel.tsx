import {
  forwardRef,
  useEffect,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cx } from "../utils/cx";
import { useProgressContext } from "./progress-context";

export interface ProgressLabelProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "className" | "id"
> {
  /** 标签文本。 */
  children: ReactNode;
  /** 合并到标签元素。 */
  className?: string;
  /** 可选稳定 id；默认自动生成并关联到根元素的 aria-labelledby。 */
  id?: string;
}

/**
 * 进度条的可读标签，通过 aria-labelledby 与根元素关联。
 * 未提供 id 时自动生成。
 */
export const ProgressLabel = forwardRef<HTMLSpanElement, ProgressLabelProps>(
  function ProgressLabel(
    { children, className, id: providedId, ...rest },
    ref,
  ): ReactElement {
    const { setLabelId } = useProgressContext("ProgressLabel");
    const generatedId = useId();
    const id = providedId ?? generatedId;

    useEffect(() => {
      setLabelId(id);
      return () => setLabelId(null);
    }, [id, setLabelId]);

    return (
      <span
        {...rest}
        ref={ref}
        id={id}
        className={cx("uk-progress__label", className)}
      >
        {children}
      </span>
    );
  },
);
