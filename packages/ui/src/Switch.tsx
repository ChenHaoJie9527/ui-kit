import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useControllableState } from "@momotom/hooks";
import { cx } from "./utils/cx";
import "./switch.css";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size" | "checked" | "defaultChecked" | "onChange"
> {
  /** 受控选中状态。传入即进入受控模式。 */
  checked?: boolean;
  /** 非受控模式下的初始状态。 */
  defaultChecked?: boolean;
  /** 状态变化回调，受控与非受控都会触发。 */
  onCheckedChange?: (checked: boolean) => void;
  /** 显示在开关右侧的标签文本。 */
  children?: ReactNode;
}

/**
 * 开关。
 *
 * 底层是原生 checkbox（role="switch"），所以表单提交、键盘操作和
 * 屏幕阅读器语义都是免费的；视觉部分由 track / thumb 两个 span 承担。
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
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
      className={cx("uk-switch", className)}
      data-disabled={disabled ? "true" : undefined}
      htmlFor={inputId}
    >
      <input
        {...rest}
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        className="uk-switch__input"
        checked={current}
        disabled={disabled}
        aria-checked={current}
        onChange={(event) => setCurrent(event.target.checked)}
      />
      <span className="uk-switch__track" aria-hidden="true">
        <span className="uk-switch__thumb" />
      </span>
      {children ? <span className="uk-switch__label">{children}</span> : null}
    </label>
  );
});
