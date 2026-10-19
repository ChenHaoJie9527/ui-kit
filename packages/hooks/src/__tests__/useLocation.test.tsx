import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocation } from "../useLocation";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("useLocation", () => {
  it("parses the current location", () => {
    window.history.replaceState({}, "", "/start?x=1#intro");
    const { result } = renderHook(() => useLocation());

    expect(result.current.pathname).toBe("/start");
    expect(result.current.search).toBe("?x=1");
    expect(result.current.hash).toBe("#intro");
    expect(result.current.href).toContain("/start?x=1#intro");
  });

  it("tracks pushState and replaceState", () => {
    const { result } = renderHook(() => useLocation());

    act(() => {
      window.history.pushState({}, "", "/docs?tab=api#top");
    });

    expect(result.current.pathname).toBe("/docs");
    expect(result.current.search).toBe("?tab=api");
    expect(result.current.hash).toBe("#top");

    act(() => {
      window.history.replaceState({}, "", "/overview");
    });

    expect(result.current.pathname).toBe("/overview");
    expect(result.current.search).toBe("");
  });

  it("restores history methods when the last subscriber unmounts", () => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const { unmount } = renderHook(() => useLocation());

    expect(window.history.pushState).not.toBe(originalPushState);
    expect(window.history.replaceState).not.toBe(originalReplaceState);

    unmount();

    expect(window.history.pushState).toBe(originalPushState);
    expect(window.history.replaceState).toBe(originalReplaceState);
  });
});
