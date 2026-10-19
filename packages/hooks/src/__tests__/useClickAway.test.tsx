import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useClickAway } from "../useClickAway";

function ClickAwayExample({
  onAway,
  events,
}: {
  onAway: () => void;
  events?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickAway(ref, onAway, events);

  return (
    <div>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <button type="button" data-testid="outside">
        outside
      </button>
    </div>
  );
}

describe("useClickAway", () => {
  it("ignores pointer events inside the target", () => {
    const onAway = vi.fn<() => void>();
    render(<ClickAwayExample onAway={onAway} />);

    fireEvent.pointerDown(screen.getByTestId("inside"));

    expect(onAway).not.toHaveBeenCalled();
  });

  it("calls the handler for pointer events outside the target", () => {
    const onAway = vi.fn<() => void>();
    render(<ClickAwayExample onAway={onAway} />);

    fireEvent.pointerDown(screen.getByTestId("outside"));

    expect(onAway).toHaveBeenCalledTimes(1);
  });

  it("supports custom event names", () => {
    const onAway = vi.fn<() => void>();
    render(<ClickAwayExample onAway={onAway} events={["mousedown"]} />);

    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(onAway).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onAway).toHaveBeenCalledTimes(1);
  });
});
