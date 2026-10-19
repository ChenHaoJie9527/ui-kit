import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePageLeave } from "../usePageLeave";

describe("usePageLeave", () => {
  it("fires when the pointer leaves the document", () => {
    const onLeave = vi.fn<() => void>();
    const { result } = renderHook(() => usePageLeave(onLeave));

    expect(result.current).toBe(false);

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseout", { relatedTarget: null }),
      );
    });

    expect(result.current).toBe(true);
    expect(onLeave).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseover"));
    });

    expect(result.current).toBe(false);
  });

  it("ignores moves between elements inside the page", () => {
    const onLeave = vi.fn<() => void>();
    const { result } = renderHook(() => usePageLeave(onLeave));
    const inner = document.createElement("div");

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseout", { relatedTarget: inner }),
      );
    });

    expect(result.current).toBe(false);
    expect(onLeave).not.toHaveBeenCalled();
  });
});
