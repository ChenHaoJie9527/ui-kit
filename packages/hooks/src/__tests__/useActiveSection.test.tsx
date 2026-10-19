import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveSection } from "../useActiveSection";

const sections: HTMLElement[] = [];

function addSection(id: string, top: number) {
  const element = document.createElement("section");
  element.id = id;
  element.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + 100,
      left: 0,
      right: 0,
      width: 0,
      height: 100,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.append(element);
  sections.push(element);
}

function setDocumentHeight(scrollHeight: number) {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
}

function setViewport(innerHeight: number, scrollY: number) {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: innerHeight,
  });
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value: scrollY,
  });
}

function scrollTo(top: number) {
  setViewport(window.innerHeight, top);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

beforeEach(() => {
  // 让 rAF 同步执行，测试里不需要等待下一帧。
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  sections.splice(0).forEach((element) => element.remove());
  vi.restoreAllMocks();
});

describe("useActiveSection", () => {
  it("returns the first section before any scrolling", () => {
    addSection("intro", 600);
    addSection("usage", 1200);
    setDocumentHeight(3000);
    setViewport(800, 0);

    const { result } = renderHook(() => useActiveSection(["intro", "usage"]));

    expect(result.current).toBe("intro");
  });

  it("follows the section that passed the offset", () => {
    addSection("intro", -420);
    addSection("usage", 200);
    addSection("api", 700);
    setDocumentHeight(3000);
    setViewport(800, 0);

    const { result } = renderHook(() =>
      useActiveSection(["intro", "usage", "api"], { offset: 80 }),
    );

    // usage 的 top(200) 还没越过 offset(80)，所以仍是 intro。
    expect(result.current).toBe("intro");

    sections[1]!.getBoundingClientRect = () =>
      ({ top: -40, bottom: 60, toJSON: () => ({}) }) as DOMRect;

    scrollTo(400);
    expect(result.current).toBe("usage");

    sections[2]!.getBoundingClientRect = () =>
      ({ top: -60, bottom: 40, toJSON: () => ({}) }) as DOMRect;

    scrollTo(900);
    expect(result.current).toBe("api");
  });

  it("pins the last section at the bottom of the page", () => {
    addSection("intro", -900);
    addSection("api", -200);
    setDocumentHeight(1400);
    setViewport(800, 600);

    const { result } = renderHook(() => useActiveSection(["intro", "api"]));

    expect(result.current).toBe("api");
  });

  it("ignores ids that are not in the document", () => {
    addSection("intro", 100);
    setDocumentHeight(2000);
    setViewport(800, 0);

    const { result } = renderHook(() => useActiveSection(["missing", "intro"]));

    expect(result.current).toBe("missing");
  });

  it("returns null for an empty list", () => {
    setDocumentHeight(1000);
    setViewport(800, 0);

    const { result } = renderHook(() => useActiveSection([], { offset: 0 }));

    expect(result.current).toBeNull();
  });

  it("stops listening after unmount", () => {
    addSection("intro", 100);
    setDocumentHeight(2000);
    setViewport(800, 0);

    const { unmount } = renderHook(() => useActiveSection(["intro"]));
    const removeSpy = vi.spyOn(window, "removeEventListener");

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
