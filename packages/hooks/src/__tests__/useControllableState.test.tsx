import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "../useControllableState";

describe("useControllableState", () => {
  it("updates internal state in uncontrolled mode", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 0, onChange }),
    );

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](1);
    });

    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 1 }),
    );

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
  });

  it("ignores internal writes in controlled mode", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: 10, defaultValue: 0, onChange }),
    );

    act(() => {
      result.current[1](20);
    });

    expect(result.current[0]).toBe(10);
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("does not notify when the value is unchanged", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 5, onChange }),
    );

    act(() => {
      result.current[1](5);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
