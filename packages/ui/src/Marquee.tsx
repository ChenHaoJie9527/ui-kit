import {
  Children,
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";
import { cx } from "./utils/cx";

export type MarqueeDirection = "left" | "right" | "up" | "down";

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  direction?: MarqueeDirection;
  speed?: number;
  pauseOnHover?: boolean;
  gap?: string;
  fade?: boolean;
}

const Marquee: ForwardRefExoticComponent<
  MarqueeProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  {
    children,
    className,
    direction = "left",
    speed = 30,
    pauseOnHover = true,
    gap = "1rem",
    fade = true,
    ...rest
  },
  ref,
) {
  const items = Children.toArray(children);

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uk-marquee", className)}
      data-direction={direction}
      data-fade={fade ? "true" : undefined}
      data-pause-on-hover={pauseOnHover ? "true" : undefined}
      style={{
        ...rest.style,
        ["--uk-marquee-gap" as string]: gap,
        ["--uk-marquee-duration" as string]: `${speed}s`,
        gap,
      }}
    >
      {[false, true].map((duplicate) => (
        <div
          key={duplicate ? "duplicate" : "primary"}
          aria-hidden={duplicate}
          className="uk-marquee__track"
          data-duplicate={duplicate ? "true" : undefined}
          inert={duplicate}
        >
          {items.map((item, index) => (
            <div className="uk-marquee__item" key={index}>
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export { Marquee };
