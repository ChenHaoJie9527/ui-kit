import { useRef } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "motion/react";
import { Carousel, useCarousel, type CarouselProps } from "../Carousel";

vi.mock("embla-carousel-react", () => ({
  default: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();

  return {
    ...actual,
    useReducedMotion: vi.fn<() => boolean | null>(() => false),
  };
});

type Listener = (api: EmblaCarouselType) => void;

interface FakeEmblaApi {
  selectedScrollSnap: () => number;
  scrollSnapList: () => number[];
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
  scrollPrev: ReturnType<typeof vi.fn>;
  scrollNext: ReturnType<typeof vi.fn>;
  scrollTo: ReturnType<typeof vi.fn>;
  on: (event: string, listener: Listener) => FakeEmblaApi;
  off: (event: string, listener: Listener) => FakeEmblaApi;
  emit: (event: string) => void;
  setCount: (count: number) => void;
}

function createFakeApi(initialCount: number, initialIndex = 0): FakeEmblaApi {
  let count = initialCount;
  let current = Math.min(Math.max(initialIndex, 0), Math.max(0, count - 1));
  const listeners = new Map<string, Set<Listener>>();

  const emit = (event: string) => {
    listeners.get(event)?.forEach((listener) => {
      listener(api as unknown as EmblaCarouselType);
    });
  };

  const scrollTo = vi.fn<(next: number) => void>((next) => {
    const clamped = Math.min(Math.max(next, 0), Math.max(0, count - 1));

    if (clamped === current) {
      return;
    }

    current = clamped;
    emit("select");
  });

  const api: FakeEmblaApi = {
    selectedScrollSnap: () => current,
    scrollSnapList: () => Array.from({ length: count }, (_, index) => index),
    canScrollPrev: () => current > 0,
    canScrollNext: () => current < count - 1,
    scrollPrev: vi.fn<() => void>(() => {
      if (current > 0) {
        scrollTo(current - 1);
      }
    }),
    scrollNext: vi.fn<() => void>(() => {
      if (current < count - 1) {
        scrollTo(current + 1);
      }
    }),
    scrollTo,
    on: (event, listener) => {
      const set = listeners.get(event) ?? new Set<Listener>();
      listeners.set(event, set);
      set.add(listener);
      return api;
    },
    off: (event, listener) => {
      listeners.get(event)?.delete(listener);
      return api;
    },
    emit,
    setCount: (nextCount) => {
      count = nextCount;
      current = Math.min(current, Math.max(0, count - 1));
      emit("reInit");
    },
  };

  return api;
}

const emblaMock = vi.mocked(useEmblaCarousel);
let fakeApi: FakeEmblaApi;
let initialCount = 3;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useReducedMotion).mockReturnValue(false);
  initialCount = 3;

  emblaMock.mockImplementation((options) => {
    const apiRef = useRef<FakeEmblaApi | null>(null);

    if (!apiRef.current) {
      apiRef.current = createFakeApi(initialCount, options?.startIndex ?? 0);
    }

    fakeApi = apiRef.current;

    return [
      () => {},
      apiRef.current as unknown as EmblaCarouselType,
    ] as unknown as ReturnType<typeof useEmblaCarousel>;
  });
});

function CarouselIndex() {
  const { index, count } = useCarousel();

  return <output data-testid="carousel-index">{`${index}:${count}`}</output>;
}

type CarouselExampleProps = Partial<
  Omit<CarouselProps, "aria-label" | "aria-labelledby">
>;

function CarouselExample(props: CarouselExampleProps = {}) {
  return (
    <Carousel aria-label="Gallery" {...props}>
      <Carousel.Content>
        <Carousel.Item>One</Carousel.Item>
        <Carousel.Item>Two</Carousel.Item>
        <Carousel.Item>Three</Carousel.Item>
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
      <CarouselIndex />
    </Carousel>
  );
}

function OutsideHook() {
  useCarousel();
  return null;
}

