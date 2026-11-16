/* eslint-disable jsx-a11y/prefer-tag-over-role --
 * 只读模式不用原生 <progress>：其填充由 UA 计算，伪元素宽度无法跨浏览器过渡，
 * 无法满足「连续进度用 linear 过渡」；且原生 progress 的 children 是
 * fallback 内容，Label / Value / Description 部件无法可见渲染。
 * 交互模式使用原生 <input type="range">，隐式 slider 语义、键盘与焦点免费。
 */
import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  isValidElement,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState } from "seam-hooks";

import { cx } from "../utils/cx";
import { ProgressContext, type ProgressContextValue } from "./progress-context";
import { ProgressDescription } from "./ProgressDescription";

interface ProgressBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "onChange"
> {
  /** 范围下限。默认 0。 */
  min?: number;
  /** 范围上限。默认 100。 */
  max?: number;
  /** 交互模式下键盘与拖拽的步长。默认 1。 */
  step?: number;
  /** 交互模式下禁用点击、拖拽与键盘。 */
  disabled?: boolean;
  /** 合并到根元素。 */
  className?: string;
  /** Progress.Label / Progress.Value / Progress.Description 子组件。 */
  children?: ReactNode;
  /** 无 Progress.Label 时提供可访问名称。 */
  "aria-label"?: string;
  /** 外部元素 ID 作为可访问名称。 */
  "aria-labelledby"?: string;
}

/**
 * 只读模式：value 必填；交互模式：value 受控可选、defaultValue 非受控可选。
 * 交互模式下组件切换为原生 <input type="range">（slider 语义），
 * 支持点击、拖拽与键盘；progressbar 语义按 ARIA 规定只读。
 */
export type ProgressProps =
  | (ProgressBaseProps & {
      interactive?: false;
      /**
       * 当前进度值。null（或 undefined）时渲染为不确定进度，
       * 表示任务进行中但总量未知。超出 min/max 的值会被夹紧。
       */
      value: number | null;
      defaultValue?: never;
      onValueChange?: never;
    })
  | (ProgressBaseProps & {
      interactive: true;
      /** 受控值。 */
      value?: number | null;
      /** 非受控模式下的初始值。 */
      defaultValue?: number;
      /** 交互（点击 / 拖拽 / 键盘）后的回调，受控与非受控都会触发。 */
      onValueChange?: (value: number) => void;
    });

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 进度条根组件：渲染标签行（Label + Value）+ 轨道 + 填充条 + 交互圆点。
 *
 * 只读模式渲染 role="progressbar"；交互模式（interactive）渲染原生
 * <input type="range"> 承载 slider 语义，视觉轨道处理点击与拖拽，
 * 填充与圆点跟随 value 用 CSS 线性过渡。
 *
 * Progress.Description 提取到轨道下方的 role="status" 区域（原生 <output>），
 * 与 progressbar / slider 的数值播报互不干扰。
 */
