import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGetSet } from "../useGetSet";

describe("useGetSet", () => {
  it("returns a getter backed by the latest value", () => {
    const { result } = renderHook(() => useGetSet(0));

    expect(result.current[0]()).toBe(0);

    act(() => {
      result.current[1](1);
    });
    expect(result.current[0]()).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]()).toBe(2);
  });

  it("calls the lazy initializer only once", () => {
    const initializer = vi.fn<() => number>(() => 5);
    const { result, rerender } = renderHook(() => useGetSet(initializer));

    rerender();
    rerender();

    expect(initializer).toHaveBeenCalledTimes(1);
    expect(result.current[0]()).toBe(5);
  });
});
