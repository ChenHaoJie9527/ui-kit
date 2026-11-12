/* eslint-disable jsx-a11y/prefer-tag-over-role -- Carousel slides are named groups; fieldset/address/optgroup would add wrong semantics. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx";
import { useCarouselContext } from "./carousel-context";
import { setRef } from "./CarouselRoot";

export interface CarouselItemProps extends HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
  children?: ReactNode;
}

export const CarouselItem: ForwardRefExoticComponent<
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