export function ProgressRoot(props: ProgressProps): ReactElement {
  const {
    value,
    defaultValue,
    onValueChange,
    interactive = false,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...rest
  } = props;

  const [labelId, setLabelId] = useState<string | null>(null);
  const setLabelIdStable = useCallback((id: string | null) => {
    setLabelId(id);
  }, []);

  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue: defaultValue ?? (interactive ? min : null),
    onChange: (next) => {
      if (next != null) {
        onValueChange?.(next);
      }
    },
  });

  const isIndeterminate = !interactive && current == null;
  const numeric = current == null ? (interactive ? min : null) : current;
  const clamped = numeric == null ? null : clamp(numeric, min, max);
  const normalized =
    clamped == null ? null : ((clamped - min) / (max - min)) * 100;

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      interactive &&
      current == null
    ) {
      console.warn("Progress: interactive 模式不支持 null 值，已按 min 渲染。");
    }
  }, [interactive, current, min]);

  const context = useMemo<ProgressContextValue>(
    () => ({
      value: clamped,
      min,
      max,
      normalized,
      labelId,
      setLabelId: setLabelIdStable,
    }),
    [clamped, min, max, normalized, labelId, setLabelIdStable],
  );

  // Description 提取到独立的状态区域；其余部件（Label / Value 等）
  // 进入标签行。
  const descriptionNodes: ReactNode[] = [];
  const headerNodes: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === ProgressDescription) {
      descriptionNodes.push(child);
    } else {
      headerNodes.push(child);
    }
  });

  // 指针交互：点击轨道直接跳转（保留过渡），超过阈值后进入拖拽（关闭过渡）。
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const roundToStep = useCallback(
    (raw: number): number => {
      const stepped = Math.round(raw / step) * step;
      return Math.min(max, Math.max(min, stepped));
    },
    [step, min, max],
  );

  const updateFromPointer = useCallback(
    (clientX: number): void => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        return;
      }
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );
      setCurrent(roundToStep(min + ratio * (max - min)));
    },
    [min, max, roundToStep, setCurrent],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      moved: false,
    };
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    // 点击跳转：此时尚未进入拖拽，填充保留线性过渡动画。
    updateFromPointer(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    if (!drag.moved) {
      if (Math.abs(event.clientX - drag.startX) <= 4) {
        return;
      }
      drag.moved = true;
      setDragging(true);
    }
    event.preventDefault();
    updateFromPointer(event.clientX);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    setDragging(false);
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId) &&
      typeof event.currentTarget.releasePointerCapture === "function"
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    const base = numeric ?? min;
    const next = nextValueForKey(event.key, base, step, min, max);
    if (next == null) {
      return;
    }
    event.preventDefault();
    setCurrent(Math.min(max, Math.max(min, next)));
  };

  const labelReference = ariaLabelledBy ?? labelId ?? undefined;

  return (
    <ProgressContext.Provider value={context}>
      <div
        {...rest}
        className={cx("uk-progress", className)}
        data-interactive={interactive ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
      >
        <div className="uk-progress__bar">{headerNodes}</div>
        {interactive ? (
          <>
            <input
              type="range"
              className="uk-progress__input"
              value={numeric ?? min}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-labelledby={labelReference}
              aria-valuetext={
                normalized == null ? undefined : `${Math.round(normalized)}%`
              }
              onChange={(event) => setCurrent(Number(event.target.value))}
              onKeyDown={handleKeyDown}
            />
            <div
              className="uk-progress__track"
              aria-hidden="true"
              data-dragging={dragging ? "true" : undefined}
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              <div
                className="uk-progress__indicator"
                style={{ width: `${normalized ?? 0}%` }}
              />
              <div
                className="uk-progress__thumb"
                style={{ left: `${normalized ?? 0}%` }}
              />
            </div>
          </>
        ) : (
          <div
            className="uk-progress__track"
            role="progressbar"
            aria-label={ariaLabel}
            aria-labelledby={labelReference}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clamped ?? undefined}
            aria-valuetext={
              normalized == null ? undefined : `${Math.round(normalized)}%`
            }
            data-indeterminate={isIndeterminate ? "true" : undefined}
          >
            <div
              className="uk-progress__indicator"
              style={{
                width: normalized == null ? undefined : `${normalized}%`,
              }}
            />
          </div>
        )}
        {descriptionNodes.length > 0 ? descriptionNodes : null}
      </div>
    </ProgressContext.Provider>
  );
}

function nextValueForKey(
  key: string,
  base: number,
  step: number,
  min: number,
  max: number,
): number | null {
  if (key === "ArrowRight" || key === "ArrowUp") {
    return base + step;
  }
  if (key === "ArrowLeft" || key === "ArrowDown") {
    return base - step;
  }
  if (key === "PageUp") {
    return base + step * 10;
  }
  if (key === "PageDown") {
    return base - step * 10;
  }
  if (key === "Home") {
    return min;
  }
  if (key === "End") {
    return max;
  }
  return null;
}
