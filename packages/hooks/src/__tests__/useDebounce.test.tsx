import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "../useDebounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("runs once after the delay with the latest arguments", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebounce(fn, 200));

    act(() => {
      result.current("a");
      result.current("ab");
    });

    expect(fn).not.toHaveBeenCalled();
    expect(result.current.pending()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("ab");
    expect(result.current.pending()).toBe(false);
  });

  it("can cancel a pending call", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebounce(fn, 100));

    act(() => {
      result.current("a");
      result.current.cancel();
      vi.advanceTimersByTime(200);
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it("can flush a pending call immediately", () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebounce(fn, 100));

    act(() => {
      result.current("a");
      result.current.flush();
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("always calls the latest callback", () => {
    const first = vi.fn<(value: string) => void>();
    const second = vi.fn<(value: string) => void>();
    const { result, rerender } = renderHook(
      ({ fn }: { fn: (value: string) => void }) => useDebounce(fn, 100),
      { initialProps: { fn: first } },
    );

    rerender({ fn: second });

    act(() => {
      result.current("value");
      vi.advanceTimersByTime(100);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("value");
  });
});
