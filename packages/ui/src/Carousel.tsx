/* eslint-disable jsx-a11y/prefer-tag-over-role -- Carousel slides are named groups; fieldset/address/optgroup would add wrong semantics. */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
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
import { useReducedMotion } from "motion/react";
import { useControllableState, useEventCallback } from "seam-hooks";
import { Button, type ButtonProps } from "./Button";
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
    children?: ReactNode;
  };

interface CarouselContextValue {
  viewportRef: UseEmblaCarouselType[0];
  api: CarouselApi | undefined;
  orientation: CarouselOrientation;
  reduceMotion: boolean;
  itemVersion: number;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
}

interface CarouselStateContextValue {
  index: number;
  count: number;
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

    const emblaOptions = useMemo<EmblaOptionsType>(
      () => ({
        align: "start",
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
        startIndex: initialIndex,
      }),
      [opts, orientation, initialIndex],
    );

    const [viewportRef, api] = useEmblaCarousel(emblaOptions, plugins);

    const syncFromApi = useEventCallback((emblaApi: CarouselApi) => {
      const nextIndex = emblaApi.selectedScrollSnap();
      const nextCount = emblaApi.scrollSnapList().length;

      setCount(nextCount);
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

    const contextValue = useMemo<CarouselContextValue>(
      () => ({
        viewportRef,
        api,
        orientation,
        reduceMotion,
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
        canScrollPrev,
        canScrollNext,
      }),
      [index, count, canScrollPrev, canScrollNext],
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        <CarouselStateContext.Provider value={stateValue}>
          <section
            {...rest}
            ref={ref}
            aria-roledescription={ariaRoleDescription ?? "carousel"}
            data-orientation={orientation}
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
  const { itemVersion } = useCarouselContext("Carousel.Item");
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
      {children}
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

export type CarouselComponent = ForwardRefExoticComponent<
  CarouselProps & RefAttributes<HTMLElement>
> & {
  Content: typeof CarouselContent;
  Item: typeof CarouselItem;
  Previous: typeof CarouselPrevious;
  Next: typeof CarouselNext;
};

/**
 * 轮播。
 *
 * 组合式 API：Carousel / Carousel.Content / Carousel.Item /
 * Carousel.Previous / Carousel.Next。滚动、吸附与拖拽由 Embla 提供；
 * 组件负责受控 snap 索引、ARIA、RTL、reduced-motion 与样式。
 */
export const Carousel: CarouselComponent = Object.assign(CarouselRoot, {
  Content: CarouselContent,
  Item: CarouselItem,
  Previous: CarouselPrevious,
  Next: CarouselNext,
});
