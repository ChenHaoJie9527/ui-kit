import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMap } from "../useMap";

describe("useMap", () => {
  it("sets, reads and removes entries", () => {
    const { result } = renderHook(() =>
      useMap<string, number>(new Map([["a", 1]])),
    );

    expect(result.current[0].get("a")).toBe(1);

    act(() => {
      result.current[1].set("b", 2);
    });

    expect(result.current[0].get("b")).toBe(2);
    expect(result.current[1].get("b")).toBe(2);

    act(() => {
      result.current[1].remove("a");
    });

    expect(result.current[0].has("a")).toBe(false);
    expect(result.current[0].size).toBe(1);
  });

  it("supports batch writes, clear and reset", () => {
    const { result } = renderHook(() =>
      useMap<string, number>(new Map([["a", 1]])),
    );

    act(() => {
      result.current[1].setAll([
        ["b", 2],
        ["c", 3],
      ]);
    });

    expect(result.current[0].size).toBe(3);
    expect(result.current[0].get("c")).toBe(3);

    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0].size).toBe(0);

    act(() => {
      result.current[1].reset();
    });
    expect(result.current[0].size).toBe(1);
    expect(result.current[0].get("a")).toBe(1);
  });

  it("does not mutate the initial map", () => {
    const source = new Map([["a", 1]]);
    const { result } = renderHook(() => useMap(source));

    act(() => {
      result.current[1].set("b", 2);
    });

    expect(source.has("b")).toBe(false);
    expect(result.current[0].has("b")).toBe(true);
  });
});
