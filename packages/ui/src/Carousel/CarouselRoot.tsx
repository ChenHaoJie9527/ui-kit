import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";
import { useReducedMotion } from "motion/react";
import { useControllableState, useEventCallback } from "seam-hooks";

import { cx } from "../utils/cx";
import {
  getCarouselCenterOffset,
  getCarouselScaleAt,
  getCarouselScaleGeometry,
  resolveCarouselScale,
  resolveCarouselVisible,
  type CarouselScaleGeometry,
} from "./carousel-geometry";
import {
  CarouselContext,
  CarouselStateContext,
  type CarouselContextValue,
  type CarouselStateContextValue,
} from "./carousel-context";

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

export function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), count - 1);
}

export function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

export const CarouselRoot = forwardRef<HTMLElement, CarouselProps>(
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

    const loop = opts?.loop ?? false;

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
        loop,
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
        loop,
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
