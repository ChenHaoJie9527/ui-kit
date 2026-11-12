/* eslint-disable jsx-a11y/prefer-tag-over-role -- Carousel dots are a named group. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";
import { useReducedMotion } from "motion/react";

import { cx } from "../utils/cx";
import { useCarousel } from "./carousel-context";
import { setRef } from "./CarouselRoot";

export interface CarouselDotsProps extends HTMLAttributes<HTMLDivElement> {
  /** 每个 dot 的无障碍名称；默认按 snap 数决定 slide/page 文案。 */
  label?: (index: number, count: number) => string;
}

function interpolateDotCenter(centers: number[], value: number): number {
  const whole = Math.max(0, Math.min(Math.floor(value), centers.length - 1));
  const part = Math.max(0, Math.min(value - whole, 1));
  const from = centers[whole] ?? centers[0] ?? 0;
  const to = centers[Math.min(whole + 1, centers.length - 1)] ?? from;

  return from + (to - from) * part;
}

/**
 * 按 snap 渲染 dot 按钮。当前项是容器级 pill，跟随滚动在两个 dot 之间
 * 连续拉伸：前半程前缘伸向下一项，后半程后缘收拢。点击调用 scrollTo。
 *
 * 分组滚动（slidesToScroll > 1）时 dot 表示 page，而不是 slide。
 * reduced motion 下 pill 停在当前 dot，不做拉伸动画。
 */
export const CarouselDots: ForwardRefExoticComponent<
  CarouselDotsProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CarouselDotsProps>(function CarouselDots(
  { className, label, "aria-label": ariaLabel, ...rest },
  ref,
) {
  const { index, count, slideCount, scrollTo, api, loop } = useCarousel();
  const reduceMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const dotCentersRef = useRef<number[]>([]);
  const baseWidthRef = useRef(20);

  const setPill = useCallback(
    (start: number, end: number, baseWidth: number) => {
      const pill = pillRef.current;
      const centers = dotCentersRef.current;

      if (!pill || centers.length === 0) {
        return;
      }

      const x = interpolateDotCenter(centers, start) - baseWidth / 2;
      const width = Math.max(
        baseWidth,
        interpolateDotCenter(centers, end) -
          interpolateDotCenter(centers, start),
      );

      pill.style.setProperty("--uk-dots-pill-x", `${x}px`);
      pill.style.setProperty("--uk-dots-pill-scale", String(width / baseWidth));
    },
    [],
  );

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      setRef(ref, node);
    },
    [ref],
  );

  useEffect(() => {
    const container = containerRef.current;
    const pill = pillRef.current;

    if (!container || !pill) {
      return;
    }

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const dots = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".uk-carousel__dot"),
      );

      dotCentersRef.current = dots.map((dot) => {
        const rect = dot.getBoundingClientRect();

        return rect.left + rect.width / 2 - containerRect.left;
      });
      baseWidthRef.current =
        Number.parseFloat(getComputedStyle(pill).width) || baseWidthRef.current;
    };

    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react/exhaustive-effect-dependencies -- count 变化时 dot 数量变化，需要重新测量。
  }, [count]);

  // reduced motion：pill 固定到当前 dot（select 驱动），不做拉伸。
  useEffect(() => {
    if (!api || !reduceMotion) {
      return;
    }

    const settle = () => {
      const current = api.selectedScrollSnap();
      setPill(current, current, baseWidthRef.current);
    };

    settle();
    api.on("select", settle);

    return () => {
      api.off("select", settle);
    };
  }, [api, reduceMotion, setPill]);

  // 正常模式：跟随滚动，rAF 合并，只写 transform。
  useEffect(() => {
    if (!api || reduceMotion) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      const snaps = api.scrollSnapList().length;
      const centers = dotCentersRef.current;

      if (snaps === 0 || centers.length !== snaps) {
        return;
      }

      const position = loop
        ? (((api.scrollProgress() * snaps) % snaps) + snaps) % snaps
        : Math.max(0, Math.min(api.scrollProgress() * (snaps - 1), snaps - 1));
      const from = Math.min(Math.floor(position), snaps - 1);
      const t = position - from;
      const to = from === snaps - 1 ? (loop ? 0 : from) : from + 1;
      // 前半程前缘拉伸，后半程后缘收拢。
      const lead = from + (to - from) * Math.min(1, t * 2);
      const trail = from + (to - from) * Math.max(0, (t - 0.5) * 2);

      setPill(
        Math.min(lead, trail),
        Math.max(lead, trail),
        baseWidthRef.current,
      );
    };

    const onScroll = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };

    api.on("scroll", onScroll);
    api.on("reInit", onScroll);
    update();

    return () => {
      api.off("scroll", onScroll);
      api.off("reInit", onScroll);

      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    };
  }, [api, loop, reduceMotion, setPill]);

  if (count <= 1) {
    return null;
  }

  const grouped = slideCount > 0 && slideCount !== count;
  const getLabel =
    label ??
    ((dotIndex: number) =>
      `Go to ${grouped ? "page" : "slide"} ${dotIndex + 1}`);

  return (
    <div
      {...rest}
      ref={setContainerRef}
      role="group"
      aria-label={ariaLabel?.trim() || "Slide controls"}
      className={cx("uk-carousel__dots", className)}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className="uk-carousel__dot-pill"
      />
      {Array.from({ length: count }, (_, dotIndex) => {
        const active = dotIndex === index;

        return (
          <button
            key={dotIndex}
            type="button"
            className="uk-carousel__dot"
            data-state={active ? "active" : "inactive"}
            aria-label={getLabel(dotIndex, count)}
            aria-current={active ? "true" : undefined}
            onClick={() => scrollTo(dotIndex)}
          >
            <span aria-hidden="true" className="uk-carousel__dot-mark" />
          </button>
        );
      })}
    </div>
  );
});
