import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocalStorage } from "../useLocalStorage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useLocalStorage", () => {
  it("returns the initial value when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("name", "initial"));

    expect(result.current[0]).toBe("initial");
  });

  it("writes updates and functional updates to storage", () => {
    const { result } = renderHook(() => useLocalStorage("count", 1));

    act(() => {
      result.current[1](2);
    });
    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem("count")).toBe("2");

    act(() => {
      result.current[1]((previous) => previous + 1);
    });
    expect(result.current[0]).toBe(3);
    expect(window.localStorage.getItem("count")).toBe("3");
  });

  it("reads an existing value on mount", () => {
    window.localStorage.setItem("settings", JSON.stringify({ theme: "dark" }));

    const { result } = renderHook(() =>
      useLocalStorage("settings", { theme: "light" }),
    );

    expect(result.current[0]).toEqual({ theme: "dark" });
  });

  it("removes the value and resets to the initial value", () => {
    const { result } = renderHook(() => useLocalStorage("name", "initial"));

    act(() => {
      result.current[1]("next");
    });
    expect(window.localStorage.getItem("name")).toBe('"next"');

    act(() => {
      result.current[2]();
    });
    expect(window.localStorage.getItem("name")).toBeNull();
    expect(result.current[0]).toBe("initial");
  });

  it("falls back to the initial value for invalid JSON", () => {
    window.localStorage.setItem("broken", "{not-json");

    const { result } = renderHook(() => useLocalStorage("broken", "fallback"));

    expect(result.current[0]).toBe("fallback");
  });

  it("syncs changes from other tabs", () => {
    const { result } = renderHook(() => useLocalStorage("shared", "initial"));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "shared",
          newValue: JSON.stringify("updated"),
        }),
      );
    });

    expect(result.current[0]).toBe("updated");
  });
});
