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
  type Ref,
  type ReactElement,
  type ReactNode,
} from "react";
import { useControllableState } from "seam-hooks";

import { cx } from "../utils/cx";
import { ProgressContext, type ProgressContextValue } from "./progress-context";
import { ProgressDescription } from "./ProgressDescription";
import { ProgressValue } from "./ProgressValue";

interface ProgressBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "onChange"
> {
  /** 外观变体：条形（默认）或圆形圆环。 */
  variant?: "line" | "circle";
  /** 圆形变体的直径（px）。默认 120。 */
  size?: number;
  /** 圆形变体的环粗细（px）。默认按直径 8% 计算。 */
  thickness?: number;
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

/** 圆环默认粗细：直径的 8%，至少 6px。 */
function defaultThickness(size: number): number {
  return Math.max(6, Math.round(size * 0.08));
}

/**
 * 进度条根组件。条形变体渲染轨道 + 填充条 + 交互圆点；
 * 圆形变体渲染 SVG 圆环（stroke-dashoffset 控制填充弧），
 * 数值部件居中显示在环内，interactive 时环边缘出现旋钮圆点。
 *
 * 交互模式渲染原生 <input type="range"> 承载 slider 语义，
 * 视觉轨道 / 圆环处理点击与拖拽；填充与圆点 / 旋钮用 CSS 线性过渡，
 * 拖拽时关闭过渡直接跟手。
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
    variant = "line",
    size = 120,
    thickness = defaultThickness(size),
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

  // 部件分流：Description 提取到状态区域；圆形变体的 Value 提取到环心；
  // 其余部件（Label 等）进入标签行。
  const descriptionNodes: ReactNode[] = [];
  const valueNodes: ReactNode[] = [];
  const headerNodes: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === ProgressDescription) {
      descriptionNodes.push(child);
    } else if (
      variant === "circle" &&
      isValidElement(child) &&
      child.type === ProgressValue
    ) {
      valueNodes.push(child);
    } else {
      headerNodes.push(child);
    }
  });

  // 指针交互：点击直接跳转（保留过渡），超过阈值后进入拖拽（关闭过渡）。
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
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
    (clientX: number, clientY: number): void => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      if (variant === "circle") {
        if (rect.width === 0 || rect.height === 0) {
          return;
        }
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // 屏幕坐标角度：0 = 3 点方向，顺时针递增；换算成从 12 点顺时针的占比。
        const degrees =
          (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
        const fraction = ((((degrees + 360) % 360) + 90) % 360) / 360;
        setCurrent(roundToStep(min + fraction * (max - min)));
        return;
      }

      if (rect.width === 0) {
        return;
      }
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );
      setCurrent(roundToStep(min + ratio * (max - min)));
    },
    [min, max, roundToStep, setCurrent, variant],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    // 点击跳转：此时尚未进入拖拽，填充保留线性过渡动画。
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    if (!drag.moved) {
      const distance = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );
      if (distance <= 4) {
        return;
      }
      drag.moved = true;
      setDragging(true);
    }
    event.preventDefault();
    updateFromPointer(event.clientX, event.clientY);
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

  // 交互表面的属性：交互模式承载指针事件，只读模式承载 progressbar 语义。
  interface SurfaceAttrs extends HTMLAttributes<HTMLDivElement> {
    "data-dragging"?: string;
    "data-indeterminate"?: string;
    ref?: Ref<HTMLDivElement>;
  }

  const surfaceAttrs: SurfaceAttrs = interactive
    ? {
        "aria-hidden": "true",
        "data-dragging": dragging ? "true" : undefined,
        ref: surfaceRef,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerEnd,
        onPointerCancel: handlePointerEnd,
      }
    : {
        role: "progressbar",
        "aria-label": ariaLabel,
        "aria-labelledby": labelReference,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": clamped ?? undefined,
        "aria-valuetext":
          normalized == null ? undefined : `${Math.round(normalized)}%`,
        "data-indeterminate": isIndeterminate ? "true" : undefined,
      };

  // 圆形变体的 SVG 几何：1:1 viewBox，圆环从 12 点顺时针填充。
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const fraction = normalized == null ? null : normalized / 100;
  const indicatorDashArray =
    fraction == null ? circumference * 0.25 : circumference;
  const indicatorDashOffset =
    fraction == null ? circumference * 0.75 : circumference * (1 - fraction);
  const thumbFraction = fraction ?? 0;
  const thumbAngle = ((thumbFraction * 360 - 90) * Math.PI) / 180;
  const thumbSize = Math.min(24, Math.max(14, thickness * 1.6));

  const ring = (
    <div
      className="uk-progress__ring"
      style={{ width: size, height: size }}
      {...surfaceAttrs}
    >
      <svg className="uk-progress__ring-svg" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="uk-progress__ring-track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={thickness}
        />
        <circle
          className="uk-progress__ring-indicator"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={thickness}
          strokeDasharray={indicatorDashArray}
          strokeDashoffset={indicatorDashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div
        className="uk-progress__ring-value"
        style={{ fontSize: Math.max(12, size * 0.2) }}
      >
        {valueNodes}
      </div>
      {interactive ? (
        <div
          className="uk-progress__dial-thumb"
          style={{
            left: center + radius * Math.cos(thumbAngle),
            top: center + radius * Math.sin(thumbAngle),
            width: thumbSize,
            height: thumbSize,
          }}
        />
      ) : null}
    </div>
  );

  const rangeInput = interactive ? (
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
  ) : null;

  return (
    <ProgressContext.Provider value={context}>
      <div
        {...rest}
        className={cx(
          "uk-progress",
          variant === "circle" && "uk-progress--circle",
          className,
        )}
        data-interactive={interactive ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
      >
        <div className="uk-progress__bar">{headerNodes}</div>
        {variant === "circle" ? (
          <>
            {rangeInput}
            {ring}
          </>
        ) : (
          <>
            {rangeInput}
            <div className="uk-progress__track" {...surfaceAttrs}>
              <div
                className="uk-progress__indicator"
                style={{
                  width: normalized == null ? undefined : `${normalized}%`,
                }}
              />
              {interactive ? (
                <div
                  className="uk-progress__thumb"
                  style={{ left: `${fraction == null ? 0 : fraction * 100}%` }}
                />
              ) : null}
            </div>
          </>
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
