import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useTitle } from "../useTitle";

const originalTitle = document.title;

afterEach(() => {
  document.title = originalTitle;
});

describe("useTitle", () => {
  it("sets and updates the document title", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) => useTitle(title),
      { initialProps: { title: "First" } },
    );

    expect(document.title).toBe("First");

    rerender({ title: "Second" });
    expect(document.title).toBe("Second");
  });

  it("restores the original title on unmount when requested", () => {
    document.title = "Original";

    const { unmount } = renderHook(() =>
      useTitle("Modal open", { restoreOnUnmount: true }),
    );

    expect(document.title).toBe("Modal open");

    unmount();

    expect(document.title).toBe("Original");
  });

  it("keeps the original title across updates", () => {
    document.title = "Original";

    const { rerender, unmount } = renderHook(
      ({ title }: { title: string }) =>
        useTitle(title, { restoreOnUnmount: true }),
      { initialProps: { title: "First" } },
    );

    rerender({ title: "Second" });
    expect(document.title).toBe("Second");

    unmount();

    expect(document.title).toBe("Original");
  });

  it("leaves the title in place by default", () => {
    const { unmount } = renderHook(() => useTitle("Persistent"));

    unmount();

    expect(document.title).toBe("Persistent");
  });
});
