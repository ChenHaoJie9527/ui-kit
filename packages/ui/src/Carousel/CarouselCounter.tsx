import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { UI_SPRING } from "../motion";

import { cx } from "../utils/cx";
import { useCarousel } from "./carousel-context";

export interface CarouselCounterProps extends HTMLAttributes<HTMLDivElement> {
  /** 自定义文本；默认 Slide {current} of {count}。 */
  format?: (current: number, count: number) => ReactNode;
}

/**
 * 当前 snap 文本。默认只让数字滑动；自定义 format 即时替换。
 *
 * 位置已由 slide 的 x of y 标签提供，所以默认对读屏隐藏，避免重复播报。
 */
export const CarouselCounter: ForwardRefExoticComponent<
  CarouselCounterProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CarouselCounterProps>(function CarouselCounter(
  { className, format, "aria-hidden": ariaHidden, dir = "ltr", ...rest },
  ref,
) {
  const { index, count } = useCarousel();
  const reduceMotion = useReducedMotion() ?? false;

  if (count <= 1) {
    return null;
  }

  const current = index + 1;

  return (
    <div
      {...rest}
      ref={ref}
      dir={dir}
      aria-hidden={ariaHidden ?? true}
      className={cx("uk-carousel__counter", className)}
    >
      {format ? (
        <span key={current} className="uk-carousel__counter-custom">
          {format(current, count)}
        </span>
      ) : (
        <>
          <span>Slide</span>
          <span className="uk-carousel__counter-number">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={current}
                className="uk-carousel__counter-value"
                initial={reduceMotion ? false : { y: "0.35em", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={
                  reduceMotion ? { opacity: 0 } : { y: "-0.35em", opacity: 0 }
                }
                transition={reduceMotion ? { duration: 0 } : UI_SPRING}
              >
                {current}
              </motion.span>
            </AnimatePresence>
          </span>
          <span>of {count}</span>
        </>
      )}
    </div>
  );
});
