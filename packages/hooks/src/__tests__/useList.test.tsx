import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useList } from "../useList";

describe("useList", () => {
  it("pushes and updates items", () => {
    const { result } = renderHook(() => useList([1, 2, 3]));

    act(() => {
      result.current[1].push(4, 5);
    });
    expect(result.current[0]).toEqual([1, 2, 3, 4, 5]);

    act(() => {
      result.current[1].update(0, (value) => value * 10);
    });
    expect(result.current[0]).toEqual([10, 2, 3, 4, 5]);

    act(() => {
      result.current[1].set(1, (value) => value + 8);
    });
    expect(result.current[0]).toEqual([10, 10, 3, 4, 5]);
  });

  it("removes, filters and sorts without mutating the previous array", () => {
    const { result } = renderHook(() => useList([3, 1, 2]));

    act(() => {
      result.current[1].remove(1);
    });
    expect(result.current[0]).toEqual([3, 2]);

    act(() => {
      result.current[1].sort((a, b) => a - b);
    });
    expect(result.current[0]).toEqual([2, 3]);

    act(() => {
      result.current[1].filter((value) => value > 2);
    });
    expect(result.current[0]).toEqual([3]);
  });

  it("clears and resets to the initial items", () => {
    const initial = [1, 2];
    const { result } = renderHook(() => useList(initial));

    act(() => {
      result.current[1].push(3);
    });
    expect(result.current[0]).toEqual([1, 2, 3]);

    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0]).toEqual([]);

    act(() => {
      result.current[1].reset();
    });
    expect(result.current[0]).toEqual([1, 2]);
    expect(initial).toEqual([1, 2]);
  });

  it("ignores out-of-range indices", () => {
    const { result } = renderHook(() => useList([1]));

    act(() => {
      result.current[1].set(5, 9);
      result.current[1].update(-1, (value) => value);
      result.current[1].remove(3);
    });

    expect(result.current[0]).toEqual([1]);
  });
});
