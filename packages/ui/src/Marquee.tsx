import {
  Children,
  forwardRef,
  isValidElement,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type HTMLAttributes,
  type RefAttributes,
} from "react";
import { cx } from "./utils/cx";

export type MarqueeDirection = "left" | "right" | "up" | "down";

export type MarqueeItemClickEvent =
  | MouseEvent<HTMLDivElement>
  | KeyboardEvent<HTMLDivElement>;

export interface MarqueeItem<TData = unknown> {
  key: string;
  content: ReactNode;
  data?: TData;
}

export interface MarqueeItemDetail<TData = unknown> {
  index: number;
  key: string | null;
  data: TData | undefined;
}

export interface MarqueeProps<
  TData = unknown,
> extends HTMLAttributes<HTMLDivElement> {
  direction?: MarqueeDirection;
  speed?: number;
  pauseOnHover?: boolean;
  gap?: string;
  fade?: boolean;
  paused?: boolean;
  items?: ReadonlyArray<MarqueeItem<TData>>;
  onItemClick?: (
    item: MarqueeItemDetail<TData>,
    event: MarqueeItemClickEvent,
  ) => void;
}

interface MarqueeEntry<TData> {
  key: string | null;
  content: ReactNode;
  data: TData | undefined;
}

function isExternalInteractiveTarget(
  currentTarget: HTMLDivElement,
  target: EventTarget | null,
): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const interactive = target.closest(
    'a, button, input, select, textarea, label, [contenteditable="true"], [role="button"]',
  );

  return interactive !== null && interactive !== currentTarget;
}

const Marquee = forwardRef(function Marquee<TData>(
  {
    children,
    className,
    direction = "left",
    speed = 30,
    pauseOnHover = true,
    gap = "1rem",
    fade = true,
    paused = false,
    items,
    onItemClick,
    ...rest
  }: MarqueeProps<TData>,
  ref: Ref<HTMLDivElement>,
) {
  const entries: Array<MarqueeEntry<TData>> = items
    ? items.map((item) => ({
        key: item.key,
        content: item.content,
        data: item.data,
      }))
    : Children.toArray(children).map((child, _index) => ({
        key: isValidElement(child) ? (child.key ?? null) : null,
        content: child,
        data: undefined,
      }));

  const handleItemClick = (
    entry: MarqueeEntry<TData>,
    index: number,
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (
      !onItemClick ||
      event.defaultPrevented ||
      isExternalInteractiveTarget(event.currentTarget, event.target)
    ) {
      return;
    }

    onItemClick({ index, key: entry.key, data: entry.data }, event);
  };

  const handleItemKeyDown = (
    entry: MarqueeEntry<TData>,
    index: number,
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!onItemClick || event.defaultPrevented) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onItemClick({ index, key: entry.key, data: entry.data }, event);
    }
  };

  return (
    <div
      {...rest}
      ref={ref}
      className={cx("uk-marquee", className)}
      data-direction={direction}
      data-fade={fade ? "true" : undefined}
      data-pause-on-hover={pauseOnHover ? "true" : undefined}
      data-paused={paused ? "true" : "false"}
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
          inert={duplicate && !onItemClick}
          role={duplicate ? "presentation" : undefined}
          onFocusCapture={
            duplicate
              ? (event: FocusEvent<HTMLDivElement>) => {
                  if (event.target instanceof HTMLElement) {
                    event.target.blur();
                  }
                }
              : undefined
          }
        >
          {entries.map((entry, index) => (
            <div
              className="uk-marquee__item"
              key={duplicate ? `duplicate-${index}` : (entry.key ?? index)}
              data-clickable={onItemClick ? "true" : undefined}
              {...(onItemClick
                ? {
                    role: duplicate ? undefined : "button",
                    tabIndex: duplicate ? -1 : 0,
                    onClick: (event: MouseEvent<HTMLDivElement>) =>
                      handleItemClick(entry, index, event),
                    onKeyDown: duplicate
                      ? undefined
                      : (event: KeyboardEvent<HTMLDivElement>) =>
                          handleItemKeyDown(entry, index, event),
                  }
                : {})}
            >
              {entry.content}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}) as <TData = unknown>(
  props: MarqueeProps<TData> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;

export { Marquee };
