import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCounter, type UseCounterOptions } from "../useCounter";

describe("useCounter", () => {
  it("defaults to 0 and exposes stable actions", () => {
    const { result, rerender } = renderHook(() => useCounter());
    const firstActions = result.current[1];

    expect(result.current[0]).toBe(0);

    rerender();

    expect(result.current[1]).toBe(firstActions);
  });

  it("evaluates a lazy default once and clamps it to the initial bounds", () => {
    const initializer = vi.fn<() => number>(() => 99);
    const { result, rerender } = renderHook(() =>
      useCounter({ defaultValue: initializer, min: 0, max: 10 }),
    );

    rerender();
    rerender();

    expect(initializer).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(10);
  });

  it("supports set, increment, decrement, reset, and custom steps", () => {
    const { result } = renderHook(() =>
      useCounter({ defaultValue: 5, min: 0, max: 10, step: 2 }),
    );

    act(() => {
      expect(result.current[1].increment()).toBe(7);
    });
    expect(result.current[0]).toBe(7);

    act(() => {
      expect(result.current[1].decrement()).toBe(5);
    });
    expect(result.current[0]).toBe(5);

    act(() => {
      expect(result.current[1].set(16)).toBe(10);
    });
    expect(result.current[0]).toBe(10);

    act(() => {
      expect(result.current[1].decrement(20)).toBe(0);
    });
    expect(result.current[0]).toBe(0);

    act(() => {
      expect(result.current[1].reset()).toBe(5);
    });
    expect(result.current[0]).toBe(5);
  });

  it("applies synchronous repeated actions without losing updates", () => {
    const { result } = renderHook(() =>
      useCounter({ defaultValue: 0, max: 10 }),
    );

    act(() => {
      result.current[1].increment();
      result.current[1].increment();
      result.current[1].set((current) => current + 3);
    });

    expect(result.current[0]).toBe(5);
  });

  it("clamps immediately when bounds change and does not restore hidden values", () => {
    const { result, rerender } = renderHook(
      (options: UseCounterOptions) => useCounter(options),
      { initialProps: { defaultValue: 5, max: 10 } },
    );

    rerender({ defaultValue: 99, max: 3 });
    expect(result.current[0]).toBe(3);

    rerender({ defaultValue: 99, max: 10 });
    expect(result.current[0]).toBe(3);

    act(() => {
      expect(result.current[1].reset()).toBe(5);
    });
  });

  it("supports controlled values and reports clamped proposals", () => {
    const onChange = vi.fn<(value: number) => void>();
    const { result, rerender } = renderHook(
      (value: number) =>
        useCounter({
          value,
          defaultValue: 0,
          min: 0,
          max: 5,
          onChange,
        }),
      { initialProps: 2 },
    );

    expect(result.current[0]).toBe(2);

    act(() => {
      expect(result.current[1].set(9)).toBe(5);
    });
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenLastCalledWith(5);

    rerender(3);
    expect(result.current[0]).toBe(3);

    act(() => {
      expect(result.current[1].increment()).toBe(4);
    });
    expect(result.current[0]).toBe(3);
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it("only calls onChange for effective value changes", () => {
    const onChange = vi.fn<(value: number) => void>();
    const { result } = renderHook(() =>
      useCounter({ defaultValue: 3, max: 5, onChange }),
    );

    act(() => {
      expect(result.current[1].set(3)).toBe(3);
      expect(result.current[1].set(8)).toBe(5);
      expect(result.current[1].set(9)).toBe(5);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("rejects invalid configuration and runtime values", () => {
    expect(() => renderHook(() => useCounter({ min: 1, max: 0 }))).toThrowError(
      "min must be less than or equal to max",
    );
    expect(() => renderHook(() => useCounter({ step: 0 }))).toThrowError(
      "step must be greater than 0",
    );
    expect(() =>
      renderHook(() => useCounter({ defaultValue: Number.NaN })),
    ).toThrowError("defaultValue must be a finite number");

    const { result } = renderHook(() => useCounter({ defaultValue: 1 }));

    expect(() =>
      act(() => {
        result.current[1].set(Number.POSITIVE_INFINITY);
      }),
    ).toThrowError("next must be a finite number");
    expect(() =>
      act(() => {
        result.current[1].increment(Number.NaN);
      }),
    ).toThrowError("delta must be a finite number");
    expect(result.current[0]).toBe(1);
  });
});
