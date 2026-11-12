import {
  forwardRef,
  useCallback,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
  type ReactNode,
} from "react";

import { cx } from "../utils/cx";
import { useCarouselContext } from "./carousel-context";
import { setRef } from "./CarouselRoot";

export interface CarouselContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 额外作用于 track 的类名；className 作用于 viewport。 */
  trackClassName?: string;
  children?: ReactNode;
}

export const CarouselContent: ForwardRefExoticComponent<
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
