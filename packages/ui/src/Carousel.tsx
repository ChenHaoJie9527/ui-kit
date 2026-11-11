/* eslint-disable jsx-a11y/prefer-tag-over-role -- Carousel slides are named groups; fieldset/address/optgroup would add wrong semantics. */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useControllableState, useEventCallback } from "seam-hooks";
import { Button, type ButtonProps } from "./Button";
import {
  getCarouselCenterOffset,
  getCarouselScaleAt,
  getCarouselScaleGeometry,
  resolveCarouselScale,
  resolveCarouselVisible,
  type CarouselScaleGeometry,
} from "./carousel-geometry";
import { INDICATOR_SPRING, UI_SPRING } from "./motion";
import { cx } from "./utils/cx";

export type CarouselOrientation = "horizontal" | "vertical";
export type CarouselApi = EmblaCarouselType;
export type CarouselOptions = EmblaOptionsType;
export type CarouselPlugin = EmblaPluginType;

type CarouselLabelProps =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };

export type CarouselProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "aria-labelledby"
> &
  CarouselLabelProps & {
    orientation?: CarouselOrientation;
    opts?: CarouselOptions;
    plugins?: CarouselPlugin[];
    setApi?: (api: CarouselApi | undefined) => void;
    index?: number;
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
    gap?: string;
    visible?: number;
    scale?: number;
    children?: ReactNode;
  };

interface CarouselContextValue {
  viewportRef: UseEmblaCarouselType[0];
  api: CarouselApi | undefined;
  orientation: CarouselOrientation;
  reduceMotion: boolean;
  scale: number | undefined;
  itemVersion: number;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
}

interface CarouselStateContextValue {
  index: number;
  count: number;
  slideCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);
const CarouselStateContext = createContext<CarouselStateContextValue | null>(
  null,
);

