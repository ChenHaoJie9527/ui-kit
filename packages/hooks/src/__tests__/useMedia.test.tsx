import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMedia } from "../useMedia";

type MediaListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<MediaListener>();
  let matches = initialMatches;

  const queryList = {
    get matches() {
      return matches;
    },
    media: "",
    onchange: null,
    addEventListener: vi.fn<(type: string, listener: MediaListener) => void>(
      (type, listener) => {
        if (type === "change") {
          listeners.add(listener);
        }
      },
    ),
    removeEventListener: vi.fn<(type: string, listener: MediaListener) => void>(
      (type, listener) => {
        listeners.delete(listener);
      },
    ),
    addListener: vi.fn<() => void>(),
    removeListener: vi.fn<() => void>(),
    dispatchEvent: vi.fn<() => boolean>(),
  };

  const matchMedia = vi.fn<(query: string) => MediaQueryList>(
    () => queryList as unknown as MediaQueryList,
  );
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMedia,
  });

  return {
    matchMedia,
    listeners,
    emit(nextMatches: boolean) {
      matches = nextMatches;
      act(() => {
        listeners.forEach((listener) =>
          listener({ matches: nextMatches } as MediaQueryListEvent),
        );
      });
    },
  };
}

afterEach(() => {
  Reflect.deleteProperty(window, "matchMedia");
});

describe("useMedia", () => {
  it("reads the initial state and reacts to changes", () => {
    const media = installMatchMedia(true);
    const { result } = renderHook(() => useMedia("(min-width: 600px)"));

    expect(result.current).toBe(true);
    expect(media.matchMedia).toHaveBeenCalledWith("(min-width: 600px)");

    media.emit(false);
    expect(result.current).toBe(false);

    media.emit(true);
    expect(result.current).toBe(true);
  });

  it("subscribes to the new query when it changes", () => {
    const media = installMatchMedia(false);
    const { rerender } = renderHook(({ query }) => useMedia(query), {
      initialProps: { query: "(min-width: 600px)" },
    });

    media.matchMedia.mockClear();
    rerender({ query: "(prefers-color-scheme: dark)" });

    expect(media.matchMedia).toHaveBeenCalledWith(
      "(prefers-color-scheme: dark)",
    );
    expect(media.listeners.size).toBe(1);
  });

  it("unsubscribes on unmount", () => {
    const media = installMatchMedia(true);
    const { unmount } = renderHook(() => useMedia("(min-width: 600px)"));

    expect(media.listeners.size).toBe(1);
    unmount();
    expect(media.listeners.size).toBe(0);
  });
});
