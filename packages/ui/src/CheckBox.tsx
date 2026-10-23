import {
  forwardRef,
  useId,
  type ForwardRefExoticComponent,
  type InputHTMLAttributes,
  type ReactNode,
  type RefAttributes,
} from "react";
import { useControllableState } from "seam-hooks";
import { cx } from "./utils/cx";

export interface CheckBoxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "onChange"
> {
  /** 受控选中状态。传入即进入受控模式。 */
  checked?: boolean;
  /** 非受控模式下的初始状态。 */
  defaultChecked?: boolean;
  /** 状态变化回调，受控与非受控都会触发。 */
  onCheckedChange?: (checked: boolean) => void;
  /** 显示在复选框右侧的标签文本。 */
  children?: ReactNode;
}

/**
 * 复选框。
 *
 * 保留原生 checkbox 的表单、键盘和读屏语义；方框内的对勾用 SVG 描边
 * 展示状态转换，按压时的轻微缩放提供即时的触觉反馈。
 */
export const CheckBox: ForwardRefExoticComponent<
  CheckBoxProps & RefAttributes<HTMLInputElement>
> = forwardRef<HTMLInputElement, CheckBoxProps>(function CheckBox(
  {
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    className,
    children,
    id,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [current, setCurrent] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
  });

  return (
    <label
      className={cx("uk-checkbox", className)}
      data-disabled={disabled ? "true" : undefined}
      htmlFor={inputId}
    >
      <input
        {...rest}
        ref={ref}
        id={inputId}
        type="checkbox"
        className="uk-checkbox__input"
        checked={current}
        disabled={disabled}
        onChange={(event) => {
          if (disabled) {
            return;
          }

          setCurrent(event.target.checked);
        }}
      />
      <span className="uk-checkbox__box" aria-hidden="true">
        <svg
          className="uk-checkbox__check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12.5 L9.5 18 L20 7" pathLength={1} />
        </svg>
      </span>
      {children ? <span className="uk-checkbox__label">{children}</span> : null}
    </label>
  );
});

CheckBox.displayName = "CheckBox";