function useCarouselContext(component: string): CarouselContextValue {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Carousel>`);
  }

  return context;
}

export interface UseCarouselReturn extends CarouselStateContextValue {
  api: CarouselApi | undefined;
  orientation: CarouselOrientation;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
}

/**
 * 读取当前 Carousel 的状态与控制方法。
 *
 * 必须在 <Carousel> 内使用；用于自定义上一张/下一张、计数器或缩略图。
 */
export function useCarousel(): UseCarouselReturn {
  const context = useContext(CarouselContext);
  const state = useContext(CarouselStateContext);

  if (!context || !state) {
    throw new Error("useCarousel must be used within <Carousel>");
  }

  return {
    api: context.api,
    orientation: context.orientation,
    index: state.index,
    count: state.count,
    slideCount: state.slideCount,
    canScrollPrev: state.canScrollPrev,
    canScrollNext: state.canScrollNext,
    scrollPrev: context.scrollPrev,
    scrollNext: context.scrollNext,
    scrollTo: context.scrollTo,
  };
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), count - 1);
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

const CarouselRoot = forwardRef<HTMLElement, CarouselProps>(
  function CarouselRoot(
    {
      orientation = "horizontal",
      opts,
      plugins,
      setApi,
      index: controlledIndex,
      defaultIndex,
      onIndexChange,
      gap = "0px",
      visible = 1,
      scale,
      className,
      style,
      children,
      "aria-roledescription": ariaRoleDescription,
      ...rest
    },
    ref,
  ) {
    const resolvedVisible =
      Number.isFinite(visible) && visible > 0 ? visible : 1;
    const resolvedScale = useMemo(() => resolveCarouselScale(scale), [scale]);
    const scaleVisible = useMemo(
      () => resolveCarouselVisible(visible),
      [visible],
    );
    const scaleEnabled = resolvedScale !== undefined && scaleVisible >= 2;
    const geometryRef = useRef<CarouselScaleGeometry | null>(null);

    /**
     * 初始位置只读一次：受控 index 后续变化由 scrollTo 同步，避免把
     * index 放进 Embla options 导致每次选择都 reInit。
     */
    const [initialIndex] = useState(
      () => controlledIndex ?? defaultIndex ?? opts?.startIndex ?? 0,
    );
    const [index, setIndex] = useControllableState<number>({
      value: controlledIndex,
      defaultValue: initialIndex,
    });
    const [count, setCount] = useState(0);
    const [slideCount, setSlideCount] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [itemVersion, setItemVersion] = useState(0);
    const reduceMotion = useReducedMotion() ?? false;

    const lastIndexRef = useRef(initialIndex);
    const hasSyncedOnceRef = useRef(false);
    const propSyncRef = useRef(false);
    const propSyncTargetRef = useRef<number | null>(null);
    const emitIndexChange = useEventCallback((next: number) => {
      onIndexChange?.(next);
    });

    const emblaOptions = useMemo<EmblaOptionsType>(() => {
      const options: EmblaOptionsType = {
        align: opts?.align ?? (scaleEnabled ? "center" : "start"),
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
        startIndex: initialIndex,
      };

      // 只在 scale 模式写 containScroll；普通模式保持 Embla 默认 trimSnaps。
      if (scaleEnabled) {
        options.containScroll = opts?.containScroll ?? false;
      }

      return options;
    }, [opts, orientation, initialIndex, scaleEnabled]);

    const [viewportRef, api] = useEmblaCarousel(emblaOptions, plugins);

    const syncFromApi = useEventCallback((emblaApi: CarouselApi) => {
      const nextIndex = emblaApi.selectedScrollSnap();
      const nextCount = emblaApi.scrollSnapList().length;

      setCount(nextCount);
      setSlideCount(emblaApi.slideNodes().length);
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());

      const isPropSync = propSyncRef.current;

      if (isPropSync && nextIndex === propSyncTargetRef.current) {
        propSyncRef.current = false;
        propSyncTargetRef.current = null;
      }

      const previous = lastIndexRef.current;
      lastIndexRef.current = nextIndex;

      if (!hasSyncedOnceRef.current) {
        hasSyncedOnceRef.current = true;
        setIndex(nextIndex);
        return;
      }

      if (isPropSync || nextIndex === previous) {
        return;
      }

      setIndex(nextIndex);
      emitIndexChange(nextIndex);
    });

    useEffect(() => {
      if (!api) {
        return;
      }

      syncFromApi(api);
    }, [api, syncFromApi]);

    useEffect(() => {
      if (!api) {
        return;
      }

      const onSelect = (emblaApi: CarouselApi) => {
        syncFromApi(emblaApi);
      };
      const onReInit = (emblaApi: CarouselApi) => {
        setItemVersion((version) => version + 1);
        syncFromApi(emblaApi);
      };
      const onSettle = () => {
        // 等待本帧的最终 select 先处理；避免 prop 同步在终止时被 settle 提前放行。
        queueMicrotask(() => {
          propSyncRef.current = false;
          propSyncTargetRef.current = null;
        });
      };

      api.on("select", onSelect);
      api.on("reInit", onReInit);
      api.on("settle", onSettle);

      return () => {
        api.off("select", onSelect);
        api.off("reInit", onReInit);
        api.off("settle", onSettle);
      };
    }, [api, syncFromApi]);

    useEffect(() => {
      if (!api || controlledIndex === undefined) {
        return;
      }

      const snaps = api.scrollSnapList().length;

      if (snaps <= 0) {
        return;
      }

      const target = clampIndex(controlledIndex, snaps);

      if (api.selectedScrollSnap() === target) {
        return;
      }

      propSyncRef.current = true;
      propSyncTargetRef.current = target;
      api.scrollTo(target, reduceMotion);
    }, [api, controlledIndex, reduceMotion]);

    const notifyApi = useEventCallback((nextApi: CarouselApi | undefined) => {
      setApi?.(nextApi);
    });

    useEffect(() => {
      notifyApi(api);

      return () => notifyApi(undefined);
    }, [api, notifyApi]);

    const scrollTo = useCallback(
      (nextIndex: number, jump?: boolean) => {
        if (!api || !Number.isFinite(nextIndex)) {
          return;
        }

        const nextCount = api.scrollSnapList().length;

        if (nextCount <= 0) {
          return;
        }

        api.scrollTo(clampIndex(nextIndex, nextCount), jump ?? reduceMotion);
      },
      [api, reduceMotion],
    );

    const scrollPrev = useEventCallback(() => {
      if (!api || !api.canScrollPrev()) {
        return;
      }

      if (!reduceMotion) {
        api.scrollPrev();
        return;
      }

      const snaps = api.scrollSnapList().length;

      if (snaps <= 0) {
        return;
      }

      const current = api.selectedScrollSnap();
      api.scrollTo((current - 1 + snaps) % snaps, true);
    });

    const scrollNext = useEventCallback(() => {
      if (!api || !api.canScrollNext()) {
        return;
      }

      if (!reduceMotion) {
        api.scrollNext();
        return;
      }

      const snaps = api.scrollSnapList().length;

      if (snaps <= 0) {
        return;
      }

      const current = api.selectedScrollSnap();
      api.scrollTo((current + 1) % snaps, true);
    });

    useEffect(() => {
      if (!api || !resolvedScale) {
        return;
      }

      const measure = () => {
        const slides = api.slideNodes();
        const viewport = api.rootNode();
        const first = slides[0];

        if (!first || !viewport) {
          geometryRef.current = null;
          return;
        }

        const horizontal = orientation === "horizontal";
        const length = horizontal
          ? viewport.clientWidth
          : viewport.clientHeight;
        const slideStyle = getComputedStyle(first);
        const gapPx =
          Number.parseFloat(
            horizontal
              ? slideStyle.paddingInlineStart
              : slideStyle.paddingBlockStart,
          ) || 0;

        if (length <= 0) {
          geometryRef.current = null;
          return;
        }

        const geometry = getCarouselScaleGeometry({
          length,
          gap: gapPx,
          visible: scaleVisible,
          scale: resolvedScale,
        });

        if (!Number.isFinite(geometry.base) || geometry.base <= 0) {
          geometryRef.current = null;
          return;
        }

        geometryRef.current = geometry;

        // 分组滚动没有 1:1 的 slide/snap 对应关系，保留 CSS 布局。
        if (api.scrollSnapList().length !== slides.length) {
          for (const slide of slides) {
            slide.style.flexBasis = "";
          }
          return;
        }

        const basis = `${Math.max(0, Math.floor(geometry.base + gapPx))}px`;

        for (const slide of slides) {
          if (slide.style.flexBasis !== basis) {
            slide.style.flexBasis = basis;
          }
        }
      };

      measure();
      api.on("reInit", measure);
      api.on("resize", measure);

      return () => {
        api.off("reInit", measure);
        api.off("resize", measure);

        for (const slide of api.slideNodes()) {
          slide.style.flexBasis = "";
        }
      };
      // eslint-disable-next-line react/exhaustive-effect-dependencies -- gap changes the computed padding and basis.
    }, [api, gap, orientation, resolvedScale, scaleVisible]);

    useEffect(() => {
      if (!api || !resolvedScale || reduceMotion) {
        return;
      }

      let frame = 0;

      const reset = () => {
        for (const slide of api.slideNodes()) {
          slide.style.removeProperty("--uk-carousel-slide-z");
          const inner = slide.querySelector<HTMLElement>(
            ".uk-carousel__item-inner",
          );

          if (inner) {
            inner.style.removeProperty("--uk-carousel-slide-scale");
            inner.style.removeProperty("--uk-carousel-slide-shift");
            inner.style.removeProperty("--uk-carousel-slide-opacity");
          }
        }
      };

      const update = () => {
        frame = 0;

        const geometry = geometryRef.current;
        const slides = api.slideNodes();
        const viewport = api.rootNode();

        if (!geometry || !viewport || slides.length === 0) {
          return;
        }

        if (api.scrollSnapList().length !== slides.length) {
          return;
        }

        const horizontal = orientation === "horizontal";
        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenter = horizontal
          ? viewportRect.left + viewportRect.width / 2
          : viewportRect.top + viewportRect.height / 2;
        const rtl =
          horizontal && getComputedStyle(viewport).direction === "rtl";

        // 先一次性读完，再统一写，避免读写交错触发布局抖动。
        const rects = slides.map((slide) => slide.getBoundingClientRect());
        const values = slides.map((slide, slideIndex) => {
          const rect = rects[slideIndex]!;
          const contentCenter = horizontal
            ? rtl
              ? rect.right - geometry.gap - geometry.base / 2
              : rect.left + geometry.gap + geometry.base / 2
            : rect.top + geometry.gap + geometry.base / 2;
          const actualOffset = contentCenter - viewportCenter;
          const distance = actualOffset / (geometry.base + geometry.gap);
          const away = Math.abs(distance);
          const slideScale = getCarouselScaleAt(
            distance,
            resolvedScale,
            geometry.side,
          );
          const target = getCarouselCenterOffset(
            distance,
            geometry.base,
            geometry.gap,
            resolvedScale,
            geometry.side,
          );
          const opacity =
            away > geometry.side + 1
              ? 0
              : away <= geometry.side
                ? 1
                : 1 - (away - geometry.side);
          const z = Math.max(1, 100 - Math.round(away * 10));

          return {
            slide,
            scale: slideScale,
            shift: target - actualOffset,
            opacity,
            z,
          };
        });

        for (const value of values) {
          const inner = value.slide.querySelector<HTMLElement>(
            ".uk-carousel__item-inner",
          );

          if (!inner) {
            continue;
          }

          inner.style.setProperty(
            "--uk-carousel-slide-scale",
            String(value.scale),
          );
          inner.style.setProperty(
            "--uk-carousel-slide-shift",
            `${value.shift}px`,
          );
          inner.style.setProperty(
            "--uk-carousel-slide-opacity",
            String(value.opacity),
          );
          value.slide.style.setProperty(
            "--uk-carousel-slide-z",
            String(value.z),
          );
        }
      };

      const onScroll = () => {
        if (frame === 0) {
          frame = requestAnimationFrame(update);
        }
      };

      api.on("scroll", onScroll);
      api.on("reInit", onScroll);
      api.on("resize", onScroll);
      update();

      return () => {
        api.off("scroll", onScroll);
        api.off("reInit", onScroll);
        api.off("resize", onScroll);

        if (frame !== 0) {
          cancelAnimationFrame(frame);
        }

        reset();
      };
    }, [api, orientation, reduceMotion, resolvedScale]);

    const contextValue = useMemo<CarouselContextValue>(
      () => ({
        viewportRef,
        api,
        orientation,
        reduceMotion,
        scale: scaleEnabled ? resolvedScale : undefined,
        itemVersion,
        scrollPrev,
        scrollNext,
        scrollTo,
      }),
      [
        viewportRef,
        api,
        orientation,
        reduceMotion,
        scaleEnabled,
        resolvedScale,
        itemVersion,
        scrollPrev,
        scrollNext,
        scrollTo,
      ],
    );

    const stateValue = useMemo<CarouselStateContextValue>(
      () => ({
        index,
        count,
        slideCount,
        canScrollPrev,
        canScrollNext,
      }),
      [index, count, slideCount, canScrollPrev, canScrollNext],
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        <CarouselStateContext.Provider value={stateValue}>
          <section
            {...rest}
            ref={ref}
            aria-roledescription={ariaRoleDescription ?? "carousel"}
            data-orientation={orientation}
            data-scale={scaleEnabled ? "true" : undefined}
            className={cx("uk-carousel", className)}
            style={{
              ...style,
              ["--uk-carousel-gap" as string]: gap,
              ["--uk-carousel-visible" as string]: String(resolvedVisible),
            }}
          >
            {children}
          </section>
        </CarouselStateContext.Provider>
      </CarouselContext.Provider>
    );
  },
);

export interface CarouselContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 额外作用于 track 的类名；className 作用于 viewport。 */
  trackClassName?: string;
  children?: ReactNode;
}

const CarouselContent: ForwardRefExoticComponent<
  CarouselContentProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CarouselContentProps>(function CarouselContent(
  { className, trackClassName, children, ...rest },
  ref,
) {
  const { viewportRef } = useCarouselContext("Carousel.Content");
  const setViewport = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef(node);
      setRef(ref, node);
    },
    [viewportRef, ref],
  );

  return (
    <div
      {...rest}
      ref={setViewport}
      className={cx("uk-carousel__viewport", className)}
    >
      <div className={cx("uk-carousel__track", trackClassName)}>{children}</div>
    </div>
  );
});

export interface CarouselItemProps extends HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
  children?: ReactNode;
}

const CarouselItem: ForwardRefExoticComponent<
  CarouselItemProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CarouselItemProps>(function CarouselItem(
  {
    className,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-roledescription": ariaRoleDescription,
    ...rest
  },
  ref,
) {
  const { itemVersion, scale } = useCarouselContext("Carousel.Item");
  const internalRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{
    index: number;
    count: number;
  } | null>(null);

  const setItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      setRef(ref, node);
    },
    [ref],
  );

  useEffect(() => {
    const node = internalRef.current;
    const parent = node?.parentElement;

    if (!node || !parent) {
      setPosition(null);
      return;
    }

    const slides = Array.from(parent.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.hasAttribute("data-uk-carousel-item"),
    );
    const nextIndex = slides.indexOf(node);

    setPosition(
      nextIndex >= 0 ? { index: nextIndex, count: slides.length } : null,
    );
    // eslint-disable-next-line react/exhaustive-effect-dependencies -- itemVersion is the re-measure trigger after Embla reInit.
  }, [itemVersion]);

  const autoLabel = position
    ? `${position.index + 1} of ${position.count}`
    : undefined;
  const label = ariaLabel?.trim() || (ariaLabelledBy ? undefined : autoLabel);

  return (
    <div
      {...rest}
      ref={setItemRef}
      role="group"
      aria-roledescription={ariaRoleDescription ?? "slide"}
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      data-uk-carousel-item=""
      className={cx("uk-carousel__item", className)}
    >
      {scale ? (
        <div className="uk-carousel__item-inner">{children}</div>
      ) : (
        children
      )}
    </div>
  );
});

function CarouselChevron({ side }: { side: "previous" | "next" }) {
  return (
    <svg
      className="uk-carousel__control-icon"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          side === "previous"
            ? "M12.5 4.5 7 10l5.5 5.5"
            : "M7.5 4.5 13 10l-5.5 5.5"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface CarouselControlProps extends Omit<
  ButtonProps,
  "iconOnly" | "loading"
> {
  /** 无障碍名称；默认 Previous slide / Next slide。 */
  "aria-label"?: string;
}

const CarouselPrevious: ForwardRefExoticComponent<
  CarouselControlProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, CarouselControlProps>(
  function CarouselPrevious(
    {
      variant = "outline",
      size = "md",
      className,
      children,
      onClick,
      disabled,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) {
    const { scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        {...rest}
        ref={ref}
        variant={variant}
        size={size}
        iconOnly
        className={cx("uk-carousel__control", className)}
        data-side="previous"
        aria-label={ariaLabel?.trim() || "Previous slide"}
        disabled={disabled || !canScrollPrev}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented) {
            scrollPrev();
          }
        }}
      >
        {children ?? <CarouselChevron side="previous" />}
      </Button>
    );
  },
);

const CarouselNext: ForwardRefExoticComponent<
  CarouselControlProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, CarouselControlProps>(function CarouselNext(
  {
    variant = "outline",
    size = "md",
    className,
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      {...rest}
      ref={ref}
      variant={variant}
      size={size}
      iconOnly
      className={cx("uk-carousel__control", className)}
      data-side="next"
      aria-label={ariaLabel?.trim() || "Next slide"}
      disabled={disabled || !canScrollNext}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          scrollNext();
        }
      }}
    >
      {children ?? <CarouselChevron side="next" />}
    </Button>
  );
});

export interface CarouselDotsProps extends HTMLAttributes<HTMLDivElement> {
  /** 每个 dot 的无障碍名称；默认按 snap 数决定 slide/page 文案。 */
  label?: (index: number, count: number) => string;
}

/**
 * 按 snap 渲染 dot 按钮。当前项用共享 pill 标记；点击调用 scrollTo。
 *
 * 分组滚动（slidesToScroll > 1）时 dot 表示 page，而不是 slide。
 */
const CarouselDots: ForwardRefExoticComponent<
  CarouselDotsProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CarouselDotsProps>(function CarouselDots(
  { className, label, "aria-label": ariaLabel, ...rest },
  ref,
) {
  const { index, count, slideCount, scrollTo } = useCarousel();
  const reduceMotion = useReducedMotion() ?? false;
  const pillId = useId();

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
      ref={ref}
      role="group"
      aria-label={ariaLabel?.trim() || "Slide controls"}
      className={cx("uk-carousel__dots", className)}
    >
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
            {active ? (
              <motion.span
                aria-hidden="true"
                className="uk-carousel__dot-pill"
                layoutId={`${pillId}-dot-pill`}
                transition={reduceMotion ? { duration: 0 } : INDICATOR_SPRING}
              />
            ) : (
              <span aria-hidden="true" className="uk-carousel__dot-mark" />
            )}
          </button>
        );
      })}
    </div>
  );
});

export interface CarouselCounterProps extends HTMLAttributes<HTMLDivElement> {
  /** 自定义文本；默认 Slide {current} of {count}。 */
  format?: (current: number, count: number) => ReactNode;
}

/**
 * 当前 snap 文本。默认只让数字滑动；自定义 format 即时替换。
 *
 * 位置已由 slide 的 x of y 标签提供，所以默认对读屏隐藏，避免重复播报。
 */
const CarouselCounter: ForwardRefExoticComponent<
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

export type CarouselComponent = ForwardRefExoticComponent<
  CarouselProps & RefAttributes<HTMLElement>
> & {
  Content: typeof CarouselContent;
  Item: typeof CarouselItem;
  Previous: typeof CarouselPrevious;
  Next: typeof CarouselNext;
  Dots: typeof CarouselDots;
  Counter: typeof CarouselCounter;
};

/**
 * 轮播。
 *
 * 组合式 API：Carousel / Carousel.Content / Carousel.Item /
 * Carousel.Previous / Carousel.Next / Carousel.Dots / Carousel.Counter。
 * 滚动、吸附与拖拽由 Embla 提供；组件负责受控 snap 索引、ARIA、RTL、
 * reduced-motion 与样式。
 */
export const Carousel: CarouselComponent = Object.assign(CarouselRoot, {
  Content: CarouselContent,
  Item: CarouselItem,
  Previous: CarouselPrevious,
  Next: CarouselNext,
  Dots: CarouselDots,
  Counter: CarouselCounter,
});
