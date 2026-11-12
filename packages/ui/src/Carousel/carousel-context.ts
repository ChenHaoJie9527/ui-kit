import { createContext, useContext } from "react";
import type { UseEmblaCarouselType } from "embla-carousel-react";

import type { CarouselApi, CarouselOrientation } from "./CarouselRoot";

export interface CarouselContextValue {
  viewportRef: UseEmblaCarouselType[0];
  api: CarouselApi | undefined;
  orientation: CarouselOrientation;
  reduceMotion: boolean;
  scale: number | undefined;
  loop: boolean;
  itemVersion: number;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
}

export interface CarouselStateContextValue {
  index: number;
  count: number;
  slideCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);
export const CarouselStateContext =
  createContext<CarouselStateContextValue | null>(null);

export function useCarouselContext(component: string): CarouselContextValue {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Carousel>`);
  }

  return context;
}

export interface UseCarouselReturn extends CarouselStateContextValue {
  api: CarouselApi | undefined;
  orientation: CarouselOrientation;
  loop: boolean;
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
    loop: context.loop,
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
