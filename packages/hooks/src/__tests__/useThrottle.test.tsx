import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useThrottle } from "../useThrottle";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useThrottle", () => {
  it("invokes immediately and again with the trailing call", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useThrottle(fn, 200));

    act(() => {
      result.current("a");
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    act(() => {
      vi.advanceTimersByTime(50);
      result.current("b");
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("b");
  });

  it("can disable the leading call", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() =>
      useThrottle(fn, 200, { leading: false }),
    );

    act(() => {
      result.current("a");
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("can disable the trailing call", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() =>
      useThrottle(fn, 200, { trailing: false }),
    );

    act(() => {
      result.current("a");
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(100);
      result.current("b");
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current("c");
    });
    expect(fn).toHaveBeenLastCalledWith("c");
  });

  it("supports cancel and flush", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useThrottle(fn, 200));

    act(() => {
      result.current("a");
      vi.advanceTimersByTime(50);
      result.current("b");
      result.current.cancel();
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(200);
      result.current("c");
      vi.advanceTimersByTime(50);
      result.current("d");
      result.current.flush();
    });
    expect(fn).toHaveBeenLastCalledWith("d");
  });
});
