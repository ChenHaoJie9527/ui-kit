import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ForwardRefExoticComponent,
  type InputHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefAttributes,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useControllableState } from "seam-hooks";
import { UI_SPRING } from "./motion";
import { cx } from "./utils/cx";

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
export const Switch: ForwardRefExoticComponent<
  SwitchProps & RefAttributes<HTMLInputElement>
> = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
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
  const reduceMotion = useReducedMotion() ?? false;
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startValue: number;
    moved: boolean;
    samples: Array<{ x: number; time: number }>;
  } | null>(null);

  const [current, setCurrent] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
  });
  const thumbX = useMotionValue(current ? 16 : 0);

  useEffect(() => {
    if (dragRef.current) {
      return;
    }

    const controls = animate(
      thumbX,
      current ? 16 : 0,
      reduceMotion ? { duration: 0 } : UI_SPRING,
    );

    return () => controls.stop();
  }, [current, reduceMotion, thumbX]);

  const finishDrag = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.moved) {
      const first = drag.samples[0];
      const last = drag.samples[drag.samples.length - 1];
      const elapsed = first && last ? Math.max(last.time - first.time, 1) : 1;
      const velocity =
        first && last ? ((last.x - first.x) / elapsed) * 1000 : 0;
      const next = Math.abs(velocity) > 220 ? velocity > 0 : thumbX.get() >= 8;

      suppressClickRef.current = true;
      dragRef.current = null;
      setCurrent(next);
      animate(
        thumbX,
        next ? 16 : 0,
        reduceMotion ? { duration: 0 } : { ...UI_SPRING, velocity },
      );
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    } else {
      dragRef.current = null;
    }

    if (
      event.currentTarget.hasPointerCapture(event.pointerId) &&
      typeof event.currentTarget.releasePointerCapture === "function"
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <label
      className={cx("uk-switch", className)}
      data-disabled={disabled ? "true" : undefined}
      htmlFor={inputId}
      onClickCapture={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
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
      <span
        className="uk-switch__track"
        aria-hidden="true"
        onPointerDown={(event) => {
          if (disabled) {
            return;
          }

          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startValue: thumbX.get(),
            moved: false,
            samples: [{ x: event.clientX, time: performance.now() }],
          };
          if (typeof event.currentTarget.setPointerCapture === "function") {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;

          if (!drag || drag.pointerId !== event.pointerId) {
            return;
          }

          const delta = event.clientX - drag.startX;
          if (Math.abs(delta) > 4) {
            drag.moved = true;
          }

          if (!drag.moved) {
            return;
          }

          event.preventDefault();
          thumbX.set(Math.max(0, Math.min(16, drag.startValue + delta)));
          drag.samples.push({ x: event.clientX, time: performance.now() });
          drag.samples = drag.samples.filter(
            (sample) => performance.now() - sample.time < 120,
          );
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <motion.span className="uk-switch__thumb" style={{ x: thumbX }} />
      </span>
      {children ? <span className="uk-switch__label">{children}</span> : null}
    </label>
  );
});
