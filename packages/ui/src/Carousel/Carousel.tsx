import type { ForwardRefExoticComponent, RefAttributes } from "react";

import { CarouselContent } from "./CarouselContent";
import { CarouselNext, CarouselPrevious } from "./CarouselControl";
import { CarouselCounter } from "./CarouselCounter";
import { CarouselDots } from "./CarouselDots";
import { CarouselItem } from "./CarouselItem";
import { CarouselRoot, type CarouselProps } from "./CarouselRoot";

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