describe("Carousel", () => {
  it("renders region and slide semantics", async () => {
    render(<CarouselExample />);

    const region = screen.getByRole("region", { name: "Gallery" });
    const slides = screen.getAllByRole("group");

    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    expect(region.getAttribute("data-orientation")).toBe("horizontal");
    expect(slides).toHaveLength(3);
    expect(slides[0]?.getAttribute("aria-roledescription")).toBe("slide");

    await waitFor(() => {
      expect(slides[0]?.getAttribute("aria-label")).toBe("1 of 3");
      expect(slides[2]?.getAttribute("aria-label")).toBe("3 of 3");
    });
  });

  it("allows roledescription overrides for localization", () => {
    render(
      <Carousel aria-label="Gallery" aria-roledescription="轮播">
        <Carousel.Content>
          <Carousel.Item aria-roledescription="幻灯片">One</Carousel.Item>
        </Carousel.Content>
      </Carousel>,
    );

    expect(
      screen.getByRole("region").getAttribute("aria-roledescription"),
    ).toBe("轮播");
    expect(screen.getByRole("group").getAttribute("aria-roledescription")).toBe(
      "幻灯片",
    );
  });

  it("lets aria-labelledby override the automatic slide label", () => {
    render(
      <Carousel aria-label="Gallery">
        <Carousel.Content>
          <Carousel.Item aria-labelledby="slide-title">
            <span id="slide-title">Custom slide</span>
          </Carousel.Item>
        </Carousel.Content>
      </Carousel>,
    );

    const slide = screen.getByRole("group");

    expect(slide.getAttribute("aria-labelledby")).toBe("slide-title");
    expect(slide.hasAttribute("aria-label")).toBe(false);
  });

  it("passes orientation, default align, and start index to Embla", () => {
    render(
      <CarouselExample
        orientation="vertical"
        defaultIndex={2}
        opts={{ loop: true }}
      />,
    );

    expect(emblaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        align: "start",
        axis: "y",
        loop: true,
        startIndex: 2,
      }),
      undefined,
    );
  });

  it("updates control disabled state at snap boundaries", async () => {
    render(<CarouselExample />);

    const previous = screen.getByRole("button", {
      name: "Previous slide",
    }) as HTMLButtonElement;
    const next = screen.getByRole("button", {
      name: "Next slide",
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    fireEvent.click(next);

    await waitFor(() => {
      expect(previous.disabled).toBe(false);
    });
    expect(screen.getByTestId("carousel-index").textContent).toBe("1:3");

    fireEvent.click(next);

    await waitFor(() => {
      expect(next.disabled).toBe(true);
    });
    expect(screen.getByTestId("carousel-index").textContent).toBe("2:3");
  });

  it("syncs a controlled index without echoing onIndexChange", async () => {
    const onIndexChange = vi.fn<(index: number) => void>();
    const { rerender } = render(
      <CarouselExample index={1} onIndexChange={onIndexChange} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("carousel-index").textContent).toBe("1:3");
    });
    expect(onIndexChange).not.toHaveBeenCalled();

    rerender(<CarouselExample index={0} onIndexChange={onIndexChange} />);

    await waitFor(() => {
      expect(fakeApi.scrollTo).toHaveBeenCalledWith(0, false);
      expect(screen.getByTestId("carousel-index").textContent).toBe("0:3");
    });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("does not suppress later changes after an out-of-range controlled index", async () => {
    const onIndexChange = vi.fn<(index: number) => void>();

    render(<CarouselExample index={99} onIndexChange={onIndexChange} />);

    await waitFor(() => {
      expect(screen.getByTestId("carousel-index").textContent).toBe("99:3");
    });

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));

    await waitFor(() => {
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });
  });

  it("emits onIndexChange for user-driven changes", async () => {
    const onIndexChange = vi.fn<(index: number) => void>();

    render(<CarouselExample onIndexChange={onIndexChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    await waitFor(() => {
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it("lets control onClick prevent scrolling", () => {
    render(
      <Carousel aria-label="Gallery">
        <Carousel.Content>
          <Carousel.Item>One</Carousel.Item>
        </Carousel.Content>
        <Carousel.Next onClick={(event) => event.preventDefault()} />
      </Carousel>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    expect(fakeApi.scrollNext).not.toHaveBeenCalled();
  });

  it("throws when parts are rendered outside Carousel", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <Carousel.Content>
          <Carousel.Item>One</Carousel.Item>
        </Carousel.Content>,
      ),
    ).toThrow("<Carousel.Content> must be rendered inside <Carousel>");

    expect(() => render(<Carousel.Item>One</Carousel.Item>)).toThrow(
      "<Carousel.Item> must be rendered inside <Carousel>",
    );

    expect(() => render(<Carousel.Next />)).toThrow(
      "useCarousel must be used within <Carousel>",
    );

    expect(() => render(<OutsideHook />)).toThrow(
      "useCarousel must be used within <Carousel>",
    );

    spy.mockRestore();
  });

  it("updates slide labels after reInit", async () => {
    const { rerender } = render(
      <Carousel aria-label="Gallery">
        <Carousel.Content>
          <Carousel.Item>One</Carousel.Item>
          <Carousel.Item>Two</Carousel.Item>
        </Carousel.Content>
      </Carousel>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("group")[0]?.getAttribute("aria-label")).toBe(
        "1 of 2",
      );
    });

    rerender(
      <Carousel aria-label="Gallery">
        <Carousel.Content>
          <Carousel.Item>One</Carousel.Item>
          <Carousel.Item>Two</Carousel.Item>
          <Carousel.Item>Three</Carousel.Item>
        </Carousel.Content>
      </Carousel>,
    );

    act(() => {
      fakeApi.setCount(3);
    });

    await waitFor(() => {
      expect(screen.getAllByRole("group")[0]?.getAttribute("aria-label")).toBe(
        "1 of 3",
      );
    });
  });

  it("jumps instead of animating under reduced motion", async () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);

    render(<CarouselExample />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    await waitFor(() => {
      expect(fakeApi.scrollTo).toHaveBeenCalledWith(1, true);
    });
    expect(screen.getByTestId("carousel-index").textContent).toBe("1:3");
  });

  it("disables controls when there are no snap points", () => {
    initialCount = 0;

    render(
      <Carousel aria-label="Empty">
        <Carousel.Content />
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>,
    );

    const previous = screen.getByRole("button", {
      name: "Previous slide",
    }) as HTMLButtonElement;
    const next = screen.getByRole("button", {
      name: "Next slide",
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
  });

  it("renders a single slide without enabling navigation", async () => {
    initialCount = 1;

    render(
      <Carousel aria-label="Single">
        <Carousel.Content>
          <Carousel.Item>Only</Carousel.Item>
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>,
    );

    await waitFor(() => {
      expect(screen.getByRole("group").getAttribute("aria-label")).toBe(
        "1 of 1",
      );
    });

    const previous = screen.getByRole("button", {
      name: "Previous slide",
    }) as HTMLButtonElement;
    const next = screen.getByRole("button", {
      name: "Next slide",
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
  });
});
