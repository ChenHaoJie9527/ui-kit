import {
  forwardRef,
  type ForwardRefExoticComponent,
  type InputHTMLAttributes,
  type RefAttributes,
} from "react";
import { cx } from "./utils/cx";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** 输入框尺寸，默认 md。原生 size 属性被该字段替代。 */
  inputSize?: InputSize;
  /** 标记校验失败状态，等同于 aria-invalid="true"。 */
  invalid?: boolean;
}

/**
 * 文本输入框。
 *
 * 只负责样式与校验状态，label、提示文案与错误信息由调用方组合，
 * 这样表单结构可以完全自定义。
 */
export const Input: ForwardRefExoticComponent<
  InputProps & RefAttributes<HTMLInputElement>
> = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    inputSize = "md",
    invalid = false,
    className,
    "aria-invalid": ariaInvalid,
    ...rest
  },
  ref,
) {
  return (
    <input
      {...rest}
      ref={ref}
      className={cx("uk-input", className)}
      data-size={inputSize}
      aria-invalid={invalid ? true : ariaInvalid}
    />
  );
});
