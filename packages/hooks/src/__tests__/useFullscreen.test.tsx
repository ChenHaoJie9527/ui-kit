import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFullscreen } from "../useFullscreen";

let fullscreenElement: Element | null = null;
const restores: Array<() => void> = [];

function installFullscreen(element: HTMLElement) {
  const originalEnabled = Object.getOwnPropertyDescriptor(
    document,
    "fullscreenEnabled",
  );
  const originalElement = Object.getOwnPropertyDescriptor(
    document,
    "fullscreenElement",
  );
  const originalExit = Object.getOwnPropertyDescriptor(
    document,
    "exitFullscreen",
  );
  const originalRequest = Object.getOwnPropertyDescriptor(
    element,
    "requestFullscreen",
  );

  Object.defineProperty(document, "fullscreenEnabled", {
    configurable: true,
    value: true,
  });
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });

  const requestFullscreen = vi.fn<() => Promise<void>>(async () => {
    fullscreenElement = element;
  });
  const exitFullscreen = vi.fn<() => Promise<void>>(async () => {
    fullscreenElement = null;
  });

  Object.defineProperty(element, "requestFullscreen", {
    configurable: true,
    value: requestFullscreen,
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    value: exitFullscreen,
  });

  restores.push(() => {
    fullscreenElement = null;
    restoreProperty(document, "fullscreenEnabled", originalEnabled);
    restoreProperty(document, "fullscreenElement", originalElement);
    restoreProperty(document, "exitFullscreen", originalExit);
    restoreProperty(element, "requestFullscreen", originalRequest);
  });

  return { requestFullscreen, exitFullscreen };
}

function restoreProperty(
  target: object,
  key: string,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
  } else {
    Reflect.deleteProperty(target, key);
  }
}

afterEach(() => {
  restores.splice(0).forEach((restore) => restore());
});

describe("useFullscreen", () => {
  it("enters and exits fullscreen while tracking the state", async () => {
    const element = document.createElement("div");
    const { requestFullscreen, exitFullscreen } = installFullscreen(element);
    const ref = { current: element };
    const onEnter = vi.fn<() => void>();
    const onExit = vi.fn<() => void>();

    const { result } = renderHook(() =>
      useFullscreen(ref, { onEnter, onExit }),
    );

    expect(result.current.supported).toBe(true);
    expect(result.current.isFullscreen).toBe(false);

    await act(async () => {
      await result.current.enter();
    });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(true);
    expect(onEnter).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.exit();
    });
    expect(exitFullscreen).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(false);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("toggles based on the current fullscreen element", async () => {
    const element = document.createElement("div");
    const { requestFullscreen, exitFullscreen } = installFullscreen(element);
    const ref = { current: element };
    const { result } = renderHook(() => useFullscreen(ref));

    await act(async () => {
      await result.current.toggle();
    });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    await act(async () => {
      await result.current.toggle();
    });
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
