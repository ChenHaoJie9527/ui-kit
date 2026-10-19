import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useFocusTrap } from "../useFocusTrap";

interface TrapExampleProps {
  active: boolean;
  withInitialFocus?: boolean;
  withReturnFocus?: boolean;
}

function TrapExample({
  active,
  withInitialFocus = false,
  withReturnFocus = false,
}: TrapExampleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement>(null);

  useFocusTrap({
    active,
    containerRef,
    initialFocusRef: withInitialFocus ? initialFocusRef : undefined,
    returnFocusRef: withReturnFocus ? returnFocusRef : undefined,
  });

  return (
    <div>
      <button ref={returnFocusRef} data-testid="trigger" type="button">
        trigger
      </button>
      <div ref={containerRef} data-testid="container">
        <button data-testid="first" type="button">
          first
        </button>
        <button data-testid="second" type="button">
          second
        </button>
        <button data-testid="disabled" type="button" disabled>
          disabled
        </button>
        <button data-testid="last" type="button">
          last
        </button>
        <button
          ref={initialFocusRef}
          data-testid="preferred"
          type="button"
          hidden={!withInitialFocus}
        >
          preferred
        </button>
      </div>
      <button data-testid="outside" type="button">
        outside
      </button>
    </div>
  );
}

function StackedTraps() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useFocusTrap({ active: true, containerRef: outerRef });
  useFocusTrap({ active: true, containerRef: innerRef });

  return (
    <div>
      <div ref={outerRef} data-testid="outer">
        <button data-testid="outer-first" type="button">
          outer first
        </button>
        <button data-testid="outer-last" type="button">
          outer last
        </button>
      </div>
      <div ref={innerRef} data-testid="inner">
        <button data-testid="inner-first" type="button">
          inner first
        </button>
        <button data-testid="inner-last" type="button">
          inner last
        </button>
      </div>
    </div>
  );
}

function preventDefault(event: KeyboardEvent) {
  event.preventDefault();
}

function pressTab(shiftKey = false, target: EventTarget = document) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

afterEach(() => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});

describe("useFocusTrap", () => {
  it("focuses the first focusable element when activated", () => {
    render(<TrapExample active />);

    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("honours initialFocusRef", () => {
    render(<TrapExample active withInitialFocus />);

    expect(document.activeElement).toBe(screen.getByTestId("preferred"));
  });

  it("wraps forward from the last element to the first", () => {
    render(<TrapExample active />);

    screen.getByTestId("last").focus();
    pressTab();

    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("wraps backward from the first element to the last", () => {
    render(<TrapExample active />);

    screen.getByTestId("first").focus();
    pressTab(true);

    expect(document.activeElement).toBe(screen.getByTestId("last"));
  });

  it("skips disabled elements when resolving the edges", () => {
    render(<TrapExample active />);

    // disabled 不是 first 也不是 last，若被算进去，反向循环会落到它身上。
    screen.getByTestId("first").focus();
    pressTab(true);

    expect(document.activeElement).toBe(screen.getByTestId("last"));
  });

  it("pulls focus back when it moves outside the container", () => {
    render(<TrapExample active />);

    act(() => {
      screen.getByTestId("outside").focus();
    });

    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("restores focus to returnFocusRef on deactivate", () => {
    const { rerender } = render(<TrapExample active={false} withReturnFocus />);

    act(() => {
      screen.getByTestId("trigger").focus();
    });

    rerender(<TrapExample active withReturnFocus />);
    expect(document.activeElement).toBe(screen.getByTestId("first"));

    rerender(<TrapExample active={false} withReturnFocus />);
    expect(document.activeElement).toBe(screen.getByTestId("trigger"));
  });

  it("does nothing while inactive", () => {
    render(<TrapExample active={false} />);

    expect(document.activeElement).toBe(document.body);

    pressTab();
    expect(document.activeElement).toBe(document.body);
  });

  it("lets inner handlers opt out of the trap", () => {
    render(<TrapExample active />);

    const last = screen.getByTestId("last");
    last.addEventListener("keydown", preventDefault);
    last.focus();

    pressTab(false, last);

    expect(document.activeElement).toBe(last);
    last.removeEventListener("keydown", preventDefault);
  });

  it("gives the topmost trap control when traps are stacked", () => {
    render(<StackedTraps />);

    expect(document.activeElement).toBe(screen.getByTestId("inner-first"));

    // 外层容器在 DOM 中独立存在，但焦点不能被它抢走。
    act(() => {
      screen.getByTestId("outer-first").focus();
    });
    expect(document.activeElement).toBe(screen.getByTestId("inner-first"));

    screen.getByTestId("inner-last").focus();
    pressTab();
    expect(document.activeElement).toBe(screen.getByTestId("inner-first"));
  });
});
