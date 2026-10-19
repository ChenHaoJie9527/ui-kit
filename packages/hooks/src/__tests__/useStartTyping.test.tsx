import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useStartTyping } from "../useStartTyping";

const appended: HTMLElement[] = [];

afterEach(() => {
  appended.splice(0).forEach((element) => element.remove());
});

describe("useStartTyping", () => {
  it("turns true when the user starts typing", () => {
    const { result } = renderHook(() => useStartTyping());

    expect(result.current).toBe(false);

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { key: "a", bubbles: true }),
      );
    });

    expect(result.current).toBe(true);
  });

  it("ignores input inside form controls", () => {
    const input = document.createElement("input");
    document.body.append(input);
    appended.push(input);

    const { result } = renderHook(() => useStartTyping());

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "a", bubbles: true }),
      );
    });

    expect(result.current).toBe(false);
  });

  it("ignores shortcuts with modifier keys", () => {
    const { result } = renderHook(() => useStartTyping());

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        }),
      );
    });

    expect(result.current).toBe(false);
  });
});
