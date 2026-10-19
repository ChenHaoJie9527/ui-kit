import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLockBodyScroll } from "../useLockBodyScroll";

afterEach(() => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

describe("useLockBodyScroll", () => {
  it("locks and restores body scrolling", () => {
    const { unmount } = renderHook(() => useLockBodyScroll());

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("keeps the lock until the last consumer unmounts", () => {
    const first = renderHook(() => useLockBodyScroll());
    const second = renderHook(() => useLockBodyScroll());

    expect(document.body.style.overflow).toBe("hidden");

    first.unmount();
    expect(document.body.style.overflow).toBe("hidden");

    second.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("does nothing when disabled", () => {
    renderHook(() => useLockBodyScroll(false));

    expect(document.body.style.overflow).toBe("");
  });

  it("restores a pre-existing overflow value", () => {
    document.body.style.overflow = "scroll";

    const { unmount } = renderHook(() => useLockBodyScroll());

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("scroll");
  });
});
