import {
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";

import { Button, type ButtonProps } from "../Button";
import { cx } from "../utils/cx";
import { useCarousel } from "./carousel-context";

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

export const CarouselPrevious: ForwardRefExoticComponent<
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

export const CarouselNext: ForwardRefExoticComponent<
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
