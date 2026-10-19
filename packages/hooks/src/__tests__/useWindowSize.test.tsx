import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWindowSize } from "../useWindowSize";

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
}

describe("useWindowSize", () => {
  it("reads the current window size", () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useWindowSize());

    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it("updates after a resize and keeps a stable snapshot otherwise", () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useWindowSize());
    const initial = result.current;

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(initial);

    act(() => {
      setWindowSize(800, 600);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toEqual({ width: 800, height: 600 });
    expect(result.current).not.toBe(initial);
  });
});
