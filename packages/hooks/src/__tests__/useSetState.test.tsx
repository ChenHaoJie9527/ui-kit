import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSetState } from "../useSetState";

interface FormState {
  count: number;
  name: string;
}

describe("useSetState", () => {
  it("merges partial patches", () => {
    const { result } = renderHook(() =>
      useSetState<FormState>({ count: 0, name: "a" }),
    );

    act(() => {
      result.current[1]({ count: 1 });
    });

    expect(result.current[0]).toEqual({ count: 1, name: "a" });
  });

  it("supports functional patches", () => {
    const { result } = renderHook(() =>
      useSetState<FormState>({ count: 0, name: "a" }),
    );

    act(() => {
      result.current[1]((prev) => ({ count: prev.count + 1 }));
    });

    expect(result.current[0].count).toBe(1);
    expect(result.current[0].name).toBe("a");
  });

  it("applies several patches without losing earlier fields", () => {
    const { result } = renderHook(() =>
      useSetState<FormState>({ count: 0, name: "a" }),
    );

    act(() => {
      result.current[1]({ count: 5 });
      result.current[1]({ name: "b" });
    });

    expect(result.current[0]).toEqual({ count: 5, name: "b" });
  });
});
